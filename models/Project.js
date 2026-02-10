import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tools: String,
  repo: String,
  view: String,
  category: String,
  body: String,
  urlImg: String,
  likedBy: { 
    type: [String], 
    default: [] 
  },
  views: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

export default mongoose.model("Project", projectSchema);