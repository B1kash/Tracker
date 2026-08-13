'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    IoAdd, IoTrashOutline, IoCheckmarkSharp, IoAddCircleOutline, IoCloseCircleOutline,
    IoBarbell, IoWalk, IoFastFoodOutline, IoFlameOutline, IoTimerOutline, IoImageOutline, IoCloudUploadOutline,
    IoListOutline, IoSaveOutline, IoCheckmarkDoneOutline, IoRepeatOutline, IoCopyOutline
} from 'react-icons/io5';
import EmptyState from '@/components/EmptyState';
import {
    getWorkoutByDate, addExerciseToDate, removeExerciseFromDate, updateExerciseSets, getGymWorkouts, saveWorkoutForDate,
    getCardioByDate, addCardioLog, deleteCardioLog,
    getDietByDate, addDietLog, deleteDietLog,
    getGymPhotos, addGymPhoto, deleteGymPhoto,
    getWorkoutTemplates, createWorkoutTemplate, deleteWorkoutTemplate,
    generateWorkoutTemplateWithAI, generateDailyRoutineWithAI, analyzeDietWithAI,
    updateDietTargets, generateDietPlanWithAI, getMe, addXP
} from '@/lib/storage';
import { triggerGamificationUpdate } from '@/lib/events';
import { IoSettingsOutline, IoSparklesOutline, IoRestaurantOutline, IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';
import { compressImage } from './Compressor';
import OneRMChart from '@/components/OneRMChart';
import MacroRings from '@/components/MacroRings';
import PageSkeleton from '@/components/PageSkeleton';
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

function SwipeToLogSet({ completed, onToggle, disabled }) {
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef(null);

    const handleStart = () => {
        if (disabled) return;
        setIsDragging(true);
    };

    const handleMove = (e) => {
        if (!isDragging || !trackRef.current || disabled) return;
        const rect = trackRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const offset = Math.max(0, Math.min(clientX - rect.left - 16, rect.width - 36));
        setDragX(offset);
    };

    const handleEnd = () => {
        if (!isDragging || !trackRef.current || disabled) return;
        setIsDragging(false);
        const rect = trackRef.current.getBoundingClientRect();
        const maxDrag = rect.width - 36;
        if (dragX > maxDrag * 0.55) {
            if (typeof window !== 'undefined' && window.navigator?.vibrate) {
                window.navigator.vibrate(40);
            }
            onToggle();
        }
        setDragX(0);
    };

    return (
        <div 
            ref={trackRef} 
            className={`${styles.swipeTrack} ${completed ? styles.swipeTrackDone : ''}`}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onClick={() => {
                if (!isDragging) onToggle();
            }}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
            <div 
                className={styles.swipeFill} 
                style={{ width: completed ? '100%' : `${dragX + 18}px`, transition: isDragging ? 'none' : 'width 0.2s ease' }} 
            />
            <span className={styles.swipeText}>
                {completed ? '✓ Logged' : 'Swipe to log →'}
            </span>
            <div 
                className={styles.swipeThumb}
                style={{ 
                    left: completed ? 'calc(100% - 34px)' : `${dragX + 2}px`,
                    transition: isDragging ? 'none' : 'left 0.2s ease',
                    background: completed ? 'var(--accent-emerald)' : 'white',
                    color: completed ? 'white' : 'var(--bg-primary)'
                }}
            >
                {completed ? <IoCheckmarkSharp size={16} /> : <IoCheckmarkDoneOutline size={16} />}
            </div>
        </div>
    );
}

function NumberPickerModal({ pickerState, onClose, onSave }) {
    const [localValue, setLocalValue] = useState(0);

    useEffect(() => {
        if (pickerState) {
            setLocalValue(pickerState.value === '' || pickerState.value === undefined ? 0 : Number(pickerState.value));
        }
    }, [pickerState]);

    if (!pickerState) return null;
    const isWeight = pickerState.field === 'weight';
    const presets = isWeight 
        ? [0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200]
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30];

    const currentVal = localValue;

    const updateVal = (newVal) => {
        const stepVal = Math.max(0, newVal);
        const formatted = isWeight ? (stepVal % 1 === 0 ? stepVal.toString() : stepVal.toFixed(1)) : Math.round(stepVal);
        setLocalValue(stepVal);
        onSave(pickerState.exId, pickerState.setId, pickerState.field, formatted);
    };

    return (
        <div className={styles.pickerOverlay} onClick={onClose}>
            <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.pickerHeader}>
                    <div className={styles.pickerTitle}>
                        {isWeight ? '🏋️ Weight Selector' : '🔢 Reps Selector'}
                    </div>
                    <button type="button" className="btn-icon" onClick={onClose}><IoCloseCircleOutline size={22} /></button>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{pickerState.title}</div>
                
                <div className={styles.pickerDisplay}>
                    <button type="button" className={styles.stepperBtn} style={{ width: '42px', height: '42px', fontSize: '1.3rem' }} onClick={() => updateVal(currentVal - (isWeight ? 2.5 : 1))}>-</button>
                    <div className={styles.pickerValue}>
                        {currentVal} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{isWeight ? 'kg' : 'reps'}</span>
                    </div>
                    <button type="button" className={styles.stepperBtn} style={{ width: '42px', height: '42px', fontSize: '1.3rem' }} onClick={() => updateVal(currentVal + (isWeight ? 2.5 : 1))}>+</button>
                </div>

                <div className={styles.pickerGrid}>
                    {presets.map((val) => {
                        const isActive = localValue === val;
                        return (
                            <button
                                type="button"
                                key={val}
                                className={`${styles.pickerChip} ${isActive ? styles.pickerChipActive : ''}`}
                                onClick={() => updateVal(val)}
                            >
                                {val} {isWeight && val > 0 ? 'kg' : ''}
                            </button>
                        );
                    })}
                </div>

                <button type="button" className="btn btn-primary" onClick={onClose} style={{ width: '100%', marginTop: '8px' }}>
                    Done
                </button>
            </div>
        </div>
    );
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
    const [aiRoutinePrompt, setAiRoutinePrompt] = useState('');
    const [generatingRoutine, setGeneratingRoutine] = useState(false);
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
    
    const [timerEnabled, setTimerEnabled] = useState(true);
    const [pickerState, setPickerState] = useState(null);
    const [collapsedExercises, setCollapsedExercises] = useState(new Set());

    const toggleExerciseCollapse = (id) => {
        setCollapsedExercises((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

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
    // Diet form
    const [dietForm, setDietForm] = useState({ meal: 'Breakfast', food: '', calories: '', protein: '', carbs: '', fats: '', notes: '' });

    const [selectedImage, setSelectedImage] = useState(null);

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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: body ? JSON.stringify(body) : null
        });
        return res.json();
    }

    useEffect(() => {
        loadData().then(() => setMounted(true));
        setTimerEnabled(localStorage.getItem('restTimerEnabled') !== 'false');
    }, [loadData]);

    if (!mounted) return <PageSkeleton type="dashboard" />;

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
        
        // Validation: require weight and reps before marking complete
        if (!targetSet?.completed) {
            if (targetSet.weight === '' || targetSet.weight === undefined) {
                alert('Please enter a weight before logging the set. (Enter 0 for bodyweight)');
                return;
            }
            if (!targetSet.reps || targetSet.reps <= 0) {
                alert('Please enter the number of reps before logging the set.');
                return;
            }
        }

        const willBeCompleted = !(targetSet?.completed);
        const newSets = ex.sets.map((s) => (s._id || s.id) === setId ? { ...s, completed: !s.completed } : s);
        setWorkout(prev => ({ ...prev, exercises: prev.exercises.map(e => (e._id || e.id) === exId ? { ...e, sets: newSets } : e) }));

        if (setDebounceTimer.current) clearTimeout(setDebounceTimer.current);
        await updateExerciseSets(dateStr, exId, newSets);

        // Manage XP instantly 
        if (willBeCompleted) {
            await addXP(15); // +15 XP per set
        } else {
            await addXP(-15);
        }

        // Trigger rest timer popup when completing a set
        if (willBeCompleted && typeof window !== 'undefined') {
            window.dispatchEvent(new Event('start_rest_timer'));
        }
    };

    const handleCloneSet = async (exId, setIndex) => {
        if (!workout) return;
        const ex = exercises.find((e) => (e._id || e.id) === exId);
        if (!ex) return;
        const setToClone = ex.sets[setIndex];
        const newSet = { reps: setToClone.reps, weight: setToClone.weight, completed: false, _id: mockObjectId() };
        const newSets = [...ex.sets];
        newSets.splice(setIndex + 1, 0, newSet);
        
        setWorkout(prev => ({ ...prev, exercises: prev.exercises.map(e => (e._id || e.id) === exId ? { ...e, sets: newSets } : e) }));
        
        if (setDebounceTimer.current) clearTimeout(setDebounceTimer.current);
        setDebounceTimer.current = setTimeout(async () => {
            await updateExerciseSets(dateStr, exId, newSets);
        }, 750);
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
        await addXP(50); // +50 XP for doing Cardio
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
        await addXP(20); // +20 XP for logging a Meal
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

    const handleGenerateDailyRoutine = async (e) => {
        if (e) e.preventDefault();
        if (!aiRoutinePrompt.trim()) return;
        setGeneratingRoutine(true);
        try {
            await generateDailyRoutineWithAI(aiRoutinePrompt, dateStr);
            setAiRoutinePrompt('');
            setWorkout(await getWorkoutByDate(dateStr));
        } catch (err) {
            alert('Failed to generate today\'s routine.');
        }
        setGeneratingRoutine(false);
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

    const lastPastWorkout = allWorkouts
        .filter(w => w.date < dateStr && w.exercises && w.exercises.length > 0)
        .sort((a, b) => b.date.localeCompare(a.date))[0];

    const handleCopyForward = async (pastSession) => {
        if (isFuture || !pastSession) return;
        const clonedExercises = pastSession.exercises.map(ex => ({
            name: ex.name,
            sets: ex.sets.map(s => ({
                reps: s.reps || 0,
                weight: s.weight || '',
                completed: false,
                _id: mockObjectId()
            })),
            _id: mockObjectId()
        }));

        setWorkout({ exercises: clonedExercises, date: dateStr });
        await saveWorkoutForDate(dateStr, clonedExercises);
        setWorkout(await getWorkoutByDate(dateStr));
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
                    
                    {/* AI Daily Routine Generator */}
                    <div className={styles.aiRoutineBox}>
                        <div className={styles.aiRoutineHeader}>
                            ✨ Auto-Build Today's Routine
                        </div>
                        <form onSubmit={handleGenerateDailyRoutine} className={styles.aiRoutineForm}>
                            <input className="form-input" placeholder="e.g. 'I only have 30 mins and dumbbells'" value={aiRoutinePrompt} onChange={(e) => setAiRoutinePrompt(e.target.value)} disabled={generatingRoutine || isFuture} required />
                            <button type="submit" className="btn btn-sm" disabled={generatingRoutine || isFuture}>
                                {generatingRoutine ? 'Thinking...' : 'Generate Plan'}
                            </button>
                        </form>
                    </div>

                    <form onSubmit={handleAddExercise} className={styles.quickAdd}>
                        <input className="form-input" placeholder="Add exercise (e.g. Bench Press, Squats...)" value={newExercise} onChange={(e) => setNewExercise(e.target.value)} disabled={isFuture} />
                        <button type="submit" className="btn btn-primary btn-sm" disabled={isFuture}><IoAdd size={18} /> Add</button>
                    </form>
                    {/* Copy-Forward Previous Routine Banner */}
                    {exercises.length === 0 && lastPastWorkout && (
                        <div className={styles.copyForwardBanner}>
                            <div className={styles.copyForwardInfo}>
                                <span className={styles.copyForwardBadge}>⚡ Copy-Forward Routine</span>
                                <h4 className={styles.copyForwardTitle}>
                                    Duplicate session from {new Date(lastPastWorkout.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </h4>
                                <p className={styles.copyForwardSub}>
                                    {lastPastWorkout.exercises.map(e => e.name).join(' · ')}
                                </p>
                            </div>
                            <button 
                                type="button"
                                className="btn btn-primary btn-sm" 
                                onClick={() => handleCopyForward(lastPastWorkout)}
                                disabled={isFuture}
                                style={{ whiteSpace: 'nowrap', gap: '6px' }}
                            >
                                <IoRepeatOutline size={16} /> Copy Routine & Pre-fill
                            </button>
                        </div>
                    )}

                    {exercises.length === 0 ? (
                        <div className="empty-inline">No exercises logged — type above or copy your previous routine!</div>
                    ) : (
                        <div className={styles.exerciseList}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                                <label className={styles.restTimerToggle}>
                                    <input type="checkbox" checked={timerEnabled} onChange={(e) => {
                                        const val = e.target.checked;
                                        setTimerEnabled(val);
                                        localStorage.setItem('restTimerEnabled', val);
                                    }} style={{ accentColor: 'var(--accent-purple)' }} />
                                    Auto Rest Timer
                                </label>
                            </div>
                            {exercises.map((ex) => {
                                const isCollapsed = collapsedExercises.has(ex._id || ex.id);
                                const totalExSets = ex.sets.length;
                                const loggedExSets = ex.sets.filter(s => s.completed).length;
                                const allLogged = totalExSets > 0 && loggedExSets === totalExSets;

                                return (
                                <div key={ex._id || ex.id} className="exercise-block">
                                    <div className={`exercise-header ${styles.exerciseHeaderInteractive}`} onClick={() => toggleExerciseCollapse(ex._id || ex.id)}>
                                        <div className={styles.exerciseHeaderTopRow}>
                                            <h3 className="exercise-name">{ex.name}</h3>
                                            <div className={styles.exerciseHeaderTopRight}>
                                                <span className={styles.exerciseSummary}>
                                                    {totalExSets} sets {isCollapsed && <span>· <span className={allLogged ? styles.textEmerald : ''}>{loggedExSets}/{totalExSets} logged</span></span>}
                                                </span>
                                                <button type="button" className="btn-icon" style={{ padding: '2px', margin: 0, opacity: 0.8 }} title={isCollapsed ? "Expand" : "Collapse"}>
                                                    {isCollapsed ? <IoChevronDownOutline size={18} /> : <IoChevronUpOutline size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className={`exercise-actions ${styles.exerciseActions}`} onClick={(e) => e.stopPropagation()}>
                                            <button className="btn-ghost" onClick={() => handleAddSet(ex._id || ex.id)} disabled={isFuture}><IoAddCircleOutline size={16} /> Add Set</button>
                                            <button className="btn-icon" onClick={() => handleRemoveExercise(ex._id || ex.id)} disabled={isFuture}><IoTrashOutline size={18} /></button>
                                        </div>
                                    </div>
                                    {!isCollapsed && ex.sets.length > 0 && (
                                        <div className={styles.tableWrapper}>
                                            <table className="sets-table">
                                                <thead>
                                                    <tr>
                                                        <th className={styles.thSet}>Set</th>
                                                        <th className={styles.thReps}>Reps</th>
                                                        <th className={styles.thWeight}>Weight (kg)</th>
                                                        <th className={styles.thSwipe}>Swipe to Log</th>
                                                        <th className={styles.thDelete}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {ex.sets.map((set, idx) => (
                                                        <tr key={set._id || set.id}>
                                                            <td><span className={styles.setNumber}>{idx + 1}</span></td>
                                                            <td>
                                                                <div className={styles.stepperContainer}>
                                                                    <button type="button" className={styles.stepperBtn} onClick={() => handleSetChange(ex._id || ex.id, set._id || set.id, 'reps', Math.max(0, (parseInt(set.reps) || 0) - 1))} disabled={isFuture}>-</button>
                                                                    <button type="button" className={styles.valueBtn} onClick={() => setPickerState({ exId: ex._id || ex.id, setId: set._id || set.id, field: 'reps', value: set.reps, title: `${ex.name} - Set ${idx + 1}` })} disabled={isFuture}>
                                                                        {set.reps !== '' && set.reps !== undefined ? set.reps : '0'}
                                                                    </button>
                                                                    <button type="button" className={styles.stepperBtn} onClick={() => handleSetChange(ex._id || ex.id, set._id || set.id, 'reps', (parseInt(set.reps) || 0) + 1)} disabled={isFuture}>+</button>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className={styles.stepperContainer}>
                                                                    <button type="button" className={styles.stepperBtn} onClick={() => handleSetChange(ex._id || ex.id, set._id || set.id, 'weight', Math.max(0, (parseFloat(set.weight) || 0) - 2.5))} disabled={isFuture}>-2.5</button>
                                                                    <button type="button" className={styles.valueBtn} onClick={() => setPickerState({ exId: ex._id || ex.id, setId: set._id || set.id, field: 'weight', value: set.weight, title: `${ex.name} - Set ${idx + 1}` })} disabled={isFuture}>
                                                                        {set.weight !== '' && set.weight !== undefined ? `${set.weight} kg` : '0 kg'}
                                                                    </button>
                                                                    <button type="button" className={styles.stepperBtn} onClick={() => handleSetChange(ex._id || ex.id, set._id || set.id, 'weight', (parseFloat(set.weight) || 0) + 2.5)} disabled={isFuture}>+2.5</button>
                                                                    <button type="button" className={styles.stepperBtn} onClick={() => handleSetChange(ex._id || ex.id, set._id || set.id, 'weight', (parseFloat(set.weight) || 0) + 5)} disabled={isFuture}>+5</button>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <SwipeToLogSet 
                                                                    completed={set.completed} 
                                                                    onToggle={() => handleToggleSet(ex._id || ex.id, set._id || set.id)}
                                                                    disabled={isFuture} 
                                                                />
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <div className={styles.setActionsDesktop}>
                                                                    <button type="button" className="btn-icon" onClick={() => handleCloneSet(ex._id || ex.id, idx)} disabled={isFuture} title="Clone set"><IoCopyOutline size={18} /></button>
                                                                    <button type="button" className="btn-icon" onClick={() => handleRemoveSet(ex._id || ex.id, set._id || set.id)} disabled={isFuture} title="Delete set"><IoTrashOutline size={18} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ========== TEMPLATES TAB ========== */}
            {activeTab === 'templates' && (
                <>
                    <h3 className={styles.sectionTitle}>Workout Templates</h3>
                    <p className={styles.sectionSubtitle}>Load a saved routine, or save today's workout as a new template.</p>
                    
                    <div className={styles.templateGrid}>
                        {/* Save Current Workout */}
                        <form onSubmit={handleSaveTemplate} className={styles.saveTemplateForm}>
                            <div className={styles.saveTemplateHeader}>
                                <div className={styles.saveTemplateIcon}><IoSaveOutline size={18} /></div>
                                Save Current Workout
                            </div>
                            <input className="form-input" placeholder="e.g. Push Day A" value={templateName} onChange={(e) => setTemplateName(e.target.value)} disabled={exercises.length === 0} required />
                            <button type="submit" className="btn btn-sm" disabled={exercises.length === 0}>
                                Save Layout
                            </button>
                        </form>

                        {/* AI Auto-Generator */}
                        <form onSubmit={handleGenerateTemplate} className={styles.aiTemplateForm}>
                            <div className={styles.aiTemplateGlow}></div>
                            
                            <div className={styles.aiTemplateHeader}>
                                <div className={styles.aiTemplateIcon}><IoSparklesOutline size={18} /></div>
                                AI Auto-Generator
                            </div>
                            <input className="form-input" placeholder="e.g. '4-day upper body split'" value={aiTemplatePrompt} onChange={(e) => setAiTemplatePrompt(e.target.value)} disabled={generatingTemplate} required />
                            <button type="submit" className="btn btn-sm" disabled={generatingTemplate}>
                                {generatingTemplate ? 'Thinking...' : 'Generate New Routine'}
                            </button>
                        </form>
                    </div>

                    {templates.length === 0 ? (
                        <div className="empty-inline">No templates saved yet. Create your workout then save it here!</div>
                    ) : (
                        <div className={styles.templateListGrid}>
                            {templates.map((tpl) => {
                                const isAI = tpl.name.includes('(AI Generated)');
                                const cleanName = tpl.name.replace('(AI Generated)', '').trim();
                                const isExpanded = expandedTemplates.has(tpl._id || tpl.id);
                                const maxShows = 4;
                                const displayExs = isExpanded ? tpl.exercises : tpl.exercises.slice(0, maxShows);
                                const extraCount = !isExpanded && tpl.exercises.length > maxShows ? tpl.exercises.length - maxShows : 0;

                                return (
                                    <div key={tpl._id} className={`${styles.templateCard} ${isAI ? styles.templateCardAI : ''}`}>
                                        <div className={`${styles.templateCardHeader} ${isAI ? styles.templateCardHeaderAI : ''}`}>
                                            <div className={styles.templateCardTitleBlock}>
                                                <div className={styles.templateCardTitleRow}>
                                                    {isAI ? <span style={{ fontSize: '1.1rem' }}>✨</span> : <IoListOutline size={18} style={{ color: 'var(--accent-cyan)' }} />}
                                                    <span className={styles.templateCardTitle}>{cleanName}</span>
                                                </div>
                                                <div className={styles.templateCardCount}>{tpl.exercises.length} Exercises</div>
                                            </div>
                                            <div className={styles.templateCardActions}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleApplyTemplate(tpl)} disabled={isFuture}>Apply</button>
                                                <button type="button" className="btn-icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteTemplate(tpl._id || tpl.id); }}><IoTrashOutline size={16} /></button>
                                            </div>
                                        </div>
                                        <div className={styles.templateCardBody}>
                                            <div className={styles.templateCardTags}>
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
                                                        <div key={idx} className={styles.templateCardTag}>
                                                            <span className={styles.templateCardTagName}>{e.name}</span>
                                                            {setStr && <span className={styles.templateCardTagSets}> {setStr}</span>}
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
                            <div className={`form-group ${styles.formGroupFlex}`}>
                                <label className="form-label">Type</label>
                                <select className="form-select" value={cardioForm.type} onChange={(e) => setCardioForm({ ...cardioForm, type: e.target.value })}>
                                    {CARDIO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className={`form-group ${styles.formGroupSmall}`}>
                                <label className="form-label">Duration</label>
                                <input className="form-input" placeholder="30 min" value={cardioForm.duration} onChange={(e) => setCardioForm({ ...cardioForm, duration: e.target.value })} />
                            </div>
                            <div className={`form-group ${styles.formGroupSmall}`}>
                                <label className="form-label">Distance</label>
                                <input className="form-input" placeholder="5 km" value={cardioForm.distance} onChange={(e) => setCardioForm({ ...cardioForm, distance: e.target.value })} />
                            </div>
                            <div className={`form-group ${styles.formGroupSmall}`}>
                                <label className="form-label">Calories</label>
                                <input className="form-input" placeholder="300" value={cardioForm.calories} onChange={(e) => setCardioForm({ ...cardioForm, calories: e.target.value })} />
                            </div>
                            <button type="submit" className={`btn btn-primary btn-sm ${styles.formSubmitBtn}`}>
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
                    <div className={styles.aiDietArchitectBox}>
                        <div className={styles.aiDietArchitectLogo}>
                            <IoRestaurantOutline size={100} />
                        </div>
                        <div className={styles.aiDietArchitectHeader}>
                            <div className={styles.aiDietArchitectIcon}>
                                <IoSparklesOutline size={20} />
                            </div>
                            <div>
                                <h3 className={styles.aiDietArchitectTitle}>AI Diet Architect</h3>
                                <p className={styles.aiDietArchitectSub}>Generate personalized Indian meal plans and macro targets</p>
                            </div>
                        </div>

                        {!showDietPlan ? (
                            <form onSubmit={handleGenerateDietPlan} className={styles.aiDietForm}>
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
                            <div className={styles.aiDietPlanBox}>
                                <div className={styles.aiDietPlanHeader}>
                                    <h4 className={styles.aiDietPlanTitle}>Your Personalized Plan</h4>
                                    <button onClick={() => setShowDietPlan(false)} className="btn-icon"><IoCloseCircleOutline size={20} /></button>
                                </div>
                                
                                <div className={styles.aiDietTargetsGrid}>
                                    {Object.entries(aiDietPlan.targets).map(([k, v]) => (
                                        <div key={k} className={styles.aiDietTargetCard}>
                                            <div className={styles.aiDietTargetLabel}>{k}</div>
                                            <div className={styles.aiDietTargetVal}>{v}{k === 'calories' ? '' : 'g'}</div>
                                        </div>
                                    ))}
                                </div>
 
                                <div className={styles.aiDietMeals}>
                                    {aiDietPlan.plan.map((meal, idx) => (
                                        <div key={idx} className={styles.aiDietMealRow}>
                                            <div className={styles.aiDietMealName}>{meal.meal}</div>
                                            <div className={styles.aiDietMealRec}>{meal.recommendation}</div>
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
                    <div className={styles.aiLoggerBox}>
                        <div className={styles.aiLoggerTitle}>
                            ✨ AI Magic Logger
                        </div>
                        <form onSubmit={handleAIDietSubmit} className={styles.aiLoggerForm}>
                            <input className={`form-input ${styles.aiLoggerInput}`} placeholder="What did you eat? E.g. '3 eggs and toast'" value={dietSnapText} onChange={(e) => setDietSnapText(e.target.value)} disabled={analyzingDiet} required />
                            <div className={styles.aiLoggerButtons}>
                                <label className={styles.aiLoggerPhotoBtn}>
                                    📸 Photo
                                    <input type="file" accept="image/*" onChange={(e) => handleAIDietSubmit(null, e.target.files[0])} disabled={analyzingDiet} style={{ display: 'none' }} />
                                </label>
                                <button type="submit" className={`btn btn-sm ${styles.aiLoggerSubmitBtn}`} disabled={analyzingDiet || !dietSnapText}>
                                    {analyzingDiet ? 'Analyzing...' : 'Log'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <form onSubmit={handleAddDiet} className={styles.dietForm}>
                        <div className={styles.dietFormRow}>
                            <div className={`form-group ${styles.formGroupMedium}`}>
                                <label className="form-label">Meal</label>
                                <select className="form-select" value={dietForm.meal} onChange={(e) => setDietForm({ ...dietForm, meal: e.target.value })}>
                                    {MEAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className={`form-group ${styles.formGroupFlex}`}>
                                <label className="form-label">Food</label>
                                <input className="form-input" placeholder="e.g. Chicken breast + rice" value={dietForm.food} onChange={(e) => setDietForm({ ...dietForm, food: e.target.value })} required />
                            </div>
                            <div className={`form-group ${styles.formGroupSmall}`}>
                                <label className="form-label">Calories</label>
                                <input className="form-input" placeholder="500" value={dietForm.calories} onChange={(e) => setDietForm({ ...dietForm, calories: e.target.value })} />
                            </div>
                            <div className={`form-group ${styles.formGroupSmall}`}>
                                <label className="form-label">Protein</label>
                                <input className="form-input" placeholder="40g" value={dietForm.protein} onChange={(e) => setDietForm({ ...dietForm, protein: e.target.value })} />
                            </div>
                            <div className={`form-group ${styles.formGroupTiny}`}>
                                <label className="form-label">Carbs</label>
                                <input className="form-input" placeholder="60g" value={dietForm.carbs} onChange={(e) => setDietForm({ ...dietForm, carbs: e.target.value })} />
                            </div>
                            <div className={`form-group ${styles.formGroupTiny}`}>
                                <label className="form-label">Fats</label>
                                <input className="form-input" placeholder="15g" value={dietForm.fats} onChange={(e) => setDietForm({ ...dietForm, fats: e.target.value })} />
                            </div>
                            <button type="submit" className={`btn btn-primary btn-sm ${styles.formSubmitBtn}`} disabled={isFuture}>
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
                    {/* Minimalist Photos Timeline */}
                    {(() => {
                        const grouped = photos.reduce((acc, p) => {
                            if (!acc[p.date]) acc[p.date] = [];
                            acc[p.date].push(p);
                            return acc;
                        }, {});
                        
                        // Force the actively selected date to appear so user has an upload bucket
                        if (!grouped[dateStr]) grouped[dateStr] = [];

                        return (
                            <div className={styles.photosTimeline}>
                                {Object.entries(grouped)
                                    .sort((a, b) => b[0].localeCompare(a[0]))
                                    .map(([dateKey, dailyPhotos]) => (
                                        <div key={dateKey} className={styles.photoDateGroup}>
                                            <div className={styles.photoDateHeaderWrapper}>
                                                <h4 className={styles.photoDateHeader}>
                                                    {new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                </h4>
                                                
                                                {/* Inline Upload Button for selected date */}
                                                {dateKey === dateStr && !isFuture && dailyPhotos.length < 3 && (
                                                    <label className={styles.photoAddBtn} style={{ opacity: uploading ? 0.5 : 1 }}>
                                                        {uploading ? <div className="spinner-border text-light" style={{ width: '1rem', height: '1rem', borderWidth: '0.15em' }} /> : <IoAdd size={20} />}
                                                        <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} style={{ display: 'none' }} />
                                                    </label>
                                                )}
                                            </div>

                                            {dailyPhotos.length === 0 ? (
                                                <div className={styles.photoEmptyState}>
                                                    <IoImageOutline size={32} color="#334155" />
                                                    <p style={{ margin: 0 }}>{isFuture ? 'No photos for future dates' : 'No photos yet for this layout'}</p>
                                                </div>
                                            ) : (
                                                <div className={styles.photoGallery}>
                                                    {dailyPhotos.map((photo) => (
                                                        <div key={photo._id || photo.id} className={styles.photoCard}>
                                                            <img 
                                                              src={photo.url || photo.base64} 
                                                              alt={`Progress on ${photo.date}`} 
                                                              className={styles.photoImg} 
                                                              onClick={() => setSelectedImage(photo.url || photo.base64)}
                                                              style={{ cursor: 'pointer' }}
                                                            />
                                                            <div className={styles.photoOverlay}>
                                                                <button className={styles.photoDeleteBtn} onClick={async () => { await deleteGymPhoto(photo._id || photo.id); await loadData(); }} disabled={isFuture}>
                                                                    <IoTrashOutline size={16} color="#e2e8f0" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        );
                    })()}
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
            {/* Selected Image Fullscreen Modal */}
            {selectedImage && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
                    <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 10000, width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IoCloseCircleOutline size={32} />
                    </button>
                    <img src={selectedImage} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} alt="Enlarged Progress" />
                </div>
            )}
            {/* Touch Number Picker Modal */}
            <NumberPickerModal 
                pickerState={pickerState} 
                onClose={() => setPickerState(null)} 
                onSave={(exId, setId, field, val) => handleSetChange(exId, setId, field, val)} 
            />
        </div>
    );
}
