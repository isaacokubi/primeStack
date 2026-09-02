import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production' ? null : 'development-only-secret-change-me'
);

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production');
}

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.ps_token || req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    const user = await User.findById(decoded.id).select('-password').lean();
    if (!user || user.status !== 'Active') {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = {
      ...user,
      id: user._id.toString()
    };

    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (roles.includes(req.user?.role)) return next();
  return res.status(403).json({ success: false, message: 'Insufficient permissions' });
};
