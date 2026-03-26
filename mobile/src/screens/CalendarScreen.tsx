import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
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

export default function CalendarScreen({ onBack }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll().then((r) => r.data),
  });

  // Build marked dates from tasks with dueAt
  const markedDates: Record<string, any> = {};
  tasks.forEach((t) => {
    if (t.dueAt) {
      const dateStr = t.dueAt.split('T')[0];
      const existing = markedDates[dateStr];
      markedDates[dateStr] = {
        marked: true,
        dotColor: t.completed ? colors.green : colors.red,
        dots: [
          ...(existing?.dots ?? []),
          { color: t.completed ? colors.green : colors.amber },
        ],
      };
    }
  });

  // Highlight selected
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] ?? {}),
    selected: true,
    selectedColor: colors.violet,
  };

  const dayTasks = tasks.filter((t) => {
    if (!t.dueAt) return false;
    return t.dueAt.split('T')[0] === selectedDate;
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Calendar</Text>
      </View>

      <Calendar
        current={today}
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          backgroundColor: colors.bg,
          calendarBackground: colors.surface,
          textSectionTitleColor: colors.textMuted,
          selectedDayBackgroundColor: colors.violet,
          selectedDayTextColor: colors.white,
          todayTextColor: colors.violetLight,
          dayTextColor: colors.textPrimary,
          textDisabledColor: colors.textMuted,
          dotColor: colors.violetLight,
          selectedDotColor: colors.white,
          arrowColor: colors.violetLight,
          monthTextColor: colors.textPrimary,
          indicatorColor: colors.violetLight,
        }}
        style={styles.calendar}
      />

      <View style={styles.daySection}>
        <Text style={styles.dayTitle}>
          {selectedDate === today ? "Today's Tasks" : `Tasks on ${selectedDate}`}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.violetLight} style={{ marginTop: spacing.lg }} />
        ) : dayTasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks due on this date.</Text>
          </View>
        ) : (
          <FlatList
            data={dayTasks}
            keyExtractor={(t) => t._id}
            renderItem={({ item }) => (
              <View style={[styles.taskCard, item.completed && styles.taskDone]}>
                <Ionicons
                  name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={item.completed ? colors.green : colors.textMuted}
                />
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, item.completed && styles.taskDoneText]}>
                    {item.title}
                  </Text>
                  {item.estimateMins && (
                    <Text style={styles.taskMeta}>{item.estimateMins} min</Text>
                  )}
                </View>
                {item.aiPriority && (
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.aiPriority) + '30' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(item.aiPriority) }]}>
                      {item.aiPriority}
                    </Text>
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function getPriorityColor(priority: string) {
  if (priority === 'High') return colors.red;
  if (priority === 'Medium') return colors.amber;
  return colors.green;
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

  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  daySection: { flex: 1, padding: spacing.md },
  dayTitle: { ...typography.h3, marginBottom: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { ...typography.bodySmall, color: colors.textMuted },

  list: { gap: spacing.sm },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  taskDone: { opacity: 0.55 },
  taskInfo: { flex: 1 },
  taskTitle: { ...typography.body, fontWeight: '600' },
  taskDoneText: { textDecorationLine: 'line-through', color: colors.textMuted },
  taskMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  priorityText: { ...typography.caption, fontWeight: '700' },
});
