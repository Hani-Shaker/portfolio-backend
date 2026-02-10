import express from "express";
import { 
  getProjects, 
  toggleLike, 
  incrementViews 
} from "../controllers/projectController.js";

const router = express.Router();

router.get("/", getProjects);
router.post("/:projectId/like", toggleLike);
router.post("/:projectId/view", incrementViews);

export default router;