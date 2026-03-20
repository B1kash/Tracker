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
app.use('/api/cardio', require('./routes/cardioRoutes'));
app.use('/api/diet', require('./routes/dietRoutes'));
app.use('/api/bodyweight', require('./routes/bodyWeightRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/push', require('./routes/pushRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));

// Start cron jobs
require('./cron/pushCron');

app.get('/', (req, res) => {
    res.send('Life Tracker API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, Object.assign(() => console.log(`Server running on port ${PORT}`)));
