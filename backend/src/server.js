const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Secure HTTP headers
app.use(helmet());

// Enable CORS with reasonable defaults for a modern Web+Mobile API
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourapp.com', 'trackerapp://', 'exp://'] 
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

// Apply Global Rate Limiting to prevent DoS & Brute Force attacks
const rateLimit = require('express-rate-limit');
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per 15 minutes
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', globalLimiter);


// Route-Specific Body parser (Large payload required for photos)
app.use('/api/gym/photos', express.json({ limit: '10mb' }));
app.use('/api/gym/photos', express.urlencoded({ extended: false, limit: '10mb' }));

app.use('/api/auth/profile', express.json({ limit: '10mb' }));
app.use('/api/auth/profile', express.urlencoded({ extended: false, limit: '10mb' }));

app.use('/api/ai', express.json({ limit: '10mb' }));
app.use('/api/ai', express.urlencoded({ extended: false, limit: '10mb' }));

// Global Body parser clamped down to prevent JSON-DoS
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/social', require('./routes/socialRoutes'));
app.use('/api/habits', require('./routes/habitRoutes'));
app.use('/api/gym', require('./routes/gymRoutes'));
app.use('/api/cardio', require('./routes/cardioRoutes'));
app.use('/api/diet', require('./routes/dietRoutes'));
app.use('/api/bodyweight', require('./routes/bodyWeightRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/push', require('./routes/pushRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/learning', require('./routes/learningRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
// Start cron jobs
require('./cron/pushCron');

app.get('/', (req, res) => {
    res.send('Life Tracker API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, Object.assign(() => console.log(`Server running on port ${PORT}`)));
