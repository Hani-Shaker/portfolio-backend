import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import projectsHandler from "./api/projects.js";
import surveyCountHandler from "./api/survey-count.js";  // ✅
import surveySubmitHandler from "./api/survey-submit.js";  // ✅

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const wrapHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('❌ Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

app.get("/", (req, res) => {
  res.json({ 
    message: "Backend running! 🚀",
    endpoints: {
      projects: "/api/projects",
      surveyCount: "/api/survey-count",
      surveySubmit: "/api/survey-submit"
    }
  });
});

app.all("/api/projects", wrapHandler(projectsHandler));
app.all("/api/survey-count", wrapHandler(surveyCountHandler));  // ✅
app.all("/api/survey-submit", wrapHandler(surveySubmitHandler));  // ✅

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📊 Projects: http://localhost:${PORT}/api/projects`);
  console.log(`👥 Visitor Count: http://localhost:${PORT}/api/survey-count`);
});