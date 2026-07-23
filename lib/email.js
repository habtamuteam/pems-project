import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // ✅ Replace with your real SMTP server
  port: 587,
  secure: false,
  auth: {
    user: 'your-real-email@gmail.com', // ✅ Replace with your real email
    pass: 'your-app-password',         // ✅ Use an app password if using Gmail
  },
});

export async function sendEmail(to, subject, html) {
  const info = await transporter.sendMail({
    from: '"Industrial Park Corporation" <your-real-email@gmail.com>',
    to,
    subject,
    html,
  });
  console.log('Message sent: %s', info.messageId);
}
