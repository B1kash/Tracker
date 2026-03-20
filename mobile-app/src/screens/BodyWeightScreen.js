import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBodyWeightLogs, upsertBodyWeight, deleteBodyWeight } from '../lib/storage';

function getDateStr(d) { return d.toISOString().split('T')[0]; }

export default function BodyWeightScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: getDateStr(new Date()), weight: '', chest: '', waist: '', arms: '', notes: '' });

  const load = async () => {
    setLoading(true);
    const data = await getBodyWeightLogs();
    setLogs([...data].reverse()); // newest first
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.weight) return Alert.alert('Required', 'Please enter your weight.');
    try {
      await upsertBodyWeight({
        date: form.date,
        weight: parseFloat(form.weight),
        chest: parseFloat(form.chest) || undefined,
        waist: parseFloat(form.waist) || undefined,
        arms: parseFloat(form.arms) || undefined,
        notes: form.notes || undefined,
      });
      setShowModal(false);
      setForm({ date: getDateStr(new Date()), weight: '', chest: '', waist: '', arms: '', notes: '' });
      load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const remove = (id) => Alert.alert('Delete log?', 'Remove this body weight entry?', [
    { text: 'Cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      await deleteBodyWeight(id);
      setLogs(l => l.filter(x => (x._id || x.id) !== id));
    }},
  ]);

  // Calculate trend
  const latest = logs[0];
  const previous = logs[1];
  const diff = latest && previous ? (parseFloat(latest.weight) - parseFloat(previous.weight)).toFixed(1) : null;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Stats Header */}
        {latest && (
          <View style={s.statsCard}>
            <View style={s.bigWeightRow}>
              <Text style={s.bigWeight}>{latest.weight}</Text>
              <Text style={s.bigWeightUnit}>kg</Text>
              {diff !== null && (
                <View style={[s.diffBadge, { backgroundColor: parseFloat(diff) <= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)' }]}>
                  <Ionicons name={parseFloat(diff) <= 0 ? 'trending-down' : 'trending-up'} size={14} color={parseFloat(diff) <= 0 ? '#10b981' : '#f43f5e'} />
                  <Text style={{ color: parseFloat(diff) <= 0 ? '#10b981' : '#f43f5e', fontWeight: '700', fontSize: 13 }}>
                    {parseFloat(diff) > 0 ? '+' : ''}{diff} kg
                  </Text>
                </View>
              )}
            </View>
            <Text style={s.dateLabel}>Last logged: {latest.date}</Text>
            {(latest.chest || latest.waist || latest.arms) && (
              <View style={s.measureRow}>
                {latest.chest ? <View style={s.measureItem}><Text style={s.measureVal}>{latest.chest}</Text><Text style={s.measureKey}>Chest</Text></View> : null}
                {latest.waist ? <View style={s.measureItem}><Text style={s.measureVal}>{latest.waist}</Text><Text style={s.measureKey}>Waist</Text></View> : null}
                {latest.arms ? <View style={s.measureItem}><Text style={s.measureVal}>{latest.arms}</Text><Text style={s.measureKey}>Arms</Text></View> : null}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={s.logBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={s.logBtnText}>Log Today's Weight</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={s.center}><ActivityIndicator color="#8b5cf6" size="large" /></View>
        ) : logs.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="scale-outline" size={56} color="#334155" />
            <Text style={s.emptyText}>No weight logs yet.</Text>
            <Text style={s.emptySubText}>Log your first weigh-in above!</Text>
          </View>
        ) : (
          <>
            <Text style={s.sectionTitle}>History</Text>
            {logs.map(log => (
              <View key={log._id || log.id} style={s.logCard}>
                <View style={s.logLeft}>
                  <Text style={s.logDate}>{log.date}</Text>
                  {log.notes ? <Text style={s.logNotes}>{log.notes}</Text> : null}
                  {(log.chest || log.waist || log.arms) ? (
                    <Text style={s.logMeasures}>
                      {[log.chest && `Chest: ${log.chest}`, log.waist && `Waist: ${log.waist}`, log.arms && `Arms: ${log.arms}`].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <View style={s.logRight}>
                  <Text style={s.logWeight}>{log.weight} <Text style={s.logUnit}>kg</Text></Text>
                  <TouchableOpacity onPress={() => remove(log._id || log.id)} style={{ marginTop: 8 }}>
                    <Ionicons name="trash-outline" size={16} color="#475569" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Log Weight</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
            </View>

            <Text style={s.fieldLabel}>Date</Text>
            <TextInput style={s.input} value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor="#475569" />

            <Text style={s.fieldLabel}>Weight (kg) *</Text>
            <TextInput style={s.input} keyboardType="numeric" value={form.weight} onChangeText={v => setForm(f => ({ ...f, weight: v }))} placeholder="75.5" placeholderTextColor="#475569" />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Chest (cm)</Text>
                <TextInput style={s.input} keyboardType="numeric" value={form.chest} onChangeText={v => setForm(f => ({ ...f, chest: v }))} placeholder="0" placeholderTextColor="#475569" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Waist (cm)</Text>
                <TextInput style={s.input} keyboardType="numeric" value={form.waist} onChangeText={v => setForm(f => ({ ...f, waist: v }))} placeholder="0" placeholderTextColor="#475569" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Arms (cm)</Text>
                <TextInput style={s.input} keyboardType="numeric" value={form.arms} onChangeText={v => setForm(f => ({ ...f, arms: v }))} placeholder="0" placeholderTextColor="#475569" />
              </View>
            </View>

            <Text style={s.fieldLabel}>Notes (optional)</Text>
            <TextInput style={s.input} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="e.g. Morning, after workout" placeholderTextColor="#475569" />

            <TouchableOpacity style={s.saveBtn} onPress={submit}>
              <Text style={s.saveBtnText}>Save Entry</Text>
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
  statsCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  bigWeightRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 6 },
  bigWeight: { fontSize: 48, fontWeight: '900', color: '#fff' },
  bigWeightUnit: { fontSize: 18, color: '#94a3b8', paddingBottom: 10 },
  diffBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  dateLabel: { color: '#64748b', fontSize: 12, marginBottom: 12 },
  measureRow: { flexDirection: 'row', gap: 16 },
  measureItem: { alignItems: 'center' },
  measureVal: { color: '#fff', fontSize: 16, fontWeight: '700' },
  measureKey: { color: '#64748b', fontSize: 11, textTransform: 'uppercase' },
  logBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8b5cf6', borderRadius: 14, padding: 16, marginBottom: 24 },
  logBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  logCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  logLeft: { flex: 1 },
  logDate: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  logNotes: { color: '#64748b', fontSize: 12, marginBottom: 2 },
  logMeasures: { color: '#64748b', fontSize: 11 },
  logRight: { alignItems: 'flex-end' },
  logWeight: { color: '#fff', fontSize: 22, fontWeight: '800' },
  logUnit: { color: '#94a3b8', fontSize: 14, fontWeight: '400' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  fieldLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  saveBtn: { backgroundColor: '#8b5cf6', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
