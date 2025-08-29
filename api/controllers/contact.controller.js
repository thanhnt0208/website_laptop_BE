const nodemailer = require("nodemailer");
require("dotenv").config();

// Hàm gửi liên hệ
const sendContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    // Cấu hình transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Nội dung email
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: `📩 Liên hệ từ khách hàng: ${subject}`,
      text: `
📌 Thông tin liên hệ:
----------------------
👤 Họ và tên: ${name}
📧 Email: ${email}
📞 Số điện thoại: ${phone}

📝 Chủ đề: ${subject}

📄 Nội dung:
${message}
      `,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Gửi liên hệ thành công" });
  } catch (error) {
    console.error("Lỗi gửi email:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
};

module.exports = {
  sendContact,
};
