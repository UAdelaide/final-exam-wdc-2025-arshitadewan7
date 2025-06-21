const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let db;

(async () => {
  try {

    const connection = await mysql.createConnection({ // creating a sql connection
      host: '127.0.0.1', // using 127.0.0.1 instead of localhost
      user: 'root',
      password: ''
    });


    await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await connection.end();


    db = await mysql.createConnection({ // connect with DogWalkService database
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });


    await db.execute(`
      CREATE TABLE IF NOT EXISTS Users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('owner', 'walker') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS Dogs (
        dog_id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        size ENUM('small', 'medium', 'large') NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES Users(user_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkRequests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        dog_id INT NOT NULL,
        requested_time DATETIME NOT NULL,
        duration_minutes INT NOT NULL,
        location VARCHAR(255) NOT NULL,
        status ENUM('open', 'accepted', 'completed', 'cancelled') DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dog_id) REFERENCES Dogs(dog_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkApplications (
        application_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        walker_id INT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
        FOREIGN KEY (walker_id) REFERENCES Users(user_id),
        UNIQUE (request_id, walker_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS WalkRatings (
        rating_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        walker_id INT NOT NULL,
        owner_id INT NOT NULL,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        comments TEXT,
        rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES WalkRequests(request_id),
        FOREIGN KEY (walker_id) REFERENCES Users(user_id),
        FOREIGN KEY (owner_id) REFERENCES Users(user_id),
        UNIQUE (request_id)
      )
    `);

    // insert vak
    const [users] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (users[0].count === 0) {
      await db.execute(`
        INSERT INTO Users (username, email, password_hash, role)
        VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker')
      `);

      await db.execute(`
        INSERT INTO Dogs (owner_id, name, size)
        VALUES
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small')
      `);

      await db.execute(`
        INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
        VALUES
        ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted')
      `);
    }

    // Route: /api/dogs
    app.get('/api/dogs', async (req, res) => {
      try {
        const [rows] = await db.query(`
          SELECT d.name AS dog_name, d.size, u.username AS owner_username
          FROM Dogs d
          JOIN Users u ON d.owner_id = u.user_id;
        `);
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve dogs' });
      }
    });

    // Route: /api/walkrequests/open
    app.get('/api/walkrequests/open', async (req, res) => {
      try {
        const [rows] = await db.query(`
          SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username AS owner_username
          FROM WalkRequests wr
          JOIN Dogs d ON wr.dog_id = d.dog_id
          JOIN Users u ON d.owner_id = u.user_id
          WHERE wr.status = 'open';
        `);
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve walk requests' });
      }
    });

    // Route: /api/walkers/summary
    app.get('/api/walkers/summary', async (req, res) => {
      try {
        const [rows] = await db.query(`
          SELECT
            u.username AS walker_username,
            COUNT(r.rating_id) AS total_ratings,
            ROUND(AVG(r.rating), 1) AS average_rating,
            IFNULL((
              SELECT COUNT(*)
              FROM WalkRequests wr
              JOIN WalkApplications wa ON wa.request_id = wr.request_id
              WHERE wa.walker_id = u.user_id AND wr.status = 'completed' AND wa.status = 'accepted'
            ), 0) AS completed_walks
          FROM Users u
          LEFT JOIN WalkApplications wa ON wa.walker_id = u.user_id
          LEFT JOIN WalkRatings r ON r.walker_id = u.user_id
          WHERE u.role = 'walker'
          GROUP BY u.user_id;
        `);
        res.json(rows);
      } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve walker summary' });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error setting up database:', err);
  }
})();
