import { connectDB, Project } from '../lib/db.js';

// ========== Auth Helper ==========
const checkAuth = (req) => {
  const authHeader = req.headers.authorization;
  
  console.log('🔐 Checking auth...');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No auth header');
    const error = new Error('غير مصرح - لا يوجد Authorization header');
    error.status = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.log('❌ No token');
    const error = new Error('غير مصرح - Token فارغ');
    error.status = 401;
    throw error;
  }
  
  if (token !== process.env.ADMIN_SECRET) {
    console.log('❌ Invalid token');
    const error = new Error('ممنوع - Token غير صحيح');
    error.status = 403;
    throw error;
  }
  
  console.log('✅ Auth successful');
};

// ========== Main Handler ==========
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectDB();

  const { id, action } = req.query;

  try {
    // ========== GET /api/projects - جلب كل المشاريع ==========
    if (!id && !action && req.method === 'GET') {
      console.log('📥 GET all projects');
      const projects = await Project.find().sort({ createdAt: -1 });
      console.log(`✅ Found ${projects.length} projects`);
      return res.status(200).json(projects);
    }

    // ========== POST /api/projects - إضافة مشروع ==========
    if (!id && !action && req.method === 'POST') {
      console.log('📥 POST new project');
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
      console.log('✅ Project created:', newProject._id);
      
      return res.status(201).json({
        success: true,
        message: 'تم إضافة المشروع بنجاح',
        project: newProject
      });
    }

    // ========== GET /api/projects?id=xxx - جلب مشروع واحد ==========
    if (id && !action && req.method === 'GET') {
      console.log('📥 GET project:', id);
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({ message: 'المشروع غير موجود' });
      }

      return res.status(200).json(project);
    }

    // ========== PUT /api/projects?id=xxx - تعديل مشروع ==========
    if (id && !action && req.method === 'PUT') {
      console.log('📥 PUT project:', id);
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

      console.log('✅ Project updated:', id);
      return res.status(200).json({
        success: true,
        message: 'تم التحديث بنجاح',
        project
      });
    }

    // ========== DELETE /api/projects?id=xxx - حذف مشروع ==========
    if (id && !action && req.method === 'DELETE') {
      console.log('📥 DELETE project:', id);
      checkAuth(req);

      const project = await Project.findByIdAndDelete(id);

      if (!project) {
        return res.status(404).json({ 
          success: false,
          message: 'المشروع غير موجود' 
        });
      }

      console.log('✅ Project deleted:', id);
      return res.status(200).json({
        success: true,
        message: 'تم الحذف بنجاح'
      });
    }

    // ========== POST /api/projects?id=xxx&action=like - Like ==========
    if (id && action === 'like' && req.method === 'POST') {
      console.log('📥 Like project:', id);
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
      console.log('✅ Like toggled:', hasLiked ? 'unliked' : 'liked');

      return res.status(200).json({
        likes: project.likedBy.length,
        liked: !hasLiked
      });
    }

    // ========== POST /api/projects?id=xxx&action=view - View ==========
    if (id && action === 'view' && req.method === 'POST') {
      console.log('📥 View project:', id);
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
    }

    // Method not allowed
    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(error.status || 500).json({ 
      success: false,
      message: error.message 
    });
  }
}