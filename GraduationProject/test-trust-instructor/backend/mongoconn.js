const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/testtrust', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to TestTrust database');
}).catch((err) => {
    console.log('Error connecting to database', err);
});

app.use('/auth', authRoutes);

app.listen(5000, () => {
    console.log("App is running on port 5000");
});
