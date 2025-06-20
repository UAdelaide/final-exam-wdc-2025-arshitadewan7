const express = require('express');
const app = express();
const port = 3000;

const dogsRoute = require('./routes/dogs');
const walkrequestsRoute = require('./routes/walkrequests');
const walkersRoute = require('./routes/walkers');
const pool = require('./db');

app.use(express.json());

app.use('/api/dogs', dogsRoute);
app.use('/api/walkrequests/open', walkrequestsRoute);
app.use('/api/walkers/summary', walkersRoute);


app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);

  try {
    const conn = await pool.getConnection();


    await conn.query(`DELETE FROM WalkRatings; DELETE FROM WalkApplications; DELETE FROM WalkRequests; DELETE FROM Dogs; DELETE FROM Users;`);

    await conn.query(`
      INSERT INTO Users (username, email, password_hash, role) VALUES
      ('alice123', 'alice@example.com', 'hashed123', 'owner'),
      ('carol123', 'carol@example.com', 'hashed789', 'owner'),
      ('bobwalker', 'bob@example.com', 'hashed456', 'walker');

      INSERT INTO Dogs (owner_id, name, size)
      VALUES
      ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
      ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small');

      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
      VALUES
      ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
      ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted');
    `);

    conn.release();
  } catch (error) {
    console.error('Startup DB insert error:', error);
  }
});
