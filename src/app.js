const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // add this
const authRoutes = require('./routes/auth.route');
const courseRoutes = require('./routes/course.routes'); // add this
const paymentRoutes  = require('./routes/payment.routes'); // add this

const app = express();
//our frontend origin abclive.com here for cors [cross origin resource sharing]
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cookieParser()); // ← must add this to read req.cookies

// ⚠️ IMPORTANT: webhook route must come BEFORE express.json()
// We capture rawBody here before JSON parsing mutates it
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body.toString('utf8');
  next();
});

//all other route is json parsing
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes); // add this
app.use('/api/orders',  paymentRoutes); // add this

app.get('/', (req, res) => {
  res.json({ message: 'Buy Course API is running!' });
});

module.exports = app;