import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAICoachAdvice, getAIRoast, getSupplementAdviceWithAI } from '../lib/storage';

export default function AICoachModal({ visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState('');
  const [roast, setRoast] = useState('');

  const fetchAdvice = async (type) => {
    setLoading(true);
    setAdvice('');
    setRoast('');
    try {
      if (type === 'coach') {
        const res = await getAICoachAdvice();
        if (res?.advice) setAdvice(res.advice);
      } else if (type === 'roast') {
        const res = await getAIRoast();
        if (res?.roast) setRoast(res.roast);
      } else if (type === 'supplements') {
        const res = await getSupplementAdviceWithAI();
        if (res?.supplements) setAdvice(res.supplements);
      }
    } catch (e) {
      if (type === 'roast') setRoast("You're too weak right now, even my roasts won't connect. Try again later!");
      else setAdvice("The Oracle is currently disconnected. Try again later!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.modalContent}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
          
          <Text style={s.title}><Ionicons name="sparkles" size={20} color="#8b5cf6" /> AI Oracle</Text>
          <Text style={s.subtitle}>Consult the AI Oracle for gym insights, supplements, or a brutal roast.</Text>
          
          <View style={s.buttonsRow}>
            <TouchableOpacity style={[s.btn, { backgroundColor: '#8b5cf6' }]} onPress={() => fetchAdvice('coach')} disabled={loading}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
              <Text style={s.btnText}>Gym Advice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: '#f43f5e' }]} onPress={() => fetchAdvice('roast')} disabled={loading}>
              <Ionicons name="flame-outline" size={18} color="#fff" />
              <Text style={s.btnText}>Roast</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[s.btn, { backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: '#10b981', marginBottom: 20 }]} onPress={() => fetchAdvice('supplements')} disabled={loading}>
            <Text style={[s.btnText, { color: '#10b981' }]}>💊 Suggest Supplements</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={s.loader}>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={s.loaderText}>The Oracle is analyzing...</Text>
            </View>
          ) : (
            <ScrollView style={[s.resultBox, (advice || roast) ? {} : { display: 'none' }]}>
              {roast ? (
                <View style={s.roastContainer}>
                  <Text style={s.roastQuote}>"</Text>
                  <Text style={s.roastText}>{roast}</Text>
                </View>
              ) : (
                <Text style={s.adviceText}>{advice}</Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 24, width: '100%', maxHeight: '80%', padding: 20, borderWidth: 1, borderColor: '#334155' },
  closeBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 14, marginBottom: 20 },
  buttonsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  loader: { alignItems: 'center', paddingVertical: 40 },
  loaderText: { color: '#8b5cf6', marginTop: 12, fontSize: 15 },
  resultBox: { backgroundColor: 'rgba(139,92,246,0.05)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  adviceText: { color: '#e2e8f0', fontSize: 15, lineHeight: 24 },
  roastContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  roastQuote: { fontSize: 30, color: '#f43f5e', opacity: 0.5, lineHeight: 30 },
  roastText: { color: '#fca5a5', fontSize: 16, fontStyle: 'italic', lineHeight: 24, flex: 1 }
});
