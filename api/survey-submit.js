import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

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

const surveySchema = new mongoose.Schema({
  source: { type: String, required: true },
  userType: { type: String, required: true },
  email: String,
  userId: { type: String, required: true, unique: true },
  ipAddress: String,
  userAgent: String,
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Survey = mongoose.models.Survey || mongoose.model('Survey', surveySchema);

const siteStatsSchema = new mongoose.Schema({
  totalVisitors: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const SiteStats = mongoose.models.SiteStats || mongoose.model('SiteStats', siteStatsSchema);

async function sendEmailNotification(survey) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '🎉 استبيان جديد من الموقع',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
          <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #19cee6;">استبيان جديد 📋</h2>
            <p><strong>من أين عرفتنا:</strong> ${survey.source}</p>
            <p><strong>نوع المستخدم:</strong> ${survey.userType}</p>
            <p><strong>البريد الإلكتروني:</strong> ${survey.email}</p>
            <p><strong>التاريخ:</strong> ${new Date(survey.submittedAt).toLocaleString('ar-EG')}</p>
            <p><strong>IP Address:</strong> ${survey.ipAddress}</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent");
  } catch (error) {
    console.error("❌ Email failed:", error);
  }
}

export default async function handler(req, res) {
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

  try {
    const { source, userType, email, userId } = req.body;

    const existingSurvey = await Survey.findOne({ userId });
    if (existingSurvey) {
      return res.status(400).json({ 
        success: false,
        message: "لقد أكملت الاستبيان من قبل" 
      });
    }

    const survey = new Survey({
      source,
      userType,
      email: email || "لم يتم تقديمه",
      userId,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    await survey.save();

    let stats = await SiteStats.findOne();
    if (!stats) {
      stats = new SiteStats({ totalVisitors: 1 });
    } else {
      stats.totalVisitors += 1;
      stats.lastUpdated = new Date();
    }
    await stats.save();

    await sendEmailNotification(survey);

    return res.status(200).json({
      success: true,
      message: "شكرًا لإكمال الاستبيان! 🎉",
      totalVisitors: stats.totalVisitors
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(error.status || 500).json({ 
      success: false,
      message: error.message 
    });
  }
}