import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
  },
  {
    id: 'slack',
    icon: 'chatbubbles',
    label: 'Slack',
    description: 'Turn messages into tasks',
    color: '#611f69',
  },
  {
    id: 'gcal',
    icon: 'calendar-outline',
    label: 'Google Calendar',
    description: 'Sync events with deadlines',
    color: '#1a73e8',
  },
];

export default function MoreScreen() {
  const [active, setActive] = useState<SubScreen>('menu');

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

        {CONNECTORS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={26} color={item.color} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.description}</Text>
            </View>
            <View style={styles.soonBadge}>
              <Text style={styles.soonText}>Soon</Text>
            </View>
          </TouchableOpacity>
        ))}
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
});
