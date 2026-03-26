import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Vibration,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { useTimerStore } from '../stores/timerStore';
import { sessionsApi } from '../services/api';
import { colors, spacing, radius, typography } from '../theme/colors';

const CIRCLE_SIZE = 240;
const RADIUS = 100;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PRESETS = [
  { label: 'Pomodoro', work: 25, brk: 5 },
  { label: 'Short', work: 15, brk: 3 },
  { label: 'Deep Work', work: 50, brk: 10 },
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function FocusScreen() {
  const {
    phase,
    secondsLeft,
    isRunning,
    sessionCount,
    workDuration,
    breakDuration,
    subject,
    actions,
  } = useTimerStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState(subject);
  const prevPhaseRef = useRef(phase);

  // Tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => actions.tick(), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Phase change → log session + vibrate
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      prevPhaseRef.current = phase;
      // If we just completed a work phase → log session
      if (phase === 'break') {
        sessionsApi
          .log({ type: 'pomodoro', subject: subject || undefined, durationMins: workDuration })
          .catch(() => {});
      }
      Vibration.vibrate(Platform.OS === 'android' ? [0, 400, 100, 400] : 400);
    }
  }, [phase]);

  const totalSeconds = (phase === 'work' ? workDuration : breakDuration) * 60;
  const progress = secondsLeft / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const phaseColor = phase === 'work' ? colors.violetLight : colors.green;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Focus Timer</Text>

        {/* Presets */}
        <View style={styles.presetRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.label}
              style={[
                styles.presetBtn,
                workDuration === p.work && breakDuration === p.brk && styles.presetActive,
              ]}
              onPress={() => {
                actions.setWorkDuration(p.work);
                actions.setBreakDuration(p.brk);
              }}
            >
              <Text
                style={[
                  styles.presetText,
                  workDuration === p.work && breakDuration === p.brk && styles.presetTextActive,
                ]}
              >
                {p.label}
              </Text>
              <Text style={styles.presetSub}>{p.work}/{p.brk}m</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Circular Timer */}
        <View style={styles.timerWrap}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Track */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={colors.border}
              strokeWidth={10}
              fill="none"
            />
            {/* Progress */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={phaseColor}
              strokeWidth={10}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          </Svg>
          {/* Overlay text */}
          <View style={styles.timerOverlay}>
            <Text style={[styles.phaseLabel, { color: phaseColor }]}>
              {phase === 'work' ? '🎯 Focus' : '☕ Break'}
            </Text>
            <Text style={[styles.timeText, { color: phaseColor }]}>
              {pad(minutes)}:{pad(seconds)}
            </Text>
            <Text style={styles.sessionCount}>
              Session #{sessionCount + 1}
            </Text>
          </View>
        </View>

        {/* Subject */}
        {showSubjectInput ? (
          <View style={styles.subjectRow}>
            <TextInput
              style={styles.subjectInput}
              placeholder="What are you working on?"
              placeholderTextColor={colors.textMuted}
              value={subjectDraft}
              onChangeText={setSubjectDraft}
              onSubmitEditing={() => {
                actions.setSubject(subjectDraft);
                setShowSubjectInput(false);
              }}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                actions.setSubject(subjectDraft);
                setShowSubjectInput(false);
              }}
            >
              <Ionicons name="checkmark-circle" size={28} color={colors.green} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.subjectPill}
            onPress={() => {
              setSubjectDraft(subject);
              setShowSubjectInput(true);
            }}
          >
            <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
            <Text style={styles.subjectText}>
              {subject || 'Tap to set focus topic'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={actions.reset}>
            <Ionicons name="refresh-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: phaseColor }]}
            onPress={isRunning ? actions.pause : actions.start}
          >
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={32}
              color={colors.white}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={actions.nextPhase}>
            <Ionicons name="play-skip-forward-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: colors.violetLight }]}>{sessionCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: colors.amber }]}>
              {sessionCount * workDuration}
            </Text>
            <Text style={styles.statLabel}>Focus mins</Text>
          </View>
        </View>

        {/* Tips */}
        {phase === 'work' && isRunning && (
          <View style={styles.tipBanner}>
            <Text style={styles.tipText}>
              🧠 Put your phone face-down and silence notifications for best results.
            </Text>
          </View>
        )}
        {phase === 'break' && (
          <View style={[styles.tipBanner, styles.breakBanner]}>
            <Text style={styles.tipText}>
              🌿 Stand up, stretch, or look out a window. Rest is part of the work.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: { ...typography.h2, alignSelf: 'flex-start' },

  presetRow: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
  presetBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  presetActive: {
    backgroundColor: colors.violet + '30',
    borderColor: colors.violetLight,
  },
  presetText: { ...typography.label, color: colors.textSecondary },
  presetTextActive: { color: colors.violetLight },
  presetSub: { ...typography.caption },

  timerWrap: {
    position: 'relative',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
  },
  phaseLabel: { ...typography.label, fontWeight: '700' },
  timeText: { fontSize: 52, fontWeight: '800', fontVariant: ['tabular-nums'] },
  sessionCount: { ...typography.caption },

  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectText: { ...typography.bodySmall, color: colors.textMuted },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  subjectInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    color: colors.textPrimary,
    fontSize: 15,
  },

  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statsRow: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statVal: { fontSize: 28, fontWeight: '700' },
  statLabel: { ...typography.caption },

  tipBanner: {
    backgroundColor: colors.violet + '20',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.violet + '40',
    padding: spacing.md,
    alignSelf: 'stretch',
  },
  breakBanner: {
    backgroundColor: colors.green + '20',
    borderColor: colors.green + '40',
  },
  tipText: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
});
