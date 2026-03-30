import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLeaderboard, addFriend, getSquad, createSquad, joinSquad } from '../lib/storage';

const TABS = ['Global', 'Friends', 'Squad'];

export default function SocialScreen() {
    const [activeTab, setActiveTab] = useState('Global');
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState({ global: [], friends: [] });
    const [squad, setSquadData] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState(''); // 'addFriend', 'createSquad', 'joinSquad'
    const [inputValue, setInputValue] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [lb, sq] = await Promise.all([getLeaderboard(), getSquad()]);
            setLeaderboard(lb);
            setSquadData(sq.squad);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async () => {
        if (!inputValue.trim()) return;
        try {
            if (modalMode === 'addFriend') {
                await addFriend(inputValue.trim());
                Alert.alert("Success", "Friend added!");
            } else if (modalMode === 'createSquad') {
                await createSquad(inputValue.trim());
                Alert.alert("Success", "Squad created!");
            } else if (modalMode === 'joinSquad') {
                await joinSquad(inputValue.trim().toUpperCase());
                Alert.alert("Success", "Joined Squad!");
            }
            setModalVisible(false);
            setInputValue('');
            fetchData();
        } catch (e) {
            Alert.alert("Error", e.message || "Action failed");
        }
    };

    const openModal = (mode) => {
        setModalMode(mode);
        setInputValue('');
        setModalVisible(true);
    };

    const renderUserRow = (user, index) => (
        <View key={user._id} style={s.userCard}>
            <View style={s.rankCircle}>
                <Text style={s.rankText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.username}>{user.username}</Text>
                <Text style={s.levelText}>Lvl {user.gamification?.level || 1} • Streak 🔥 {user.gamification?.currentStreak || 0}</Text>
            </View>
            <View style={s.xpBox}>
                <Text style={s.xpText}>{user.gamification?.xp || 0} XP</Text>
            </View>
        </View>
    );

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>Leaderboard</Text>
            </View>

            <View style={s.tabBar}>
                {TABS.map(t => (
                    <TouchableOpacity key={t} style={[s.tab, activeTab === t && s.tabActive]} onPress={() => setActiveTab(t)}>
                        <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={s.center}><ActivityIndicator size="large" color="#8b5cf6" /></View>
            ) : (
                <ScrollView contentContainerStyle={s.scrollContent}>
                    {activeTab === 'Global' && (
                        <>
                            {leaderboard.global.map((u, i) => renderUserRow(u, i))}
                        </>
                    )}

                    {activeTab === 'Friends' && (
                        <>
                            <TouchableOpacity style={s.actionBtn} onPress={() => openModal('addFriend')}>
                                <Ionicons name="person-add" size={20} color="#fff" />
                                <Text style={s.actionBtnText}>Add Friend by Username</Text>
                            </TouchableOpacity>
                            {leaderboard.friends.length === 0 ? (
                                <Text style={s.emptyText}>Add friends to start competing!</Text>
                            ) : (
                                leaderboard.friends.map((u, i) => renderUserRow(u, i))
                            )}
                        </>
                    )}

                    {activeTab === 'Squad' && (
                        <>
                            {!squad ? (
                                <View style={s.squadEmpty}>
                                    <Ionicons name="shield-outline" size={64} color="#8b5cf6" />
                                    <Text style={s.emptyText}>You are not in a Squad.</Text>
                                    <TouchableOpacity style={[s.actionBtn, {backgroundColor: '#8b5cf6', marginTop: 20}]} onPress={() => openModal('createSquad')}>
                                        <Text style={s.actionBtnText}>Create Squad</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[s.actionBtn, {backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#8b5cf6'}]} onPress={() => openModal('joinSquad')}>
                                        <Text style={[s.actionBtnText, {color: '#8b5cf6'}]}>Join via Invite Code</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={s.squadBox}>
                                    <Text style={s.squadTitle}>{squad.name}</Text>
                                    <Text style={s.inviteCode}>Invite Code: <Text style={{color: '#fff', fontWeight: 'bold'}}>{squad.inviteCode}</Text></Text>
                                    
                                    <View style={s.questBox}>
                                        <Text style={s.questTitle}>Weekly Squad Quest</Text>
                                        <Text style={s.questDesc}>{squad.currentQuest?.title}</Text>
                                        <View style={s.progressBar}><View style={[s.progressFill, { width: `${Math.min(100, ((squad.currentQuest?.current || 0) / (squad.currentQuest?.target || 1)) * 100)}%` }]} /></View>
                                        <Text style={s.questProgress}>{squad.currentQuest?.current || 0} / {squad.currentQuest?.target}</Text>
                                        <Text style={s.xpReward}>Reward: {squad.currentQuest?.xpReward} XP</Text>
                                    </View>

                                    <Text style={s.membersTitle}>Members</Text>
                                    {squad.members.map((m, i) => renderUserRow(m, i))}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            )}

            <Modal visible={modalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>
                                {modalMode === 'addFriend' ? 'Add Friend' : modalMode === 'createSquad' ? 'Create Squad' : 'Join Squad'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
                        </View>
                        <TextInput 
                            style={s.input} 
                            placeholder={modalMode === 'addFriend' ? "Username" : modalMode === 'createSquad' ? "Squad Name" : "INVITE CODE"}
                            placeholderTextColor="#475569"
                            value={inputValue}
                            onChangeText={setInputValue}
                            autoCapitalize={modalMode === 'joinSquad' ? "characters" : "none"}
                        />
                        <TouchableOpacity style={s.submitBtn} onPress={handleAction}>
                            <Text style={s.submitBtnText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 },
    title: { color: '#fff', fontSize: 28, fontWeight: '800' },
    tabBar: { flexDirection: 'row', backgroundColor: '#1e293b', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 15 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: '#8b5cf6' },
    tabText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
    tabTextActive: { color: '#fff' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    
    userCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    rankCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(139,92,246,0.2)', justifyContent: 'center', alignItems: 'center' },
    rankText: { color: '#8b5cf6', fontWeight: 'bold' },
    username: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    levelText: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
    xpBox: { backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    xpText: { color: '#10b981', fontWeight: 'bold', fontSize: 13 },

    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8b5cf6', padding: 14, borderRadius: 12, marginBottom: 15 },
    actionBtnText: { color: '#fff', fontWeight: 'bold' },
    emptyText: { color: '#64748b', textAlign: 'center', marginTop: 20 },

    squadEmpty: { alignItems: 'center', marginTop: 40 },
    squadBox: { },
    squadTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    inviteCode: { color: '#94a3b8', fontSize: 14, marginBottom: 20, marginTop: 5 },
    questBox: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#8b5cf6', marginBottom: 20 },
    questTitle: { color: '#8b5cf6', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 5 },
    questDesc: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', backgroundColor: '#10b981' },
    questProgress: { color: '#94a3b8', fontSize: 12, alignSelf: 'flex-end', marginBottom: 10 },
    xpReward: { color: '#f59e0b', fontWeight: 'bold', fontSize: 14 },
    membersTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15, color: '#fff', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    submitBtn: { backgroundColor: '#8b5cf6', padding: 16, borderRadius: 12, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
