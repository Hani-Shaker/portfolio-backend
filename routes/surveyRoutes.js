import express from "express";
import { submitSurvey, getVisitorCount } from "../controllers/surveyController.js";

const router = express.Router();

router.post("/submit", submitSurvey);
router.get("/visitor-count", getVisitorCount);

export default router;