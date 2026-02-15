import { connectDB, Project } from '../lib/db.js';  // ✅ Import

// ========== Auth Helper ==========
const checkAuth = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('غير مصرح');
    error.status = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];
  
  if (token !== process.env.ADMIN_SECRET) {
    const error = new Error('Token غير صحيح');
    error.status = 403;
    throw error;
  }
};

// ========== Main Handler ==========
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectDB();  // ✅

  const { id, action } = req.query;

  try {
    // ========== /api/projects (GET, POST) ==========
    if (!id) {
      if (req.method === 'GET') {
        const projects = await Project.find().sort({ createdAt: -1 });
        return res.status(200).json(projects);
      }

      if (req.method === 'POST') {
        checkAuth(req);
        
        const { title, tools, repo, view, category, body, urlImg } = req.body;

        if (!title || !category) {
          return res.status(400).json({ 
            success: false,
            message: 'العنوان والفئة مطلوبان' 
          });
        }

        const newProject = new Project({
          title,
          tools: tools || '',
          repo: repo || '',
          view: view || '',
          category,
          body: body || '',
          urlImg: urlImg || '',
          likedBy: [],
          views: 0
        });

        await newProject.save();
        
        return res.status(201).json({
          success: true,
          message: 'تم إضافة المشروع بنجاح',
          project: newProject
        });
      }
    }

    // ========== /api/projects?id=xxx ==========
    if (id && !action) {
      if (req.method === 'GET') {
        const project = await Project.findById(id);
        
        if (!project) {
          return res.status(404).json({ message: 'المشروع غير موجود' });
        }

        return res.status(200).json(project);
      }

      if (req.method === 'PUT') {
        checkAuth(req);

        const project = await Project.findByIdAndUpdate(
          id,
          req.body,
          { new: true }
        );

        if (!project) {
          return res.status(404).json({ 
            success: false,
            message: 'المشروع غير موجود' 
          });
        }

        return res.status(200).json({
          success: true,
          message: 'تم التحديث بنجاح',
          project
        });
      }

      if (req.method === 'DELETE') {
        checkAuth(req);

        const project = await Project.findByIdAndDelete(id);

        if (!project) {
          return res.status(404).json({ 
            success: false,
            message: 'المشروع غير موجود' 
          });
        }

        return res.status(200).json({
          success: true,
          message: 'تم الحذف بنجاح'
        });
      }
    }

    // ========== /api/projects?id=xxx&action=like ==========
    if (id && action === 'like' && req.method === 'POST') {
      const { userId } = req.body;

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

      return res.status(200).json({
        likes: project.likedBy.length,
        liked: !hasLiked
      });
    }

    // ========== /api/projects?id=xxx&action=view ==========
    if (id && action === 'view' && req.method === 'POST') {
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({ message: 'المشروع غير موجود' });
      }

      if (typeof project.views !== 'number') {
        project.views = 0;
      }

      project.views += 1;
      await project.save();

      return res.status(200).json({ views: project.views });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(error.status || 500).json({ 
      success: false,
      message: error.message 
    });
  }
}