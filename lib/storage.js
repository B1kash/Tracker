// Local Storage utility for CRUD operations on goals

const STORAGE_KEYS = {
  gym: 'gym_workouts',
  cardio: 'gym_cardio',
  diet: 'gym_diet',
  learning: 'learning_goals',
  content: 'content_logs',
  theme: 'app_theme',
};

function isBrowser() {
  return typeof window !== 'undefined';
}

// ============ THEME ============
export function getTheme() {
  if (!isBrowser()) return 'dark';
  return localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
}

export function setTheme(theme) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

// ============ GENERIC ============
function getData(key) {
  if (!isBrowser()) return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveData(key, data) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ============ API HELPER ============
async function apiCall(endpoint, method = 'GET', body = null) {
  if (!isBrowser()) return null;
  const token = localStorage.getItem('jwt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  const config = { method, headers, cache: 'no-store' };
  if (body) config.body = JSON.stringify(body);
  const res = await fetch(`http://localhost:5000/api${endpoint}`, config);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'API Error: ' + res.statusText);
  }
  return res.json();
}

export function logout() {
  if (!isBrowser()) return;
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
  window.location.href = '/'; // Redirect to login
}

export async function getMe() {
  return await apiCall('/auth/me');
}

// ============ GYM (Day-based) ============
// Structure: { id, date: 'YYYY-MM-DD', exercises: [{ id, name, sets: [{ id, reps, weight, completed }] }] }

export async function getGymWorkouts() {
  try {
    return await apiCall('/gym/workouts');
  } catch {
    return [];
  }
}

export async function getWorkoutByDate(dateStr) {
  const workouts = await getGymWorkouts();
  return workouts.find((w) => w.date === dateStr) || null;
}

export async function saveWorkoutForDate(dateStr, exercises) {
  return await apiCall('/gym/workouts', 'POST', { dateStr, exercises });
}

export async function addExerciseToDate(dateStr, exerciseName) {
  const workout = await getWorkoutByDate(dateStr) || { exercises: [] };
  const exercises = [...workout.exercises, {
    name: exerciseName,
    sets: [{ reps: 0, weight: '', completed: false }],
  }];
  return await saveWorkoutForDate(dateStr, exercises);
}

export async function removeExerciseFromDate(dateStr, exerciseId) {
  const workout = await getWorkoutByDate(dateStr);
  if (!workout) return null;
  const exercises = workout.exercises.filter((e) => e._id !== exerciseId);
  return await saveWorkoutForDate(dateStr, exercises);
}

export async function updateExerciseSets(dateStr, exerciseId, sets) {
  const workout = await getWorkoutByDate(dateStr);
  if (!workout) return null;
  const exercises = workout.exercises.map((e) =>
    e._id === exerciseId ? { ...e, sets } : e
  );
  return await saveWorkoutForDate(dateStr, exercises);
}

export async function renameExercise(dateStr, exerciseId, newName) {
  const workout = await getWorkoutByDate(dateStr);
  if (!workout) return null;
  const exercises = workout.exercises.map((e) =>
    e._id === exerciseId ? { ...e, name: newName } : e
  );
  return await saveWorkoutForDate(dateStr, exercises);
}

// ============ CARDIO (API-backed) ============

export async function getCardioByDate(dateStr) {
  try { return await apiCall(`/cardio?date=${dateStr}`); } catch { return []; }
}

export async function addCardioLog(data) {
  return await apiCall('/cardio', 'POST', data);
}

export async function deleteCardioLog(id) {
  return await apiCall(`/cardio/${id}`, 'DELETE');
}

// ============ DIET (API-backed) ============

export async function getDietByDate(dateStr) {
  try { return await apiCall(`/diet?date=${dateStr}`); } catch { return []; }
}

export async function addDietLog(data) {
  return await apiCall('/diet', 'POST', data);
}

export async function deleteDietLog(id) {
  return await apiCall(`/diet/${id}`, 'DELETE');
}

// ============ CONTENT (API-backed) ============

export async function getContentLogs() {
  try { return await apiCall('/content'); } catch { return []; }
}

export async function getContentByDate(dateStr) {
  try { return await apiCall(`/content?date=${dateStr}`); } catch { return []; }
}

export async function addContentLog(data) {
  return await apiCall('/content', 'POST', data);
}

export async function updateContentLog(id, updates) {
  return await apiCall(`/content/${id}`, 'PUT', updates);
}

export async function deleteContentLog(id) {
  return await apiCall(`/content/${id}`, 'DELETE');
}

// ============ LEARNING (API-backed) ============

export async function getLearningGoals() {
  try { return await apiCall('/learning'); } catch { return []; }
}

export async function addLearningGoal(data) {
  return await apiCall('/learning', 'POST', data);
}

export async function updateLearningGoal(id, updates) {
  return await apiCall(`/learning/${id}`, 'PUT', updates);
}

export async function deleteLearningGoal(id) {
  return await apiCall(`/learning/${id}`, 'DELETE');
}

// Add a daily progress log to a learning goal
export async function addProgressLog(goalId, logData) {
  return await apiCall(`/learning/${goalId}/log`, 'POST', logData);
}

// Delete a specific progress log from a goal
export async function deleteProgressLog(goalId, logId) {
  return await apiCall(`/learning/${goalId}/log/${logId}`, 'DELETE');
}

// ============ DASHBOARD STATS ============
export async function getStats() {
  const gym = await getGymWorkouts();
  const learning = await getLearningGoals();
  const content = await getContentLogs();

  const totalGymDays = gym.length;
  const totalExercises = gym.reduce((sum, w) => sum + w.exercises.length, 0);
  const learningCompleted = learning.filter((g) => g.status === 'Completed').length;
  const contentPosted = content.filter((c) => c.status === 'Posted').length;

  const totalGoals = totalExercises + learning.length + content.length;
  const totalCompleted = gym.reduce((sum, w) =>
    sum + w.exercises.reduce((s, e) =>
      s + e.sets.filter((set) => set.completed).length, 0), 0)
    + learningCompleted + contentPosted;

  return {
    totalGoals,
    totalCompleted,
    completionPercent: totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0,
    gym: {
      totalDays: totalGymDays,
      totalExercises,
      percent: totalExercises > 0 ? Math.min(100, Math.round((totalGymDays / 7) * 100)) : 0,
    },
    learning: {
      total: learning.length,
      completed: learningCompleted,
      percent: learning.length > 0 ? Math.round((learningCompleted / learning.length) * 100) : 0,
    },
    content: {
      total: content.length,
      posted: contentPosted,
      percent: content.length > 0 ? Math.round((contentPosted / content.length) * 100) : 0,
    },
  };
}

export async function getRecentActivity(limit = 8) {
  const activities = [];

  const gymWorkouts = await getGymWorkouts();
  gymWorkouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      activities.push({
        id: ex._id || ex.id,
        title: ex.name,
        category: 'gym',
        categoryLabel: 'Gym',
        updatedAt: w.updatedAt || w.date,
        detail: `${ex.sets.length} sets`,
      });
    });
  });

  const learning = await getLearningGoals();
  learning.forEach((g) => {
    activities.push({
      id: g._id || g.id,
      title: g.title,
      category: 'learning',
      categoryLabel: 'Learning',
      updatedAt: g.updatedAt,
      detail: g.status,
    });
  });

  const contentLogs = await getContentLogs();
  contentLogs.forEach((c) => {
    activities.push({
      id: c._id || c.id,
      title: c.title,
      category: 'content',
      categoryLabel: 'Content',
      updatedAt: c.updatedAt,
      detail: `${c.platform} · ${c.status}`,
    });
  });

  activities.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return activities.slice(0, limit);
}

// ============ HABITS (Daily Checklist) ============
// Structure Habits: { id, name, icon, createdAt }
// Structure Logs: { id, date, completedHabitIds: [] }

export async function getHabits() {
  try { return await apiCall('/habits'); } catch { return []; }
}

export async function addHabit(data) {
  return await apiCall('/habits', 'POST', data);
}

export async function deleteHabit(id) {
  return await apiCall(`/habits/${id}`, 'DELETE');
}

export async function getHabitLogs() {
  try { return await apiCall('/habits/logs'); } catch { return []; }
}

export async function getHabitLogByDate(dateStr) {
  try { return await apiCall(`/habits/logs/${dateStr}`); } catch { return { date: dateStr, completedHabitIds: [] }; }
}

export async function toggleHabitLog(dateStr, habitId) {
  const res = await apiCall('/habits/logs', 'POST', { dateStr, habitId });
  if (res.newlyCompleted) {
    await addXP(10); // +10 XP per habit!
  }
  await checkAndUpdateStreak(dateStr);
  return res.log;
}

// ============ GYM PROGRESS PHOTOS ============
// Structure: { id, date, base64, createdAt }



// ============ GAMIFICATION & STREAKS ============
// Structure: { xp, level, currentStreak, bestStreak, lastActiveDate }

const XP_PER_LEVEL = 1000;

export async function getGamificationData() {
  const defaultData = { xp: 0, level: 1, currentStreak: 0, bestStreak: 0, lastActiveDate: null };
  try {
    return await apiCall('/gamification');
  } catch {
    return defaultData;
  }
}

export async function addXP(amount) {
  try {
    const data = await apiCall('/gamification/xp', 'POST', { amount });
    if (isBrowser()) {
      window.dispatchEvent(new Event('gamification_updated'));
      if (data.leveledUp) {
        window.dispatchEvent(new Event('level_up'));
      }
    }
    return data;
  } catch {
    return null;
  }
}

export async function checkAndUpdateStreak(dateStr) {
  try {
    return await apiCall('/gamification/streak', 'POST', { dateStr });
  } catch (e) { console.error(e); }
}

export async function updateGamificationSettings(settings) {
  return await apiCall('/gamification/settings', 'PUT', settings);
}


// ============ CALENDAR AGGREGATION ============
export async function getCalendarData(year, month) {
  // Returns an object keyed by "YYYY-MM-DD" mapping to array of activity types
  // e.g. { "2026-03-12": ["gym", "learning", "habit"] }

  const results = {};

  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const gymWorkouts = await getGymWorkouts();
  const habitLogs = await getHabitLogs();
  const learningGoals = await getLearningGoals();
  const contentLogs = await getContentLogs();
  // Gym
  gymWorkouts.forEach(w => {
    if (w.date.startsWith(prefix) && w.exercises.length > 0) {
      if (!results[w.date]) results[w.date] = new Set();
      results[w.date].add('gym');
    }
  });

  // Learning
  learningGoals.forEach(g => {
    (g.progressLogs || []).forEach(log => {
      if (log.date.startsWith(prefix)) {
        if (!results[log.date]) results[log.date] = new Set();
        results[log.date].add('learning');
      }
    });
  });

  // Content
  contentLogs.forEach(c => {
    const cDate = c.date || c.updatedAt.split('T')[0];
    if (cDate.startsWith(prefix)) {
      if (!results[cDate]) results[cDate] = new Set();
      results[cDate].add('content');
    }
  });

  // Habits
  habitLogs.forEach(log => {
    if (log.date.startsWith(prefix) && log.completedHabitIds.length > 0) {
      if (!results[log.date]) results[log.date] = new Set();
      results[log.date].add('habit');
    }
  });

  // Convert Sets to Arrays for easy mapping in React
  const finalResults = {};
  Object.keys(results).forEach(date => {
    finalResults[date] = Array.from(results[date]);
  });

  return finalResults;
}

// ============ BODY WEIGHT (API-backed) ============

export async function getBodyWeightLogs() {
  try { return await apiCall('/bodyweight'); } catch { return []; }
}

export async function upsertBodyWeight(data) {
  return await apiCall('/bodyweight', 'POST', data);
}

export async function deleteBodyWeight(id) {
  return await apiCall(`/bodyweight/${id}`, 'DELETE');
}

// ============ WORKOUT TEMPLATES (API-backed) ============

export async function getWorkoutTemplates() {
  try { return await apiCall('/templates'); } catch { return []; }
}

export async function createWorkoutTemplate(data) {
  return await apiCall('/templates', 'POST', data);
}

export async function deleteWorkoutTemplate(id) {
  return await apiCall(`/templates/${id}`, 'DELETE');
}

// ============ PUSH NOTIFICATIONS ============

export async function getPushPublicKey() {
  const res = await apiCall('/push/public-key', 'GET');
  return res.publicKey;
}

export async function subscribeToPush(subscription) {
  return await apiCall('/push/subscribe', 'POST', subscription);
}

export async function getPushSettings() {
  try { return await apiCall('/push/settings', 'GET'); } catch { return null; }
}

export async function updatePushSettings(settings) {
  return await apiCall('/push/settings', 'PUT', settings);
}

// ============ GOALS ============

export async function getGoals() {
  try { return await apiCall('/goals', 'GET'); } catch { return []; }
}

export async function addGoal(data) {
  return await apiCall('/goals', 'POST', data);
}

export async function updateGoal(id, updates) {
  return await apiCall(`/goals/${id}`, 'PUT', updates);
}

export async function deleteGoal(id) {
  return await apiCall(`/goals/${id}`, 'DELETE');
}

// ============ GYM PHOTOS (API-backed) ============

export async function getGymPhotos(dateStr = '') {
  try {
    const query = dateStr ? `?date=${dateStr}` : '';
    return await apiCall(`/gym/photos${query}`);
  } catch { return []; }
}

export async function addGymPhoto(dateStr, base64, mimetype = 'image/jpeg') {
  const res = await apiCall('/gym/photos', 'POST', { dateStr, base64, mimetype });
  await addXP(50); // Big reward for photo update
  await checkAndUpdateStreak(dateStr);
  return res;
}

export async function deleteGymPhoto(id) {
  return await apiCall(`/gym/photos/${id}`, 'DELETE');
}

// ============ AI INTEGRATION ============

export async function getAICoachAdvice() {
  return await apiCall('/ai/coach', 'GET');
}

export async function getAIRoast() {
  return await apiCall('/ai/roast', 'GET');
}

export async function analyzeDietWithAI(text, imageBase64, date) {
  return await apiCall('/ai/diet', 'POST', { text, imageBase64, date });
}

export async function generateWorkoutTemplateWithAI(prompt) {
  return await apiCall('/ai/workout-template', 'POST', { prompt });
}

export async function generateCurriculumWithAI(topic) {
  return await apiCall('/ai/curriculum', 'POST', { topic });
}

export async function getDailyBriefWithAI() {
  return await apiCall('/ai/brief', 'GET');
}

export async function getSupplementAdviceWithAI() {
  return await apiCall('/ai/supplements', 'GET');
}

export async function updateDietTargets(targets) {
  return await apiCall('/auth/diet-targets', 'PUT', targets);
}

export async function generateDietPlanWithAI(data) {
  return await apiCall('/ai/diet-plan', 'POST', data);
}

