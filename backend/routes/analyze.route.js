import express from "express";
import { analyzePetSymptoms } from "../controller/analyze.controller.js";

const router = express.Router();

// POST /api/analyze - Analyze pet symptoms
router.post('/', analyzePetSymptoms);

export default router;
