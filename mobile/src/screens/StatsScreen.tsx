import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from 'react-native-chart-kit';

import { statsApi } from '../services/api';
import { colors, spacing, radius, typography } from '../theme/colors';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - spacing.md * 2 - 2; // full width minus padding

type Tab = 'weekly' | 'monthly';

interface WeeklyData {
  tasksPerDay?: number[];
  focusPerDay?: number[];
  labels?: string[];
  streak?: number;
  totalTasks?: number;
  totalFocusMins?: number;
}

interface MonthlyData {
  tasksPerWeek?: number[];
  focusPerWeek?: number[];
  labels?: string[];
  streak?: number;
  totalTasks?: number;
  totalFocusMins?: number;
}

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
  labelColor: () => colors.textMuted,
  strokeWidth: 2,
  barPercentage: 0.6,
  decimalPlaces: 0,
  propsForBackgroundLines: {
    stroke: colors.border,
  },
};

const focusChartConfig = {
  ...chartConfig,
  color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
};

export default function StatsScreen() {
  const [tab, setTab] = useState<Tab>('weekly');

  const { data: weekly, isLoading: loadingWeekly } = useQuery<WeeklyData>({
    queryKey: ['stats', 'weekly'],
    queryFn: () => statsApi.weekly().then((r) => r.data),
    enabled: tab === 'weekly',
  });

  const { data: monthly, isLoading: loadingMonthly } = useQuery<MonthlyData>({
    queryKey: ['stats', 'monthly'],
    queryFn: () => statsApi.monthly().then((r) => r.data),
    enabled: tab === 'monthly',
  });

  const isLoading = tab === 'weekly' ? loadingWeekly : loadingMonthly;
  const d = tab === 'weekly' ? weekly : monthly;

  const taskLabels = d?.labels ?? (tab === 'weekly'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['W1', 'W2', 'W3', 'W4']);
  const taskData = (tab === 'weekly' ? (d as WeeklyData)?.tasksPerDay : (d as MonthlyData)?.tasksPerWeek) ?? taskLabels.map(() => 0);
  const focusData = (tab === 'weekly' ? (d as WeeklyData)?.focusPerDay : (d as MonthlyData)?.focusPerWeek) ?? taskLabels.map(() => 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Statistics</Text>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['weekly', 'monthly'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'weekly' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.violetLight} size="large" />
          </View>
        ) : (
          <>
            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <SummaryCard
                icon="checkmark-circle"
                color={colors.green}
                value={d?.totalTasks ?? 0}
                label="Tasks Done"
              />
              <SummaryCard
                icon="timer"
                color={colors.violet}
                value={d?.totalFocusMins ?? 0}
                label="Focus Mins"
              />
              <SummaryCard
                icon="flame"
                color={colors.amber}
                value={d?.streak ?? 0}
                label="Day Streak"
              />
            </View>

            {/* Tasks Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>✅ Tasks Completed</Text>
              <BarChart
                data={{
                  labels: taskLabels,
                  datasets: [{ data: taskData.length > 0 ? taskData : [0] }],
                }}
                width={CHART_W - spacing.md * 2}
                height={180}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
                yAxisLabel=""
                yAxisSuffix=""
              />
            </View>

            {/* Focus Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>🎯 Focus Minutes</Text>
              <BarChart
                data={{
                  labels: taskLabels,
                  datasets: [{ data: focusData.length > 0 ? focusData : [0] }],
                }}
                width={CHART_W - spacing.md * 2}
                height={180}
                chartConfig={focusChartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
                yAxisLabel=""
                yAxisSuffix=""
              />
            </View>

            {/* Motivational Message */}
            <View style={styles.motiveBanner}>
              <Text style={styles.motiveText}>
                {(d?.totalTasks ?? 0) > 0
                  ? `🎉 You completed ${d?.totalTasks} task${(d?.totalTasks ?? 0) > 1 ? 's' : ''}${tab === 'weekly' ? ' this week' : ' this month'}! Keep it up!`
                  : `💪 Start small — even one task counts. You've got this!`}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
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
    <View style={[summaryStyles.card, { borderColor: color + '40' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[summaryStyles.value, { color }]}>{value}</Text>
      <Text style={summaryStyles.label}>{label}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  value: { fontSize: 22, fontWeight: '700' },
  label: { ...typography.caption, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  title: { ...typography.h2 },

  tabRow: { flexDirection: 'row', gap: spacing.sm },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.violet + '30',
    borderColor: colors.violetLight,
  },
  tabText: { ...typography.label, color: colors.textMuted },
  tabTextActive: { color: colors.violetLight },

  summaryRow: { flexDirection: 'row', gap: spacing.sm },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  chartTitle: { ...typography.h3 },
  chart: { borderRadius: radius.md, marginHorizontal: -spacing.sm },

  motiveBanner: {
    backgroundColor: colors.violet + '20',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.violet + '40',
    padding: spacing.md,
  },
  motiveText: { ...typography.bodySmall, color: colors.violetLight, lineHeight: 20 },
});
