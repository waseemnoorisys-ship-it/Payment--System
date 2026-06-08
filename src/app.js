const express = require('express');
const cors = require('cors');


const app = express();

app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Buy Course API is running!' });
});

module.exports = app;