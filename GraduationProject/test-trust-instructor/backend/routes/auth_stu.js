const express = require('express');
const router = express.Router();
const Student = require('../models/student');

router.post('/register', async (req, res) => {
  try {
    const { fullName, nationalId, section, department, academicYear, idPhoto, fingerprintData } = req.body;

    const existingStudent = await Student.findOne({ nationalId });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    const newStudent = new Student({
      fullName,
      nationalId,
      section,
      department,
      academicYear,
      idPhoto,
      fingerprintData
    });

    await newStudent.save();
    res.status(201).json({ message: 'Student registered successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { fullName, nationalId } = req.body;
    console.log('Login Attempt:', { fullName, nationalId });

    const student = await Student.findOne({ fullName: fullName });

    if (!student) {
      return res.status(404).json({ message: "User doesn't exist" });
    }

    if (student.nationalId !== nationalId) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Student found:', student);
    res.status(200).json({ message: 'Login successful', student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
