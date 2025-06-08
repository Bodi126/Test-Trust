const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Exam = require('../models/exam');
const Question = require('../models/question');
const ModelAnswer = require('../models/modelAnswer');

const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Only allow setting twoFactorCode and twoFactorExpires in /send-2fa-code and /verify-2fa endpoints
router.post('/signup', async (req, res) => {
  try {
    const { email, ...rest } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Prevent twoFactorCode and twoFactorExpires from being set on signup
    const filteredRest = { ...rest };
    delete filteredRest.twoFactorCode;
    delete filteredRest.twoFactorExpires;

    const newUser = new User({ email, ...filteredRest });
    await newUser.save();
    console.log('New user created:', newUser);

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Signup error', error: err });
  }
});