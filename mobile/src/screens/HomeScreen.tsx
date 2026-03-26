import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useUser } from '../contexts/UserContext';
import { useEnergy } from '../contexts/EnergyContext';
import { tasksApi, statsApi } from '../services/api';
import { colors, spacing, radius, typography } from '../theme/colors';

const ENERGY_OPTS = [
  { level: 1, emoji: '💀', label: 'Crashed' },
  { level: 2, emoji: '😴', label: 'Low' },
  { level: 3, emoji: '😐', label: 'Okay' },
  { level: 4, emoji: '😊', label: 'Good' },
  { level: 5, emoji: '🔥', label: 'High' },
];

const AFFIRMATIONS = [
  "Your brain works differently — that's a superpower.",
  "One small step counts. Always.",
  "Progress, not perfection.",
  "You showed up today. That matters.",
  "Small wins build big momentum.",
];

export default function HomeScreen() {
  const { user, logout } = useUser();
  const { energy, setEnergy } = useEnergy();
  const [refreshing, setRefreshing] = useState(false);

  const affirmation = AFFIRMATIONS[new Date().getDay() % AFFIRMATIONS.length];

  const { data: whatNext, refetch: refetchWhatNext, isLoading: loadingWhatNext } = useQuery({
    queryKey: ['whatNext', energy],
    queryFn: () => tasksApi.whatNext(energy).then((r) => r.data),
    enabled: true,
  });

  const { data: dailyStats, refetch: refetchStats } = useQuery({
    queryKey: ['dailyStats'],
    queryFn: () => statsApi.daily().then((r) => r.data),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchWhatNext(), refetchStats()]);
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.violetLight}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.name ?? 'Friend'} 👋</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Affirmation Banner */}
        <View style={styles.affirmBanner}>
          <Text style={styles.affirmText}>✨ {affirmation}</Text>
        </View>

        {/* Energy Check-In */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How's your energy right now?</Text>
          <View style={styles.energyRow}>
            {ENERGY_OPTS.map((opt) => (
              <TouchableOpacity
                key={opt.level}
                style={[
                  styles.energyBtn,
                  energy === opt.level && styles.energyBtnActive,
                ]}
                onPress={() => setEnergy(opt.level)}
              >
                <Text style={styles.energyEmoji}>{opt.emoji}</Text>
                <Text style={[styles.energyLabel, energy === opt.level && styles.energyLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* What Next */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚡ What Next?</Text>
            <TouchableOpacity onPress={() => refetchWhatNext()} style={styles.refreshBtn}>
              <Ionicons name="refresh-outline" size={18} color={colors.violetLight} />
            </TouchableOpacity>
          </View>

          {loadingWhatNext ? (
            <ActivityIndicator color={colors.violetLight} style={{ marginVertical: spacing.md }} />
          ) : whatNext?.task ? (
            <View style={styles.whatNextCard}>
              <Text style={styles.whatNextTitle}>{whatNext.task.title}</Text>
              <View style={styles.taskMeta}>
                {whatNext.task.estimateMins && (
                  <View style={styles.chip}>
                    <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.chipText}>{whatNext.task.estimateMins}m</Text>
                  </View>
                )}
                {whatNext.task.aiPriority && (
                  <View style={[styles.chip, styles.chipPriority]}>
                    <Text style={styles.chipText}>{whatNext.task.aiPriority}</Text>
                  </View>
                )}
              </View>
              {whatNext.reason && (
                <Text style={styles.whatNextReason}>💡 {whatNext.reason}</Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>🎉 No pending tasks! Take a break.</Text>
            </View>
          )}
        </View>

        {/* Daily Stats */}
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="checkmark-circle"
            color={colors.green}
            value={dailyStats?.tasksCompleted ?? 0}
            label="Tasks Done"
          />
          <StatCard
            icon="timer"
            color={colors.violet}
            value={dailyStats?.focusMinutes ?? 0}
            label="Focus Mins"
          />
          <StatCard
            icon="flame"
            color={colors.amber}
            value={dailyStats?.streak ?? 0}
            label="Day Streak"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  color,
  value,
  label,
}: {
  icon: string;
  color: string;
  value: number;
  label: string;
}) {
  return (
    <View style={[statStyles.card, { borderColor: color + '40' }]}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: { fontSize: 24, fontWeight: '700' },
  label: { ...typography.caption, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { ...typography.bodySmall, color: colors.textMuted },
  userName: { ...typography.h2 },
  logoutBtn: { padding: spacing.xs },

  affirmBanner: {
    backgroundColor: colors.violet + '20',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.violet + '40',
    padding: spacing.md,
  },
  affirmText: { ...typography.bodySmall, color: colors.violetLight, lineHeight: 20 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { ...typography.h3, marginBottom: spacing.xs },
  refreshBtn: { padding: spacing.xs },

  energyRow: { flexDirection: 'row', gap: spacing.xs },
  energyBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  energyBtnActive: {
    backgroundColor: colors.violet + '30',
    borderColor: colors.violetLight,
  },
  energyEmoji: { fontSize: 20 },
  energyLabel: { ...typography.caption },
  energyLabelActive: { color: colors.violetLight },

  whatNextCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  whatNextTitle: { ...typography.body, fontWeight: '600' },
  taskMeta: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipPriority: { backgroundColor: colors.violet + '30' },
  chipText: { ...typography.caption },
  whatNextReason: { ...typography.bodySmall, color: colors.textMuted, fontStyle: 'italic' },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: { ...typography.bodySmall },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
});
