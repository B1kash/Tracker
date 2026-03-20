import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getGoals, addGoal, deleteGoal, updateGoal } from '../lib/storage';

function daysUntil(deadline) {
  const diff = new Date(deadline) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function progressPercent(current, target) {
  if (!target) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

const GOAL_TYPES = ['strength', 'cardio', 'weight', 'habit', 'other'];

export default function GoalsScreen() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(null); // goal being updated
  const [form, setForm] = useState({ title: '', type: 'strength', exerciseName: '', targetValue: '', deadline: '' });
  const [progress, setProgress] = useState('');

  const load = async () => {
    setLoading(true);
    setGoals(await getGoals());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title || !form.targetValue || !form.deadline) {
      return Alert.alert('Required', 'Title, target and deadline are required.');
    }
    try {
      await addGoal({ ...form, targetValue: parseFloat(form.targetValue) });
      setShowModal(false);
      setForm({ title: '', type: 'strength', exerciseName: '', targetValue: '', deadline: '' });
      load();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const remove = (id) => Alert.alert('Delete goal?', undefined, [
    { text: 'Cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      await deleteGoal(id);
      setGoals(g => g.filter(x => (x._id || x.id) !== id));
    }},
  ]);

  const updateProgress = async () => {
    if (!editModal || !progress) return;
    try {
      const updated = await updateGoal(editModal._id || editModal.id, { currentValue: parseFloat(progress) });
      setGoals(g => g.map(x => (x._id || x.id) === (editModal._id || editModal.id) ? updated : x));
      setEditModal(null);
      setProgress('');
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const getTypeColor = (type) => ({ strength: '#8b5cf6', cardio: '#10b981', weight: '#f59e0b', habit: '#06b6d4', other: '#94a3b8' }[type] || '#94a3b8');
  const getTypeIcon = (type) => ({ strength: 'barbell', cardio: 'bicycle', weight: 'scale', habit: 'checkbox', other: 'flag' }[type] || 'flag');

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={s.addBtnText}>New Goal</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={s.center}><ActivityIndicator color="#8b5cf6" size="large" /></View>
        ) : goals.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="trophy-outline" size={56} color="#334155" />
            <Text style={s.emptyText}>No goals set yet.</Text>
            <Text style={s.emptySubText}>Create your first milestone goal!</Text>
          </View>
        ) : (
          goals.map(goal => {
            const id = goal._id || goal.id;
            const color = getTypeColor(goal.type);
            const pct = progressPercent(goal.currentValue || 0, goal.targetValue);
            const days = daysUntil(goal.deadline);
            return (
              <View key={id} style={[s.goalCard, { borderLeftColor: color }]}>
                <View style={s.goalHeader}>
                  <View style={[s.typeBadge, { backgroundColor: `${color}20` }]}>
                    <Ionicons name={getTypeIcon(goal.type)} size={14} color={color} />
                    <Text style={[s.typeText, { color }]}>{goal.type}</Text>
                  </View>
                  <TouchableOpacity onPress={() => remove(id)}>
                    <Ionicons name="trash-outline" size={16} color="#475569" />
                  </TouchableOpacity>
                </View>

                <Text style={s.goalTitle}>{goal.title}</Text>
                {goal.exerciseName ? <Text style={s.goalSub}>{goal.exerciseName}</Text> : null}

                <View style={s.progressRow}>
                  <View style={s.progressBar}>
                    <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={[s.pctText, { color }]}>{pct}%</Text>
                </View>

                <View style={s.goalFooter}>
                  <Text style={s.goalValue}>
                    <Text style={{ color }}>{goal.currentValue || 0}</Text> / {goal.targetValue}
                  </Text>
                  <Text style={[s.daysText, { color: days < 7 ? '#f43f5e' : days < 30 ? '#f59e0b' : '#94a3b8' }]}>
                    {days > 0 ? `${days}d left` : days === 0 ? 'Due today!' : 'Overdue!'}
                  </Text>
                </View>

                <TouchableOpacity style={[s.updateBtn, { borderColor: color }]} onPress={() => { setEditModal(goal); setProgress(String(goal.currentValue || '')); }}>
                  <Text style={[s.updateBtnText, { color }]}>Update Progress</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <ScrollView style={s.modalBox} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>New Goal</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>Title *</Text>
            <TextInput style={s.input} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Bench 100kg" placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {GOAL_TYPES.map(t => (
                <TouchableOpacity key={t} style={[s.pill, form.type === t && s.pillActive]} onPress={() => setForm(f => ({ ...f, type: t }))}>
                  <Text style={[s.pillText, form.type === t && s.pillTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.fieldLabel}>Exercise / Metric name</Text>
            <TextInput style={s.input} value={form.exerciseName} onChangeText={v => setForm(f => ({ ...f, exerciseName: v }))} placeholder="e.g. Bench Press, Weight" placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>Target Value *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={form.targetValue} onChangeText={v => setForm(f => ({ ...f, targetValue: v }))} placeholder="100" placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>Deadline * (YYYY-MM-DD)</Text>
            <TextInput style={s.input} value={form.deadline} onChangeText={v => setForm(f => ({ ...f, deadline: v }))} placeholder="2025-12-31" placeholderTextColor="#475569" />
            <TouchableOpacity style={s.saveBtn} onPress={submit}>
              <Text style={s.saveBtnText}>Create Goal</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Update Progress Modal */}
      <Modal visible={!!editModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Update Progress</Text>
              <TouchableOpacity onPress={() => setEditModal(null)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>{editModal?.title}</Text>
            <Text style={s.fieldLabel}>Current Value</Text>
            <TextInput style={s.input} keyboardType="numeric" value={progress} onChangeText={setProgress}
              placeholder={`Target: ${editModal?.targetValue}`} placeholderTextColor="#475569" />
            <TouchableOpacity style={s.saveBtn} onPress={updateProgress}>
              <Text style={s.saveBtnText}>Save Progress</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { padding: 40, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
  emptySubText: { color: '#475569', fontSize: 13 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8b5cf6', borderRadius: 14, padding: 16, marginBottom: 24 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  goalCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 14, borderLeftWidth: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  goalTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 2 },
  goalSub: { color: '#64748b', fontSize: 12, marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  pctText: { fontSize: 13, fontWeight: '700', width: 38, textAlign: 'right' },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  goalValue: { color: '#94a3b8', fontSize: 13 },
  daysText: { fontSize: 13, fontWeight: '700' },
  updateBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  updateBtnText: { fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  fieldLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pillActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  pillText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  pillTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#8b5cf6', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
