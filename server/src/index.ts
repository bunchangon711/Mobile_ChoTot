import "dotenv/config";
import "express-async-errors";
import "src/db";
import express from "express";
import authRouter from "routes/auth";
import formidable from "formidable";
import path from "path";
import http from "http";
import productRouter from "routes/product";
import { sendErrorRes } from "./utils/helper";
import { Server } from "socket.io";
import { TokenExpiredError, verify } from "jsonwebtoken";
import morgan from "morgan";
import conversationRouter from "./routes/conversation";
import ConversationModel from "./models/conversation";
import { updateSeenStatus } from "./controllers/conversation";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket-message",
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(morgan("dev"));
app.use(express.static("src/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use("/auth", authRouter);
app.use("/product", productRouter);
app.use("/conversation", conversationRouter);

// SOCKET IO
io.use((socket, next) => {
  const socketReq = socket.handshake.auth as { token: string } | undefined;
  if (!socketReq?.token) {
    return next(new Error("Unauthorized request!"));
  }

  try {
    socket.data.jwtDecode = verify(socketReq.token, process.env.JWT_SECRET!);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(new Error("jwt expired"));
    }

    return next(new Error("Invalid token!"));
  }

  next();
});

type MessageProfile = {
  id: string;
  name: string;
  avatar?: string;
};

type IncomingMessage = {
  message: {
    id: string;
    time: string;
    text: string;
    user: MessageProfile;
  };
  to: string;
  conversationId: string;
};

type OutgoingMessageResponse = {
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
  peerId: string;
  conversationId: string;
};

io.on("connection", (socket) => {
  const socketData = socket.data as { jwtDecode: { id: string } };
  const userId = socketData.jwtDecode.id;
  
  console.log(`User ${userId} connected with socket ID: ${socket.id}`);

  socket.on('join_room', (conversationId) => {
    console.log(`User ${userId} attempting to join room ${conversationId}`);
    socket.join(conversationId);
    console.log(`User ${userId} successfully joined room ${conversationId}`);
    socket.emit('join_room', { success: true });
  });

  socket.on('leave_room', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User ${userId} left room ${conversationId}`);
  });

  socket.on('send_message', async (data: IncomingMessage) => {
    const { conversationId, message } = data;
    
    try {
      // Update database through controller
      await ConversationModel.findByIdAndUpdate(conversationId, {
        $push: {
          chats: {
            sentBy: message.user.id,
            content: message.text,
            timestamp: message.time,
          },
        },
      });

      // Broadcast to room
      io.to(conversationId).emit('new_message', {
        from: message.user,
        conversationId,
        message: { ...message, viewed: false },
      });

      console.log(`Message sent in room ${conversationId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('chat:seen', async ({ conversationId, messageId, peerId }: SeenData) => {
    try {
      await updateSeenStatus(peerId, conversationId);
      io.to(conversationId).emit('chat:seen', { conversationId, messageId });
      console.log(`Message ${messageId} marked as seen in room ${conversationId}`);
    } catch (error) {
      console.error('Error updating seen status:', error);
    }
  });

  socket.on('chat:typing', ({ conversationId, active }: { conversationId: string, active: boolean }) => {
    socket.to(conversationId).emit('chat:typing', {
      userId,
      typing: active
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`User ${userId} disconnected. Reason: ${reason}`);
  });
});

// this is how you can upload files
app.post("/upload-file", async (req, res) => {
  const form = formidable({
    uploadDir: path.join(__dirname, "public"),
    filename(name, ext, part, form) {
      return Date.now() + "_" + part.originalFilename;
    },
  });
  await form.parse(req);

  res.send("ok");
});

app.use(function (err, req, res, next) {
  res.status(500).json({ message: err.message });
} as express.ErrorRequestHandler);

app.use("*", (req, res) => {
  sendErrorRes(res, "Not Found!", 404);
});

server.listen(8000, () => {
  console.log("The app is running on http://localhost:8000");
});
