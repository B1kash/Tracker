import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { logout, getMe, updateProfile, updatePassword, togglePrivacy, updateGamificationSettings, getGamificationData } from '../lib/storage';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [weeklyTrainDays, setWeeklyTrainDays] = useState(4);
  
  const [profile, setProfile] = useState({ name: '', height: '', targetWeight: '', targetBmi: '' });
  const [profilePic, setProfilePic] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    Promise.all([
      getMe().catch(() => null),
      getGamificationData().catch(() => null)
    ]).then(([data, gam]) => {
      if (data) {
        setIsPrivate(data.isPrivate || false);
        setProfile({
          name: data.name || '',
          height: data.height ? String(data.height) : '',
          targetWeight: data.targetWeight ? String(data.targetWeight) : '',
          targetBmi: data.targetBmi ? String(data.targetBmi) : '',
        });
        if (data.profilePic) setProfilePic(data.profilePic);
      }
      if (gam?.weeklyTrainDays) setWeeklyTrainDays(gam.weeklyTrainDays);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true
    });
    if (!result.canceled) {
      const b64 = `data:${result.assets[0].mimeType || 'image/jpeg'};base64,${result.assets[0].base64}`;
      setProfilePic(b64);
      saveProfile(result.assets[0].base64, result.assets[0].mimeType);
    }
  };

  const saveProfile = async (base64Data = null, mimeType = null) => {
    setSaving(true);
    try {
      const payload = {
        name: profile.name,
        height: Number(profile.height) || null,
        targetWeight: Number(profile.targetWeight) || null,
        targetBmi: Number(profile.targetBmi) || null
      };
      if (base64Data) {
        payload.profilePicBase64 = `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;
        payload.profilePicMime = mimeType || 'image/jpeg';
      }
      await updateProfile(payload);
      if (!base64Data) Alert.alert('Success', 'Profile updated successfully!');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  const savePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) return Alert.alert('Error', 'Both password fields are required');
    try {
      await updatePassword(passwords);
      Alert.alert('Success', 'Password updated successfully!');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      const data = await togglePrivacy();
      setIsPrivate(data.isPrivate);
      Alert.alert('Success', `Account is now ${data.isPrivate ? 'Private' : 'Public'}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSaveTrainingDays = async (days) => {
    setWeeklyTrainDays(days);
    try { await updateGamificationSettings({ weeklyTrainDays: days }); }
    catch (e) { Alert.alert('Error', 'Failed to save training target'); }
  };
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

  if (loading) return <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color="#8b5cf6" size="large" /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      
      {/* Profile Section */}
      <View style={s.section}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View>
              <Text style={s.sectionTitle}>Profile Details</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>Set your targets for accurate BMI.</Text>
            </View>
            <TouchableOpacity onPress={pickImage} style={s.avatarContainer}>
              {profilePic ? <Image source={{ uri: profilePic }} style={s.avatar} /> : <View style={s.avatarPlaceholder}><Ionicons name="person" size={24} color="#fff" /></View>}
              <View style={s.avatarBadge}><Ionicons name="camera" size={12} color="#fff" /></View>
            </TouchableOpacity>
        </View>

        <Text style={s.fieldLabel}>Display Name</Text>
        <TextInput style={s.input} value={profile.name} onChangeText={v => setProfile(p => ({ ...p, name: v }))} placeholder="Your name" placeholderTextColor="#475569" />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Height (cm)</Text>
            <TextInput style={s.input} keyboardType="numeric" value={profile.height} onChangeText={v => setProfile(p => ({ ...p, height: v }))} placeholder="180" placeholderTextColor="#475569" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Target Weight (kg)</Text>
            <TextInput style={s.input} keyboardType="numeric" value={profile.targetWeight} onChangeText={v => setProfile(p => ({ ...p, targetWeight: v }))} placeholder="75" placeholderTextColor="#475569" />
          </View>
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={() => saveProfile()}>
            <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
        </TouchableOpacity>
      </View>

      {/* Security Section */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Security</Text>
        
        <Text style={s.fieldLabel}>Current Password</Text>
        <TextInput style={s.input} secureTextEntry value={passwords.currentPassword} onChangeText={v => setPasswords(p => ({ ...p, currentPassword: v }))} placeholder="••••••" placeholderTextColor="#475569" />

        <Text style={s.fieldLabel}>New Password</Text>
        <TextInput style={s.input} secureTextEntry value={passwords.newPassword} onChangeText={v => setPasswords(p => ({ ...p, newPassword: v }))} placeholder="••••••" placeholderTextColor="#475569" />

        <TouchableOpacity style={s.saveBtn} onPress={savePassword}>
            <Text style={s.saveBtnText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Section */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Privacy</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: '#e2e8f0', fontWeight: '600', fontSize: 15 }}>Account Visibility</Text>
            <Text style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
              {isPrivate ? '🔒 Private – Hidden from leaderboards' : '🌍 Public – Visible on leaderboards'}
            </Text>
          </View>
          <TouchableOpacity style={[s.saveBtn, { paddingHorizontal: 16, paddingVertical: 10, marginTop: 0 }]} onPress={handleTogglePrivacy}>
            <Text style={s.saveBtnText}>{isPrivate ? 'Make Public' : 'Make Private'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Training Days Section */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Weekly Goal</Text>
        <Text style={{ color: '#e2e8f0', fontWeight: '600', fontSize: 15, marginBottom: 12 }}>Target Training Days / Week</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[2, 3, 4, 5, 6, 7].map(d => (
            <TouchableOpacity
              key={d}
              onPress={() => handleSaveTrainingDays(d)}
              style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: weeklyTrainDays === d ? '#8b5cf6' : 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: weeklyTrainDays === d ? '#8b5cf6' : 'rgba(255,255,255,0.08)' }}
            >
              <Text style={{ color: weeklyTrainDays === d ? '#fff' : '#64748b', fontWeight: '700', fontSize: 16 }}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
  fieldLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, color: '#fff', fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  saveBtn: { backgroundColor: '#8b5cf6', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#8b5cf6' },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  avatarBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#8b5cf6', borderRadius: 10, padding: 4, borderWidth: 2, borderColor: '#1e293b' }
});
