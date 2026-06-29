import crypto from 'crypto';

export const csrfProtection = (req, res, next) => {
  // Methods that don't change state are safe
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const tokenFromCookie = req.cookies['_csrf'];
  const tokenFromHeader = req.headers['x-csrf-token'];

  if (!tokenFromCookie || !tokenFromHeader || tokenFromCookie !== tokenFromHeader) {
    return res.status(403).json({ message: 'CSRF token validation failed' });
  }

  next();
};

export const generateCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  
  res.cookie('_csrf', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.json({ csrfToken: token });
};
