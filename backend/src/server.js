const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Enable CORS
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/habits', require('./routes/habitRoutes'));
app.use('/api/gym', require('./routes/gymRoutes'));

app.get('/', (req, res) => {
    res.send('Life Tracker API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, Object.assign(() => console.log(`Server running on port ${PORT}`)));
