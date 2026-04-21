import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { registerValidation, loginValidation } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { accessToken, refreshToken };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true, secure: isProd,
    sameSite: isProd ? 'none' : 'lax', maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, secure: isProd,
    sameSite: isProd ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth',
  });
};

/* POST /api/auth/register */
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: exists.email === email ? 'Email already registered' : 'Username taken' });

    const user = new User({ username, email, passwordHash: password });
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate('bookmarks', 'slug title')
      .populate('readingHistory.manhwaId', 'slug title cover')
      .populate('readingHistory.chapterId', 'chapterNumber title');

    setTokenCookies(res, accessToken, refreshToken);
    res.status(201).json({ user: populatedUser.toJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

/* POST /api/auth/login */
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
      .populate('bookmarks', 'slug title')
      .populate('readingHistory.manhwaId', 'slug title cover')
      .populate('readingHistory.chapterId', 'chapterNumber title');
    
    if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

/* POST /api/auth/logout */
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
    }
  } catch { /* ignore */ }
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('accessToken', {
    httpOnly: true, secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  });
  res.clearCookie('refreshToken', { 
    path: '/api/auth',
    httpOnly: true, secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out' });
});

/* POST /api/auth/refresh */
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id)
      .populate('bookmarks', 'slug title')
      .populate('readingHistory.manhwaId', 'slug title cover')
      .populate('readingHistory.chapterId', 'chapterNumber title');

    if (!user || user.refreshToken !== token) return res.status(401).json({ message: 'Invalid refresh token' });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);
    res.json({ user: user.toJSON() });
  } catch (err) {
    res.status(401).json({ message: 'Token refresh failed' });
  }
});

/* GET /api/auth/me */
router.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('bookmarks', 'slug title')
    .populate('readingHistory.manhwaId', 'slug title cover')
    .populate('readingHistory.chapterId', 'chapterNumber title');
  res.json({ user: user.toJSON() });
});

export default router;
