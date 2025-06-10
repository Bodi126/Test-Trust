require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');

const authRoutes = require("./routes/auth");
const instructorRoutes = require("./routes/instructors");
const authstuRouts = require("./routes/auth_stu");
const examRoutes = require("./routes/exams");

const app = express();

// Middleware - Must be before routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware - must be before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Remove body-parser as we're using express's built-in
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

const server = http.createServer(app); // Use this instead of app.listen directly

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

const connectedStudents = {};

// Handle socket connections
io.on('connection', (socket) => {
    console.log("User connected:", socket.id);

    socket.on('student_join', (studentId) => {
        connectedStudents[studentId] = socket.id;
        console.log(`Student ${studentId} connected with socket ${socket.id}`);
    });

    socket.on('start_exam', () => {
        io.emit('start_exam'); // broadcast to all students
        console.log('Exam started');
    });

    socket.on('end_exam_for_student', (studentId) => {
        const socketId = connectedStudents[studentId];
        if (socketId) {
            io.to(socketId).emit('end_exam');
            console.log(`Ended exam for student ${studentId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log("User disconnected:", socket.id);
        for (let id in connectedStudents) {
            if (connectedStudents[id] === socket.id) {
                delete connectedStudents[id];
                break;
            }
        }
    });
});


// CORS configuration
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/testtrust', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
}).then(() => {
    console.log('Connected to TestTrust database');
}).catch((err) => {
    console.log('Error connecting to database', err);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/auth_stu', authstuRouts);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Run the server with Socket.IO
server.listen(5000, () => {
    console.log("Server is running on port 5000");
});
