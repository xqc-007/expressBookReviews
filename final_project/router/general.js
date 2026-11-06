const express = require('express');
const axios = require('axios');
const books = require('./booksdb');
const { isValid, registerUser } = require('./auth_users');
const public_users = express.Router();

public_users.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || !/^[a-zA-Z0-9_-]{1,50}$/.test(username) ||
        typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ message: 'Provide a username (letters, numbers, underscores or hyphens) and password.' });
    }
    if (isValid(username) || !(await registerUser(username, password))) {
      return res.status(409).json({ message: 'Username already exists.' });
    }
    return res.status(201).json({ message: 'User successfully registered. You can now log in.' });
  } catch (error) { next(error); }
});
public_users.get('/', (req, res) => res.json(books));
public_users.get('/isbn/:isbn', (req, res) => {
  if (!Object.hasOwn(books, req.params.isbn)) return res.status(404).json({ message: 'Book not found.' });
  return res.json(books[req.params.isbn]);
});
function matchingBooks(field, value) {
  return Object.fromEntries(Object.entries(books).filter(([, book]) =>
    book[field].toLowerCase().includes(value.toLowerCase())));
}
public_users.get('/author/:author', (req, res) => res.json(matchingBooks('author', req.params.author)));
public_users.get('/title/:title', (req, res) => res.json(matchingBooks('title', req.params.title)));
public_users.get('/review/:isbn', (req, res) => {
  if (!Object.hasOwn(books, req.params.isbn)) return res.status(404).json({ message: 'Book not found.' });
  return res.json(books[req.params.isbn].reviews);
});

// Tasks 10-13: Axios clients call the REST API asynchronously. They are separate
// from the route handlers to avoid recursive requests back to the same handler.
const api = axios.create({ baseURL: process.env.BOOK_API_URL || 'http://127.0.0.1:5000', timeout: 5000, proxy: false });
// Task 10: async/await with an optional error-first callback.
async function getAllBooks(callback) {
  try {
    const { data } = await api.get('/');
    if (callback) callback(null, data);
    return data;
  } catch (error) {
    if (callback) { callback(error); return; }
    throw error;
  }
}
// Task 11: return a Promise and handle the Axios response with .then().
function getBooksByISBN(isbn) {
  return api.get('/isbn/' + encodeURIComponent(isbn)).then(response => response.data);
}
// Task 12: retrieve books by author using async/await.
async function getBooksByAuthor(author) {
  const { data } = await api.get('/author/' + encodeURIComponent(author));
  return data;
}
// Task 13: retrieve books by title using async/await.
async function getBooksByTitle(title) {
  const { data } = await api.get('/title/' + encodeURIComponent(title));
  return data;
}
module.exports = { general: public_users, getAllBooks, getBooksByISBN, getBooksByAuthor, getBooksByTitle };
