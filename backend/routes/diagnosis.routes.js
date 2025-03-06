import express from 'express';
import { 
  createDiagnosis, 
  getDiagnoses, 
  getDiagnosis, 
  addFeedback 
} from '../controllers/diagnosis.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createDiagnosis)
  .get(protect, getDiagnoses);

router.route('/:id')
  .get(protect, getDiagnosis);

router.route('/:id/feedback')
  .put(protect, addFeedback);

export default router;
