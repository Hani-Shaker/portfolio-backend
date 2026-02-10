import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import projectRoutes from "./routes/projectRoutes.js";

connectDB();
const app = express();


app.use(cors());
app.use(express.json());

app.use("/api/projects", projectRoutes);


// ✅ للتطوير المحلي
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// ✅ لـ Vercel
export default app;
