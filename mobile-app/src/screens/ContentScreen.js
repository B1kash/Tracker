import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getContentLogs, addContentLog, updateContentLog, deleteContentLog } from '../lib/storage';

const STATUSES = ['Created', 'Drafted', 'Posted'];
const PLATFORMS = ['YouTube', 'Blog', 'Twitter', 'Instagram', 'LinkedIn', 'TikTok', 'Other'];
const STATUS_COLORS = { Created: '#f59e0b', Drafted: '#06b6d4', Posted: '#10b981' };
const PLATFORM_COLORS = { YouTube: '#f43f5e', Blog: '#8b5cf6', Twitter: '#06b6d4', Instagram: '#f59e0b', LinkedIn: '#3b82f6', TikTok: '#f43f5e', Other: '#8b5cf6' };

function getDateStr(d) { return d.toISOString().split('T')[0]; }

export default function ContentScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const today = getDateStr(new Date());
  const [form, setForm] = useState({ title: '', platform: 'Blog', status: 'Created', date: today, notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setLogs(await getContentLogs());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingLog(null);
    setForm({ title: '', platform: 'Blog', status: 'Created', date: today, notes: '' });
    setShowModal(true);
  };

  const openEdit = (log) => {
    setEditingLog(log);
    setForm({ title: log.title, platform: log.platform, status: log.status, date: log.date, notes: log.notes || '' });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim()) return Alert.alert('Required', 'Content title is required.');
    try {
      if (editingLog) {
        await updateContentLog(editingLog._id || editingLog.id, form);
      } else {
        await addContentLog(form);
      }
      setShowModal(false);
      load();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const remove = (id) => Alert.alert('Delete?', undefined, [
    { text: 'Cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      await deleteContentLog(id);
      setLogs(l => l.filter(x => (x._id || x.id) !== id));
    }},
  ]);

  const cycleStatus = async (log) => {
    const id = log._id || log.id;
    const nextStatus = STATUSES[(STATUSES.indexOf(log.status) + 1) % STATUSES.length];
    await updateContentLog(id, { status: nextStatus });
    setLogs(l => l.map(x => (x._id || x.id) === id ? { ...x, status: nextStatus } : x));
  };

  // Group by date
  const byDate = {};
  logs.forEach(l => {
    const key = l.date || today;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(l);
  });
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  const posted = logs.filter(l => l.status === 'Posted').length;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header stats */}
        <View style={s.statsRow}>
          <View style={s.statChip}><Text style={s.statVal}>{logs.length}</Text><Text style={s.statKey}>Total</Text></View>
          <View style={s.statChip}><Text style={[s.statVal, { color: '#10b981' }]}>{posted}</Text><Text style={s.statKey}>Posted</Text></View>
          <View style={s.statChip}><Text style={[s.statVal, { color: '#06b6d4' }]}>{logs.filter(l => l.status === 'Drafted').length}</Text><Text style={s.statKey}>Drafted</Text></View>
        </View>

        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={s.addBtnText}>Log New Content</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={s.center}><ActivityIndicator color="#06b6d4" size="large" /></View>
        ) : logs.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="videocam-outline" size={56} color="#334155" />
            <Text style={s.emptyText}>No content logged yet</Text>
            <Text style={s.emptySubText}>Track ideas, drafts, and published work</Text>
          </View>
        ) : (
          sortedDates.map(dateKey => (
            <View key={dateKey}>
              <View style={s.dateHeader}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={s.dateText}>{dateKey === today ? '📅 Today' : dateKey}</Text>
                <View style={s.dateBadge}><Text style={s.dateBadgeText}>{byDate[dateKey].length}</Text></View>
              </View>
              {byDate[dateKey].map(log => {
                const id = log._id || log.id;
                const statusColor = STATUS_COLORS[log.status] || '#94a3b8';
                const platColor = PLATFORM_COLORS[log.platform] || '#8b5cf6';
                return (
                  <View key={id} style={s.logCard}>
                    <TouchableOpacity style={s.statusCircle} onPress={() => cycleStatus(log)}>
                      {log.status === 'Posted'
                        ? <Ionicons name="checkmark-circle" size={26} color="#10b981" />
                        : <Ionicons name="ellipse-outline" size={26} color={statusColor} />}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={s.logTitle}>{log.title}</Text>
                      <View style={s.badgeRow}>
                        <View style={[s.badge, { backgroundColor: `${platColor}20` }]}><Text style={[s.badgeText, { color: platColor }]}>{log.platform}</Text></View>
                        <View style={[s.badge, { backgroundColor: `${statusColor}20` }]}><Text style={[s.badgeText, { color: statusColor }]}>{log.status}</Text></View>
                      </View>
                      {log.notes ? <Text style={s.logNotes} numberOfLines={2}>{log.notes}</Text> : null}
                    </View>
                    <View style={{ gap: 8 }}>
                      <TouchableOpacity onPress={() => openEdit(log)}><Ionicons name="pencil-outline" size={16} color="#64748b" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => remove(id)}><Ionicons name="trash-outline" size={16} color="#f43f5e" /></TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <ScrollView style={s.modalBox} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingLog ? 'Edit Content' : 'Log New Content'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>Title *</Text>
            <TextInput style={s.input} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. How to Build APIs" placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>Platform</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {PLATFORMS.map(p => {
                const pc = PLATFORM_COLORS[p];
                return (
                  <TouchableOpacity key={p} style={[s.pill, form.platform === p && { backgroundColor: pc, borderColor: pc }]} onPress={() => setForm(f => ({ ...f, platform: p }))}>
                    <Text style={[s.pillText, form.platform === p && { color: '#fff' }]}>{p}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={s.fieldLabel}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {STATUSES.map(st => {
                const sc = STATUS_COLORS[st];
                return (
                  <TouchableOpacity key={st} style={[s.pill, form.status === st && { backgroundColor: sc, borderColor: sc }]} onPress={() => setForm(f => ({ ...f, status: st }))}>
                    <Text style={[s.pillText, form.status === st && { color: '#fff' }]}>{st}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.fieldLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput style={s.input} value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} placeholder="2025-03-21" placeholderTextColor="#475569" />
            <Text style={s.fieldLabel}>Notes</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} multiline value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Key points, links..." placeholderTextColor="#475569" />
            <TouchableOpacity style={s.saveBtn} onPress={save}>
              <Text style={s.saveBtnText}>Save</Text>
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
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#06b6d4', borderRadius: 14, padding: 14, marginBottom: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 },
  dateText: { color: '#94a3b8', fontSize: 13, fontWeight: '700', flex: 1 },
  dateBadge: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  dateBadgeText: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  logCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statusCircle: { marginTop: 2 },
  logTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  logNotes: { color: '#64748b', fontSize: 12, lineHeight: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  fieldLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pillText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  saveBtn: { backgroundColor: '#06b6d4', borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
