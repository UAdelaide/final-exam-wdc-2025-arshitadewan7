const express = require('express');
const path = require('path');
const session = require('express-session'); // added for express session
const cookieParser = require('cookie-parser'); // added cookie parser
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

app.use(cookieParser()); // added cookie parser
app.use(session({ // added functionality for express session
  secret: 'mykey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // we can set this to true if using HTTPS
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes'); // added new dog route

// Use routes
app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dogs', dogRoutes); // use dog route

// Export the app instead of listening here
module.exports = app;
