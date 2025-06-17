import { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import asyncStorage, { Keys } from "@utils/asyncStorage";
import client, { baseURL } from "app/api/client";
import { runAxiosAsync } from "app/api/runAxiosAsync";
import { TokenResponse } from "app/hooks/useClient";
import { Profile, updateAuthState } from "app/store/auth";
import { updateActiveChat } from "app/store/chats";
import { updateChatViewed, updateConversation } from "app/store/conversation";
import { io } from "socket.io-client";
import * as Notifications from 'expo-notifications';

//Socket.io client setup with configuration
const socket = io(baseURL, { 
  path: "/socket-message", 
  autoConnect: false, // Manual connection control
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  transports: ['websocket'],  //Forcing websocket transport
});

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
    return () => {};
  }

  let currentRoom = '';
  let reconnectAttempts = 0;
  
   // Message handler for incoming messages
  const handleMessage = (data: NewMessageResponse) => {
    console.log(`Received message in room ${data.conversationId}`);
    if (!data.message || !data.from || !data.conversationId) return;
    
    // Update Redux store with new message
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

    // Only show notification if sender is not current user
    if (data.from.id !== profile.id) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: data.from.name,
          body: data.message.text || 'New message',
          data: { 
            conversationId: data.conversationId,
            peerProfile: data.from
          },
        },
        trigger: null,
      });
    }
  };
  
  // Main connection setup function
  const setupConnection = () => {
    console.log('Setting up socket connection with token:', !!profile.accessToken);
    socket.auth = { token: profile.accessToken }; //authentication token
    
    if (socket.connected) {
      console.log('Socket already connected, disconnecting...');
      socket.disconnect();
    }
    
    socket.removeAllListeners();
    socket.connect();

    // New message handler
    socket.on("new_message", (data: NewMessageResponse) => {
      console.log('Received new message:', data);
      handleMessage(data);
    });

    socket.on("chat:seen", (seenData: SeenData) => {
      dispatch(updateChatViewed(seenData));
    });

    // Connection events handling
    socket.on("connect", () => {
      console.log('Socket connected successfully, joining room:', conversationId);
      reconnectAttempts = 0;
      
      if (conversationId) {
        currentRoom = conversationId;
        socket.emit('join_room', conversationId, (response: { success: boolean }) => {
          console.log('Join room response:', response);
          if (response.success) {
            console.log(`Successfully joined room: ${conversationId}`);
          } else {
            console.error(`Failed to join room: ${conversationId}`);
          }
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      if (reconnectAttempts < 5) {
        setTimeout(() => {
          reconnectAttempts++;
          console.log(`Attempting reconnection ${reconnectAttempts}/5`);
          setupConnection();
        }, 1000 * reconnectAttempts);
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    socket.on("connect_error", async (error) => {
      if (error.message === "jwt expired") {
        try {
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
        } catch (err) {
          console.error('Token refresh failed:', err);
        }
      }
    });
  };

  // Initialize connection
  setupConnection();

  return () => {
    if (currentRoom) {
      socket.emit('leave_room', currentRoom, (response: { success: boolean }) => {
        if (response.success) {
          console.log(`Successfully left room: ${currentRoom}`);
        } else {
          console.error(`Failed to leave room: ${currentRoom}`);
        }
      });
    }
    socket.removeAllListeners();
    socket.disconnect();
  };
};

export default socket;
