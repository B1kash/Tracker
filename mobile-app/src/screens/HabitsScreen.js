import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getHabits, getHabitLogByDate, toggleHabitLog, addHabit, deleteHabit } from '../lib/storage';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDateStr(date) { 
    return date.toISOString().split('T')[0]; 
}

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

export default function HabitsScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habits, setHabits] = useState([]);
  const [currentLog, setCurrentLog] = useState({ completedHabitIds: [] });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  const dateStr = getDateStr(selectedDate);
  const weekDates = getWeekDates(selectedDate);
  const todayStr = getDateStr(new Date());
  const isFuture = dateStr > todayStr;

  const fetchData = async () => {
    try {
      const [h, log] = await Promise.all([
        getHabits(),
        getHabitLogByDate(dateStr)
      ]);
      setHabits(h);
      setCurrentLog(log);
    } catch (error) {
      console.error("Habits fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateStr]);

  const handleToggleHabit = async (habitId) => {
    if (isFuture) return;
    
    // Optimistic Update
    const isDone = currentLog.completedHabitIds.includes(habitId);
    let newIds;
    if (isDone) {
        newIds = currentLog.completedHabitIds.filter(id => id !== habitId);
    } else {
        newIds = [...currentLog.completedHabitIds, habitId];
    }
    setCurrentLog({ ...currentLog, completedHabitIds: newIds });

    try {
        await toggleHabitLog(dateStr, habitId);
    } catch (error) {
        fetchData(); // Rollback if error
        Alert.alert("Error", "Failed to update habit status.");
    }
  };

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) return;
    try {
        await addHabit({ name: newHabitName.trim() });
        setNewHabitName('');
        setIsModalOpen(false);
        fetchData();
    } catch (error) {
        Alert.alert("Error", "Failed to add habit.");
    }
  };

  const handleDeleteHabit = (id) => {
    Alert.alert(
        "Delete Habit",
        "Are you sure you want to delete this habit template?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive",
                onPress: async () => {
                    await deleteHabit(id);
                    fetchData();
                }
            }
        ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
            <Text style={styles.dateTitle}>{dateStr === todayStr ? "Today's Checklist" : dateStr}</Text>
            <Text style={styles.statsSubtitle}>{habits.length} total habits</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalOpen(true)}>
            <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.dateStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {weekDates.map(d => {
            const ds = getDateStr(d);
            const isActive = ds === dateStr;
            const isToday = ds === todayStr;
            return (
              <TouchableOpacity 
                key={ds} 
                style={[styles.dateChip, isActive && styles.dateChipActive, isToday && !isActive && styles.dateChipToday]}
                onPress={() => setSelectedDate(d)}
              >
                <Text style={[styles.dateDay, isActive && styles.dateTextActive]}>{DAYS_SHORT[d.getDay()]}</Text>
                <Text style={[styles.dateNum, isActive && styles.dateTextActive]}>{d.getDate()}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <ScrollView style={styles.habitList} contentContainerStyle={{ paddingBottom: 40 }}>
          {habits.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkbox-outline" size={64} color="#334155" />
              <Text style={styles.emptyText}>No habits defined yet.</Text>
            </View>
          ) : (
            habits.map(habit => {
              const id = habit._id || habit.id;
              const isDone = currentLog.completedHabitIds.includes(id);
              return (
                <View key={id} style={[styles.habitCard, isDone && styles.habitCardDone]}>
                  <TouchableOpacity 
                    style={[styles.checkbox, isDone && styles.checkboxDone]}
                    onPress={() => handleToggleHabit(id)}
                    disabled={isFuture}
                  >
                    {isDone && <Ionicons name="checkmark" size={18} color="#ffffff" />}
                  </TouchableOpacity>
                  <Text style={[styles.habitName, isDone && styles.habitNameDone]}>{habit.name}</Text>
                  <TouchableOpacity onPress={() => handleDeleteHabit(id)}>
                    <Ionicons name="trash-outline" size={18} color="#475569" />
                  </TouchableOpacity>
                </View>
              )
            })
          )}
        </ScrollView>
      )}

      {/* Modal for adding habit */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Habit</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <TextInput 
              style={styles.modalInput}
              placeholder="Habit name (e.g. Drink Water)"
              placeholderTextColor="#64748b"
              value={newHabitName}
              onChangeText={setNewHabitName}
              autoFocus
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleCreateHabit}>
              <Text style={styles.modalButtonText}>Add Habit</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  statsSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dateStrip: {
    paddingLeft: 20,
    marginBottom: 24,
  },
  dateChip: {
    width: 60,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  dateChipToday: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  dateDay: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  dateTextActive: {
    color: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitList: {
    paddingHorizontal: 20,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  habitCardDone: {
    opacity: 0.8,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkboxDone: {
    backgroundColor: '#8b5cf6',
  },
  habitName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  habitNameDone: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#ffffff',
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  }
});
