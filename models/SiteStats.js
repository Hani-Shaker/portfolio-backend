import mongoose from "mongoose";

const siteStatsSchema = new mongoose.Schema({
  totalVisitors: { 
    type: Number, 
    default: 0 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("SiteStats", siteStatsSchema);