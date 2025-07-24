import { Request, Response } from 'express';
import { Room } from '../../../models/chat.model';
import User from '../../../models/user.model';

// Create a new chat room (1-to-1 or group)
export const createRoomController = async (req: Request, res: Response) => {
  try {
    const { participantIds, name } = req.body;
    const isGroup = participantIds.length > 2;
    const room = await Room.create({
      name: isGroup ? name : undefined,
      isGroup,
      participants: participantIds,
      createdBy: req.user?._id
    });
    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create room', error: err });
  }
};

// Get all rooms for a user
export const getUserRoomsController = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find({ participants: req.user?._id })
      .populate('participants', 'username email status')
      .select('-messages');
    res.status(200).json({ rooms });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch rooms', error: err });
  }
};

// Get chat history for a room
export const getRoomHistoryController = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId)
      .populate('participants', 'username status')
      .populate('messages.sender', 'username');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch room history', error: err });
  }
};

// Get chat history for a room with pagination and minimal fields
export const getRoomHistoryControllersPagination = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const room = await Room.findById(roomId).select('messages');
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Paginate messages (latest first)
    const totalMessages = room.messages.length;
    const paginatedMessages = room.messages
      .slice()
      .reverse()
      .slice(skip, skip + limit)
      .map(msg => ({
        roomId: room._id,
        senderId: msg.sender,
        message: msg.content
      }));

    res.status(200).json({
      roomId: room._id,
      page,
      limit,
      totalMessages,
      messages: paginatedMessages,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch room history', error: err });
  }
};

