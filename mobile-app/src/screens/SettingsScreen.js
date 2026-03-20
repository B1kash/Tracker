import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../lib/storage';

export default function SettingsScreen() {
  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        // Force app reset / trigger auth state
        Alert.alert('Signed Out', 'Please close and reopen the app.', [{ text: 'OK' }]);
      } }
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      
      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <TouchableOpacity style={s.row} onPress={confirmLogout}>
          <View style={[s.iconBg, { backgroundColor: 'rgba(244,63,94,0.1)' }]}>
            <Ionicons name="log-out-outline" size={20} color="#f43f5e" />
          </View>
          <Text style={s.rowText}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color="#475569" />
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>About</Text>
        <View style={s.infoRow}>
          <Text style={s.infoKey}>App Version</Text>
          <Text style={s.infoVal}>1.0.0</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoKey}>Environment</Text>
          <Text style={s.infoVal}>Production S3</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  section: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sectionTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 },
  iconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowText: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoKey: { color: '#e2e8f0', fontSize: 15 },
  infoVal: { color: '#94a3b8', fontSize: 15 },
});
