/**
 * routes/contact.js
 * POST /api/contact
 * Handles contact form submissions (logs to console; add email service in production)
 */

const express = require('express');
const router  = express.Router();

router.post('/', (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // In production: send via Nodemailer / SendGrid / Resend
  // Example with Nodemailer (npm install nodemailer):
  //
  // const nodemailer = require('nodemailer');
  // const transporter = nodemailer.createTransporter({
  //   service: 'gmail',
  //   auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  // });
  // await transporter.sendMail({
  //   from: email,
  //   to: process.env.ADMIN_EMAIL,
  //   subject: `ReelGrab Contact: ${subject}`,
  //   text: `From: ${name} <${email}>\n\n${message}`
  // });

  console.log(`[Contact] New message from ${name} <${email}>: ${subject || 'No subject'}`);

  res.json({ success: true, message: 'Message received. We will respond within 24 hours.' });
});

module.exports = router;
