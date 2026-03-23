'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    IoAdd, IoTrashOutline, IoCheckmarkSharp, IoAddCircleOutline, IoCloseCircleOutline,
    IoBarbell, IoWalk, IoFastFoodOutline, IoFlameOutline, IoTimerOutline, IoImageOutline, IoCloudUploadOutline,
    IoListOutline, IoSaveOutline
} from 'react-icons/io5';
import EmptyState from '@/components/EmptyState';
import {
    getWorkoutByDate, addExerciseToDate, removeExerciseFromDate, updateExerciseSets, getGymWorkouts, saveWorkoutForDate,
    getCardioByDate, addCardioLog, deleteCardioLog,
    getDietByDate, addDietLog, deleteDietLog,
    getGymPhotos, addGymPhoto, deleteGymPhoto,
    getWorkoutTemplates, createWorkoutTemplate, deleteWorkoutTemplate,
    generateWorkoutTemplateWithAI, analyzeDietWithAI,
    updateDietTargets, generateDietPlanWithAI, getMe
} from '@/lib/storage';
import { triggerGamificationUpdate } from '@/lib/events';
import { IoSettingsOutline, IoSparklesOutline, IoRestaurantOutline, IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import { compressImage } from './Compressor';
import OneRMChart from '@/components/OneRMChart';
import MacroRings from '@/components/MacroRings';
import styles from './page.module.css';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TABS = [
    { id: 'exercises', label: 'Exercises', icon: IoBarbell },
    { id: 'templates', label: 'Templates', icon: IoListOutline },
    { id: 'cardio', label: 'Cardio', icon: IoWalk },
    { id: 'diet', label: 'Diet', icon: IoFastFoodOutline },
    { id: 'photos', label: 'Photos', icon: IoImageOutline },
];
const CARDIO_TYPES = ['Running', 'Walking', 'Cycling', 'Swimming', 'Jump Rope', 'Elliptical', 'Stairmaster', 'HIIT', 'Other'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout'];

function getDateStr(date) { return date.toISOString().split('T')[0]; }
function mockObjectId() { return [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''); }

function getWeekDates(centerDate) {
    const dates = [];
    const start = new Date(centerDate);
    start.setDate(start.getDate() - 3);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
    }
    return dates;
}

export default function GymPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('exercises');
    const [workout, setWorkout] = useState(null);
    const [cardioEntries, setCardioEntries] = useState([]);
    const [dietEntries, setDietEntries] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [newExercise, setNewExercise] = useState('');
    const [allWorkouts, setAllWorkouts] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [templateName, setTemplateName] = useState('');
    const [mounted, setMounted] = useState(false);
    const [uploading, setUploading] = useState(false);
    const setDebounceTimer = useRef(null);

    // AI States
    const [aiTemplatePrompt, setAiTemplatePrompt] = useState('');
    const [generatingTemplate, setGeneratingTemplate] = useState(false);
    const [dietSnapText, setDietSnapText] = useState('');
    const [analyzingDiet, setAnalyzingDiet] = useState(false);
    
    // UI states
    const [expandedTemplates, setExpandedTemplates] = useState(new Set());
    const [userData, setUserData] = useState(null);
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [generatingDietPlan, setGeneratingDietPlan] = useState(false);
    const [showDietPlan, setShowDietPlan] = useState(false);
    const [aiDietPlan, setAiDietPlan] = useState(null);
    const [aiDietConfig, setAiDietConfig] = useState({
        age: 25, weight: 70, height: 175, goal: 'Build Muscle', activity: 'Moderately Active', vegNonVeg: 'Non-Vegetarian'
    });

    const toggleTemplateExpand = (id) => {
        setExpandedTemplates((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // Cardio form
    const [cardioForm, setCardioForm] = useState({ type: 'Running', duration: '', distance: '', calories: '' });
    // Diet form
    const [dietForm, setDietForm] = useState({ meal: 'Breakfast', food: '', calories: '', protein: '', carbs: '', fats: '', notes: '' });

    const dateStr = getDateStr(selectedDate);
    const weekDates = getWeekDates(selectedDate);
    const today = getDateStr(new Date());
    const isFuture = dateStr > today;

    const loadData = useCallback(async () => {
        setWorkout(await getWorkoutByDate(dateStr));
        setAllWorkouts(await getGymWorkouts());
        setCardioEntries(await getCardioByDate(dateStr));
        setDietEntries(await getDietByDate(dateStr));
        setPhotos(await getGymPhotos());
        setTemplates(await getWorkoutTemplates());
        
        // Load Profile Data for targets
        const me = await apiCall('/auth/me');
        if (me) setUserData(me);
    }, [dateStr]);

    // Add apiCall for auth me if not already in storage
    async function apiCall(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('jwt_token');
        const res = await fetch(`http://localhost:5000/api${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: body ? JSON.stringify(body) : null
        });
        return res.json();
    }

    useEffect(() => {
        loadData().then(() => setMounted(true));
    }, [loadData]);

    if (!mounted) return null;

    const exercises = workout?.exercises || [];
    const datesWithData = new Set(allWorkouts.map((w) => w.date));

    // === EXERCISE HANDLERS ===
    const handleAddExercise = async (e) => {
        e.preventDefault();
        const name = newExercise.trim();
        if (!name) return;
        setNewExercise('');
        // Optimistic UI for visual snap
        const id = mockObjectId();
        const newEx = { _id: id, id, name, sets: [{ reps: 0, weight: '', completed: false, _id: mockObjectId() }] };
        setWorkout(prev => prev ? { ...prev, exercises: [...prev.exercises, newEx] } : { exercises: [newEx] });

        await addExerciseToDate(dateStr, name);
        // Refresh silently just for this component to sync real MongoDB _ids
        setWorkout(await getWorkoutByDate(dateStr));
    };

    const handleRemoveExercise = async (exId) => {
        setWorkout(prev => ({ ...prev, exercises: prev.exercises.filter(e => (e._id || e.id) !== exId) }));
        await removeExerciseFromDate(dateStr, exId);
    };

    const handleAddSet = async (exId) => {
        const ex = exercises.find((e) => (e._id || e.id) === exId);
        if (!ex) return;
        const newSets = [...ex.sets, { reps: 0, weight: '', completed: false, _id: mockObjectId() }];
        setWorkout(prev => ({ ...prev, exercises: prev.exercises.map(e => (e._id || e.id) === exId ? { ...e, sets: newSets } : e) }));

        await updateExerciseSets(dateStr, exId, newSets);
        setWorkout(await getWorkoutByDate(dateStr)); // Sync IDs
    };

    const handleRemoveSet = async (exId, setId) => {
        const ex = exercises.find((e) => (e._id || e.id) === exId);
        if (!ex) return;
        const newSets = ex.sets.filter((s) => (s._id || s.id) !== setId);
        setWorkout(prev => ({ ...prev, exercises: prev.exercises.map(e => (e._id || e.id) === exId ? { ...e, sets: newSets } : e) }));

        await updateExerciseSets(dateStr, exId, newSets);
    };
    const handleSetChange = async (exId, setId, field, value) => {
        if (!workout) return;

        // Optimistic UI state update
        const newExercises = workout.exercises.map(ex => {
            if ((ex._id || ex.id) === exId) {
                const newSets = ex.sets.map(s => {
                    if ((s._id || s.id) === setId) {
                        return { ...s, [field]: field === 'reps' ? (value === '' ? '' : parseInt(value) || 0) : value };
                    }
                    return s;
                });
                return { ...ex, sets: newSets };
            }
            return ex;
        });
        setWorkout({ ...workout, exercises: newExercises });

        // Debounce actual API call by 750ms to prevent database spam on every keystroke
        const updatedEx = newExercises.find(e => (e._id || e.id) === exId);
        if (setDebounceTimer.current) clearTimeout(setDebounceTimer.current);

        setDebounceTimer.current = setTimeout(async () => {
            await updateExerciseSets(dateStr, exId, updatedEx.sets);
        }, 750);
    };
    const handleToggleSet = async (exId, setId) => {
        const ex = exercises.find((e) => (e._id || e.id) === exId);
        if (!ex) return;
        const targetSet = ex.sets.find(s => (s._id || s.id) === setId);
        const willBeCompleted = !(targetSet?.completed);
        const newSets = ex.sets.map((s) => (s._id || s.id) === setId ? { ...s, completed: !s.completed } : s);
        setWorkout(prev => ({ ...prev, exercises: prev.exercises.map(e => (e._id || e.id) === exId ? { ...e, sets: newSets } : e) }));

        if (setDebounceTimer.current) clearTimeout(setDebounceTimer.current);
        await updateExerciseSets(dateStr, exId, newSets);

        // Trigger rest timer popup when completing a set
        if (willBeCompleted && typeof window !== 'undefined') {
            window.dispatchEvent(new Event('start_rest_timer'));
        }
    };

    // === CARDIO HANDLERS ===
    const handleAddCardio = async (e) => {
        e.preventDefault();
        if (!cardioForm.duration) return;
        // Optimistic update
        const temp = { _id: mockObjectId(), ...cardioForm, date: dateStr, completed: true };
        setCardioEntries(prev => [...prev, temp]);
        setCardioForm({ type: 'Running', duration: '', distance: '', calories: '' });
        await addCardioLog({ ...cardioForm, date: dateStr, completed: true });
        setCardioEntries(await getCardioByDate(dateStr));
    };

    // === DIET HANDLERS ===
    const handleAddDiet = async (e) => {
        e.preventDefault();
        if (!dietForm.food) return;
        const temp = { _id: mockObjectId(), ...dietForm, date: dateStr };
        setDietEntries(prev => [...prev, temp]);
        setDietForm({ meal: 'Breakfast', food: '', calories: '', protein: '', carbs: '', fats: '', notes: '' });
        await addDietLog({ ...dietForm, date: dateStr });
        setDietEntries(await getDietByDate(dateStr));
    };

    const handleAIDietSubmit = async (e, file = null) => {
        if (e) e.preventDefault();
        if (!dietSnapText && !file) return;
        setAnalyzingDiet(true);
        try {
            let base64 = null;
            if (file) {
                base64 = await compressImage(file, 800, 0.6);
            }
            await analyzeDietWithAI(dietSnapText, base64, dateStr);
            setDietEntries(await getDietByDate(dateStr));
            setDietSnapText('');
        } catch (e) {
            alert('AI Failed to parse your meal.');
        }
        setAnalyzingDiet(false);
    };

    const handleUpdateTargets = async (e) => {
        if (e) e.preventDefault();
        try {
            const res = await apiCall('/auth/diet-targets', 'PUT', userData.dietTargets);
            if (res) {
                setUserData({ ...userData, dietTargets: res });
                setShowTargetModal(false);
            }
        } catch (err) { alert('Failed to update targets'); }
    };

    const handleGenerateDietPlan = async (e) => {
        if (e) e.preventDefault();
        setGeneratingDietPlan(true);
        try {
            const res = await generateDietPlanWithAI(aiDietConfig);
            setAiDietPlan(res);
            setShowDietPlan(true);
        } catch (err) { alert('AI Architect failed to build the plan.'); }
        setGeneratingDietPlan(false);
    };

    const handleApplyAITargets = async () => {
        if (!aiDietPlan) return;
        try {
            const res = await apiCall('/auth/diet-targets', 'PUT', aiDietPlan.targets);
            if (res) {
                setUserData({ ...userData, dietTargets: res });
                setShowDietPlan(false);
            }
        } catch (err) { alert('Failed to apply AI targets'); }
    };

    // === PHOTOS HANDLERS ===
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const photosToday = photos.filter(p => p.date === dateStr);
        if (photosToday.length >= 3) {
            alert('Maximum 3 photos per day allowed.');
            e.target.value = null;
            return;
        }

        try {
            setUploading(true);
            const base64 = await compressImage(file, 800, 0.6); // Compress aggressively 
            await addGymPhoto(dateStr, base64);
            triggerGamificationUpdate(); // XP for taking progress photos
            setPhotos(await getGymPhotos());
        } catch (error) {
            console.error("Failed to compress image:", error);
            alert("Failed to process image. Please try a different photo.");
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    // === TEMPLATE HANDLERS ===
    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        if (!workout?.exercises?.length || !templateName.trim()) return;
        const payload = {
            name: templateName,
            exercises: workout.exercises.map(ex => ({
                name: ex.name,
                defaultSets: ex.sets.length,
                defaultReps: ex.sets[0]?.reps || 10,
                defaultWeight: ex.sets[0]?.weight || ''
            }))
        };
        await createWorkoutTemplate(payload);
        setTemplateName('');
        setTemplates(await getWorkoutTemplates());
        alert('Template saved successfully!');
    };

    const handleGenerateTemplate = async (e) => {
        e.preventDefault();
        if (!aiTemplatePrompt.trim()) return;
        setGeneratingTemplate(true);
        try {
            await generateWorkoutTemplateWithAI(aiTemplatePrompt);
            setTemplates(await getWorkoutTemplates());
            setAiTemplatePrompt('');
        } catch (e) {
            alert('Failed to automatically generate template.');
        }
        setGeneratingTemplate(false);
    };

    const handleApplyTemplate = async (tpl) => {
        if (isFuture) return;
        if (!window.confirm(`Apply "${tpl.name}" to today's workout?`)) return;

        const currentExs = workout?.exercises || [];
        const newExs = tpl.exercises.map(tplEx => {
            const defaultSets = Array.from({ length: tplEx.defaultSets }).map(() => ({
                reps: tplEx.defaultReps, weight: tplEx.defaultWeight, completed: false, _id: mockObjectId()
            }));
            return { name: tplEx.name, sets: defaultSets };
        });

        const merged = [...currentExs, ...newExs];
        
        // Optimistic UI update immediately
        setWorkout({ ...workout, exercises: merged, date: dateStr });
        
        await saveWorkoutForDate(dateStr, merged);
        setWorkout(await getWorkoutByDate(dateStr)); // Refresh ids
    };

    const handleDeleteTemplate = async (id) => {
        if (!id) return;
        
        // Optimistic UI Removal
        setTemplates(prev => prev.filter(t => (t._id || t.id) !== id));
        
        try {
            await deleteWorkoutTemplate(id);
        } catch (e) {
            console.error(e);
            alert("Template deletion failed: " + e.message);
        }
        setTemplates(await getWorkoutTemplates());
    };

    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0);
    const totalCardioMins = cardioEntries.reduce((sum, c) => sum + (parseInt(c.duration) || 0), 0);
    const totalCalories = dietEntries.reduce((sum, d) => sum + (parseInt(d.calories) || 0), 0);
    const totalProtein = dietEntries.reduce((sum, d) => sum + (parseInt(d.protein) || 0), 0);

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.headerRow}>
                <div className="page-header">
                    <h1 className="page-title">
                        <span className="page-title-gradient">💪 Gym Tracker</span>
                    </h1>
                    <p className="page-subtitle">
                        {dateStr === today ? "Today's session" : `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`}
                        {activeTab === 'exercises' && totalSets > 0 && ` — ${completedSets}/${totalSets} sets`}
                        {activeTab === 'cardio' && totalCardioMins > 0 && ` — ${totalCardioMins} min cardio`}
                        {activeTab === 'diet' && totalCalories > 0 && ` — ${totalCalories} cal · ${totalProtein}g protein`}
                    </p>
                </div>
            </div>

            {/* Date Strip */}
            <div className="date-strip">
                {weekDates.map((d) => {
                    const ds = getDateStr(d);
                    const isActive = ds === dateStr;
                    const hasData = datesWithData.has(ds);
                    return (
                        <button key={ds} className={`date-chip ${isActive ? 'active' : ''}`} onClick={() => setSelectedDate(d)}>
                            <span className="date-chip-day">{DAYS_SHORT[d.getDay()]}</span>
                            <span className="date-chip-num">{d.getDate()}</span>
                            {hasData && <span className="date-chip-dot" />}
                        </button>
                    );
                })}
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ========== EXERCISES TAB ========== */}
            {activeTab === 'exercises' && (
                <>
                    <OneRMChart allWorkouts={allWorkouts} />
                    <form onSubmit={handleAddExercise} className={styles.quickAdd}>
                        <input className="form-input" placeholder="Add exercise (e.g. Bench Press, Squats...)" value={newExercise} onChange={(e) => setNewExercise(e.target.value)} disabled={isFuture} />
                        <button type="submit" className="btn btn-primary btn-sm" disabled={isFuture}><IoAdd size={18} /> Add</button>
                    </form>
                    {exercises.length === 0 ? (
                        <div className="empty-inline">No exercises logged — type above and hit Add!</div>
                    ) : (
                        <div className={styles.exerciseList}>
                            {exercises.map((ex) => (
                                <div key={ex._id || ex.id} className="exercise-block">
                                    <div className="exercise-header">
                                        <h3 className="exercise-name">{ex.name}</h3>
                                        <div className="exercise-actions">
                                            <button className="btn-ghost" onClick={() => handleAddSet(ex._id || ex.id)} disabled={isFuture}><IoAddCircleOutline size={16} /> Add Set</button>
                                            <button className="btn-icon" onClick={() => handleRemoveExercise(ex._id || ex.id)} disabled={isFuture}><IoTrashOutline size={18} /></button>
                                        </div>
                                    </div>
                                    {ex.sets.length > 0 && (
                                        <table className="sets-table">
                                            <thead><tr><th style={{ width: '50px' }}>Set</th><th>Reps</th><th>Weight</th><th style={{ width: '50px' }}>Done</th><th style={{ width: '40px' }}></th></tr></thead>
                                            <tbody>
                                                {ex.sets.map((set, idx) => (
                                                    <tr key={set._id || set.id}>
                                                        <td><span className={styles.setNumber}>{idx + 1}</span></td>
                                                        <td><input className="set-input" type="number" min="0" placeholder="0" value={set.reps || ''} onChange={(e) => handleSetChange(ex._id || ex.id, set._id || set.id, 'reps', e.target.value)} disabled={isFuture} /></td>
                                                        <td><input className="set-input" placeholder="0 kg" value={set.weight || ''} onChange={(e) => handleSetChange(ex._id || ex.id, set._id || set.id, 'weight', e.target.value)} disabled={isFuture} /></td>
                                                        <td><button className={`set-check ${set.completed ? 'done' : ''}`} onClick={() => handleToggleSet(ex._id || ex.id, set._id || set.id)} disabled={isFuture}>{set.completed && <IoCheckmarkSharp size={14} />}</button></td>
                                                        <td><button className="btn-icon" onClick={() => handleRemoveSet(ex._id || ex.id, set._id || set.id)} disabled={isFuture}><IoCloseCircleOutline size={16} /></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ========== TEMPLATES TAB ========== */}
            {activeTab === 'templates' && (
                <>
                    <h3 className={styles.sectionTitle}>Workout Templates</h3>
                    <p className={styles.sectionSubtitle}>Load a saved routine, or save today's workout as a new template.</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                        <form onSubmit={handleSaveTemplate} style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                <IoSaveOutline size={18} /> Save Current Workout
                            </div>
                            <input className="form-input" placeholder="e.g. Push Day A" value={templateName} onChange={(e) => setTemplateName(e.target.value)} disabled={exercises.length === 0} required style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={exercises.length === 0}>Save Layout</button>
                        </form>

                        <form onSubmit={handleGenerateTemplate} style={{ background: 'linear-gradient(135deg, rgba(88,32,135,0.2), rgba(18,15,23,0.8))', padding: '15px', borderRadius: '12px', border: '1px solid var(--accent-purple)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)', fontWeight: 'bold' }}>
                                ✨ AI Auto-Generator
                            </div>
                            <input className="form-input" placeholder="e.g. '4-day upper body split'" value={aiTemplatePrompt} onChange={(e) => setAiTemplatePrompt(e.target.value)} disabled={generatingTemplate} required style={{ border: 'none', background: 'rgba(0,0,0,0.3)', color: 'white' }} />
                            <button type="submit" className="btn btn-sm" disabled={generatingTemplate} style={{ background: 'var(--accent-purple)', color: 'white', border: 'none' }}>
                                {generatingTemplate ? 'Thinking...' : 'Generate New Routine'}
                            </button>
                        </form>
                    </div>

                    {templates.length === 0 ? (
                        <div className="empty-inline">No templates saved yet. Create your workout then save it here!</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                            {templates.map((tpl) => {
                                const isAI = tpl.name.includes('(AI Generated)');
                                const cleanName = tpl.name.replace('(AI Generated)', '').trim();
                                const isExpanded = expandedTemplates.has(tpl._id || tpl.id);
                                const maxShows = 4;
                                const displayExs = isExpanded ? tpl.exercises : tpl.exercises.slice(0, maxShows);
                                const extraCount = !isExpanded && tpl.exercises.length > maxShows ? tpl.exercises.length - maxShows : 0;

                                return (
                                    <div key={tpl._id} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: isAI ? '1px solid rgba(138,43,226,0.3)' : '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', background: isAI ? 'linear-gradient(90deg, rgba(138,43,226,0.1), transparent)' : 'transparent' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                    {isAI ? <span style={{ fontSize: '1.1rem' }}>✨</span> : <IoListOutline size={18} style={{ color: 'var(--accent-cyan)' }} />}
                                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.2' }}>{cleanName}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tpl.exercises.length} Exercises</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleApplyTemplate(tpl)} disabled={isFuture} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Apply</button>
                                                <button type="button" className="btn-icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteTemplate(tpl._id || tpl.id); }} style={{ padding: '4px' }}><IoTrashOutline size={16} /></button>
                                            </div>
                                        </div>
                                        <div style={{ padding: '12px 15px', background: 'rgba(0,0,0,0.1)' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {displayExs.map((e, idx) => {
                                                    let setStr = '';
                                                    if (e.sets && e.sets.length > 0) {
                                                        const validReps = e.sets.map(s => s.reps).filter(r => r);
                                                        if (validReps.length > 0 && validReps.every(r => r == validReps[0])) {
                                                            setStr = `${e.sets.length}×${validReps[0]}`;
                                                        } else {
                                                            setStr = `${e.sets.length} sets`;
                                                        }
                                                    } else if (e.defaultSets && e.defaultReps) {
                                                        setStr = `${e.defaultSets}×${e.defaultReps}`;
                                                    }
                                                    return (
                                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                                            <span style={{ color: 'var(--text-primary)' }}>{e.name}</span>
                                                            {setStr && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}> {setStr}</span>}
                                                        </div>
                                                    );
                                                })}
                                                {extraCount > 0 && (
                                                    <button type="button" onClick={() => toggleTemplateExpand(tpl._id || tpl.id)} style={{ background: 'rgba(138,43,226,0.15)', color: 'var(--accent-purple)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                                                        +{extraCount} more
                                                    </button>
                                                )}
                                                {isExpanded && tpl.exercises.length > maxShows && (
                                                    <button type="button" onClick={() => toggleTemplateExpand(tpl._id || tpl.id)} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                                                        Collapse
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ========== CARDIO TAB ========== */}
            {activeTab === 'cardio' && (
                <>
                    <form onSubmit={handleAddCardio} className={styles.cardioForm}>
                        <div className={styles.cardioFormRow}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Type</label>
                                <select className="form-select" value={cardioForm.type} onChange={(e) => setCardioForm({ ...cardioForm, type: e.target.value })}>
                                    {CARDIO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ width: '100px' }}>
                                <label className="form-label">Duration</label>
                                <input className="form-input" placeholder="30 min" value={cardioForm.duration} onChange={(e) => setCardioForm({ ...cardioForm, duration: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ width: '100px' }}>
                                <label className="form-label">Distance</label>
                                <input className="form-input" placeholder="5 km" value={cardioForm.distance} onChange={(e) => setCardioForm({ ...cardioForm, distance: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ width: '100px' }}>
                                <label className="form-label">Calories</label>
                                <input className="form-input" placeholder="300" value={cardioForm.calories} onChange={(e) => setCardioForm({ ...cardioForm, calories: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>
                                <IoAdd size={18} /> Log
                            </button>
                        </div>
                    </form>

                    {cardioEntries.length === 0 ? (
                        <div className="empty-inline">No cardio logged — fill in the form above!</div>
                    ) : (
                        <div className={styles.cardioList}>
                            {cardioEntries.map((entry) => (
                                    <div key={entry._id || entry.id} className={styles.cardioCard}>
                                        <div className={styles.cardioIcon}><IoWalk size={22} /></div>
                                        <div className={styles.cardioInfo}>
                                            <div className={styles.cardioType}>{entry.type}</div>
                                            <div className={styles.cardioMeta}>
                                                {entry.duration && <span className={styles.cardioStat}><IoTimerOutline size={14} /> {entry.duration}</span>}
                                                {entry.distance && <span className={styles.cardioStat}>📏 {entry.distance}</span>}
                                                {entry.calories && <span className={styles.cardioStat}><IoFlameOutline size={14} /> {entry.calories} cal</span>}
                                            </div>
                                        </div>
                                        <button className="btn-icon" onClick={async () => { await deleteCardioLog(entry._id || entry.id); setCardioEntries(await getCardioByDate(dateStr)); }} disabled={isFuture}><IoTrashOutline size={16} /></button>
                                    </div>
                            ))}
                            {totalCardioMins > 0 && (
                                <div className={styles.cardioSummary}>
                                    Total: <strong>{totalCardioMins} min</strong> cardio today
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ========== DIET TAB ========== */}
            {activeTab === 'diet' && (
                <>
                    <div style={{ position: 'relative' }}>
                        <MacroRings dietEntries={dietEntries} targets={userData?.dietTargets} />
                        <button 
                            onClick={() => setShowTargetModal(true)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                            title="Configure Macro Targets"
                        >
                            <IoSettingsOutline size={18} />
                        </button>
                    </div>

                    {/* AI Diet Architect Section */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(139,92,246,0.1))', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px dotted var(--accent-cyan)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                            <IoRestaurantOutline size={100} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                            <div style={{ background: 'var(--gradient-primary)', padding: '6px', borderRadius: '8px', color: 'white' }}>
                                <IoSparklesOutline size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>AI Diet Architect</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Generate personalized Indian meal plans and macro targets</p>
                            </div>
                        </div>

                        {!showDietPlan ? (
                            <form onSubmit={handleGenerateDietPlan} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label">Age</label>
                                    <input type="number" className="form-input" value={aiDietConfig.age} onChange={(e) => setAiDietConfig({...aiDietConfig, age: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Weight (kg)</label>
                                    <input type="number" className="form-input" value={aiDietConfig.weight} onChange={(e) => setAiDietConfig({...aiDietConfig, weight: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Height (cm)</label>
                                    <input type="number" className="form-input" value={aiDietConfig.height} onChange={(e) => setAiDietConfig({...aiDietConfig, height: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Goal</label>
                                    <select className="form-select" value={aiDietConfig.goal} onChange={(e) => setAiDietConfig({...aiDietConfig, goal: e.target.value})}>
                                        <option>Weight Loss</option>
                                        <option>Build Muscle</option>
                                        <option>Maintenance</option>
                                        <option>Endurance</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Activity</label>
                                    <select className="form-select" value={aiDietConfig.activity} onChange={(e) => setAiDietConfig({...aiDietConfig, activity: e.target.value})}>
                                        <option>Sedentary</option>
                                        <option>Lightly Active</option>
                                        <option>Moderately Active</option>
                                        <option>Very Active</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Preference</label>
                                    <select className="form-select" value={aiDietConfig.vegNonVeg} onChange={(e) => setAiDietConfig({...aiDietConfig, vegNonVeg: e.target.value})}>
                                        <option>Vegetarian</option>
                                        <option>Non-Vegetarian</option>
                                        <option>Vegan</option>
                                        <option>Eggetarian</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1', marginTop: '10px' }} disabled={generatingDietPlan}>
                                    {generatingDietPlan ? 'Architecting your plan...' : 'Build My Indian Diet Plan'}
                                </button>
                            </form>
                        ) : (
                            <div style={{ background: 'var(--bg-secondary)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h4 style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>Your Personalized Plan</h4>
                                    <button onClick={() => setShowDietPlan(false)} className="btn-icon"><IoCloseCircleOutline size={20} /></button>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px', textAlign: 'center' }}>
                                    {Object.entries(aiDietPlan.targets).map(([k, v]) => (
                                        <div key={k} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{k}</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{v}{k === 'calories' ? '' : 'g'}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {aiDietPlan.plan.map((meal, idx) => (
                                        <div key={idx} style={{ padding: '10px', borderLeft: '3px solid var(--accent-purple)', background: 'rgba(255,255,255,0.02)' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{meal.meal}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{meal.recommendation}</div>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={handleApplyAITargets} className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                                    Apply these targets to my tracker
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* AI Magic Logger */}
                    <div style={{ background: 'linear-gradient(145deg, var(--bg-secondary), #2a1538)', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--accent-purple)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                            ✨ AI Magic Logger
                        </div>
                        <form onSubmit={handleAIDietSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input className="form-input" placeholder="What did you eat? E.g. '3 eggs and toast'" value={dietSnapText} onChange={(e) => setDietSnapText(e.target.value)} disabled={analyzingDiet} style={{ flex: 1, border: 'none', background: 'var(--bg-card)' }} />
                            <label className="btn btn-sm" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', padding: '0 12px' }}>
                                📸 Photo
                                <input type="file" accept="image/*" onChange={(e) => handleAIDietSubmit(null, e.target.files[0])} disabled={analyzingDiet} style={{ display: 'none' }} />
                            </label>
                            <button type="submit" className="btn btn-sm" disabled={analyzingDiet || !dietSnapText} style={{ background: 'var(--accent-purple)', color: 'white' }}>
                                {analyzingDiet ? 'Analyzing...' : 'Log'}
                            </button>
                        </form>
                    </div>

                    <form onSubmit={handleAddDiet} className={styles.dietForm}>
                        <div className={styles.dietFormRow}>
                            <div className="form-group" style={{ width: '130px' }}>
                                <label className="form-label">Meal</label>
                                <select className="form-select" value={dietForm.meal} onChange={(e) => setDietForm({ ...dietForm, meal: e.target.value })}>
                                    {MEAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Food</label>
                                <input className="form-input" placeholder="e.g. Chicken breast + rice" value={dietForm.food} onChange={(e) => setDietForm({ ...dietForm, food: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ width: '90px' }}>
                                <label className="form-label">Calories</label>
                                <input className="form-input" placeholder="500" value={dietForm.calories} onChange={(e) => setDietForm({ ...dietForm, calories: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ width: '90px' }}>
                                <label className="form-label">Protein</label>
                                <input className="form-input" placeholder="40g" value={dietForm.protein} onChange={(e) => setDietForm({ ...dietForm, protein: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ width: '80px' }}>
                                <label className="form-label">Carbs</label>
                                <input className="form-input" placeholder="60g" value={dietForm.carbs} onChange={(e) => setDietForm({ ...dietForm, carbs: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ width: '70px' }}>
                                <label className="form-label">Fats</label>
                                <input className="form-input" placeholder="15g" value={dietForm.fats} onChange={(e) => setDietForm({ ...dietForm, fats: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }} disabled={isFuture}>
                                <IoAdd size={18} /> Log
                            </button>
                        </div>
                    </form>

                    {dietEntries.length === 0 ? (
                        <div className="empty-inline">No meals logged — track what you eat today!</div>
                    ) : (
                        <>
                            <div className={styles.dietList}>
                                {dietEntries.map((entry) => (
                                    <div key={entry._id || entry.id} className={styles.dietCard}>
                                        <div className={styles.dietMealBadge}>{entry.meal}</div>
                                        <div className={styles.dietInfo}>
                                            <div className={styles.dietFood}>{entry.food}</div>
                                            <div className={styles.dietMacros}>
                                                {entry.calories && <span className="badge badge-amber">{entry.calories} cal</span>}
                                                {entry.protein && <span className="badge badge-cyan">{entry.protein} protein</span>}
                                            </div>
                                        </div>
                                        <button className="btn-icon" onClick={async () => { await deleteDietLog(entry._id || entry.id); setDietEntries(await getDietByDate(dateStr)); }} disabled={isFuture}><IoTrashOutline size={16} /></button>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.dietSummary}>
                                Daily total: <strong>{totalCalories} cal</strong> · <strong>{totalProtein}g protein</strong>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ========== PHOTOS TAB ========== */}
            {activeTab === 'photos' && (
                <>
                    <div className={styles.photoUploadBanner}>
                        <div className={styles.photoUploadInfo}>
                            <h3 className={styles.photoUploadTitle}>Progress Updates</h3>
                            <p className={styles.photoUploadDesc}>Upload a photo to visually track your physique over time. Images are heavily compressed and saved to the cloud (limit 3 per day).</p>
                        </div>
                        <label className={`btn btn-primary ${uploading || isFuture || photos.filter(p => p.date === dateStr).length >= 3 ? styles.uploadingBtn : ''}`} style={isFuture || photos.filter(p => p.date === dateStr).length >= 3 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                            <IoCloudUploadOutline size={18} /> {uploading ? 'Processing...' : 'Upload Photo'}
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading || isFuture || photos.filter(p => p.date === dateStr).length >= 3} style={{ display: 'none' }} />
                        </label>
                    </div>

                    {photos.length === 0 ? (
                        <EmptyState
                            title="No progress photos"
                            message="Take your first physique update photo today. It will be securely uploaded to the cloud."
                        />
                    ) : (
                        <div className={styles.photosTimeline}>
                            {Object.entries(
                                photos.reduce((acc, p) => {
                                    if (!acc[p.date]) acc[p.date] = [];
                                    acc[p.date].push(p);
                                    return acc;
                                }, {})
                            ).sort((a, b) => b[0].localeCompare(a[0])).map(([dateKey, dailyPhotos]) => (
                                <div key={dateKey} className={styles.photoDateGroup}>
                                    <h4 className={styles.photoDateHeader}>{new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h4>
                                    <div className={styles.photoGallery}>
                                        {dailyPhotos.map((photo) => (
                                            <div key={photo._id || photo.id} className={styles.photoCard}>
                                                <img src={photo.url || photo.base64} alt={`Progress on ${photo.date}`} className={styles.photoImg} />
                                                <div className={styles.photoOverlay}>
                                                    <button className={styles.photoDeleteBtn} onClick={async () => { await deleteGymPhoto(photo._id || photo.id); await loadData(); }} disabled={isFuture}>
                                                        <IoTrashOutline size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Target Modal */}
            {showTargetModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Macro Targets</h2>
                            <button onClick={() => setShowTargetModal(false)} className="modal-close"><IoCloseCircleOutline size={24} /></button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            Manually set your daily nutrition goals. We'll use these to track your rings!
                        </p>
                        <form onSubmit={handleUpdateTargets} className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Daily Calories</label>
                                <input type="number" className="form-input" value={userData?.dietTargets?.calories} onChange={(e) => setUserData({...userData, dietTargets: {...userData.dietTargets, calories: e.target.value}})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Protein (g)</label>
                                <input type="number" className="form-input" value={userData?.dietTargets?.protein} onChange={(e) => setUserData({...userData, dietTargets: {...userData.dietTargets, protein: e.target.value}})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Carbs (g)</label>
                                <input type="number" className="form-input" value={userData?.dietTargets?.carbs} onChange={(e) => setUserData({...userData, dietTargets: {...userData.dietTargets, carbs: e.target.value}})} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fats (g)</label>
                                <input type="number" className="form-input" value={userData?.dietTargets?.fats} onChange={(e) => setUserData({...userData, dietTargets: {...userData.dietTargets, fats: e.target.value}})} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Save Targets</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
