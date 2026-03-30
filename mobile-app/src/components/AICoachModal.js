import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAICoachAdvice, getAIRoast, getSupplementAdviceWithAI } from '../lib/storage';

// ─── Minimal Markdown Renderer ───
// Renders AI markdown text (**, ##, -, *) into native styled Text components
function MarkdownText({ content, style = {} }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <View style={{ gap: 6 }}>
      {lines.map((line, i) => {
        // Skip blank lines but preserve spacing
        if (!line.trim()) return <View key={i} style={{ height: 6 }} />;

        // H2 heading: ## text
        if (line.startsWith('## ')) {
          return (
            <Text key={i} style={[styles.mdH2, style]}>
              {parseInline(line.slice(3))}
            </Text>
          );
        }

        // H3 heading: ### text
        if (line.startsWith('### ')) {
          return (
            <Text key={i} style={[styles.mdH3, style]}>
              {parseInline(line.slice(4))}
            </Text>
          );
        }

        // Bullet point: - text or * text
        if (line.match(/^[-*•]\s/)) {
          return (
            <View key={i} style={styles.mdBulletRow}>
              <Text style={[styles.mdBulletDot, style]}>•</Text>
              <Text style={[styles.mdBody, { flex: 1 }, style]}>
                {parseInline(line.slice(2).trim())}
              </Text>
            </View>
          );
        }

        // Numbered list: 1. text
        const numMatch = line.match(/^(\d+)\.\s(.+)/);
        if (numMatch) {
          return (
            <View key={i} style={styles.mdBulletRow}>
              <Text style={[styles.mdNum, style]}>{numMatch[1]}.</Text>
              <Text style={[styles.mdBody, { flex: 1 }, style]}>
                {parseInline(numMatch[2])}
              </Text>
            </View>
          );
        }

        // Normal paragraph
        return (
          <Text key={i} style={[styles.mdBody, style]}>
            {parseInline(line)}
          </Text>
        );
      })}
    </View>
  );
}

// Parse inline **bold** and *italic*
function parseInline(text) {
  const parts = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0, match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'normal', text: text.slice(last, match.index) });
    }
    if (match[1]) parts.push({ type: 'bold', text: match[1] });
    else if (match[2]) parts.push({ type: 'italic', text: match[2] });
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push({ type: 'normal', text: text.slice(last) });

  if (parts.length === 0) return text;

  return (
    <Text>
      {parts.map((p, i) => (
        <Text
          key={i}
          style={
            p.type === 'bold'
              ? { fontWeight: '800', color: '#fff' }
              : p.type === 'italic'
              ? { fontStyle: 'italic', color: '#cbd5e1' }
              : {}
          }
        >
          {p.text}
        </Text>
      ))}
    </Text>
  );
}

// ─── Tab Config ───
const TABS = [
  { key: 'coach',       label: 'Coach',       icon: 'chatbubble-ellipses-outline', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { key: 'supplements', label: 'Supplements', icon: 'flask-outline',               color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  { key: 'roast',       label: 'Roast Me 🔥', icon: 'flame-outline',               color: '#f43f5e', bg: 'rgba(244,63,94,0.12)'   },
];

// ─── Main Component ───
export default function AICoachModal({ visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('coach');
  const [results, setResults] = useState({ coach: '', supplements: '', roast: '' });

  const activeConfig = TABS.find(t => t.key === activeTab);

  const fetchForTab = async (tab) => {
    setActiveTab(tab);
    if (results[tab]) return; // Already loaded, don't re-fetch

    setLoading(true);
    try {
      if (tab === 'coach') {
        const res = await getAICoachAdvice();
        setResults(r => ({ ...r, coach: res?.advice || res?.message || 'No advice received.' }));
      } else if (tab === 'supplements') {
        const res = await getSupplementAdviceWithAI();
        setResults(r => ({ ...r, supplements: res?.supplements || res?.advice || res?.message || 'No supplement data received.' }));
      } else if (tab === 'roast') {
        const res = await getAIRoast();
        setResults(r => ({ ...r, roast: res?.roast || res?.message || 'The Oracle spared you today.' }));
      }
    } catch (e) {
      const fallback = tab === 'roast'
        ? "You're too weak right now, even my roasts won't connect. Try again later!"
        : "The Oracle is currently disconnected. Try again later!";
      setResults(r => ({ ...r, [tab]: fallback }));
    }
    setLoading(false);
  };

  const content = results[activeTab];
  const isRoast = activeTab === 'roast';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={[s.headerIcon, { backgroundColor: activeConfig.bg }]}>
                <Ionicons name="sparkles" size={20} color={activeConfig.color} />
              </View>
              <View>
                <Text style={s.title}>AI Oracle</Text>
                <Text style={s.subtitle}>Powered by Gemini AI</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Tab Bar */}
          <View style={s.tabBar}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[s.tab, activeTab === tab.key && { backgroundColor: tab.bg, borderColor: tab.color }]}
                onPress={() => fetchForTab(tab.key)}
                disabled={loading}
              >
                <Ionicons name={tab.icon} size={15} color={activeTab === tab.key ? tab.color : '#64748b'} />
                <Text style={[s.tabText, activeTab === tab.key && { color: tab.color }]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <ScrollView style={s.contentArea} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={s.loader}>
                <ActivityIndicator size="large" color={activeConfig.color} />
                <Text style={[s.loaderTitle, { color: activeConfig.color }]}>
                  {activeTab === 'supplements' ? '🔬 Analyzing your training...' :
                   activeTab === 'roast' ? '🔥 Preparing your roast...' :
                   '🧠 Consulting the Oracle...'}
                </Text>
                <Text style={s.loaderSub}>This may take a few seconds</Text>
              </View>
            ) : content ? (
              <View style={[s.resultCard, { borderColor: activeConfig.color + '40' }]}>
                {/* Result Header */}
                <View style={[s.resultHeader, { backgroundColor: activeConfig.bg }]}>
                  <Ionicons name={activeConfig.icon} size={16} color={activeConfig.color} />
                  <Text style={[s.resultTitle, { color: activeConfig.color }]}>
                    {activeTab === 'coach' ? 'Personalized Advice' :
                     activeTab === 'supplements' ? 'Supplement Recommendations' :
                     '🔥 Your Roast'}
                  </Text>
                </View>

                {/* Result Body */}
                <View style={s.resultBody}>
                  {isRoast ? (
                    <View style={s.roastContainer}>
                      <Text style={s.roastQuoteMark}>"</Text>
                      <MarkdownText content={content} style={{ color: '#fca5a5', fontSize: 16 }} />
                      <Text style={[s.roastQuoteMark, { alignSelf: 'flex-end' }]}>"</Text>
                    </View>
                  ) : (
                    <MarkdownText content={content} />
                  )}
                </View>

                {/* Refresh button */}
                <TouchableOpacity
                  style={[s.refreshBtn, { borderColor: activeConfig.color }]}
                  onPress={() => {
                    setResults(r => ({ ...r, [activeTab]: '' }));
                    fetchForTab(activeTab);
                  }}
                >
                  <Ionicons name="refresh-outline" size={14} color={activeConfig.color} />
                  <Text style={[s.refreshText, { color: activeConfig.color }]}>Regenerate</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.emptyState}>
                <Text style={s.emptyIcon}>
                  {activeTab === 'coach' ? '🧠' : activeTab === 'supplements' ? '💊' : '🔥'}
                </Text>
                <Text style={s.emptyTitle}>
                  {activeTab === 'coach' ? 'Get AI Gym Coaching' :
                   activeTab === 'supplements' ? 'Supplement Analysis' :
                   'Get Brutally Roasted'}
                </Text>
                <Text style={s.emptyDesc}>
                  {activeTab === 'coach' ? 'Your personal AI coach analyzes your recent workouts and gives tailored advice.' :
                   activeTab === 'supplements' ? 'Based on your training style, the AI recommends science-backed supplements.' :
                   'The AI Oracle will judge your fitness journey... mercilessly.'}
                </Text>
                <TouchableOpacity
                  style={[s.fetchBtn, { backgroundColor: activeConfig.color }]}
                  onPress={() => fetchForTab(activeTab)}
                >
                  <Ionicons name={activeConfig.icon} size={18} color="#fff" />
                  <Text style={s.fetchBtnText}>
                    {activeTab === 'coach' ? 'Get Advice' :
                     activeTab === 'supplements' ? 'Analyze Supplements' : 'Roast Me!'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Disclaimer */}
          <Text style={s.disclaimer}>
            ⚠️ AI advice is for informational purposes only — not a substitute for professional advice.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mdH2: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 6, marginBottom: 2 },
  mdH3: { color: '#e2e8f0', fontSize: 15, fontWeight: '700', marginTop: 4 },
  mdBody: { color: '#cbd5e1', fontSize: 15, lineHeight: 24 },
  mdBulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  mdBulletDot: { color: '#8b5cf6', fontSize: 16, lineHeight: 24, width: 16 },
  mdNum: { color: '#8b5cf6', fontWeight: '700', fontSize: 15, lineHeight: 24, width: 24 },
});

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 0 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#475569', fontSize: 12, marginTop: 2 },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.06)', padding: 9, borderRadius: 12 },

  // Tab bar
  tabBar: { flexDirection: 'row', gap: 8, padding: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' },
  tabText: { color: '#64748b', fontWeight: '700', fontSize: 11 },

  // Content
  contentArea: { paddingHorizontal: 16, paddingBottom: 8 },

  // Loader
  loader: { alignItems: 'center', paddingVertical: 50, gap: 14 },
  loaderTitle: { fontSize: 17, fontWeight: '700' },
  loaderSub: { color: '#475569', fontSize: 13 },

  // Result card
  resultCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  resultTitle: { fontWeight: '700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  resultBody: { padding: 16 },

  // Roast
  roastContainer: { gap: 8 },
  roastQuoteMark: { fontSize: 36, color: '#f43f5e', opacity: 0.4, lineHeight: 36 },

  // Refresh
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, margin: 12, marginTop: 0, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  refreshText: { fontWeight: '700', fontSize: 13 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 10, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyDesc: { color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  fetchBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  fetchBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Disclaimer
  disclaimer: { color: '#334155', fontSize: 11, textAlign: 'center', paddingHorizontal: 20, paddingVertical: 14 },
});
