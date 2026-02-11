import mongoose from "mongoose";

const surveySchema = new mongoose.Schema({
  source: { 
    type: String, 
    required: true 
  }, // من فين عرفتنا
  userType: { 
    type: String, 
    required: true 
  }, // عميل/صاحب شركة/زائر
  email: String, // اختياري
  userId: { 
    type: String, 
    required: true, 
    unique: true 
  }, // معرف فريد
  ipAddress: String,
  userAgent: String,
  submittedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

export default mongoose.model("Survey", surveySchema);