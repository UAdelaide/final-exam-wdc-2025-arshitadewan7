const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all walk requests (for walkers to view)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT wr.*, d.name AS dog_name, d.size, u.username AS owner_name
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// POST a new walk request (from owner)
router.post('/', async (req, res) => {
  const { dog_id, requested_time, duration_minutes, location } = req.body;
  const user = req.session.user;

  if (!user || user.role !== 'owner') {
    return res.status(403).json({ error: 'Only logged-in owners can create walk requests.' }); // added logic to check user roles
  }

  if (!dog_id || !requested_time || !duration_minutes || !location) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    // Check that the dog belongs to the logged-in user
    const [dogs] = await db.query(
      `SELECT * FROM Dogs WHERE dog_id = ? AND owner_id = ?`,
      [dog_id, user.user_id]
    );

    if (dogs.length === 0) {
      return res.status(403).json({ error: 'You do not own this dog.' });
    }

    // Insert the walk request
    const [result] = await db.query(
      `INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location)
       VALUES (?, ?, ?, ?)`,
      [dog_id, requested_time, duration_minutes, location]
    );

    res.status(201).json({
      message: 'Walk request created successfully',
      request_id: result.insertId
    });
  } catch (err) {
    console.error('Error creating walk request:', err);
    res.status(500).json({ error: 'Server error while creating walk request.' });
  }
});


// POST an application to walk a dog (from walker)
router.post('/:id/apply', async (req, res) => {
  const requestId = req.params.id;
  const { walker_id } = req.body;

  try {
    await db.query(`
      INSERT INTO WalkApplications (request_id, walker_id)
      VALUES (?, ?)
    `, [requestId, walker_id]);

    await db.query(`
      UPDATE WalkRequests
      SET status = 'accepted'
      WHERE request_id = ?
    `, [requestId]);

    res.status(201).json({ message: 'Application submitted' });
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to apply for walk' });
  }
});

module.exports = router;