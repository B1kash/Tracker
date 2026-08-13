'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const STEPS = 8;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // State for all onboarding data
  const [formData, setFormData] = useState({
    profile: {
      age: '',
      gender: '',
      height: '',
      targetWeight: '',
      unitPreference: 'kg/cm',
      country: '',
      activityLevel: 'Sedentary',
      fitnessExperience: 'Beginner',
      trainingDaysPerWeek: 3,
      preferredWorkoutDuration: '45-60 min',
      workoutLocation: 'Gym',
      equipment: [],
      trainingPreferences: {
        preferredStyle: '',
        exercisesEnjoyed: [],
        exercisesDisliked: [],
        muscleGroupsPriority: [],
        cardioPreference: ''
      },
      nutritionPreferences: {
        dietaryPreference: 'No restriction',
        allergies: [],
        foodsAvoided: [],
        favoriteFoods: [],
        mealsPerDay: 3,
        cookingPreference: 'Mostly home cooked',
        budget: 'Medium'
      },
      lifestyle: {
        dailySteps: 5000,
        sleepDuration: '7-8 hours',
        stressLevel: 'Moderate',
        sittingTime: '8 hours'
      },
      limitations: []
    },
    goal: {
      title: 'Lose Weight',
      description: 'Get leaner and fitter',
      type: 'Weight Loss',
      startingValue: '',
      targetValue: '',
      unit: 'kg'
    }
  });

  const handleNext = async () => {
    if (step < STEPS) {
      setStep(step + 1);
    } else {
      // Submit data
      try {
        const token = localStorage.getItem('jwt_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/api/onboarding`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          // Kick off initial AI plan generation in the background or redirect to a loading state
          await fetch(`${apiUrl}/api/ai/generate-plan`, {
            method: 'POST',
            headers
          });
          
          router.push('/');
        } else {
          console.error("Failed to submit onboarding");
        }
      } catch (err) {
        console.error("Error submitting onboarding:", err);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateProfile = (field, value) => {
    setFormData(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  const updateGoal = (field, value) => {
    setFormData(prev => ({
      ...prev,
      goal: { ...prev.goal, [field]: value }
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Basic Information</h1>
              <p className={styles.subtitle}>Let's get to know you better</p>
            </div>
            <div className={styles.gridOptions} style={{marginBottom: '20px'}}>
               <div className={styles.formGroup}>
                <label className={styles.label}>Age</label>
                <input type="number" className={styles.input} value={formData.profile.age} onChange={e => updateProfile('age', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Gender</label>
                <select className={styles.select} value={formData.profile.gender} onChange={e => updateProfile('gender', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className={styles.formGroup}>
                <label className={styles.label}>Activity Level</label>
                <div className={styles.gridOptions}>
                  {['Sedentary', 'Lightly active', 'Moderately active', 'Very active'].map(lvl => (
                    <div 
                      key={lvl} 
                      className={`${styles.optionCard} ${formData.profile.activityLevel === lvl ? styles.selected : ''}`}
                      onClick={() => updateProfile('activityLevel', lvl)}
                    >
                      {lvl}
                    </div>
                  ))}
                </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Primary Goal</h1>
              <p className={styles.subtitle}>What is your main objective?</p>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Goal Type</label>
                <div className={styles.gridOptions}>
                  {['Weight Loss', 'Muscle Building', 'Recomposition', 'Fitness', 'Endurance'].map(type => (
                    <div 
                      key={type} 
                      className={`${styles.optionCard} ${formData.goal.type === type ? styles.selected : ''}`}
                      onClick={() => updateGoal('type', type)}
                    >
                      {type}
                    </div>
                  ))}
                </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Training Schedule</h1>
              <p className={styles.subtitle}>Step {step} of 8</p>
            </div>
             <div className={styles.formGroup}>
                <label className={styles.label}>Fitness Experience</label>
                <select className={styles.select} value={formData.profile.fitnessExperience} onChange={e => updateProfile('fitnessExperience', e.target.value)}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Training Days Per Week</label>
                <input type="number" min="1" max="7" className={styles.input} value={formData.profile.trainingDaysPerWeek} onChange={e => updateProfile('trainingDaysPerWeek', parseInt(e.target.value) || 3)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Preferred Workout Duration</label>
                <select className={styles.select} value={formData.profile.preferredWorkoutDuration} onChange={e => updateProfile('preferredWorkoutDuration', e.target.value)}>
                  <option value="20-30 min">20-30 min</option>
                  <option value="30-45 min">30-45 min</option>
                  <option value="45-60 min">45-60 min</option>
                  <option value="60+ min">60+ min</option>
                </select>
              </div>
          </>
        );
      case 4:
        return (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Workout Location</h1>
              <p className={styles.subtitle}>Step {step} of 8</p>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Where do you workout?</label>
                <select className={styles.select} value={formData.profile.workoutLocation} onChange={e => updateProfile('workoutLocation', e.target.value)}>
                  <option value="Gym">Gym</option>
                  <option value="Home">Home</option>
                  <option value="Both">Both</option>
                </select>
            </div>
            {formData.profile.workoutLocation !== 'Gym' && (
              <div className={styles.formGroup}>
                  <label className={styles.label}>Available Equipment (comma separated)</label>
                  <input type="text" className={styles.input} placeholder="e.g. Dumbbells, Resistance Bands" onChange={e => updateProfile('equipment', e.target.value.split(','))} />
              </div>
            )}
          </>
        );
      case 5:
        return (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Training Preferences</h1>
              <p className={styles.subtitle}>Step {step} of 8</p>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Preferred Style</label>
                <select className={styles.select} value={formData.profile.trainingPreferences.preferredStyle} onChange={e => updateProfile('trainingPreferences', {...formData.profile.trainingPreferences, preferredStyle: e.target.value})}>
                  <option value="">No Preference</option>
                  <option value="Bodybuilding">Bodybuilding</option>
                  <option value="Powerlifting">Powerlifting</option>
                  <option value="Calisthenics">Calisthenics</option>
                  <option value="CrossFit">CrossFit</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Priority Muscle Groups (comma separated)</label>
                <input type="text" className={styles.input} placeholder="e.g. Chest, Back" onChange={e => updateProfile('trainingPreferences', {...formData.profile.trainingPreferences, muscleGroupsPriority: e.target.value.split(',')})} />
            </div>
          </>
        );
      case 6:
        return (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Nutrition</h1>
              <p className={styles.subtitle}>Step {step} of 8</p>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Dietary Preference</label>
                <select className={styles.select} value={formData.profile.nutritionPreferences.dietaryPreference} onChange={e => updateProfile('nutritionPreferences', {...formData.profile.nutritionPreferences, dietaryPreference: e.target.value})}>
                  <option value="No restriction">No restriction</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Keto">Keto</option>
                  <option value="Paleo">Paleo</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Meals Per Day</label>
                <input type="number" min="1" max="8" className={styles.input} value={formData.profile.nutritionPreferences.mealsPerDay} onChange={e => updateProfile('nutritionPreferences', {...formData.profile.nutritionPreferences, mealsPerDay: parseInt(e.target.value) || 3})} />
            </div>
          </>
        );
      case 7:
        return (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Lifestyle</h1>
              <p className={styles.subtitle}>Step {step} of 8</p>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Average Daily Steps</label>
                <input type="number" step="1000" className={styles.input} value={formData.profile.lifestyle.dailySteps} onChange={e => updateProfile('lifestyle', {...formData.profile.lifestyle, dailySteps: parseInt(e.target.value) || 5000})} />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Sleep Duration</label>
                <select className={styles.select} value={formData.profile.lifestyle.sleepDuration} onChange={e => updateProfile('lifestyle', {...formData.profile.lifestyle, sleepDuration: e.target.value})}>
                  <option value="< 6 hours">&lt; 6 hours</option>
                  <option value="6-7 hours">6-7 hours</option>
                  <option value="7-8 hours">7-8 hours</option>
                  <option value="8+ hours">8+ hours</option>
                </select>
            </div>
          </>
        );
      case 8:
        return (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Health & Safety</h1>
              <p className={styles.subtitle}>Any limitations we should know about?</p>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Injuries or limitations (Optional)</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Bad lower back, shoulder impingement"
                  onChange={e => updateProfile('limitations', e.target.value.split(','))} 
                />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.progressContainer}>
          <div className={styles.progressBarBg}></div>
          <div className={styles.progressBarFill} style={{ width: `${((step - 1) / (STEPS - 1)) * 100}%` }}></div>
          {Array.from({ length: STEPS }).map((_, i) => (
            <div key={i} className={`${styles.progressStep} ${step === i + 1 ? styles.active : ''} ${step > i + 1 ? styles.completed : ''}`}>
              {i + 1}
            </div>
          ))}
        </div>

        {renderStep()}

        <div className={styles.buttonGroup}>
          {step > 1 ? (
            <button className={styles.btnBack} onClick={handleBack}>Back</button>
          ) : (
            <div></div> // Spacer
          )}
          <button className={styles.btnNext} onClick={handleNext}>
            {step === STEPS ? 'Complete & Generate Plan' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
