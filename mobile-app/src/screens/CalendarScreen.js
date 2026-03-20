import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCalendarData } from '../lib/storage';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Colors: 0=empty, 1=low, 2=med, 3=high, 4=max
const HEAT_COLORS = ['rgba(30, 41, 59, 1)', 'rgba(139, 92, 246, 0.25)', 'rgba(139, 92, 246, 0.5)', 'rgba(139, 92, 246, 0.75)', 'rgba(139, 92, 246, 1)'];

function getActivityScore(activities) {
  if (!activities || activities.length === 0) return 0;
  return Math.min(activities.length, 4);
}

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const load = useCallback(async () => {
    setLoading(true);
    setData(await getCalendarData(year, month + 1) || {});
    setLoading(false);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Build grid
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<View key={`empty-${i}`} style={s.cellEmpty} />);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const activities = data[dateStr] || [];
    const score = getActivityScore(activities);
    const isToday = isCurrentMonth && today.getDate() === i;
    const bg = HEAT_COLORS[score];

    cells.push(
      <View key={i} style={[s.cell, { backgroundColor: bg }, isToday && s.cellToday]}>
        <Text style={[s.cellNumber, isToday && { color: '#c4b5fd' }]}>{i}</Text>
        {score > 0 && (
          <View style={s.indicators}>
            {activities.includes('gym') && <Text style={s.emoji}>🏋️</Text>}
            {activities.includes('habit') && <Text style={s.emoji}>✅</Text>}
            {activities.includes('learning') && <Text style={s.emoji}>📚</Text>}
            {activities.includes('content') && <Text style={s.emoji}>🎬</Text>}
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      <View style={s.header}>
        <TouchableOpacity style={s.arrowBtn} onPress={prevMonth}><Ionicons name="chevron-back" size={24} color="#fff" /></TouchableOpacity>
        <View style={s.monthTitleRow}>
          <Ionicons name="calendar" size={20} color="#8b5cf6" />
          <Text style={s.monthTitle}>{MONTHS[month]} {year}</Text>
        </View>
        <TouchableOpacity style={s.arrowBtn} onPress={nextMonth}><Ionicons name="chevron-forward" size={24} color="#fff" /></TouchableOpacity>
      </View>

      <View style={s.heatmapCard}>
        <View style={s.daysHeader}>
          {DAYS.map(d => <Text key={d} style={s.dayLabel}>{d}</Text>)}
        </View>

        {loading ? (
          <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#8b5cf6" size="large" />
          </View>
        ) : (
          <View style={s.grid}>
            {cells}
          </View>
        )}
      </View>

      <View style={s.legend}>
        <Text style={s.legendTitle}>Activity Indicator</Text>
        <View style={s.legendRow}>
          <Text style={s.legendText}>Less</Text>
          {HEAT_COLORS.map((c, i) => <View key={i} style={[s.legendBox, { backgroundColor: c }]} />)}
          <Text style={s.legendText}>More</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  arrowBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 12 },
  monthTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  heatmapCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  dayLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', width: '13%', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  cellEmpty: { width: '13%', aspectRatio: 1 },
  cell: { width: '13%', aspectRatio: 1, borderRadius: 10, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4 },
  cellToday: { borderWidth: 1.5, borderColor: '#a78bfa' },
  cellNumber: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  indicators: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 1, marginTop: 2, paddingHorizontal: 2 },
  emoji: { fontSize: 8 },
  legend: { alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  legendTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '700', marginBottom: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendText: { color: '#64748b', fontSize: 12 },
  legendBox: { width: 16, height: 16, borderRadius: 4 },
});
