const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.post('/toggle-2fa', async (req, res) => {
  try {
    const { email, enabled } = req.body;
    const instructor = await User.findOneAndUpdate(
      { email },
      { twoFactorEnabled: enabled },
      { new: true }
    );
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }
    res.json({ success: true, twoFactorEnabled: instructor.twoFactorEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
