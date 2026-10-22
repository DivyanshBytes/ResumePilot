const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config(); 

const connectDB = require('./config/database');
connectDB();

require('./models/User');
require('./models/Resume');
require('./models/JobApplication');

const app = express();

app.use(express.json());                          
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());             
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, 
  })
);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ResumePilot API is running successfully!',
  });
});

// Routes get mounted here in later phases
// app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});