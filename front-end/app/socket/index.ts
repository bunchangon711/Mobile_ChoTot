import { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import asyncStorage, { Keys } from "@utils/asyncStorage";
import client, { baseURL } from "app/api/client";
import { runAxiosAsync } from "app/api/runAxiosAsync";
import { TokenResponse } from "app/hooks/useClient";
import { Profile, updateAuthState } from "app/store/auth";
import { updateActiveChat } from "app/store/chats";
import { updateChatViewed, updateConversation } from "app/store/conversation";
import { io } from "socket.io-client";

const socket = io(baseURL, { path: "/socket-message", autoConnect: false });

type MessageProfile = {
  id: string;
  name: string;
  avatar?: string;
};

export type NewMessageResponse = {
  message: {
    id: string;
    time: string;
    text: string;
    user: MessageProfile;
    viewed: boolean;
  };
  from: MessageProfile;
  conversationId: string;
};

type SeenData = {
  messageId: string;
  conversationId: string;
};

export const handleSocketConnection = (
  profile: Profile,
  dispatch: Dispatch<UnknownAction>,
  conversationId?: string
) => {
  if (!profile || !conversationId) {
    console.log('Missing required data:', { hasProfile: !!profile, conversationId });
    return () => {};
  }

  let currentRoom = '';
  
  console.log('Setting up socket connection...', { conversationId });
  socket.auth = { token: profile.accessToken };
  
  // Clean up before new connection
  if (socket.connected) {
    console.log('Cleaning up existing connection...');
    socket.disconnect();
  }
  
  socket.removeAllListeners();
  socket.connect();

  socket.on("chat:message", (data: NewMessageResponse) => {
    const { conversationId, from, message } = data;
    // this will update on going conversation or messages in between two users
    dispatch(
      updateConversation({
        conversationId,
        chat: message,
        peerProfile: from,
      })
    );

    // this will update active chats and updates chats screen
    dispatch(
      updateActiveChat({
        id: data.conversationId,
        lastMessage: data.message.text,
        peerProfile: data.message.user,
        timestamp: data.message.time,
        unreadChatCounts: 1,
      })
    );
  });

  socket.on("chat:seen", (seenData: SeenData) => {
    dispatch(updateChatViewed(seenData));
  });

  socket.on("connect", () => {
    console.log('Socket connected successfully');
    
    if (conversationId) {
      currentRoom = conversationId;
      console.log(`Joining room: ${conversationId}`);
      socket.emit('join_room', conversationId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('new_message', (data: NewMessageResponse) => {
    console.log(`Received message in room ${data.conversationId}`);
    if (!data.message || !data.from || !data.conversationId) return;
    
    dispatch(updateConversation({
      conversationId: data.conversationId,
      chat: data.message,
      peerProfile: data.from
    }));
    
    dispatch(updateActiveChat({
      id: data.conversationId,
      lastMessage: data.message.text || '',
      peerProfile: data.from,
      timestamp: data.message.time,
      unreadChatCounts: 1
    }));
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  socket.on("connect_error", async (error) => {
    if (error.message === "jwt expired") {
      const refreshToken = await asyncStorage.get(Keys.REFRESH_TOKEN);
      const res = await runAxiosAsync<TokenResponse>(
        client.post(`${baseURL}/auth/refresh-token`, { refreshToken })
      );

      if (res) {
        await asyncStorage.save(Keys.AUTH_TOKEN, res.tokens.access);
        await asyncStorage.save(Keys.REFRESH_TOKEN, res.tokens.refresh);
        dispatch(
          updateAuthState({
            profile: { ...profile, accessToken: res.tokens.access },
            pending: false,
          })
        );
        socket.auth = { token: res.tokens.access };
        socket.connect();
      }
    }
  });

  return () => {
    console.log('Cleaning up socket connection for room:', currentRoom);
    if (currentRoom) {
      socket.emit('leave_room', currentRoom);
    }
    socket.removeAllListeners();
    socket.disconnect();
  };
};

export default socket;
