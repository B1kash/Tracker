import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ===== CONFIG — Update to your PC's local IP =====
export const BASE_URL = 'http://192.168.29.178:5000/api';

// ===== TOKEN (in-memory + SecureStore with graceful fallback) =====
let _memToken = null;

export async function setToken(token, id, username) {
  _memToken = token;
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('jwt_token', token);
    } else {
      await SecureStore.setItemAsync('jwt_token', token || '');
      await SecureStore.setItemAsync('user_id', String(id || ''));
      await SecureStore.setItemAsync('username', String(username || ''));
    }
  } catch (e) { console.warn('SecureStore set failed:', e.message); }
}

export async function clearToken() {
  _memToken = null;
  try {
    if (Platform.OS === 'web') localStorage.removeItem('jwt_token');
    else await SecureStore.deleteItemAsync('jwt_token');
  } catch (e) { console.warn('SecureStore clear failed:', e.message); }
}

export async function getToken() {
  if (_memToken) return _memToken;
  try {
    if (Platform.OS === 'web') return localStorage.getItem('jwt_token');
    const stored = await SecureStore.getItemAsync('jwt_token');
    if (stored) _memToken = stored;
    return stored;
  } catch (e) {
    console.warn('SecureStore read failed:', e.message);
    return null;
  }
}

// ===== CORE API CALL =====
export async function apiCall(endpoint, method = 'GET', body = null) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server error ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (err.message?.includes('Network request failed')) {
      throw new Error('Cannot reach server. Check IP and Wi-Fi.');
    }
    throw err;
  }
}

// ===== AUTH =====
export async function login(username, password) {
  return apiCall('/auth/login', 'POST', { username, password });
}
export async function register(username, password) {
  return apiCall('/auth/register', 'POST', { username, password });
}
export async function googleLogin(idToken) {
  return apiCall('/auth/google', 'POST', { idToken });
}

// ===== GAMIFICATION =====
export async function getGamificationData() {
  try { return await apiCall('/gamification'); }
  catch { return { xp: 0, level: 1, currentStreak: 0, bestStreak: 0, quests: [] }; }
}

// ===== HABITS =====
export async function getHabits() {
  try { return await apiCall('/habits'); } catch { return []; }
}
export async function addHabit(data) {
  return apiCall('/habits', 'POST', data);
}
export async function deleteHabit(id) {
  return apiCall(`/habits/${id}`, 'DELETE');
}
export async function getHabitLogByDate(date) {
  try { return await apiCall(`/habits/log?date=${date}`); }
  catch { return { completedHabitIds: [] }; }
}
export async function toggleHabitLog(date, habitId) {
  return apiCall('/habits/toggle', 'POST', { date, habitId });
}

// ===== GYM WORKOUTS =====
// Real endpoint: GET /api/gym/workouts  POST /api/gym/workouts
export async function getWorkoutByDate(date) {
  try {
    const all = await apiCall('/gym/workouts');
    return (all || []).find(w => w.date === date) || { date, exercises: [] };
  } catch { return { date, exercises: [] }; }
}
export async function saveWorkoutForDate(dateStr, exercises) {
  return apiCall('/gym/workouts', 'POST', { dateStr, exercises });
}

// ===== WORKOUT TEMPLATES =====
export async function getWorkoutTemplates() {
  try { return await apiCall('/templates'); } catch { return []; }
}
export async function createWorkoutTemplate(data) {
  return apiCall('/templates', 'POST', data);
}
export async function deleteWorkoutTemplate(id) {
  return apiCall(`/templates/${id}`, 'DELETE');
}

// ===== CARDIO =====
// GET /api/cardio?date=  POST /api/cardio  DELETE /api/cardio/:id
export async function getCardioByDate(date) {
  try { return await apiCall(`/cardio?date=${date}`); } catch { return []; }
}
export async function addCardioLog(data) {
  return apiCall('/cardio', 'POST', data);
}
export async function deleteCardioLog(id) {
  return apiCall(`/cardio/${id}`, 'DELETE');
}

// ===== DIET =====
// GET /api/diet?date=  POST /api/diet  DELETE /api/diet/:id
export async function getDietByDate(date) {
  try { return await apiCall(`/diet?date=${date}`); } catch { return []; }
}
export async function addDietLog(data) {
  return apiCall('/diet', 'POST', data);
}
export async function deleteDietLog(id) {
  return apiCall(`/diet/${id}`, 'DELETE');
}

// ===== BODY WEIGHT =====
// GET /api/bodyweight  POST /api/bodyweight  DELETE /api/bodyweight/:id
export async function getBodyWeightLogs() {
  try { return await apiCall('/bodyweight'); } catch { return []; }
}
export async function upsertBodyWeight(data) {
  return apiCall('/bodyweight', 'POST', data);
}
export async function deleteBodyWeight(id) {
  return apiCall(`/bodyweight/${id}`, 'DELETE');
}

// ===== GOALS =====
// GET /api/goals  POST /api/goals  PUT /api/goals/:id  DELETE /api/goals/:id
export async function getGoals() {
  try { return await apiCall('/goals'); } catch { return []; }
}
export async function addGoal(data) {
  return apiCall('/goals', 'POST', data);
}
export async function updateGoal(id, data) {
  return apiCall(`/goals/${id}`, 'PUT', data);
}
export async function deleteGoal(id) {
  return apiCall(`/goals/${id}`, 'DELETE');
}

// ===== LEARNING =====
export async function getLearningGoals() {
  try { return await apiCall('/learning'); } catch { return []; }
}
export async function addLearningGoal(data) {
  return apiCall('/learning', 'POST', data);
}
export async function updateLearningGoal(id, updates) {
  return apiCall(`/learning/${id}`, 'PUT', updates);
}
export async function deleteLearningGoal(id) {
  return apiCall(`/learning/${id}`, 'DELETE');
}
export async function addProgressLog(goalId, logData) {
  return apiCall(`/learning/${goalId}/log`, 'POST', logData);
}
export async function deleteProgressLog(goalId, logId) {
  return apiCall(`/learning/${goalId}/log/${logId}`, 'DELETE');
}

// ===== CONTENT =====
export async function getContentLogs() {
  try { return await apiCall('/content'); } catch { return []; }
}
export async function addContentLog(data) {
  return apiCall('/content', 'POST', data);
}
export async function updateContentLog(id, updates) {
  return apiCall(`/content/${id}`, 'PUT', updates);
}
export async function deleteContentLog(id) {
  return apiCall(`/content/${id}`, 'DELETE');
}

// ===== GYM PHOTOS (S3) =====
export async function getGymPhotosByDate(date) {
  try { return await apiCall(`/gym/photos?date=${date}`); } catch { return []; }
}
export async function uploadGymPhoto(dateStr, base64, mimetype = 'image/jpeg') {
  return apiCall('/gym/photos', 'POST', { dateStr, base64, mimetype });
}
export async function deleteGymPhoto(id) {
  return apiCall(`/gym/photos/${id}`, 'DELETE');
}

// ===== AI INTEGRATION =====
export async function getAICoachAdvice() {
  return apiCall('/ai/coach', 'GET');
}
export async function getAIRoast() {
  return apiCall('/ai/roast', 'GET');
}
export async function analyzeDietWithAI(text, imageBase64, date) {
  return apiCall('/ai/diet', 'POST', { text, imageBase64, date });
}
export async function generateWorkoutTemplateWithAI(prompt) {
  return apiCall('/ai/workout-template', 'POST', { prompt });
}
export async function generateCurriculumWithAI(topic) {
  return apiCall('/ai/curriculum', 'POST', { topic });
}
export async function getDailyBriefWithAI() {
  return apiCall('/ai/brief', 'GET');
}
export async function getSupplementAdviceWithAI() {
  return apiCall('/ai/supplements', 'GET');
}
export async function updateDietTargets(targets) {
  return apiCall('/auth/diet-targets', 'PUT', targets);
}
export async function generateDietPlanWithAI(data) {
  return apiCall('/ai/diet-plan', 'POST', data);
}

export async function getLeaderboard() {
  try { return await apiCall('/social/leaderboard'); } catch { return { global: [], friends: [] }; }
}
export async function addFriend(username) {
  return apiCall('/social/friends', 'POST', { username });
}
export async function getSquad() {
  try { return await apiCall('/social/squad'); } catch { return { squad: null }; }
}
export async function createSquad(name) {
  return apiCall('/social/squad', 'POST', { name });
}
export async function joinSquad(inviteCode) {
  return apiCall('/social/squad/join', 'POST', { inviteCode });
}

// ===== BULK FETCHER (Used exclusively for Calendar) =====
export async function getGymWorkouts() {
  try { return await apiCall('/gym/workouts'); } catch { return []; }
}
export async function getHabitLogs() {
  try { return await apiCall('/habits/logs'); } catch { return []; }
}

export async function getCalendarData(year, month) {
  const results = {};
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const gymWorkouts = await getGymWorkouts();
  const habitLogs = await getHabitLogs();
  const learnGoals = await getLearningGoals();
  const content = await getContentLogs();

  gymWorkouts.forEach(w => {
    if (w.date.startsWith(prefix) && w.exercises.length > 0) {
      if (!results[w.date]) results[w.date] = new Set();
      results[w.date].add('gym');
    }
  });

  learnGoals.forEach(g => {
    (g.progressLogs || []).forEach(log => {
      if (log.date.startsWith(prefix)) {
        if (!results[log.date]) results[log.date] = new Set();
        results[log.date].add('learning');
      }
    });
  });

  content.forEach(c => {
    const cDate = c.date || c.updatedAt.split('T')[0];
    if (cDate.startsWith(prefix)) {
      if (!results[cDate]) results[cDate] = new Set();
      results[cDate].add('content');
    }
  });

  habitLogs.forEach(log => {
    if (log.date.startsWith(prefix) && log.completedHabitIds.length > 0) {
      if (!results[log.date]) results[log.date] = new Set();
      results[log.date].add('habit');
    }
  });

  const finalResults = {};
  Object.keys(results).forEach(date => {
    finalResults[date] = Array.from(results[date]);
  });

  return finalResults;
}

export async function logout() {
  await SecureStore.deleteItemAsync('jwt_token');
}
