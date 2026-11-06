const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { jwtSecret, sessionSecret } = require('./config');
const customerRoutes = require('./router/auth_users').authenticated;
const generalRoutes = require('./router/general').general;
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use('/customer', session({
  secret: sessionSecret, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 3600000 }
}));
app.use('/customer/auth', (req, res, next) => {
  const token = req.session.authorization?.token;
  if (!token) return res.status(401).json({ message: 'Please log in first.' });
  try {
    req.user = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
});
app.use('/customer', customerRoutes);
app.use('/', generalRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON.' });
  console.error(error.message);
  res.status(500).json({ message: 'Internal server error.' });
});
if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Book review server listening on port ${port}`));
}
module.exports = app;
