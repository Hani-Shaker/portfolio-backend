import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    }).then((mongoose) => {
      console.log('✅ MongoDB Connected');
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

const siteStatsSchema = new mongoose.Schema({
  totalVisitors: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const SiteStats = mongoose.models.SiteStats || mongoose.model('SiteStats', siteStatsSchema);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();

  try {
    let stats = await SiteStats.findOne();
    
    if (!stats) {
      stats = new SiteStats({ totalVisitors: 0 });
      await stats.save();
    }

    return res.status(200).json({
      totalVisitors: stats.totalVisitors
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}