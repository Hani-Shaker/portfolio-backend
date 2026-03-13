import { connectDB, Survey, SiteStats } from '../lib/db.js';
import nodemailer from 'nodemailer';

// ========== Email Helper ==========
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
            <p><strong>الاسم:</strong> ${survey.userName}</p>
            <p><strong>من أين عرفتنا:</strong> ${survey.source}</p>
            <p><strong>نوع المستخدم:</strong> ${survey.userType}</p>
            <p><strong>البريد الإلكتروني:</strong> ${survey.email}</p>
            <p><strong>التاريخ:</strong> ${new Date(survey.submittedAt).toLocaleString('ar-EG')}</p>
            <p><strong>IP Address:</strong> ${survey.ipAddress}</p>
            <hr>
            <p style="color: #666; font-size: 12px;">تم الإرسال تلقائيًا من موقعك</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
}

// ========== Main Handler ==========
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

  try {
    const {userName, source, userType, email, userId } = req.body;

    // console.log('📥 Survey submission:', {userName, source, userType, userId });

    // التحقق من عدم تكرار الاستبيان
    const existingSurvey = await Survey.findOne({ userId });
    if (existingSurvey) {
      console.log('⚠️ Duplicate survey attempt');
      return res.status(400).json({ 
        success: false,
        message: "لقد أكملت الاستبيان من قبل" 
      });
    }

    // حفظ الاستبيان
    const survey = new Survey({
      userName,
      source,
      userType,
      email: email || "لم يتم تقديمه",
      userId,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    await survey.save();
    console.log('✅ Survey saved:', survey._id);

    // زيادة عدد الزوار
    let stats = await SiteStats.findOne();
    if (!stats) {
      stats = new SiteStats({ totalVisitors: 1 });
    } else {
      stats.totalVisitors += 1;
      stats.lastUpdated = new Date();
    }
    await stats.save();
    console.log('✅ Visitor count updated:', stats.totalVisitors);

    // إرسال الإيميل
    await sendEmailNotification(survey);

    return res.status(200).json({
      success: true,
      message: "شكرًا لإكمال الاستبيان! 🎉",
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