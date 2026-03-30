const { GoogleGenerativeAI } = require('@google/generative-ai');
const GymWorkout = require('../models/GymWorkout');
const User = require('../models/User');

const getAI = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
    }
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// @desc    Get AI Coach Advice based on recent workouts
// @route   GET /api/ai/coach
// @access  Private
const getCoachAdvice = async (req, res) => {
    try {
        const workouts = await GymWorkout.find({ user: req.user.id })
            .sort({ date: -1 })
            .limit(30);

        if (!workouts || workouts.length === 0) {
            return res.status(200).json({ advice: "You haven't logged any workouts yet. Start logging your gym sessions so I can analyze them and give you some advice!" });
        }

        // Format workouts for the LLM
        let workoutSummary = "Here is my workout history from newest to oldest:\n\n";
        workouts.forEach(w => {
            let daySummary = `Date: ${w.date}\n`;
            w.exercises.forEach(ex => {
                const completedSets = ex.sets.filter(s => s.completed);
                if (completedSets.length > 0) {
                    const setDetails = completedSets.map(s => `${s.reps} reps @ ${s.weight || '??'}`).join(', ');
                    daySummary += `- ${ex.name}: ${completedSets.length} sets (${setDetails})\n`;
                }
            });
            if (w.exercises.length > 0) {
                workoutSummary += daySummary + '\n';
            }
        });

        const prompt = `You are a highly analytical, no-nonsense personal fitness coach. Analyze the following list of recent gym workouts from a user.
Identify any clear plateaus, suggest progressive overload adjustments (like changing rep ranges or weights for specific exercises), and give brief, actionable advice. Make your response sound encouraging but strict. Format your response cleanly using markdown (bullet points are good). Keep it under 250 words so it's easy to read.

${workoutSummary}`;

        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        res.status(200).json({ advice: responseText });
    } catch (error) {
        console.error('AI Coach Error:', error);
        res.status(500).json({ message: 'Failed to generate AI Coach advice. Check your API key and try again.' });
    }
};

// @desc    Get an AI Roast based on gamification stats
// @route   GET /api/ai/roast
// @access  Private
const getRoast = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const gamification = user.gamification;

        const dateCurrent = new Date();
        const lastActive = gamification.lastActiveDate ? new Date(gamification.lastActiveDate) : new Date(0);
        const diffTime = dateCurrent - lastActive;
        const missedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

        const dataStr = `
Level: ${gamification.level}
XP: ${gamification.xp}
Current Streak: ${gamification.currentStreak}
Best Streak: ${gamification.bestStreak}
Days Since Last Active: ${missedDays}
Current Quests Completed: ${gamification.quests.filter(q => q.completed).length} out of ${gamification.quests.length}
`;

        const prompt = `You are an extremely sarcastic and slightly edgy AI built into a Life Tracker app. Look at the user's current game stats below and give them a short, 2-to-3 sentence ROAST or praise. If their streak is high, hype them up like an absolute legend. If they've missed several days and their streak is active, roast them mercilessly for slacking. Be punchy, funny, and dramatic.

Stats:
${dataStr}`;

        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        res.status(200).json({ roast: responseText });
    } catch (error) {
        console.error('AI Roast Error:', error);
        res.status(500).json({ message: 'Failed to generate AI roast.' });
    }
};

// @desc    Analyze Text/Image to generate Diet Macros
// @route   POST /api/ai/diet
// @access  Private
const analyzeDiet = async (req, res) => {
    try {
        const { text, imageBase64, date } = req.body;
        
        let promptArgs = [];
        
        const systemPrompt = `Analyze the provided text description or image of food. Determine exactly what the person ate, and estimate the calories, protein(g), carbs(g), and fats(g).
You must return your estimate as a RAW JSON object exactly in this format without any markdown ticks:
{ "food": "Title of Meal", "calories": "number", "protein": "number", "carbs": "number", "fats": "number" }. Do not wrap the JSON in \`\`\`.`;

        if (imageBase64) {
            // Strip any Data URI stuff if sent by frontend
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            };
            promptArgs = [systemPrompt, imagePart];
            if (text) promptArgs.push(`Additional user context: ${text}`);
        } else if (text) {
            promptArgs = [systemPrompt, `User description: ${text}`];
        } else {
            return res.status(400).json({ message: 'Must provide text or imageBase64' });
        }

        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(promptArgs);
        
        let responseText = result.response.text();
        
        // Clean up formatting to extract raw JSON
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(responseText);

        const DietLog = require('../models/DietLog');

        const newLog = await DietLog.create({
            user: req.user.id,
            date: date || new Date().toISOString().split('T')[0],
            meal: 'AI Snapped',
            food: parsed.food,
            calories: parsed.calories,
            protein: parsed.protein,
            carbs: parsed.carbs,
            fats: parsed.fats,
            notes: 'Autologged via Gemini AI 🔮'
        });

        res.status(200).json(newLog);
    } catch (error) {
        console.error('AI Diet Error:', error);
        res.status(500).json({ message: 'Failed to analyze diet.' });
    }
};

// @desc    Generate Workout Template (Day Wise)
// @route   POST /api/ai/workout-template
// @access  Private
const generateWorkoutTemplate = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

        const systemPrompt = `You are a professional strength and conditioning coach. A user has asked you to generate a workout routine based on this request: "${prompt}".
Create a logical, effective workout routine grouped by DAY. You MUST return ONLY a raw JSON ARRAY of templates in this exact format without any markdown wrappers (no \`\`\`json):
[
  {
    "name": "Day 1 - Push Focus",
    "exercises": [
      { "name": "Barbell Bench Press", "sets": [ {"reps": 10}, {"reps": 10}, {"reps": 10} ] }
    ]
  },
  {
    "name": "Day 2 - Pull Focus",
    "exercises": [
      { "name": "Pull-Ups", "sets": [ {"reps": 8}, {"reps": 8}, {"reps": 8} ] }
    ]
  }
]`;
        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(systemPrompt);
        let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedArray = JSON.parse(responseText);

        const WorkoutTemplate = require('../models/WorkoutTemplate');
        
        let createdTemplates = [];
        for (const tpl of parsedArray) {
            const newTemplate = await WorkoutTemplate.create({
                user: req.user.id,
                name: tpl.name + " (AI Generated)",
                exercises: tpl.exercises
            });
            createdTemplates.push(newTemplate);
        }
        
        res.status(200).json(createdTemplates);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Failed to generate workout template.' });
    }
};

// @desc    Generate Daily Routine and log directly to today
// @route   POST /api/ai/daily-routine
// @access  Private
const generateDailyRoutine = async (req, res) => {
    try {
        const { prompt, date } = req.body;
        if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

        const systemPrompt = `You are a professional strength and conditioning coach. A user has given you their constraints for today: "${prompt}".
Create a logical, effective workout strictly for this DAY. You MUST return ONLY a raw JSON strictly in this format without markdown (no \`\`\`json):
{
  "exercises": [
    { "name": "Dumbbell Bench Press", "sets": [ {"reps": 10}, {"reps": 10}, {"reps": 10} ] },
    { "name": "Goblet Squat", "sets": [ {"reps": 12}, {"reps": 12} ] }
  ]
}`;
        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(systemPrompt);
        let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(responseText);

        const targetDate = date || new Date().toISOString().split('T')[0];
        let workout = await GymWorkout.findOne({ user: req.user.id, date: targetDate });
        
        if (!workout) {
            workout = new GymWorkout({
                user: req.user.id,
                date: targetDate,
                exercises: []
            });
        }
        
        const newExercises = parsed.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets.map(s => ({ reps: s.reps || 0, weight: '', completed: false }))
        }));
        
        workout.exercises = [...workout.exercises, ...newExercises];
        await workout.save();
        
        res.status(200).json(workout);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Failed to generate daily routine.' });
    }
};

// @desc    Generate Learning Curriculum
// @route   POST /api/ai/curriculum
// @access  Private
const generateCurriculum = async (req, res) => {
    try {
        const { topic } = req.body;
        const systemPrompt = `You are an expert tutor. Create a 5-step learning curriculum for a user who wants to learn "${topic}".
Return ONLY a raw JSON array of strings (the 5 steps) (no markdown). Example: ["Step 1: Basics", "Step 2: ..."]`;
        
        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(systemPrompt);
        const steps = JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

        // In a real app we might automatically add sub-quests, but for now we'll just return the steps.
        res.status(200).json({ steps });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Failed to generate curriculum.' });
    }
};

// @desc    Get Daily Brief
// @route   GET /api/ai/brief
// @access  Private
const getDailyBrief = async (req, res) => {
    try {
        // Here we'd pull gamification, diet, and gym data for the last 7 days
        // Mocking the context load for speed
        const prompt = `You are the Daily Briefing AI for a Life Tracker app. Give the user an incredibly insightful 3-sentence summary that connects their habits (like sleep or water) to their gym progress and content creation. Invent a realistic, interesting correlation to show them the value of the brief.`;
        
        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        res.status(200).json({ brief: result.response.text() });
    } catch (e) {
        res.status(500).json({ message: 'Failed to generate brief.' });
    }
};

// @desc    Get Supplement Referral
// @route   GET /api/ai/supplements
// @access  Private
const getSupplementAdvice = async (req, res) => {
    try {
        const GymWorkout = require('../models/GymWorkout');
        const workouts = await GymWorkout.find({ user: req.user.id }).sort({ date: -1 }).limit(10);
        
        let workoutSummary = "Recent workouts:\n";
        workouts.forEach(w => {
            w.exercises.forEach(ex => workoutSummary += `- ${ex.name} (${ex.sets.length} sets)\n`);
        });

        const prompt = `You are a sports nutritionist. Review the user's recent exercises and recommend 1 to 3 standard, scientifically-backed supplements (like Whey Protein, Creatine, Omega-3s, etc.) that would best support their specific training style. Justify your referral cleanly in a markdown list format. Give a tiny warning that they should consult a doctor first.

${workoutSummary}`;
        
        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        res.status(200).json({ supplements: result.response.text() });
    } catch (e) {
        res.status(500).json({ message: 'Failed to generate supplement advice.' });
    }
};

// @desc    Generate Diet Plan and Macro Targets
// @route   POST /api/ai/diet-plan
// @access  Private
const generateDietPlan = async (req, res) => {
    try {
        const { age, weight, height, goal, activity, vegNonVeg, region = 'Indian' } = req.body;

        const prompt = `You are a professional nutritionist specializing in ${region} diets. 
A user with the following stats needs a diet plan:
Age: ${age}, Weight: ${weight}kg, Height: ${height}cm, Goal: ${goal}, Activity Level: ${activity}, Food preference: ${vegNonVeg}.

1. Calculate their daily TDEE and recommended macro targets (Calories, Protein, Carbs, Fats).
2. Create a 1-day sample meal plan (Breakfast, Lunch, Evening Snack, Dinner) using mostly standard ${region} foods (like dal, roti, paneer, etc. if Indian).

Return ONLY a JSON object in this format:
{
  "targets": { "calories": 0, "protein": 0, "carbs": 0, "fats": 0 },
  "plan": [
    { "meal": "Breakfast", "recommendation": "..." },
    { "meal": "Lunch", "recommendation": "..." },
    { "meal": "Evening Snack", "recommendation": "..." },
    { "meal": "Dinner", "recommendation": "..." }
  ]
}`;

        const genAI = getAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        
        // Extract JSON
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(responseText);

        res.status(200).json(parsed);
    } catch (error) {
        console.error('AI Diet Plan Error:', error);
        res.status(500).json({ message: 'Failed to generate diet plan.' });
    }
};

module.exports = {
    getCoachAdvice,
    getRoast,
    analyzeDiet,
    generateWorkoutTemplate,
    generateCurriculum,
    getDailyBrief,
    getSupplementAdvice,
    generateDietPlan,
    generateDailyRoutine
};
