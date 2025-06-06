const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");
const authRoutes = require("./routes/auth");
const instructorRoutes = require("./routes/instructors");

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/testtrust', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
}).then(() => {
    console.log('Connected to TestTrust database');
}).catch((err) => {
    console.log('Error connecting to database', err);
});

app.use('/auth', authRoutes);
app.use('/instructors', instructorRoutes);

app.listen(5000, () => {
    console.log("App is running on port 5000");
});
