import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getGamificationData, getMe, getDailyBriefWithAI } from '../lib/storage';

export default function DashboardScreen() {
  const [gamification, setGamification] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [dailyBrief, setDailyBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [gam, profile] = await Promise.all([
        getGamificationData(),
        getMe().catch(() => null),
      ]);
      setGamification(gam);
      setUserProfile(profile);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBrief = async () => {
    setBriefLoading(true);
    try {
      const res = await getDailyBriefWithAI();
      setDailyBrief(res?.brief || res?.message || null);
    } catch (e) {
      Alert.alert('AI Brief', 'Could not load brief. Try again later.');
    }
    setBriefLoading(false);
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
  const displayName = userProfile?.name || userProfile?.username || 'Champion';
  const quests = gamification?.quests || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
      }
    >
      <View style={styles.content}>
        {/* Header with Avatar */}
        <View style={styles.welcomeSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Hello, {displayName}! 🏆</Text>
            <Text style={styles.welcomeSubtitle}>Pull down to refresh your stats</Text>
          </View>
          {userProfile?.profilePic ? (
            <Image source={{ uri: userProfile.profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{displayName[0]?.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* AI Daily Brief */}
        {dailyBrief ? (
          <View style={styles.briefCard}>
            <View style={styles.briefHeader}>
              <Ionicons name="sparkles" size={16} color="#ec4899" />
              <Text style={styles.briefTitle}>AI Daily Brief</Text>
            </View>
            <Text style={styles.briefText}>{dailyBrief}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.briefTrigger} onPress={fetchBrief} disabled={briefLoading}>
            {briefLoading ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={18} color="#8b5cf6" />
                <Text style={styles.briefTriggerText}>Get AI Daily Brief</Text>
              </>
            )}
          </TouchableOpacity>
        )}

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

        {/* Streak Cards */}
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

        {/* Active Quests */}
        {quests.length > 0 && (
          <View style={styles.questsCard}>
            <Text style={styles.questsTitle}>⚔️ Active Quests</Text>
            {quests.filter(q => !q.completed).slice(0, 3).map(q => {
              const prog = Math.min(100, Math.round(((q.current || 0) / (q.target || 1)) * 100));
              return (
                <View key={q._id || q.title} style={styles.questItem}>
                  <View style={styles.questTopRow}>
                    <Text style={styles.questName}>{q.title}</Text>
                    <Text style={styles.questXP}>+{q.xpReward} XP</Text>
                  </View>
                  <Text style={styles.questDesc}>{q.description}</Text>
                  <View style={styles.questBar}>
                    <View style={[styles.questFill, { width: `${prog}%` }]} />
                  </View>
                  <Text style={styles.questProg}>{q.current || 0} / {q.target}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🚀 Quick Actions</Text>
          <Text style={styles.tipItem}>• Log today's workout in the Gym tab (+15 XP/set)</Text>
          <Text style={styles.tipItem}>• Check off habits in the Habits tab (+10 XP each)</Text>
          <Text style={styles.tipItem}>• Upload a gym photo to earn +50 XP</Text>
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
  welcomeSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  welcomeTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  welcomeSubtitle: { fontSize: 13, color: '#94a3b8' },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#8b5cf6' },
  avatarFallback: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 20 },

  // AI Brief
  briefCard: { backgroundColor: 'rgba(236,72,153,0.08)', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(236,72,153,0.25)' },
  briefHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  briefTitle: { color: '#ec4899', fontWeight: '700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  briefText: { color: '#e2e8f0', fontSize: 14, lineHeight: 22 },
  briefTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  briefTriggerText: { color: '#8b5cf6', fontWeight: '700', fontSize: 15 },

  levelCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  levelBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  levelBadgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  levelDetails: { flex: 1 },
  levelTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelLabel: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  xpText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: '#8b5cf6', borderRadius: 4 },
  totalXpText: { fontSize: 11, color: '#64748b' },

  streakRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  streakCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 16, padding: 14, alignItems: 'center', borderLeftWidth: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 4 },
  streakNum: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  streakLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Quests
  questsCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  questsTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 16 },
  questItem: { marginBottom: 16 },
  questTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  questName: { color: '#fff', fontWeight: '700', fontSize: 14, flex: 1 },
  questXP: { color: '#f59e0b', fontWeight: '700', fontSize: 12 },
  questDesc: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  questBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  questFill: { height: '100%', backgroundColor: '#8b5cf6' },
  questProg: { color: '#94a3b8', fontSize: 11, alignSelf: 'flex-end' },

  tipsCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 8 },
  tipsTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  tipItem: { fontSize: 14, color: '#94a3b8', lineHeight: 22 },
});
