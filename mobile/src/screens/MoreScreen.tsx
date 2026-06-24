import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { colors, spacing, radius, typography } from '../theme/colors';
import CalendarScreen from './CalendarScreen';
import MindfulnessScreen from './MindfulnessScreen';

type SubScreen = 'menu' | 'calendar' | 'mindfulness';

const MENU_ITEMS = [
  {
    key: 'calendar' as SubScreen,
    icon: 'calendar',
    label: 'Calendar',
    description: 'View tasks on a calendar',
    color: colors.blue,
  },
  {
    key: 'mindfulness' as SubScreen,
    icon: 'leaf',
    label: 'Mindfulness',
    description: 'Audio-guided relaxation sessions',
    color: colors.green,
  },
];

const CONNECTORS = [
  {
    id: 'gmail',
    icon: 'mail',
    label: 'Gmail',
    description: 'Sync emails as tasks',
    color: '#ea4335',
    urlEndpoint: '/integrations/google/url',
  },
  {
    id: 'slack',
    icon: 'chatbubbles',
    label: 'Slack',
    description: 'Turn messages into tasks',
    color: '#611f69',
    urlEndpoint: '/integrations/slack/url',
  },
  {
    id: 'gcal',
    icon: 'calendar-outline',
    label: 'Google Calendar',
    description: 'Sync events with deadlines',
    color: '#1a73e8',
    urlEndpoint: '/integrations/google/url',
  },
];

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

async function getConnectorUrl(endpoint: string): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const res = await axios.get(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.url || null;
  } catch {
    return null;
  }
}

export default function MoreScreen() {
  const [active, setActive] = useState<SubScreen>('menu');
  const [connectorStatus, setConnectorStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const res = await axios.get(`${API_URL}/integrations/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const s = res.data;
        setConnectorStatus({
          gmail: !!s?.gmail?.connected,
          gcal:  !!s?.gcal?.connected,
          slack: !!s?.slack?.connected,
        });
      } catch {
        // ignore
      }
    })();
  }, []);

  async function openConnector(item: typeof CONNECTORS[0]) {
    const url = await getConnectorUrl(item.urlEndpoint);
    if (!url) {
      Alert.alert('Error', 'Could not start connection. Please try again.');
      return;
    }
    Linking.openURL(url);
  }

  if (active === 'calendar') {
    return <CalendarScreen onBack={() => setActive('menu')} />;
  }
  if (active === 'mindfulness') {
    return <MindfulnessScreen onBack={() => setActive('menu')} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>More</Text>

        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuItem}
            onPress={() => setActive(item.key)}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={26} color={item.color} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionLabel}>Connectors</Text>

        {CONNECTORS.map((item) => {
          const isConnected = !!connectorStatus[item.id];
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => openConnector(item)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={26} color={item.color} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.description}</Text>
              </View>
              {isConnected ? (
                <View style={[styles.soonBadge, styles.connectedBadge]}>
                  <Text style={[styles.soonText, styles.connectedText]}>Connected</Text>
                </View>
              ) : (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>Connect</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  title: { ...typography.h2, marginBottom: spacing.sm },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { flex: 1, gap: 2 },
  menuLabel: { ...typography.body, fontWeight: '600' },
  menuDesc: { ...typography.bodySmall, color: colors.textMuted },
  sectionLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  soonBadge: {
    backgroundColor: colors.border,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  soonText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  connectedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  connectedText: {
    color: colors.green,
  },
});
