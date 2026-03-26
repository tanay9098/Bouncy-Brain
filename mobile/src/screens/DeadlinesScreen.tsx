import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { tasksApi } from '../services/api';
import { colors, spacing, radius, typography } from '../theme/colors';

interface Task {
  _id: string;
  title: string;
  completed: boolean;
  dueAt?: string;
  estimateMins?: number;
  aiPriority?: string;
}

type Props = { onBack: () => void };

function getDaysUntil(dueAt: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueAt);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return colors.red;
  if (days === 0) return colors.red;
  if (days <= 2) return colors.amber;
  if (days <= 7) return colors.blue;
  return colors.green;
}

function urgencyLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today!';
  if (days === 1) return 'Due tomorrow';
  return `${days} days left`;
}

export default function DeadlinesScreen({ onBack }: Props) {
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll().then((r) => r.data),
  });

  const deadlineTasks = tasks
    .filter((t) => t.dueAt && !t.completed)
    .map((t) => ({ ...t, daysUntil: getDaysUntil(t.dueAt!) }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const overdue = deadlineTasks.filter((t) => t.daysUntil < 0);
  const upcoming = deadlineTasks.filter((t) => t.daysUntil >= 0);

  const renderTask = ({ item }: { item: Task & { daysUntil: number } }) => {
    const uc = urgencyColor(item.daysUntil);
    return (
      <View style={[styles.taskCard, { borderLeftColor: uc, borderLeftWidth: 3 }]}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View style={styles.taskMeta}>
            <Text style={[styles.urgencyText, { color: uc }]}>
              {urgencyLabel(item.daysUntil)}
            </Text>
            {item.estimateMins && (
              <Text style={styles.metaText}>· {item.estimateMins}m</Text>
            )}
          </View>
        </View>
        <View style={[styles.daysBadge, { backgroundColor: uc + '20' }]}>
          <Text style={[styles.daysNum, { color: uc }]}>
            {item.daysUntil < 0 ? item.daysUntil : `+${item.daysUntil}`}
          </Text>
          <Text style={[styles.daysUnit, { color: uc }]}>days</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Deadlines</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.violetLight} size="large" />
        </View>
      ) : deadlineTasks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>No upcoming deadlines!</Text>
          <Text style={styles.emptyText}>Add due dates to tasks to see them here.</Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...(overdue.length > 0 ? [{ _id: 'overdue-header', isHeader: true, label: `⚠️ Overdue (${overdue.length})` }] : []),
            ...overdue,
            ...(upcoming.length > 0 ? [{ _id: 'upcoming-header', isHeader: true, label: `📅 Upcoming (${upcoming.length})` }] : []),
            ...upcoming,
          ] as any[]}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            if (item.isHeader) {
              return <Text style={styles.sectionHeader}>{item.label}</Text>;
            }
            return renderTask({ item });
          }}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2 },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...typography.h3, textAlign: 'center' },
  emptyText: { ...typography.bodySmall, textAlign: 'center', color: colors.textMuted },

  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  sectionHeader: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  taskInfo: { flex: 1, gap: 4 },
  taskTitle: { ...typography.body, fontWeight: '600' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  urgencyText: { ...typography.bodySmall, fontWeight: '600' },
  metaText: { ...typography.bodySmall, color: colors.textMuted },

  daysBadge: {
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 48,
  },
  daysNum: { fontSize: 18, fontWeight: '800' },
  daysUnit: { ...typography.caption },
});
