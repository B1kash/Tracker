import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  getWorkoutByDate, saveWorkoutForDate,
  getCardioByDate, addCardioLog, deleteCardioLog,
  getDietByDate, addDietLog, deleteDietLog,
  getGymPhotosByDate, uploadGymPhoto, deleteGymPhoto,
  addXP, checkAndUpdateStreak, updateDietTargets, generateDietPlanWithAI, analyzeDietWithAI, getMe
} from '../lib/storage';
import AICoachModal from '../components/AICoachModal';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const CARDIO_TYPES = ['Running', 'Cycling', 'Swimming', 'Walking', 'HIIT', 'Other'];

function getDateStr(d) { return d.toISOString().split('T')[0]; }
function getWeekDates(center) {
  const dates = [];
  const start = new Date(center);
  start.setDate(start.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}
const mockId = () => Math.random().toString(36).substring(2, 10).padEnd(24, '0');

// ─── Date Strip ───
function DateStrip({ selectedDate, onSelect }) {
  const weekDates = getWeekDates(selectedDate);
  const dateStr = getDateStr(selectedDate);
  const todayStr = getDateStr(new Date());
  return (
    <View style={s.dateStrip}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {weekDates.map(d => {
          const ds = getDateStr(d);
          const active = ds === dateStr;
          const today = ds === todayStr;
          return (
            <TouchableOpacity key={ds} style={[s.dateChip, active && s.dateChipActive, today && !active && s.dateChipToday]} onPress={() => onSelect(d)}>
              <Text style={[s.dateDay, active && s.dateActive]}>{DAYS_SHORT[d.getDay()]}</Text>
              <Text style={[s.dateNum, active && s.dateActive]}>{d.getDate()}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── TAB: Exercises ───
function ExercisesTab({ dateStr, isFuture }) {
  const [workout, setWorkout] = useState({ exercises: [] });
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setLoading(true);
    getWorkoutByDate(dateStr).then(w => { setWorkout(w || { exercises: [] }); setLoading(false); });
  }, [dateStr]);

  const save = async (exercises) => {
    setWorkout(prev => ({ ...prev, exercises }));
    await saveWorkoutForDate(dateStr, exercises);
  };

  const addEx = async () => {
    if (!newName.trim() || isFuture) return;
    const id = mockId();
    const ex = { _id: id, id, name: newName.trim(), sets: [{ _id: mockId(), reps: 0, weight: '', completed: false }] };
    const list = [...workout.exercises, ex];
    setNewName('');
    await save(list);
  };

  const removeEx = (id) => Alert.alert('Remove?', 'Delete this exercise?', [
    { text: 'Cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => save(workout.exercises.filter(e => (e._id || e.id) !== id)) }
  ]);

  const addSet = async (exId) => {
    const exs = workout.exercises.map(ex => {
      if ((ex._id || ex.id) !== exId) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, { _id: mockId(), reps: last?.reps || 0, weight: last?.weight || '', completed: false }] };
    });
    await save(exs);
  };

  const updateSet = async (exId, setId, field, val) => {
    const exs = workout.exercises.map(ex => {
      if ((ex._id || ex.id) !== exId) return ex;
      return { ...ex, sets: ex.sets.map(s => (s._id || s.id) !== setId ? s : { ...s, [field]: field === 'completed' ? !s.completed : val }) };
    });
    // XP logic: +15 per set completed, -15 per uncompleted
    if (field === 'completed') {
      const ex = workout.exercises.find(e => (e._id || e.id) === exId);
      const set = ex?.sets.find(s => (s._id || s.id) === setId);
      if (set) await addXP(set.completed ? -15 : 15);
    }
    await save(exs);
  };

  const removeSet = async (exId, setId) => {
    const exs = workout.exercises.map(ex => {
      if ((ex._id || ex.id) !== exId) return ex;
      return { ...ex, sets: ex.sets.filter(s => (s._id || s.id) !== setId) };
    });
    await save(exs);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#8b5cf6" size="large" /></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={s.addRow}>
        <TextInput style={s.exInput} placeholder="Add exercise (e.g. Bench Press)" placeholderTextColor="#475569"
          value={newName} onChangeText={setNewName} editable={!isFuture} />
        <TouchableOpacity style={s.addBtn} onPress={addEx} disabled={isFuture}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {workout.exercises.length === 0 && (
        <View style={s.empty}><Ionicons name="barbell-outline" size={48} color="#334155" />
          <Text style={s.emptyText}>{isFuture ? 'Cannot log future workouts' : 'No exercises yet. Add one above!'}</Text></View>
      )}

      {workout.exercises.map(ex => {
        const exId = ex._id || ex.id;
        return (
          <View key={exId} style={s.exCard}>
            <View style={s.exHeader}>
              <Text style={s.exName}>{ex.name}</Text>
              <TouchableOpacity onPress={() => removeEx(exId)} disabled={isFuture}>
                <Ionicons name="trash-outline" size={18} color="#f43f5e" />
              </TouchableOpacity>
            </View>

            <View style={s.setHeaderRow}>
              <Text style={[s.setLabel, { width: 28 }]}>#</Text>
              <Text style={[s.setLabel, { flex: 1 }]}>Reps</Text>
              <Text style={[s.setLabel, { flex: 1 }]}>Kg</Text>
              <Text style={[s.setLabel, { width: 40 }]}>Done</Text>
              <View style={{ width: 24 }} />
            </View>

            {ex.sets.map((set, idx) => {
              const setId = set._id || set.id;
              return (
                <View key={setId} style={s.setRow}>
                  <Text style={s.setNum}>{idx + 1}</Text>
                  <TextInput style={s.setInput} keyboardType="numeric"
                    value={String(set.reps || '')} onChangeText={v => updateSet(exId, setId, 'reps', v)}
                    placeholder="0" placeholderTextColor="#475569" editable={!isFuture} />
                  <TextInput style={s.setInput} keyboardType="numeric"
                    value={String(set.weight || '')} onChangeText={v => updateSet(exId, setId, 'weight', v)}
                    placeholder="0" placeholderTextColor="#475569" editable={!isFuture} />
                  <TouchableOpacity style={[s.checkBtn, set.completed && s.checkBtnDone]}
                    onPress={() => updateSet(exId, setId, 'completed')} disabled={isFuture}>
                    {set.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeSet(exId, setId)} disabled={isFuture}>
                    <Ionicons name="close-circle-outline" size={18} color="#475569" />
                  </TouchableOpacity>
                </View>
              );
            })}

            <TouchableOpacity style={s.addSetBtn} onPress={() => addSet(exId)} disabled={isFuture}>
              <Ionicons name="add-circle-outline" size={15} color="#8b5cf6" />
              <Text style={s.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── TAB: Cardio ───
function CardioTab({ dateStr, isFuture }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'Running', duration: '', distance: '', calories: '' });

  const load = async () => {
    setLoading(true);
    setLogs(await getCardioByDate(dateStr));
    setLoading(false);
  };

  useEffect(() => { load(); }, [dateStr]);

  const submit = async () => {
    if (!form.type) return;
    await addCardioLog({ date: dateStr, ...form, duration: Number(form.duration) || 0, distance: Number(form.distance) || 0, calories: Number(form.calories) || 0 });
    await addXP(50); // +50 XP for cardio
    await checkAndUpdateStreak(dateStr);
    setShowModal(false);
    setForm({ type: 'Running', duration: '', distance: '', calories: '' });
    load();
  };

  const remove = async (id) => {
    await deleteCardioLog(id);
    setLogs(l => l.filter(x => (x._id || x.id) !== id));
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#10b981" size="large" /></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {!isFuture && (
        <TouchableOpacity style={[s.addBtn, { width: '100%', borderRadius: 14, marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 }]} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Log Cardio</Text>
        </TouchableOpacity>
      )}

      {logs.length === 0 && <View style={s.empty}><Ionicons name="bicycle-outline" size={48} color="#334155" />
        <Text style={s.emptyText}>No cardio logged for this day</Text></View>}

      {logs.map(log => (
        <View key={log._id || log.id} style={[s.exCard, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={s.cardioIcon}>
            <Ionicons name="fitness-outline" size={22} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.exName}>{log.type}</Text>
            <Text style={s.subText}>
              {log.duration ? `${log.duration} min` : ''}{log.distance ? ` · ${log.distance} km` : ''}{log.calories ? ` · ${log.calories} kcal` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => remove(log._id || log.id)}>
            <Ionicons name="trash-outline" size={18} color="#f43f5e" />
          </TouchableOpacity>
        </View>
      ))}

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Log Cardio</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CARDIO_TYPES.map(t => (
                <TouchableOpacity key={t} style={[s.pill, form.type === t && s.pillActive]} onPress={() => setForm(f => ({ ...f, type: t }))}>
                  <Text style={[s.pillText, form.type === t && s.pillTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.fieldLabel}>Duration (min)</Text>
            <TextInput style={s.modalInput} keyboardType="numeric" value={form.duration} onChangeText={v => setForm(f => ({ ...f, duration: v }))} placeholder="30" placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>Distance (km)</Text>
            <TextInput style={s.modalInput} keyboardType="numeric" value={form.distance} onChangeText={v => setForm(f => ({ ...f, distance: v }))} placeholder="5" placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>Calories Burned</Text>
            <TextInput style={s.modalInput} keyboardType="numeric" value={form.calories} onChangeText={v => setForm(f => ({ ...f, calories: v }))} placeholder="300" placeholderTextColor="#475569" />
            <TouchableOpacity style={[s.addBtn, { width: '100%', borderRadius: 14, marginTop: 8 }]} onPress={submit}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

function DietTab({ dateStr, isFuture, dietTargets, onUpdateTargets }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAIArchitect, setShowAIArchitect] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [analyzingDiet, setAnalyzingDiet] = useState(false);
  const [dietSnapText, setDietSnapText] = useState('');
  const [form, setForm] = useState({ meal: 'Breakfast', food: '', calories: '', protein: '', carbs: '', fats: '' });

  const [aiConfig, setAiConfig] = useState({ age: '25', weight: '70', height: '175', goal: 'Weight Loss', activity: 'Moderately Active', preference: 'Vegetarian' });
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);

  const load = async () => {
    setLoading(true);
    setLogs(await getDietByDate(dateStr));
    setLoading(false);
  };

  useEffect(() => { load(); }, [dateStr]);

  const submit = async () => {
    if (!form.food) return;
    await addDietLog({ date: dateStr, ...form, calories: Number(form.calories) || 0, protein: Number(form.protein) || 0, carbs: Number(form.carbs) || 0, fats: Number(form.fats) || 0 });
    await addXP(20); // +20 XP for logging a meal
    setShowModal(false);
    setForm({ meal: 'Breakfast', food: '', calories: '', protein: '', carbs: '', fats: '' });
    load();
  };

  const handleAIDietSnap = async () => {
    if (!dietSnapText.trim()) return;
    setAnalyzingDiet(true);
    try {
      const res = await analyzeDietWithAI(dietSnapText, null, dateStr);
      if (res) {
        setDietSnapText('');
        // Refresh logs immediately so the user sees the new entry
        await load(); 
        await addXP(20); // Award XP for the AI log too
        Alert.alert("Success", "AI Oracle has logged your meal!");
      }
    } catch (e) {
      Alert.alert("AI Error", "Failed to analyze diet. Please log manually.");
    } finally {
      setAnalyzingDiet(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await generateDietPlanWithAI(aiConfig);
      setAiPlan(res);
    } catch (e) {
      Alert.alert("AI Error", "Failed to generate diet plan.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  const applyAITargets = async () => {
    if (!aiPlan?.targets) return;
    try {
      await updateDietTargets(aiPlan.targets);
      onUpdateTargets(aiPlan.targets);
      setShowAIArchitect(false);
      Alert.alert("Success", "Targets applied!");
    } catch (e) { Alert.alert("Error", "Failed to apply targets."); }
  };

  const remove = async (id) => {
    await deleteDietLog(id);
    setLogs(l => l.filter(x => (x._id || x.id) !== id));
  };

  const totals = logs.reduce((acc, l) => {
    acc.calories += (Number(l.calories) || 0);
    acc.protein += (Number(l.protein) || 0);
    acc.carbs += (Number(l.carbs) || 0);
    acc.fats += (Number(l.fats) || 0);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const targets = dietTargets || { calories: 2000, protein: 120, carbs: 200, fats: 60 };

  if (loading) return <View style={s.center}><ActivityIndicator color="#f59e0b" size="large" /></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Macro Summary Web-style */}
      <View style={s.macroContainer}>
        <View style={s.macroHeader}>
          <Text style={s.macroTitle}>Macro Progress</Text>
          <TouchableOpacity onPress={() => setShowTargetModal(true)}>
            <Ionicons name="settings-outline" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        <View style={s.macroGrid}>
          {[
            { label: 'Calories', val: totals.calories, target: targets.calories, color: '#f59e0b', unit: 'kcal' },
            { label: 'Protein', val: totals.protein, target: targets.protein, color: '#10b981', unit: 'g' },
            { label: 'Carbs', val: totals.carbs, target: targets.carbs, color: '#06b6d4', unit: 'g' },
            { label: 'Fats', val: totals.fats, target: targets.fats, color: '#f43f5e', unit: 'g' },
          ].map(m => {
            const pct = Math.min(100, Math.round((m.val / m.target) * 100) || 0);
            return (
              <View key={m.label} style={s.macroItem}>
                <Text style={s.macroLabel}>{m.label}</Text>
                <View style={s.macroBarBg}>
                  <View style={[s.macroBarFill, { width: `${pct}%`, backgroundColor: m.color }]} />
                </View>
                <Text style={s.macroValues}>
                  <Text style={{ color: m.color, fontWeight: '700' }}>{Math.round(m.val)}</Text>
                  <Text style={{ color: '#475569' }}> / {m.target}{m.unit}</Text>
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* AI Diet Snap section */}
      {!isFuture && (
        <View style={s.aiSnapSection}>
          <View style={s.aiSnapHeader}>
            <Ionicons name="sparkles" size={16} color="#06b6d4" />
            <Text style={s.aiSnapTitle}>AI Diet Snap</Text>
          </View>
          <TextInput
            style={s.aiSnapInput}
            placeholder="What did you eat? (e.g. 2 Paneer parathas)"
            placeholderTextColor="#475569"
            value={dietSnapText}
            onChangeText={setDietSnapText}
            multiline
          />
          <TouchableOpacity style={s.aiSnapBtn} onPress={handleAIDietSnap} disabled={analyzingDiet}>
            {analyzingDiet ? <ActivityIndicator size="small" color="#fff" /> : 
              <><Ionicons name="flash-outline" size={16} color="#fff" /><Text style={s.aiSnapBtnText}>Analyze Meal</Text></>}
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons Row */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {!isFuture && (
          <TouchableOpacity style={[s.addBtn, { backgroundColor: '#f59e0b', flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', gap: 8 }]} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700' }}>Manual Log</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[s.addBtn, { backgroundColor: '#06b6d4', flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', gap: 8 }]} onPress={() => setShowAIArchitect(true)}>
          <Ionicons name="restaurant-outline" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700' }}>AI Architect</Text>
        </TouchableOpacity>
      </View>

      {logs.length === 0 && <View style={s.empty}><Ionicons name="restaurant-outline" size={48} color="#334155" />
        <Text style={s.emptyText}>No meals logged for this day</Text></View>}

      {logs.map(log => (
        <View key={log._id || log.id} style={[s.exCard, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={s.mealBadge}><Text style={s.mealBadgeText}>{(log.meal || '').slice(0, 1)}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.exName}>{log.food}</Text>
            <Text style={s.subText}>{log.meal}{log.calories ? ` · ${log.calories} kcal` : ''}{log.protein ? ` · ${log.protein}g P` : ''}</Text>
          </View>
          <TouchableOpacity onPress={() => remove(log._id || log.id)}>
            <Ionicons name="trash-outline" size={18} color="#f43f5e" />
          </TouchableOpacity>
        </View>
      ))}

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Log Meal</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>Meal Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {MEALS.map(m => (
                <TouchableOpacity key={m} style={[s.pill, form.meal === m && { ...s.pillActive, backgroundColor: '#f59e0b' }]} onPress={() => setForm(f => ({ ...f, meal: m }))}>
                  <Text style={[s.pillText, form.meal === m && s.pillTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.fieldLabel}>Food name *</Text>
            <TextInput style={s.modalInput} value={form.food} onChangeText={v => setForm(f => ({ ...f, food: v }))} placeholder="e.g. Grilled Chicken" placeholderTextColor="#475569" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Calories</Text>
                <TextInput style={s.modalInput} keyboardType="numeric" value={form.calories} onChangeText={v => setForm(f => ({ ...f, calories: v }))} placeholder="0" placeholderTextColor="#475569" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Protein (g)</Text>
                <TextInput style={s.modalInput} keyboardType="numeric" value={form.protein} onChangeText={v => setForm(f => ({ ...f, protein: v }))} placeholder="0" placeholderTextColor="#475569" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Carbs (g)</Text>
                <TextInput style={s.modalInput} keyboardType="numeric" value={form.carbs} onChangeText={v => setForm(f => ({ ...f, carbs: v }))} placeholder="0" placeholderTextColor="#475569" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Fats (g)</Text>
                <TextInput style={s.modalInput} keyboardType="numeric" value={form.fats} onChangeText={v => setForm(f => ({ ...f, fats: v }))} placeholder="0" placeholderTextColor="#475569" />
              </View>
            </View>
            <TouchableOpacity style={[s.addBtn, { backgroundColor: '#f59e0b', width: '100%', borderRadius: 14, marginTop: 8 }]} onPress={submit}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center' }}>Save Meal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* AI Architect Modal */}
      <Modal visible={showAIArchitect} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { maxHeight: '80%' }]}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="sparkles" size={24} color="#06b6d4" />
                <Text style={s.modalTitle}>Diet Architect</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAIArchitect(false)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {!aiPlan ? (
                <View>
                  <Text style={s.fieldLabel}>Goal</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {['Weight Loss', 'Build Muscle', 'Maintenance'].map(g => (
                      <TouchableOpacity key={g} style={[s.pill, aiConfig.goal === g && s.pillActive]} onPress={() => setAiConfig({ ...aiConfig, goal: g })}>
                        <Text style={[s.pillText, aiConfig.goal === g && s.pillTextActive]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={s.fieldLabel}>Preference</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    {['Vegetarian', 'Non-Vegetarian', 'Vegan'].map(p => (
                      <TouchableOpacity key={p} style={[s.pill, aiConfig.preference === p && s.pillActive]} onPress={() => setAiConfig({ ...aiConfig, preference: p })}>
                        <Text style={[s.pillText, aiConfig.preference === p && s.pillTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={[s.addBtn, { width: '100%', backgroundColor: '#06b6d4', height: 50, borderRadius: 14 }]} onPress={handleGeneratePlan} disabled={generatingPlan}>
                    {generatingPlan ? <ActivityIndicator color="#fff" /> : <Text style={s.fetchBtnText}>Build Indian Diet Plan</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={s.planTargets}>
                    {Object.entries(aiPlan.targets).map(([k, v]) => (
                      <View key={k} style={s.planTargetItem}>
                        <Text style={s.planTargetKey}>{k}</Text>
                        <Text style={s.planTargetVal}>{v}{k === 'calories' ? '' : 'g'}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ marginVertical: 20 }}>
                    {aiPlan.plan.map((m, idx) => (
                      <View key={idx} style={s.planMealCard}>
                        <Text style={s.planMealName}>{m.meal}</Text>
                        <Text style={s.planMealDesc}>{m.recommendation}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={[s.addBtn, { width: '100%', backgroundColor: '#10b981', height: 50, borderRadius: 14 }]} onPress={applyAITargets}>
                    <Text style={s.fetchBtnText}>Apply Macro Targets</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ marginTop: 15, alignSelf: 'center' }} onPress={() => setAiPlan(null)}>
                    <Text style={{ color: '#64748b' }}>Configure again</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Target Configuration Modal */}
      <Modal visible={showTargetModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Configure Targets</Text>
              <TouchableOpacity onPress={() => setShowTargetModal(false)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            <View style={{ gap: 12 }}>
              <View>
                <Text style={s.fieldLabel}>Daily Calories</Text>
                <TextInput style={s.modalInput} keyboardType="numeric" value={String(targets.calories)} 
                  onChangeText={v => onUpdateTargets({ ...targets, calories: Number(v) })} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Protein (g)</Text>
                  <TextInput style={s.modalInput} keyboardType="numeric" value={String(targets.protein)} 
                    onChangeText={v => onUpdateTargets({ ...targets, protein: Number(v) })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Carbs (g)</Text>
                  <TextInput style={s.modalInput} keyboardType="numeric" value={String(targets.carbs)} 
                    onChangeText={v => onUpdateTargets({ ...targets, carbs: Number(v) })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Fats (g)</Text>
                  <TextInput style={s.modalInput} keyboardType="numeric" value={String(targets.fats)} 
                    onChangeText={v => onUpdateTargets({ ...targets, fats: Number(v) })} />
                </View>
              </View>
            </View>
            <TouchableOpacity style={[s.addBtn, { width: '100%', marginTop: 20, height: 50, borderRadius: 14 }]} onPress={async () => {
              await updateDietTargets(targets);
              setShowTargetModal(false);
            }}>
              <Text style={s.fetchBtnText}>Save Targets</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── TAB: Photos ───
function PhotosTab({ dateStr, isFuture }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    setPhotos(await getGymPhotosByDate(dateStr));
    setLoading(false);
  };

  useEffect(() => { load(); }, [dateStr]);

  const pickAndUpload = async (useCamera) => {
    if (isFuture) return;
    if (photos.length >= 3) return Alert.alert('Limit reached', 'Maximum 3 photos per day allowed.');

    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) return Alert.alert('Permission denied', 'Allow access to continue.');

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    setUploading(true);
    try {
      await uploadGymPhoto(dateStr, `data:image/jpeg;base64,${asset.base64}`, 'image/jpeg');
      await addXP(50); // +50 XP for gym photo
      await checkAndUpdateStreak(dateStr);
      load();
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (id) => Alert.alert('Delete photo?', undefined, [
    { text: 'Cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      await deleteGymPhoto(id);
      setPhotos(p => p.filter(x => (x._id || x.id) !== id));
    }},
  ]);

  if (loading) return <View style={s.center}><ActivityIndicator color="#ec4899" size="large" /></View>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={[s.photoLimitBar, { backgroundColor: photos.length >= 3 ? 'rgba(244,63,94,0.1)' : 'rgba(139,92,246,0.1)' }]}>
        <Ionicons name="images-outline" size={16} color={photos.length >= 3 ? '#f43f5e' : '#8b5cf6'} />
        <Text style={[s.photoLimitText, { color: photos.length >= 3 ? '#f43f5e' : '#94a3b8' }]}>
          {photos.length}/3 photos for this day
        </Text>
      </View>

      {!isFuture && photos.length < 3 && (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <TouchableOpacity style={[s.photoBtn, { flex: 1 }]} onPress={() => pickAndUpload(true)} disabled={uploading}>
            <Ionicons name="camera-outline" size={20} color="#fff" />
            <Text style={s.photoBtnText}>{uploading ? 'Uploading...' : 'Camera'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.photoBtn, { flex: 1, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#8b5cf6' }]} onPress={() => pickAndUpload(false)} disabled={uploading}>
            <Ionicons name="images-outline" size={20} color="#8b5cf6" />
            <Text style={[s.photoBtnText, { color: '#8b5cf6' }]}>Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {photos.length === 0 && (
        <View style={s.empty}><Ionicons name="camera-outline" size={48} color="#334155" />
          <Text style={s.emptyText}>{isFuture ? 'No photos for future dates' : 'No photos yet. Take one!'}</Text></View>
      )}

      <View style={s.photoGrid}>
        {photos.map(photo => (
          <View key={photo._id || photo.id} style={s.photoContainer}>
            <Image source={{ uri: photo.url }} style={s.photoImg} resizeMode="cover" />
            <TouchableOpacity style={s.deletePhotoBtn} onPress={() => removePhoto(photo._id || photo.id)}>
              <Ionicons name="trash" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── MAIN SCREEN ───
const TABS = [
  { key: 'exercises', label: 'Exercises', icon: 'barbell-outline' },
  { key: 'cardio', label: 'Cardio', icon: 'bicycle-outline' },
  { key: 'diet', label: 'Diet', icon: 'restaurant-outline' },
  { key: 'photos', label: 'Photos', icon: 'camera-outline' },
];

export default function GymScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('exercises');
  const [showAI, setShowAI] = useState(false);
  const [dietTargets, setDietTargets] = useState(null);

  useEffect(() => {
    getMe().then(user => {
      if (user?.dietTargets) setDietTargets(user.dietTargets);
    });
  }, []);

  const dateStr = getDateStr(selectedDate);
  const todayStr = getDateStr(new Date());
  const isFuture = dateStr > todayStr;

  return (
    <View style={s.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
        <View style={{ flex: 1 }}><DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} /></View>
        <TouchableOpacity style={{ padding: 10, backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 12 }} onPress={() => setShowAI(true)}>
          <Ionicons name="sparkles" size={24} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      <AICoachModal visible={showAI} onClose={() => setShowAI(false)} />

      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, activeTab === t.key && s.tabActive]} onPress={() => setActiveTab(t.key)}>
            <Ionicons name={t.icon} size={18} color={activeTab === t.key ? '#fff' : '#475569'} />
            <Text style={[s.tabLabel, activeTab === t.key && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'exercises' && <ExercisesTab dateStr={dateStr} isFuture={isFuture} />}
      {activeTab === 'cardio' && <CardioTab dateStr={dateStr} isFuture={isFuture} />}
      {activeTab === 'diet' && <DietTab dateStr={dateStr} isFuture={isFuture} dietTargets={dietTargets} onUpdateTargets={setDietTargets} />}
      {activeTab === 'photos' && <PhotosTab dateStr={dateStr} isFuture={isFuture} />}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyText: { color: '#475569', fontSize: 15, textAlign: 'center' },

  // Date
  dateStrip: { paddingVertical: 12, paddingLeft: 16 },
  dateChip: { width: 54, height: 66, borderRadius: 14, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
  dateChipActive: { backgroundColor: '#8b5cf6' },
  dateChipToday: { borderColor: 'rgba(139,92,246,0.5)' },
  dateDay: { color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  dateNum: { color: '#fff', fontSize: 18, fontWeight: '800' },
  dateActive: { color: '#fff' },

  // Tab bar
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1e293b', borderRadius: 14, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: '#8b5cf6' },
  tabLabel: { color: '#475569', fontSize: 12, fontWeight: '700' },
  tabLabelActive: { color: '#fff' },

  // Exercise
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  exInput: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14 },
  addBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  exCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exName: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  setHeaderRow: { flexDirection: 'row', marginBottom: 6 },
  setLabel: { color: '#475569', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  setNum: { color: '#64748b', width: 20, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  setInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 9, color: '#fff', textAlign: 'center', fontSize: 14 },
  checkBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 2, borderColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  checkBtnDone: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, alignSelf: 'flex-start' },
  addSetText: { color: '#8b5cf6', fontWeight: '700', fontSize: 13 },

  // Cardio
  cardioIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  subText: { color: '#64748b', fontSize: 12, marginTop: 2 },

  // Diet
  summaryCard: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 12, padding: 14, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  summaryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  mealBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  mealBadgeText: { color: '#f59e0b', fontWeight: '800', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  fieldLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pillActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  pillText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  pillTextActive: { color: '#fff' },

  // Photos
  photoLimitBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 16 },
  photoLimitText: { fontSize: 13, fontWeight: '600' },
  photoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ec4899', borderRadius: 14, padding: 14 },
  photoBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoContainer: { width: '47%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  deletePhotoBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, padding: 5 },

  // New Diet Sync Styles
  macroContainer: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  macroTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  macroGrid: { gap: 10 },
  macroItem: { },
  macroLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  macroBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 3 },
  macroValues: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, fontSize: 12 },
  
  aiSnapSection: { backgroundColor: 'rgba(6,182,212,0.08)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(6,182,212,0.2)' },
  aiSnapHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  aiSnapTitle: { color: '#06b6d4', fontWeight: '700', fontSize: 13, textTransform: 'uppercase' },
  aiSnapInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, marginBottom: 12, textAlignVertical: 'top', height: 80 },
  aiSnapBtn: { backgroundColor: '#06b6d4', borderRadius: 10, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  aiSnapBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  fetchBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  planTargets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 10 },
  planTargetItem: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 10, minWidth: 70, alignItems: 'center' },
  planTargetKey: { color: '#64748b', fontSize: 10, textTransform: 'uppercase' },
  planTargetVal: { color: '#fff', fontSize: 16, fontWeight: '800' },
  planMealCard: { borderLeftWidth: 3, borderLeftColor: '#06b6d4', backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, marginBottom: 10 },
  planMealName: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  planMealDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
});
