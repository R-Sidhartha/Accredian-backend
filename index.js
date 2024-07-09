
const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 5000;

// Utility function to send email
async function sendReferralEmail(referral) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    host:'smtp.gmail.com',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  let mailOptions = {
    from:{ name: 'Accredian', address: process.env.GMAIL_USER },
    to: referral.friendEmail,
    subject: `Course Referral from ${referral.yourName}`,
    text: `Hi ${referral.friendName},\n\n${referral.yourName} has referred you to the course: ${referral.courseName}.\n\nBest Regards,\nCourse Team`
  };

  await transporter.sendMail(mailOptions);
}

// Endpoint to handle referral form submission
app.post('/api/referrals', async (req, res) => {
  const { yourName, yourEmail, friendName, friendEmail, courseName } = req.body;

  if (!yourName || !yourEmail || !friendName || !friendEmail || !courseName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!/\S+@\S+\.\S+/.test(yourEmail) || !/\S+@\S+\.\S+/.test(friendEmail)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const referral = await prisma.referral.create({
      data: {
        yourName,
        yourEmail,
        friendName,
        friendEmail,
        courseName
      }
    });

    // Send referral email
    await sendReferralEmail(referral);

    res.status(201).json(referral);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
