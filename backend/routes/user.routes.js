import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Add user routes here
// Example: 
// router.get('/', protect, authorize('admin'), getAllUsers);

export default router;
