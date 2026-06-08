const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // add this
const authRoutes = require('./routes/auth.route');
const courseRoutes = require('./routes/course.routes'); // add this

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser()); // ← must add this to read req.cookies

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes); // add this

app.get('/', (req, res) => {
  res.json({ message: 'Buy Course API is running!' });
});

module.exports = app;