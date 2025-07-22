const express = require('express');
  const mongoose = require('mongoose');
  const session = require('express-session');
  const passport = require('passport');
  const path = require('path');
  require('dotenv').config(); // Added to load .env

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  console.log('MONGO_URL:', process.env.MONGO_URL); // Debug
  mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

  const userRoutes = require('./routes/userRoutes');
  const adminRoutes = require('./routes/adminRoutes');
  app.use('/', userRoutes);
  app.use('/admin', adminRoutes);

  // Debug route to catch undefined routes
  app.use((req, res, next) => {
    console.log(`❌ Unhandled route: ${req.method} ${req.url}`);
    res.status(404).send(`Cannot ${req.method} ${req.url}`);
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));