const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const db = req.app.get('db');
  try {
    const [rows] = await db.query('SELECT ...');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});


router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve dogs' });
  }
});

module.exports = router;
