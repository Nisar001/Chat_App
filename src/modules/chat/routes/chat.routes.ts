import { Router } from 'express';
import { createRoomController, getUserRoomsController, getRoomHistoryController, getRoomHistoryControllersPagination } from '../controllers/room.controller';
import { jwtVerifyMiddleware } from '../../../middlewares/jwtVerify.middleware';

const router = Router();

// Create a room (1-to-1 or group)
router.post('/create', jwtVerifyMiddleware, createRoomController);

// Get all rooms for the logged-in user
router.get('/my', jwtVerifyMiddleware, getUserRoomsController);

// Get chat history for a room
router.get('/:roomId/history', jwtVerifyMiddleware, getRoomHistoryController);

// Get chat history for a room with pagination and minimal fields
router.get('/:roomId/history-pagination', jwtVerifyMiddleware, getRoomHistoryControllersPagination);

export default router;
