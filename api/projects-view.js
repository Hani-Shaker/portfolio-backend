import { connectDB, Project } from '../lib/db.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await connectDB();

  const { id } = req.query;

  try {
    console.log('📥 View request:', id);

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ message: 'المشروع غير موجود' });
    }

    if (typeof project.views !== 'number') {
      project.views = 0;
    }

    project.views += 1;
    await project.save();
    console.log('✅ Views incremented:', project.views);

    return res.status(200).json({ views: project.views });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ message: error.message });
  }
}