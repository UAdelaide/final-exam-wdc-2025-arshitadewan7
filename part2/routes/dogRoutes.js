const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET /api/dogs - getting all registered dogs
router.get('/', async (req, res) => {
  try {
    // get dogs from db
    const [rows] = await db.query('SELECT * FROM Dogs');
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;
