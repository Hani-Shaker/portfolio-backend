import mongoose from 'mongoose';

// ========== Database Connection (مُحسّن لـ Serverless) ==========
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB Connected');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// ========== Project Model ==========
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tools: String,
  repo: String,
  view: String,
  category: String,
  body: String,
  urlImg: String,
  likedBy: { type: [String], default: [] },
  views: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

// ========== Survey Model ==========
const surveySchema = new mongoose.Schema({
  source: { type: String, required: true },
  userType: { type: String, required: true },
  email: String,
  userId: { type: String, required: true, unique: true },
  ipAddress: String,
  userAgent: String,
  submittedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

export const Survey = mongoose.models.Survey || mongoose.model('Survey', surveySchema);

// ========== SiteStats Model ==========
const siteStatsSchema = new mongoose.Schema({
  totalVisitors: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export const SiteStats = mongoose.models.SiteStats || mongoose.model('SiteStats', siteStatsSchema);