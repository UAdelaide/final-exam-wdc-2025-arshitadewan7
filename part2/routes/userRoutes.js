const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const {
    username, email, password, role
  } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received with:", email, password); // added console log to debug

  try {
    const [rows] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE email = ? AND password_hash = ?
    `, [email, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // store in session
    req.session.user = rows[0];

    res.json({ message: 'Login successful', user: rows[0] });
  } catch (error) {
    console.error("Login failed:", error); // added console logs to debug
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/users/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // destroy cookie
    res.json({ message: 'Logged out successfully' });
  });
});

// GET /api/users/mydogs - return dogs owned by the logged-in user
router.get('/mydogs', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'owner') {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    const [dogs] = await db.query(`
      SELECT dog_id, name, size
      FROM Dogs
      WHERE owner_id = ?
    `, [req.session.user.user_id]);

    res.json(dogs);
  } catch (error) {
    console.error('Failed to fetch dogs:', error);
    res.status(500).json({ error: 'Error retrieving dogs' });
  }
});

module.exports = router;
