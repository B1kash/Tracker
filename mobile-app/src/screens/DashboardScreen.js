import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getGamificationData } from '../lib/storage';

export default function DashboardScreen() {
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const gam = await getGamificationData();
      setGamification(gam);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const xp = gamification?.xp || 0;
  const level = gamification?.level || 1;
  const xpForNext = 1000;
  const xpPercent = Math.min(((xp % xpForNext) / xpForNext) * 100, 100);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
      }
    >
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Hello Champion! 🏆</Text>
          <Text style={styles.welcomeSubtitle}>Pull down to refresh your stats</Text>
        </View>

        {/* Level / XP Card */}
        {gamification && (
          <View style={styles.levelCard}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LVL {level}</Text>
            </View>
            <View style={styles.levelDetails}>
              <View style={styles.levelTopRow}>
                <Text style={styles.levelLabel}>Level {level}</Text>
                <Text style={styles.xpText}>{xp % xpForNext} / {xpForNext} XP</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${xpPercent}%` }]} />
              </View>
              <Text style={styles.totalXpText}>{xp} Total XP Earned</Text>
            </View>
          </View>
        )}

        {/* Streak Card */}
        {gamification && (
          <View style={styles.streakRow}>
            <View style={[styles.streakCard, { borderLeftColor: '#f97316' }]}>
              <Ionicons name="flame" size={24} color="#f97316" />
              <Text style={styles.streakNum}>{gamification.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
            <View style={[styles.streakCard, { borderLeftColor: '#8b5cf6' }]}>
              <Ionicons name="trophy" size={24} color="#8b5cf6" />
              <Text style={styles.streakNum}>{gamification.bestStreak || 0}</Text>
              <Text style={styles.streakLabel}>Best Streak</Text>
            </View>
            <View style={[styles.streakCard, { borderLeftColor: '#06b6d4' }]}>
              <Ionicons name="star" size={24} color="#06b6d4" />
              <Text style={styles.streakNum}>{xp}</Text>
              <Text style={styles.streakLabel}>Total XP</Text>
            </View>
          </View>
        )}

        {/* Quick Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🚀 Quick Actions</Text>
          <Text style={styles.tipItem}>• Log today's workout in the Gym tab</Text>
          <Text style={styles.tipItem}>• Check off habits in the Habits tab</Text>
          <Text style={styles.tipItem}>• Pull down to refresh your level stats</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  welcomeSection: { marginBottom: 24 },
  welcomeTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  welcomeSubtitle: { fontSize: 14, color: '#94a3b8' },
  levelCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  levelDetails: { flex: 1 },
  levelTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelLabel: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  xpText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: '#8b5cf6', borderRadius: 4 },
  totalXpText: { fontSize: 11, color: '#64748b' },
  streakRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  streakCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 4,
  },
  streakNum: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  streakLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  tipsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  tipsTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  tipItem: { fontSize: 14, color: '#94a3b8', lineHeight: 22 },
});
