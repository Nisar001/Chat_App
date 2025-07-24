import express from 'express';
import http from 'http';
import 'colors'; // For colored console output
// import mongoose from 'mongoose';

import dotenv from 'dotenv';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';

import appRoutes from './app.routes';
import { connectDB } from './config/database';
import { Room } from './models/chat.model';
import User from './models/user.model';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// MongoDB Connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', appRoutes);

// Socket.io events

io.on('connection', (socket) => {
  console.log('A user connected:'.bgBlue.white, socket.id);

  // User joins with their userId
  socket.on('user-online', async (userId: string) => {
    await User.setOnline(userId);
    socket.data.userId = userId;
    io.emit('user-status-changed', { userId, status: 'online' });
  });

  // Join a room
  socket.on('join-room', async ({ roomId, userId }) => {
    socket.join(roomId);
    await User.setOnline(userId);
    io.to(roomId).emit('user-joined', { userId, roomId });
  });

  // Leave a room
  socket.on('leave-room', ({ roomId, userId }) => {
    socket.leave(roomId);
    io.to(roomId).emit('user-left', { userId, roomId });
  });

  // Send a message
  socket.on('send-message', async ({ roomId, userId, content }) => {
    const message = {
      sender: userId,
      content,
      createdAt: new Date()
    };
    await Room.findByIdAndUpdate(roomId, { $push: { messages: message } });
    socket.to(roomId).emit('new-message', { roomId, message });
  });

  // Rejoin existing room
  socket.on('rejoin-room', ({ roomId, userId }) => {
    socket.join(roomId);
    io.to(roomId).emit('user-rejoined', { userId, roomId });
  });

  // On disconnect, set user offline
  socket.on('disconnect', async () => {
    const userId = socket.data.userId;
    if (userId) {
      await User.setOffline(userId);
      io.emit('user-status-changed', { userId, status: 'offline', lastSeen: new Date() });
    }
    console.log('User disconnected:'.bgRed.white, socket.id);
  });
});




// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.bgMagenta.white);
});
