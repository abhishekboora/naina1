import jwt from 'jsonwebtoken';

export const authenticateSuperadmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'naina_secret_key');
    
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
