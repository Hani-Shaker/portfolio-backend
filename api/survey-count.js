import { connectDB, SiteStats } from '../lib/db.js';

export default async function handler(req, res) {
  // CORS
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

    console.log('✅ Visitor count:', stats.totalVisitors);
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