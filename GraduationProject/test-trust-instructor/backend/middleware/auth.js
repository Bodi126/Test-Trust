const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No authentication token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
        
        // Find user by _id from the decoded token
        const user = await User.findOne({ _id: decoded._id });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach user and token to the request object
        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        console.error('Authentication error:', err);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired' });
        }
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
