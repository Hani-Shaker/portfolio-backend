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
  const { userId } = req.body;

  try {
    console.log('📥 Like request:', { id, userId });

    if (!userId) {
      return res.status(400).json({ message: 'userId مطلوب' });
    }

    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ message: 'المشروع غير موجود' });
    }

    if (!Array.isArray(project.likedBy)) {
      project.likedBy = [];
    }

    const hasLiked = project.likedBy.includes(userId);

    if (hasLiked) {
      project.likedBy = project.likedBy.filter(uid => uid !== userId);
    } else {
      project.likedBy.push(userId);
    }

    await project.save();
    console.log('✅ Like toggled:', hasLiked ? 'unliked' : 'liked');

    return res.status(200).json({
      likes: project.likedBy.length,
      liked: !hasLiked
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ message: error.message });
  }
}