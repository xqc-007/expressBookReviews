const express = require('express');
const jwt = require('jsonwebtoken');
const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const deriveKey = promisify(scrypt);
const books = require('./booksdb');
const { jwtSecret } = require('../config');
const regd_users = express.Router();
const users = [];
const isValid = username => users.some(user => user.username === username);

async function registerUser(username, password) {
  const salt = randomBytes(16).toString('hex');
  const passwordHash = (await deriveKey(password, salt, 64)).toString('hex');
  // Recheck after the asynchronous hash to prevent concurrent duplicate users.
  if (isValid(username)) return false;
  users.push({ username, salt, passwordHash });
  return true;
}
async function authenticatedUser(username, password) {
  const user = users.find(user => user.username === username);
  if (!user) return false;
  const candidate = await deriveKey(password, user.salt, 64);
  return timingSafeEqual(candidate, Buffer.from(user.passwordHash, 'hex'));
}
regd_users.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Username and password are required.' });
    }
    if (!(await authenticatedUser(username, password))) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    req.session.regenerate(error => {
      if (error) return next(error);
      req.session.authorization = {
        token: jwt.sign({ username }, jwtSecret, { expiresIn: '1h' })
      };
      req.session.save(error => {
        if (error) return next(error);
        res.json({ message: 'User successfully logged in.', username });
      });
    });
  } catch (error) { next(error); }
});
regd_users.put('/auth/review/:isbn', (req, res) => {
  const book = Object.hasOwn(books, req.params.isbn) ? books[req.params.isbn] : null;
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  const review = req.query.review ?? req.body?.review;
  if (typeof review !== 'string' || !review.trim()) {
    return res.status(400).json({ message: 'A non-empty review is required.' });
  }
  const username = req.user.username;
  const updating = Object.hasOwn(book.reviews, username);
  Object.defineProperty(book.reviews, username, {
    value: review.trim(), writable: true, enumerable: true, configurable: true
  });
  return res.json({ message: updating ? 'Review updated successfully.' : 'Review added successfully.', reviews: book.reviews });
});
regd_users.delete('/auth/review/:isbn', (req, res) => {
  const book = Object.hasOwn(books, req.params.isbn) ? books[req.params.isbn] : null;
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  if (!Object.hasOwn(book.reviews, req.user.username)) {
    return res.status(404).json({ message: 'You have no review for this book.' });
  }
  delete book.reviews[req.user.username];
  return res.json({ message: 'Review deleted successfully.', reviews: book.reviews });
});
module.exports = { authenticated: regd_users, users, isValid, registerUser, authenticatedUser };
