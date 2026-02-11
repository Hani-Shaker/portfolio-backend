import Survey from "../models/Survey.js";
import SiteStats from "../models/SiteStats.js";
import nodemailer from "nodemailer";

// إرسال الاستبيان
export const submitSurvey = async (req, res) => {
  try {
    const { source, userType, email, userId } = req.body;

    // التحقق من عدم تكرار الاستبيان
    const existingSurvey = await Survey.findOne({ userId });
    if (existingSurvey) {
      return res.status(400).json({ 
        message: "لقد أكملت الاستبيان من قبل" 
      });
    }

    // حفظ الاستبيان
    const survey = new Survey({
      source,
      userType,
      email: email || "لم يتم تقديمه",
      userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await survey.save();

    // زيادة عدد الزوار
    let stats = await SiteStats.findOne();
    if (!stats) {
      stats = new SiteStats({ totalVisitors: 1 });
    } else {
      stats.totalVisitors += 1;
      stats.lastUpdated = new Date();
    }
    await stats.save();

    // إرسال البيانات على الإيميل
    await sendEmailNotification(survey);

    res.json({
      success: true,
      message: "شكرًا لإكمال الاستبيان! 🎉",
      totalVisitors: stats.totalVisitors
    });

  } catch (error) {
    console.error("❌ Survey submission error:", error);
    res.status(500).json({ message: error.message });
  }
};

// جلب عدد الزوار
export const getVisitorCount = async (req, res) => {
  try {
    let stats = await SiteStats.findOne();
    if (!stats) {
      stats = new SiteStats({ totalVisitors: 0 });
      await stats.save();
    }

    res.json({
      totalVisitors: stats.totalVisitors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// إرسال إيميل
async function sendEmailNotification(survey) {
  try {
    // إعداد Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail', // أو أي خدمة تانية
      auth: {
        user: process.env.EMAIL_USER, // إيميلك
        pass: process.env.EMAIL_PASSWORD // App Password من Gmail
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // إيميلك (المستقبل)
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