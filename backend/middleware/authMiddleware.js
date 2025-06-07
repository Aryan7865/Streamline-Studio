const jwt = require('jsonwebtoken');

const authMiddleware = (req,res,next) => {
    const token = req.header('Authorization');
    if(!token){
        return res.status(401).json({ message: 'Authorization denied, token required' });
    }
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user from payload
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;