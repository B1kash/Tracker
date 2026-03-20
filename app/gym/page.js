'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    IoAdd, IoTrashOutline, IoCheckmarkSharp, IoAddCircleOutline, IoCloseCircleOutline,
    IoBarbell, IoWalk, IoFastFoodOutline, IoFlameOutline, IoTimerOutline, IoImageOutline, IoCloudUploadOutline
} from 'react-icons/io5';
import EmptyState from '@/components/EmptyState';
import {
    getWorkoutByDate, addExerciseToDate, removeExerciseFromDate, updateExerciseSets, getGymWorkouts,
    getCardioByDate, addCardioLog, deleteCardioLog,
    getDietByDate, addDietLog, deleteDietLog,
    getGymPhotos, addGymPhoto, deleteGymPhoto
} from '@/lib/storage';
import { triggerGamificationUpdate } from '@/lib/events';
import { compressImage } from './Compressor';
import OneRMChart from '@/components/OneRMChart';
import MacroRings from '@/components/MacroRings';
import styles from './page.module.css';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TABS = [
    { id: 'exercises', label: 'Exercises', icon: IoBarbell },
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
    const [mounted, setMounted] = useState(false);
    const [uploading, setUploading] = useState(false);
    const setDebounceTimer = useRef(null);

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
        setCardioEntries(getCardioByDate(dateStr));
        setDietEntries(getDietByDate(dateStr));
        setPhotos(await getGymPhotos());
    }, [dateStr]);

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
    const handleAddCardio = (e) => {
        e.preventDefault();
        if (!cardioForm.duration) return;
        addCardioLog({ ...cardioForm, date: dateStr, completed: true });
        setCardioForm({ type: 'Running', duration: '', distance: '', calories: '' });
        setCardioEntries(getCardioByDate(dateStr));
    };

    // === DIET HANDLERS ===
    const handleAddDiet = (e) => {
        e.preventDefault();
        if (!dietForm.food) return;
        addDietLog({ ...dietForm, date: dateStr });
        setDietForm({ meal: 'Breakfast', food: '', calories: '', protein: '', carbs: '', fats: '', notes: '' });
        setDietEntries(getDietByDate(dateStr));
    };

    // === PHOTOS HANDLERS ===
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
                                <div key={entry.id} className={styles.cardioCard}>
                                    <div className={styles.cardioIcon}><IoWalk size={22} /></div>
                                    <div className={styles.cardioInfo}>
                                        <div className={styles.cardioType}>{entry.type}</div>
                                        <div className={styles.cardioMeta}>
                                            {entry.duration && <span className={styles.cardioStat}><IoTimerOutline size={14} /> {entry.duration}</span>}
                                            {entry.distance && <span className={styles.cardioStat}>📏 {entry.distance}</span>}
                                            {entry.calories && <span className={styles.cardioStat}><IoFlameOutline size={14} /> {entry.calories} cal</span>}
                                        </div>
                                    </div>
                                    <button className="btn-icon" onClick={() => { deleteCardioLog(entry.id); setCardioEntries(getCardioByDate(dateStr)); }} disabled={isFuture}><IoTrashOutline size={16} /></button>
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
                    <MacroRings dietEntries={dietEntries} />
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
                                    <div key={entry.id} className={styles.dietCard}>
                                        <div className={styles.dietMealBadge}>{entry.meal}</div>
                                        <div className={styles.dietInfo}>
                                            <div className={styles.dietFood}>{entry.food}</div>
                                            <div className={styles.dietMacros}>
                                                {entry.calories && <span className="badge badge-amber">{entry.calories} cal</span>}
                                                {entry.protein && <span className="badge badge-cyan">{entry.protein} protein</span>}
                                            </div>
                                        </div>
                                        <button className="btn-icon" onClick={() => { deleteDietLog(entry.id); setDietEntries(getDietByDate(dateStr)); }} disabled={isFuture}><IoTrashOutline size={16} /></button>
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
                            <p className={styles.photoUploadDesc}>Upload a photo to visually track your physique over time. Images are heavily compressed and saved locally.</p>
                        </div>
                        <label className={`btn btn-primary ${uploading || isFuture ? styles.uploadingBtn : ''}`} style={isFuture ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                            <IoCloudUploadOutline size={18} /> {uploading ? 'Processing...' : 'Upload Photo'}
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading || isFuture} style={{ display: 'none' }} />
                        </label>
                    </div>

                    {photos.length === 0 ? (
                        <EmptyState
                            title="No progress photos"
                            message="Take your first physique update photo today. Don't worry, it stays purely local on your device."
                        />
                    ) : (
                        <div className={styles.photoGallery}>
                            {photos.slice().reverse().map((photo) => (
                                <div key={photo._id || photo.id} className={styles.photoCard}>
                                    <img src={photo.base64} alt={`Progress on ${photo.date}`} className={styles.photoImg} />
                                    <div className={styles.photoOverlay}>
                                        <div className={styles.photoDateBadge}>{photo.date}</div>
                                        <button className={styles.photoDeleteBtn} onClick={async () => { await deleteGymPhoto(photo._id || photo.id); loadData(); }} disabled={isFuture}>
                                            <IoTrashOutline size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
