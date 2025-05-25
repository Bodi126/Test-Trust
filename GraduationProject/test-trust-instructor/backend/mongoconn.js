
const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");

const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/testtrust', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to TestTrust database');
}).catch((err) => {
    console.log('Error connecting to database', err);
});

// Start the server
app.listen(5000, () => {
    console.log("App is running on port 5000");
});
