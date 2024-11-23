import AppHeader from "@components/AppHeader";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import BackButton from "@ui/BackButton";
import EmptyChatContainer from "@ui/EmptyChatContainer";
import EmptyView from "@ui/EmptyView";
import PeerProfile from "@ui/PeerProfile";
import { runAxiosAsync } from "app/api/runAxiosAsync";
import useAuth from "app/hooks/useAuth";
import useClient from "app/hooks/useClient";
import { AppStackParamList } from "app/navigator/AppNavigator";
import socket, { handleSocketConnection, NewMessageResponse } from "app/socket";
import {
  Conversation,
  addConversation,
  selectConversationById,
  updateConversation,
  deleteMessage
} from "app/store/conversation";
import { FC, useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { GiftedChat, IMessage } from "react-native-gifted-chat";
import { useDispatch, useSelector } from "react-redux";
import React from "react";
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import colors from "@utils/colors";
import { MaterialIcons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import ImageView from "react-native-image-viewing";
import EmojiSelector from 'react-native-emoji-selector';

type Props = NativeStackScreenProps<AppStackParamList, "ChatWindow">;

type OutGoingMessage = {
  message: {
    id: string;
    time: string;
    text: string;
    image?: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  to: string;
  conversationId: string;
};

const getTime = (value: IMessage["createdAt"]) => {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
};

const formatConversationToIMessage = (value?: Conversation): IMessage[] => {
  const formattedValues = value?.chats.map((chat) => ({
    _id: chat.id,
    text: chat.text,
    createdAt: new Date(chat.time),
    received: chat.viewed,
    image: chat.image,
    user: {
      _id: chat.user.id,
      name: chat.user.name,
      avatar: chat.user.avatar,
    },
  }));

  const messages = formattedValues || [];
  return messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

const ChatWindow: FC<Props> = ({ route }) => {
  const { authState } = useAuth();
  const { conversationId, peerProfile } = route.params;
  const conversation = useSelector(selectConversationById(conversationId));
  const dispatch = useDispatch();
  const { authClient } = useClient();
  const [fetchingChats, setFetchingChats] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const profile = authState.profile;

  useEffect(() => {
    if (!profile || !conversationId) return;
    console.log('Initializing socket with:', { profileId: profile.id, conversationId });
    const cleanup = handleSocketConnection(profile, dispatch, conversationId);
    return cleanup;
  }, [profile, conversationId]);

  const handleOnMessageSend = async (messages: IMessage[]) => {
    if (!profile) return;
    const currentMessage = messages[0];
    
    const formData = new FormData();
    if (currentMessage.image) {
      formData.append('image', {
        uri: currentMessage.image,
        type: 'image/jpeg',
        name: 'chat-image.jpg',
      } as any);
    }
    formData.append('content', currentMessage.text);
  
    const res = await runAxiosAsync(
      authClient.post(`/conversation/message/${conversationId}`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      })
    );
  
    if (res?.message) {
      // Only update local state, let socket handle peer updates
      dispatch(updateConversation({
        conversationId,
        chat: {
          ...res.message,
          _id: res.message.id // Ensure consistent ID usage
        },
        peerProfile,
      }));
      
      // Emit to socket for peer updates
      socket.emit('send_message', {
        conversationId,
        message: res.message,
        to: peerProfile.id
      });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
  
    if (!result.canceled && result.assets[0]) {
      const formData = new FormData();
      formData.append('image', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'chat-image.jpg',
      } as any);
  
      const res = await runAxiosAsync(
        authClient.post(`/conversation/message/${conversationId}`, formData, {
          headers: {'Content-Type': 'multipart/form-data'},
        })
      );
  
      if (res?.message) {
        dispatch(updateConversation({
          conversationId,
          chat: res.message, // Use server-generated message
          peerProfile,
        }));
      }
    }
  };

  const handleLongPress = useCallback((_context: any, message: IMessage) => {
    if (message.user._id === profile?.id) {
      Alert.alert(
        "Delete Message",
        "Are you sure you want to delete this message?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await runAxiosAsync(
                authClient.delete(`/conversation/message/${conversationId}/${message._id}`)
              );
              dispatch(deleteMessage({ conversationId, messageId: message._id.toString() }));
            },
          },
        ]
      );
    }
  }, [profile, conversationId]);

  const fetchOldChats = async () => {
    setFetchingChats(true);
    const res = await runAxiosAsync<{ conversation: Conversation }>(
      authClient("/conversation/chats/" + conversationId)
    );
    //console.log('Fetched conversation:', res?.conversation); // Add logging
    setFetchingChats(false);

    if (res?.conversation) {
      dispatch(addConversation([res.conversation]));
    }
  };

  const sendSeenRequest = () => {
    runAxiosAsync(
      authClient.patch(`/conversation/seen/${conversationId}/${peerProfile.id}`)
    );
  };

  useEffect(() => {
    const handleApiRequest = async () => {
      await fetchOldChats();
      // we want to update viewed property inside our database
      await sendSeenRequest();
    };

    handleApiRequest();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const updateSeenStatus = (data: NewMessageResponse) => {
        socket.emit("chat:seen", {
          messageId: data.message.id,
          conversationId,
          peerId: peerProfile.id,
        });
      };

      socket.on("chat:message", updateSeenStatus);

      return () => socket.off("chat:message", updateSeenStatus);
    }, [])
  );

  useEffect(() => {
    const messageHandler = (data: NewMessageResponse) => {
      if (data.conversationId === conversationId && data.message?.id) {
        dispatch(updateConversation({
          conversationId: data.conversationId,
          chat: data.message,
          peerProfile: data.from
        }));
      }
    };
  
    socket.on('new_message', messageHandler);
    return () => {
      socket.off('new_message', messageHandler);
    };
  }, [conversationId]);

  if (!profile) return null;

  if (fetchingChats) return <EmptyView title="Please wait..." />;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <AppHeader
          backButton={<BackButton />}
          center={<PeerProfile name={peerProfile.name} avatar={peerProfile.avatar} />}
        />
      </View>
      <GiftedChat
        messages={formatConversationToIMessage(conversation)}
        user={{
          _id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
        }}
        onSend={handleOnMessageSend}
        renderChatEmpty={() => <EmptyChatContainer />}
        renderActions={() => (
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={pickImage} style={styles.actionButton}>
              <MaterialIcons name="image" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEmojiPicker(!showEmojiPicker)} style={styles.actionButton}>
              <MaterialIcons name="emoji-emotions" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        renderMessageImage={(props) => (
          <TouchableOpacity 
            onPress={() => {
              if (props.currentMessage?.image) {
                setSelectedImage(props.currentMessage.image);
              }
            }}
            onLongPress={() => {
              if (props.currentMessage) {
                handleLongPress(null, props.currentMessage);
              }
            }}
          >
            <View style={[
              styles.messageContainer,
              props.currentMessage?.user._id === profile.id ? styles.rightMessage : styles.leftMessage
            ]}>
              <Image 
                source={{ uri: props.currentMessage?.image }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        )}
        listViewProps={{
          contentContainerStyle: styles.messageList
        }}
        onLongPress={handleLongPress}
        minInputToolbarHeight={50}
        maxComposerHeight={100}
      />
      {showEmojiPicker ? (
        <View style={styles.emojiPicker}>
          <EmojiSelector 
            onEmojiSelected={emoji => {
              handleOnMessageSend([{
                _id: Math.random().toString(),
                text: emoji,
                createdAt: new Date(),
                user: {
                  _id: profile.id,
                  name: profile.name,
                  avatar: profile.avatar
                }
              }]);
              setShowEmojiPicker(false);
            }}
            columns={8}
          />
        </View>
      ) : null}
      <ImageView
        images={selectedImage ? [{ uri: selectedImage }] : []}
        imageIndex={0}
        visible={!!selectedImage}
        onRequestClose={() => setSelectedImage(null)}
        doubleTapToZoomEnabled
        swipeToCloseEnabled
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imageButton: {
    marginLeft: 10,
    marginBottom: 10,
  },
  messageContainer: {
    width: 330, // Changed from maxWidth to fixed width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
    borderTopLeftRadius: 15,
  },
  imageWrapper: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
  },
  messageImage: {
    width: '100%', // Changed from fixed 280 to 100%
    height: undefined,
    aspectRatio: 1.5,
  },
  rightMessage: {
    alignSelf: 'flex-end',
    marginRight: 0,
  },
  leftMessage: {
    alignSelf: 'flex-start', 
    marginLeft: 0,
  },
  messageList: {
    paddingVertical: 10,
    gap: 10
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 10,
    marginBottom: 10,
  },
  actionButton: {
    marginRight: 10,
  },
  emojiPicker: {
    height: 250,
  }
});

export default ChatWindow;
