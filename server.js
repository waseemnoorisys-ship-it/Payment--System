require('dotenv').config(); // Must be first line!
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

connectDB(); // Connect to MongoDB

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});