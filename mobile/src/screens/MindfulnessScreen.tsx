import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, radius, typography } from '../theme/colors';

type Props = { onBack: () => void };

interface Session {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  icon: string;
  gradient: [string, string];
  audioUrl?: string; // optional real URL
}

const SESSIONS: Session[] = [
  {
    id: 'focus-breath',
    title: 'Focus Breathing',
    description: '4-7-8 breathing to calm racing thoughts and restore focus.',
    duration: 240,
    icon: 'leaf',
    gradient: [colors.violet + 'cc', colors.blue + 'cc'],
  },
  {
    id: 'body-scan',
    title: 'Body Scan',
    description: 'Release tension from head to toe with this grounding exercise.',
    duration: 300,
    icon: 'body',
    gradient: [colors.green + 'cc', colors.blue + 'cc'],
  },
  {
    id: 'adhd-reset',
    title: 'ADHD Reset',
    description: 'Quick 5-min mental reset when your brain feels overwhelmed.',
    duration: 300,
    icon: 'sync',
    gradient: [colors.amber + 'cc', colors.red + 'cc'],
  },
  {
    id: 'sleep-wind',
    title: 'Sleep Wind-Down',
    description: 'Gentle relaxation to prepare your mind and body for sleep.',
    duration: 600,
    icon: 'moon',
    gradient: [colors.violetDim + 'cc', '#0f0f30cc'],
  },
  {
    id: 'gratitude',
    title: 'Gratitude Moment',
    description: 'A short guided reflection to shift your mindset positively.',
    duration: 180,
    icon: 'heart',
    gradient: [colors.pink + 'cc', colors.violet + 'cc'],
  },
];

const GUIDED_SCRIPTS: Record<string, string[]> = {
  'focus-breath': [
    'Find a comfortable position. Close your eyes.',
    'Breathe in for 4 counts... hold for 7... out for 8.',
    'Let each exhale release tension and distraction.',
    'Your mind is settling. Your focus is returning.',
    'One more cycle... in 4... hold 7... out 8.',
    'Well done. You can open your eyes when ready.',
  ],
  'body-scan': [
    'Settle into your seat. Close your eyes softly.',
    'Notice the weight of your body. You are safe here.',
    'Bring attention to your feet. Let them soften.',
    'Move up to your legs, your belly, your chest.',
    'Your shoulders release. Your jaw unclenches.',
    'You are present. Relaxed. Ready.',
  ],
  'adhd-reset': [
    'Your brain has been working hard. That is okay.',
    'Take a slow breath in through your nose.',
    'Exhale slowly. Let the overwhelm dissolve.',
    'Name one thing you can see right now.',
    'Name one thing you can feel. You are grounded.',
    'Reset complete. Pick one small next action.',
  ],
  'sleep-wind': [
    'The day is done. You have done enough.',
    'With each breath, your body grows heavier.',
    'Release the thoughts of tomorrow. They will wait.',
    'Soften every muscle from your forehead down.',
    'You are safe. You are warm. You can rest now.',
    'Drift gently... sleep comes easily to you.',
  ],
  'gratitude': [
    'Close your eyes and take a gentle breath.',
    'Think of one small thing that went okay today.',
    'It doesn\'t have to be big. Just real.',
    'Let gratitude settle in your chest like warmth.',
    'You are doing better than you think.',
    'Open your eyes with a little more lightness.',
  ],
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function MindfulnessScreen({ onBack }: Props) {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const progress = activeSession ? elapsed / activeSession.duration : 0;
  const script = activeSession ? (GUIDED_SCRIPTS[activeSession.id] ?? []) : [];

  // Advance script line every ~(duration/lines) seconds
  useEffect(() => {
    if (!activeSession || !isPlaying) return;
    const linesCount = script.length;
    const interval = (activeSession.duration / linesCount) * 1000;
    const lineTimer = setInterval(() => {
      setScriptIndex((i) => Math.min(i + 1, linesCount - 1));
    }, interval);
    return () => clearInterval(lineTimer);
  }, [isPlaying, activeSession]);

  // Main countdown
  useEffect(() => {
    if (!isPlaying || !activeSession) return;
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= activeSession.duration) {
          clearInterval(intervalRef.current!);
          setIsPlaying(false);
          setCompleted(true);
          return activeSession.duration;
        }
        return e + 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, activeSession]);

  const startSession = (session: Session) => {
    setActiveSession(session);
    setElapsed(0);
    setScriptIndex(0);
    setCompleted(false);
    setIsPlaying(true);
  };

  const togglePlay = () => setIsPlaying((p) => !p);

  const endSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setActiveSession(null);
    setElapsed(0);
    setScriptIndex(0);
    setCompleted(false);
  };

  const timeLeft = activeSession ? activeSession.duration - elapsed : 0;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  // Active session player view
  if (activeSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient
          colors={[colors.bg, colors.violetDim + '60', colors.bg]}
          style={styles.gradientBg}
        >
          <View style={styles.playerHeader}>
            <TouchableOpacity onPress={endSession} style={styles.backBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.playerTitle}>{activeSession.title}</Text>
          </View>

          <View style={styles.playerContent}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name={activeSession.icon as any} size={48} color={colors.violetLight} />
            </View>

            {/* Progress ring */}
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(progress * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.timerText}>
                {completed ? '✅ Complete!' : `${pad(mins)}:${pad(secs)}`}
              </Text>
            </View>

            {/* Script line */}
            {!completed ? (
              <View style={styles.scriptBox}>
                <Text style={styles.scriptText}>
                  {script[Math.min(scriptIndex, script.length - 1)]}
                </Text>
              </View>
            ) : (
              <View style={styles.completedBox}>
                <Text style={styles.completedEmoji}>🌟</Text>
                <Text style={styles.completedTitle}>Well done!</Text>
                <Text style={styles.completedSub}>
                  You completed a {Math.round(activeSession.duration / 60)}-minute{' '}
                  {activeSession.title} session.
                </Text>
              </View>
            )}

            {/* Controls */}
            {!completed ? (
              <View style={styles.controls}>
                <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.doneBtn} onPress={endSession}>
                <Text style={styles.doneBtnText}>Back to Sessions</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Session list
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mindfulness</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Take a mindful break. These sessions are designed for ADHD brains.
        </Text>

        {SESSIONS.map((session) => (
          <TouchableOpacity
            key={session.id}
            style={styles.sessionCard}
            onPress={() => startSession(session)}
          >
            <LinearGradient
              colors={session.gradient}
              style={styles.sessionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name={session.icon as any} size={28} color={colors.white} />
            </LinearGradient>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.sessionDesc}>{session.description}</Text>
              <View style={styles.sessionMeta}>
                <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                <Text style={styles.sessionDuration}>
                  {Math.round(session.duration / 60)} min
                </Text>
              </View>
            </View>
            <Ionicons name="play-circle" size={32} color={colors.violetLight} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  gradientBg: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2 },
  subtitle: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.sm },

  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sessionGradient: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: { flex: 1, gap: 4 },
  sessionTitle: { ...typography.body, fontWeight: '700' },
  sessionDesc: { ...typography.bodySmall, color: colors.textMuted, lineHeight: 18 },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sessionDuration: { ...typography.caption },

  // Player
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  playerTitle: { ...typography.h3 },
  playerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.violet + '30',
    borderWidth: 2,
    borderColor: colors.violetLight + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressWrap: { width: '100%', gap: spacing.sm, alignItems: 'center' },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.violetLight,
    borderRadius: 3,
  },
  timerText: { fontSize: 36, fontWeight: '800', color: colors.textPrimary },

  scriptBox: {
    backgroundColor: colors.surface + 'cc',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  scriptText: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  controls: { flexDirection: 'row', gap: spacing.xl },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },

  completedBox: { alignItems: 'center', gap: spacing.sm },
  completedEmoji: { fontSize: 48 },
  completedTitle: { ...typography.h2 },
  completedSub: { ...typography.bodySmall, textAlign: 'center', color: colors.textMuted },

  doneBtn: {
    backgroundColor: colors.violet,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  doneBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
