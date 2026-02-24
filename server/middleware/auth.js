const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const verifyParticipant = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.type !== 'participant') {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  });
};

const verifyOrganizer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.type !== 'organizer') {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  });
};

module.exports = { verifyToken, verifyParticipant, verifyOrganizer, verifyAdmin };
