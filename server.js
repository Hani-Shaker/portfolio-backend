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

const allowedOrigins = [
  'http://localhost:5173', // للتطوير المحلي
  'https://portfolio-yourusername.vercel.app' // ✅ حط رابط Frontend هنا
];

app.use(cors({
  origin: function(origin, callback) {
    // السماح بالـ requests من المصادر المسموحة
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// ✅ للتطوير المحلي
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// ✅ لـ Vercel
export default app;
