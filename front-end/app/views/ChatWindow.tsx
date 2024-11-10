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
import socket, { NewMessageResponse } from "app/socket";
import {
  Conversation,
  addConversation,
  selectConversationById,
  updateConversation,
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

  const profile = authState.profile;

  const handleOnMessageSend = (messages: IMessage[]) => {
    if (!profile) return;

    const currentMessage = messages[messages.length - 1];

    const newMessage: OutGoingMessage = {
      message: {
        id: currentMessage._id.toString(),
        text: currentMessage.text,
        time: getTime(currentMessage.createdAt),
        user: { id: profile.id, name: profile.name, avatar: profile.avatar },
        image: currentMessage.image // Add this
      },
      conversationId,
      to: peerProfile.id,
    };

    // this will update our store and also update the UI
    dispatch(updateConversation({
      conversationId,
      chat: { ...newMessage.message, viewed: false },
      peerProfile,
    }));

    // sending message to our api
    socket.emit("chat:new", newMessage);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
  
    if (!result.canceled && result.assets[0]) {
      const formData = new FormData();
      const imageUri = result.assets[0].uri;
      
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg', 
        name: 'chat-image.jpg',
      } as any);
      
      formData.append('content', ''); // Add space instead of empty string

      console.log('Sending image:', imageUri); // Add logging
      
      const res = await runAxiosAsync(
        authClient.post(`/conversation/message/${conversationId}`, formData, {
          headers: {'Content-Type': 'multipart/form-data'},
        })
      );
      
      if(res?.message) {
        console.log('Server response:', res); // Add logging
        await fetchOldChats(); // Refresh chat after image upload
      }
    }
  };

  const fetchOldChats = async () => {
    setFetchingChats(true);
    const res = await runAxiosAsync<{ conversation: Conversation }>(
      authClient("/conversation/chats/" + conversationId)
    );
    console.log('Fetched conversation:', res?.conversation); // Add logging
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

  if (!profile) return null;

  if (fetchingChats) return <EmptyView title="Please wait..." />;

  return (
    <View style={styles.container}>
      <AppHeader
        backButton={<BackButton />}
        center={<PeerProfile name={peerProfile.name} avatar={peerProfile.avatar} />}
      />
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
          <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
            <MaterialIcons name="image" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        renderMessageImage={(props) => (
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
        )}
        listViewProps={{
          contentContainerStyle: styles.messageList
        }}
        minInputToolbarHeight={50}
        maxComposerHeight={100}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  }
});

export default ChatWindow;
