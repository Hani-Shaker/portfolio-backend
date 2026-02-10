import Project from "../models/Project.js";

// جلب كل المشاريع
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error("❌ getProjects error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Toggle Like
export const toggleLike = async (req, res) => {
  try {
    console.log("📥 Like Request:", {
      userId: req.body.userId,
      projectId: req.params.projectId
    });

    const { userId } = req.body;
    const { projectId } = req.params;

    // التحقق من البيانات
    if (!userId) {
      console.log("❌ No userId provided");
      return res.status(400).json({ message: "userId is required" });
    }

    console.log("🔍 Finding project:", projectId);
    const project = await Project.findById(projectId);
    
    if (!project) {
      console.log("❌ Project not found");
      return res.status(404).json({ message: "Project not found" });
    }

    console.log("✅ Project found:", project.title);
    console.log("📊 Current likedBy:", project.likedBy);

    // تأكد إن likedBy موجود
    if (!Array.isArray(project.likedBy)) {
      console.log("⚠️ likedBy is not an array, initializing...");
      project.likedBy = [];
    }

    const hasLiked = project.likedBy.includes(userId);
    console.log("❤️ User has liked?", hasLiked);

    if (hasLiked) {
      // إزالة Like
      project.likedBy = project.likedBy.filter(id => id !== userId);
      console.log("➖ Removed like");
    } else {
      // إضافة Like
      project.likedBy.push(userId);
      console.log("➕ Added like");
    }

    console.log("💾 Saving project...");
    await project.save();
    console.log("✅ Project saved successfully");

    const response = {
      likes: project.likedBy.length,
      liked: !hasLiked
    };
    console.log("📤 Response:", response);

    res.json(response);
  } catch (error) {
    console.error("❌❌❌ toggleLike error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: error.message,
      error: error.toString()
    });
  }
};

// زيادة المشاهدات
export const incrementViews = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log("👁️ Incrementing views for:", projectId);
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // تأكد إن views موجود
    if (typeof project.views !== 'number') {
      project.views = 0;
    }

    project.views += 1;
    await project.save();

    console.log("✅ Views incremented to:", project.views);

    res.json({ views: project.views });
  } catch (error) {
    console.error("❌ incrementViews error:", error);
    res.status(500).json({ message: error.message });
  }
};