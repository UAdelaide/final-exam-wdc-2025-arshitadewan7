const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

const session = require('express-session'); // added for express session

app.use(session({
  secret: 'mykey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // we can set this to true if using HTTPS
}));

// Export the app instead of listening here
module.exports = app;