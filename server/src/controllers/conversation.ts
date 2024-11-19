import { RequestHandler } from "express";
import { ObjectId, Types, isValidObjectId } from "mongoose";
import ConversationModel from "src/models/conversation";
import UserModel from "src/models/user";
import { sendErrorRes } from "src/utils/helper";
import { uploadImage } from "src/cloud/index";
import { File } from "formidable";
import { Request } from 'express';
import { cloudApi } from "src/cloud/index";

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
}

interface Chat {
  text: string;
  time: string;
  id: string;
  user: UserProfile;
}

interface Conversation {
  id: string;
  chats: Chat[];
  peerProfile: { avatar?: string; name: string; id: string };
}

type PopulatedChat = {
  _id: ObjectId;
  content: string;
  timestamp: Date;
  viewed: boolean;
  image?: string;
  sentBy: { name: string; _id: ObjectId; avatar?: { url: string } };
};

type PopulatedParticipant = {
  _id: ObjectId;
  name: string;
  avatar?: { url: string };
};

type PopulatedUser = {
  id: string;
  name: string;
  avatar?: { url: string };
}

export const getOrCreateConversation: RequestHandler = async (req, res) => {
  const { peerId } = req.params;

  if (!isValidObjectId(peerId)) {
    return sendErrorRes(res, "Invalid peer id!", 422);
  }

  const user = await UserModel.findById(peerId);
  if (!user) {
    return sendErrorRes(res, "User not found!", 404);
  }

  const participants = [req.user.id, peerId];
  const participantsId = participants.sort().join("_");

  const conversation = await ConversationModel.findOneAndUpdate(
    { participantsId },
    {
      // insert only if upsert founds nothing as participants
      $setOnInsert: {
        participantsId,
        participants,
      },
    },
    { upsert: true, new: true }
  );

  res.json({ conversationId: conversation._id });
};

export const sendChatMessage: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;
  const { content } = req.body;
  const imageFile = req.files?.image as File;
  const typedUser = req.user as unknown as PopulatedUser;

  if (!isValidObjectId(conversationId)) 
    return sendErrorRes(res, "Invalid conversation id!", 422);

  try {
    let imageUrl;
    if (imageFile) {
      const { url } = await uploadImage(imageFile.filepath);
      imageUrl = url;
    }

    const chatData = {
      sentBy: req.user.id,
      content: content || '',
      image: imageUrl,
      timestamp: new Date(),
      viewed: false
    };

    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversationId,
      { $push: { chats: chatData } },
      { new: true }
    ).populate('chats.sentBy', 'name avatar.url');

    if (!updatedConversation) 
      return sendErrorRes(res, "Failed to update conversation", 500);

    const newMessage = updatedConversation.chats[updatedConversation.chats.length - 1];

    const messageData = {
      id: newMessage._id.toString(),
      text: content || '',
      time: newMessage.timestamp.toISOString(),
      image: imageUrl,
      viewed: false,
      user: {
        id: typedUser.id,
        name: typedUser.name,
        avatar: typedUser.avatar?.url
      }
    };

    const io = req.app.get('io');
    if (io) {
      io.emit('new_message', {
        message: messageData,
        from: {
          id: typedUser.id,
          name: typedUser.name,
          avatar: typedUser.avatar?.url
        },
        conversationId
      });
    }

    res.json({ message: messageData });
  } catch (error) {
    console.error('Send message error:', error);
    return sendErrorRes(res, "Failed to send message", 500);
  }
};


export const deleteMessage: RequestHandler = async (req, res) => {
  const { conversationId, messageId } = req.params;
  
  if (!isValidObjectId(conversationId) || !isValidObjectId(messageId))
    return sendErrorRes(res, "Invalid ids!", 422);

  try {
    // Find message before deletion to get image info
    const conversation = await ConversationModel.findOne(
      { _id: conversationId, "chats._id": messageId, "chats.sentBy": req.user.id }
    );

    if (!conversation) return sendErrorRes(res, "Message not found or unauthorized!", 404);

    const message = conversation.chats.find(chat => chat._id.toString() === messageId);
    
    // Delete from Cloudinary if message has image
    if (message?.image) {
      const publicId = message.image.split('/').pop()?.split('.')[0];
      if (publicId) {
        const cloudDeleteResult = await cloudApi.delete_resources([publicId]);
        if (cloudDeleteResult.deleted[publicId] !== 'deleted') {
          throw new Error('Failed to delete image from Cloudinary');
        }
      }
    }

    // Delete message from MongoDB only if Cloudinary deletion succeeded
    const updatedConversation = await ConversationModel.findOneAndUpdate(
      { _id: conversationId },
      { $pull: { chats: { _id: messageId } } },
      { new: true }
    );

    if (!updatedConversation) throw new Error('Failed to delete message from MongoDB');
    
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error('Delete message error:', error);
    return sendErrorRes(res, "Failed to delete message completely", 500);
  }
};

export const getConversations: RequestHandler = async (req, res) => {
  const { conversationId } = req.params;

  if (!isValidObjectId(conversationId)) {
    return sendErrorRes(res, "Invalid conversation id!", 422);
  }

  const conversation = await ConversationModel.findById(conversationId)
    .populate<{ chats: PopulatedChat[] }>({
      path: "chats.sentBy",
      select: "name avatar.url",
    })
    .populate<{ participants: PopulatedParticipant[] }>({
      path: "participants",
      match: { _id: { $ne: req.user.id } }, // Filter out the logged-in user
      select: "name avatar.url",
    })
    .select(
      "sentBy chats._id chats.content chats.timestamp chats.viewed chats.image participants"
    );

  if (!conversation) return sendErrorRes(res, "Details not found!", 404);

  const peerProfile = conversation.participants[0];

  const finalConversation: Conversation = {
    id: conversation._id,
    chats: conversation.chats.map((c) => ({
      id: c._id.toString(),
      text: c.content,
      time: c.timestamp.toISOString(),
      viewed: c.viewed,
      image: c.image, // Add this line to include image URL
      user: {
        id: c.sentBy._id.toString(),
        name: c.sentBy.name,
        avatar: c.sentBy.avatar?.url,
      },
    })),
    peerProfile: {
      id: peerProfile._id.toString(),
      name: peerProfile.name,
      avatar: peerProfile.avatar?.url,
    },
  };

  res.json({ conversation: finalConversation });
};

export const getLastChats: RequestHandler = async (req, res) => {
  const chats = await ConversationModel.aggregate([
    {
      $match: {
        participants: req.user.id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "participantsInfo",
      },
    },
    {
      $project: {
        _id: 0,
        id: "$_id",
        participants: {
          $filter: {
            input: "$participantsInfo",
            as: "participant",
            cond: { $ne: ["$$participant._id", req.user.id] },
          },
        },
        lastChat: {
          $slice: ["$chats", -1],
        },
        unreadChatCounts: {
          $size: {
            $filter: {
              input: "$chats",
              as: "chat",
              cond: {
                $and: [
                  { $eq: ["$$chat.viewed", false] },
                  { $ne: ["$$chat.sentBy", req.user.id] },
                ],
              },
            },
          },
        },
      },
    },
    {
      $unwind: "$participants",
    },
    {
      $unwind: "$lastChat",
    },
    {
      $project: {
        id: "$id",
        lastMessage: "$lastChat.content",
        timestamp: "$lastChat.timestamp",
        unreadChatCounts: "$unreadChatCounts",
        peerProfile: {
          id: "$participants._id",
          name: "$participants.name",
          avatar: "$participants.avatar.url",
        },
      },
    },
  ]);

  res.json({ chats });
};

export const updateSeenStatus = async (
  peerId: string,
  conversationId: string
) => {
  await ConversationModel.findByIdAndUpdate(
    conversationId,
    {
      $set: {
        "chats.$[elem].viewed": true,
      },
    },
    {
      arrayFilters: [{ "elem.sentBy": peerId }],
    }
  );
};

export const updateChatSeenStatus: RequestHandler = async (req, res) => {
  const { peerId, conversationId } = req.params;

  if (!isValidObjectId(peerId) || !isValidObjectId(conversationId))
    return sendErrorRes(res, "Invalid conversation or peer id!", 422);

  await updateSeenStatus(peerId, conversationId);
  // await ConversationModel.findByIdAndUpdate(
  //   conversationId,
  //   {
  //     $set: {
  //       "chats.$[elem].viewed": true,
  //     },
  //   },
  //   {
  //     arrayFilters: [{ "elem.sentBy": peerId }],
  //   }
  // );

  res.json({ message: "Updated successfully." });
};
