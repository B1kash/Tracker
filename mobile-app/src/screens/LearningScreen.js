import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getLearningGoals, addLearningGoal, updateLearningGoal, deleteLearningGoal,
  addProgressLog, deleteProgressLog,
} from '../lib/storage';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];
const STATUS_COLORS = { 'Not Started': '#8b5cf6', 'In Progress': '#f59e0b', 'Completed': '#10b981' };
const MOOD_OPTIONS = [
  { value: 'great', label: '🔥 Great' },
  { value: 'good', label: '😊 Good' },
  { value: 'okay', label: '😐 Okay' },
  { value: 'struggling', label: '😤 Struggling' }
];
const today = new Date().toISOString().split('T')[0];

function getMoodEmoji(mood) {
  return MOOD_OPTIONS.find(m => m.value === mood)?.label || '😊 Good';
}

export default function LearningScreen() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [goalModal, setGoalModal] = useState(false);
  const [logModal, setLogModal] = useState(null); // goalId
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({ title: '', resource: '', progress: '0', status: 'Not Started' });
  const [logForm, setLogForm] = useState({ whatLearned: '', doubts: '', keyTakeaways: '', timeSpent: '', mood: 'good', progress: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setGoals(await getLearningGoals());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const openGoalModal = (goal = null) => {
    setEditingGoal(goal);
    setGoalForm(goal
      ? { title: goal.title, resource: goal.resource || '', progress: String(goal.progress || 0), status: goal.status || 'Not Started' }
      : { title: '', resource: '', progress: '0', status: 'Not Started' }
    );
    setGoalModal(true);
  };

  const saveGoal = async () => {
    if (!goalForm.title.trim()) return Alert.alert('Required', 'Title is required.');
    try {
      if (editingGoal) {
        await updateLearningGoal(editingGoal._id || editingGoal.id, { ...goalForm, progress: parseInt(goalForm.progress) || 0 });
      } else {
        await addLearningGoal({ ...goalForm, progress: parseInt(goalForm.progress) || 0 });
      }
      setGoalModal(false);
      load();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const removeGoal = (goal) => Alert.alert('Delete Goal?', 'This will remove all progress logs too.', [
    { text: 'Cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      await deleteLearningGoal(goal._id || goal.id);
      setGoals(g => g.filter(x => (x._id || x.id) !== (goal._id || goal.id)));
    }},
  ]);

  const saveLog = async () => {
    if (!logForm.whatLearned.trim()) return Alert.alert('Required', 'What did you learn is required.');
    try {
      await addProgressLog(logModal, {
        whatLearned: logForm.whatLearned,
        doubts: logForm.doubts,
        keyTakeaways: logForm.keyTakeaways,
        timeSpent: logForm.timeSpent,
        mood: logForm.mood,
        progress: logForm.progress ? parseInt(logForm.progress) : undefined,
      });
      setLogModal(null);
      setLogForm({ whatLearned: '', doubts: '', keyTakeaways: '', timeSpent: '', mood: 'good', progress: '' });
      load();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const removeLog = (goalId, logId) => Alert.alert('Delete log?', undefined, [
    { text: 'Cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      await deleteProgressLog(goalId, logId);
      load();
    }},
  ]);

  const completed = goals.filter(g => g.status === 'Completed').length;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Stats header */}
        <View style={s.statsRow}>
          <View style={s.statChip}><Text style={s.statVal}>{goals.length}</Text><Text style={s.statKey}>Total</Text></View>
          <View style={s.statChip}><Text style={[s.statVal, { color: '#10b981' }]}>{completed}</Text><Text style={s.statKey}>Done</Text></View>
          <View style={s.statChip}><Text style={[s.statVal, { color: '#f59e0b' }]}>{goals.filter(g => g.status === 'In Progress').length}</Text><Text style={s.statKey}>Active</Text></View>
        </View>

        <TouchableOpacity style={s.addBtn} onPress={() => openGoalModal()}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={s.addBtnText}>New Learning Goal</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={s.center}><ActivityIndicator color="#8b5cf6" size="large" /></View>
        ) : goals.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="book-outline" size={56} color="#334155" />
            <Text style={s.emptyText}>No learning goals yet</Text>
            <Text style={s.emptySubText}>Add a course or skill you&apos;re working on</Text>
          </View>
        ) : (
          goals.map(goal => {
            const goalId = goal._id || goal.id;
            const color = STATUS_COLORS[goal.status] || '#8b5cf6';
            const isExpanded = expandedId === goalId;
            const logs = goal.progressLogs || [];
            return (
              <View key={goalId} style={[s.goalCard, { borderLeftColor: color }]}>
                <View style={s.goalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.goalTitle}>{goal.title}</Text>
                    <View style={s.statusRow}>
                      <View style={[s.statusBadge, { backgroundColor: `${color}20` }]}>
                        <Text style={[s.statusText, { color }]}>{goal.status}</Text>
                      </View>
                      {goal.resource ? <Text style={s.resourceText} numberOfLines={1}>🔗 Resource</Text> : null}
                    </View>
                  </View>
                  <View style={s.goalActions}>
                    <TouchableOpacity onPress={() => openGoalModal(goal)} style={s.iconBtn}><Ionicons name="pencil-outline" size={16} color="#94a3b8" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => removeGoal(goal)} style={s.iconBtn}><Ionicons name="trash-outline" size={16} color="#f43f5e" /></TouchableOpacity>
                  </View>
                </View>

                <View style={s.progressRow}>
                  <View style={s.progressBar}><View style={[s.progressFill, { width: `${goal.progress || 0}%`, backgroundColor: color }]} /></View>
                  <Text style={[s.pctText, { color }]}>{goal.progress || 0}%</Text>
                </View>

                <View style={s.goalBtnRow}>
                  <TouchableOpacity style={[s.logTodayBtn, { borderColor: color }]} onPress={() => { setLogModal(goalId); setLogForm({ whatLearned: '', doubts: '', keyTakeaways: '', timeSpent: '', mood: 'good', progress: '' }); }}>
                    <Ionicons name="add-circle-outline" size={14} color={color} />
                    <Text style={[s.logTodayText, { color }]}>Log Today</Text>
                  </TouchableOpacity>
                  {logs.length > 0 && (
                    <TouchableOpacity style={s.expandBtn} onPress={() => setExpandedId(isExpanded ? null : goalId)}>
                      <Text style={s.expandText}>{logs.length} log{logs.length > 1 ? 's' : ''}</Text>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#64748b" />
                    </TouchableOpacity>
                  )}
                </View>

                {isExpanded && (
                  <View style={s.logsContainer}>
                    {logs.map(log => {
                      const logId = log._id || log.id;
                      return (
                        <View key={logId} style={s.logEntry}>
                          <View style={s.logHeader}>
                            <Text style={s.logDate}>{(log.date || '').split('T')[0]}</Text>
                            <Text style={s.logMood}>{getMoodEmoji(log.mood)}</Text>
                            {log.timeSpent ? <Text style={s.logTime}>⏱ {log.timeSpent}</Text> : null}
                            <TouchableOpacity onPress={() => removeLog(goalId, logId)}><Ionicons name="close-circle-outline" size={16} color="#475569" /></TouchableOpacity>
                          </View>
                          <Text style={s.logLearned}>📖 {log.whatLearned}</Text>
                          {log.doubts ? <Text style={s.logDetail}>❓ {log.doubts}</Text> : null}
                          {log.keyTakeaways ? <Text style={s.logDetail}>💡 {log.keyTakeaways}</Text> : null}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Goal Modal */}
      <Modal visible={goalModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <ScrollView style={s.modalBox} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingGoal ? 'Edit Goal' : 'New Learning Goal'}</Text>
              <TouchableOpacity onPress={() => setGoalModal(false)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>Title *</Text>
            <TextInput style={s.input} value={goalForm.title} onChangeText={v => setGoalForm(f => ({ ...f, title: v }))} placeholder="e.g. React Advanced Patterns" placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>Resource Link</Text>
            <TextInput style={s.input} value={goalForm.resource} onChangeText={v => setGoalForm(f => ({ ...f, resource: v }))} placeholder="https://..." placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>Progress %</Text>
            <TextInput style={s.input} keyboardType="numeric" value={goalForm.progress} onChangeText={v => setGoalForm(f => ({ ...f, progress: v }))} placeholder="0" placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {STATUS_OPTIONS.map(st => (
                <TouchableOpacity key={st} style={[s.pill, goalForm.status === st && { backgroundColor: STATUS_COLORS[st], borderColor: STATUS_COLORS[st] }]} onPress={() => setGoalForm(f => ({ ...f, status: st }))}>
                  <Text style={[s.pillText, goalForm.status === st && { color: '#fff' }]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={saveGoal}>
              <Text style={s.saveBtnText}>Save Goal</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Log Modal */}
      <Modal visible={!!logModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <ScrollView style={s.modalBox} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>📝 Daily Learning Log</Text>
              <TouchableOpacity onPress={() => setLogModal(null)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>✏️ What did you learn? *</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} multiline value={logForm.whatLearned} onChangeText={v => setLogForm(f => ({ ...f, whatLearned: v }))} placeholder="e.g. Learned about useEffect cleanup..." placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>❓ Doubts / Questions</Text>
            <TextInput style={[s.input, { height: 60, textAlignVertical: 'top' }]} multiline value={logForm.doubts} onChangeText={v => setLogForm(f => ({ ...f, doubts: v }))} placeholder="Any questions that came up..." placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>💡 Key Takeaways</Text>
            <TextInput style={[s.input, { height: 60, textAlignVertical: 'top' }]} multiline value={logForm.keyTakeaways} onChangeText={v => setLogForm(f => ({ ...f, keyTakeaways: v }))} placeholder="Main insights to remember..." placeholderTextColor="#475569" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>⏱️ Time Spent</Text>
                <TextInput style={s.input} value={logForm.timeSpent} onChangeText={v => setLogForm(f => ({ ...f, timeSpent: v }))} placeholder="e.g. 2 hours" placeholderTextColor="#475569" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>📊 Progress %</Text>
                <TextInput style={s.input} keyboardType="numeric" value={logForm.progress} onChangeText={v => setLogForm(f => ({ ...f, progress: v }))} placeholder="Keep same" placeholderTextColor="#475569" />
              </View>
            </View>
            <Text style={s.fieldLabel}>🧠 Mood</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {MOOD_OPTIONS.map(m => (
                <TouchableOpacity key={m.value} style={[s.pill, logForm.mood === m.value && s.pillActive]} onPress={() => setLogForm(f => ({ ...f, mood: m.value }))}>
                  <Text style={[s.pillText, logForm.mood === m.value && s.pillTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.saveBtn} onPress={saveLog}>
              <Text style={s.saveBtnText}>Save Log</Text>
            </TouchableOpacity>
          </ScrollView>
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
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statChip: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statKey: { fontSize: 11, color: '#64748b', textTransform: 'uppercase' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8b5cf6', borderRadius: 14, padding: 14, marginBottom: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  goalCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 14, borderLeftWidth: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  goalTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  resourceText: { color: '#64748b', fontSize: 11 },
  goalActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  progressBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  pctText: { fontSize: 13, fontWeight: '700', width: 36, textAlign: 'right' },
  goalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logTodayBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  logTodayText: { fontSize: 13, fontWeight: '700' },
  expandBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expandText: { color: '#64748b', fontSize: 12 },
  logsContainer: { marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 14, gap: 12 },
  logEntry: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, gap: 4 },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  logDate: { color: '#64748b', fontSize: 11, fontWeight: '600', flex: 1 },
  logMood: { fontSize: 12 },
  logTime: { color: '#64748b', fontSize: 11 },
  logLearned: { color: '#e2e8f0', fontSize: 13, lineHeight: 18 },
  logDetail: { color: '#94a3b8', fontSize: 12, lineHeight: 16, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  fieldLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pillActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  pillText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  pillTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#8b5cf6', borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
