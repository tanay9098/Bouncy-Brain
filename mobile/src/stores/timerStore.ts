import { create } from 'zustand';

type Phase = 'work' | 'break';

interface TimerState {
  phase: Phase;
  secondsLeft: number;
  isRunning: boolean;
  sessionCount: number;
  workDuration: number;
  breakDuration: number;
  subject: string;
  focusModeActive: boolean;
  distractedCount: number;
  actions: {
    start: () => void;
    pause: () => void;
    reset: () => void;
    tick: () => void;
    nextPhase: () => void;
    setSubject: (s: string) => void;
    setWorkDuration: (m: number) => void;
    setBreakDuration: (m: number) => void;
    enableFocusMode: () => void;
    disableFocusMode: () => void;
    incrementDistracted: () => void;
  };
}

export const useTimerStore = create<TimerState>((set, get) => ({
  phase: 'work',
  secondsLeft: 25 * 60,
  isRunning: false,
  sessionCount: 0,
  workDuration: 25,
  breakDuration: 5,
  subject: '',
  focusModeActive: false,
  distractedCount: 0,

  actions: {
    start: () => set({ isRunning: true }),
    pause: () => set({ isRunning: false }),
    reset: () => {
      const { phase, workDuration, breakDuration } = get();
      set({
        isRunning: false,
        secondsLeft: (phase === 'work' ? workDuration : breakDuration) * 60,
      });
    },
    tick: () => {
      const { secondsLeft, actions } = get();
      if (secondsLeft <= 1) {
        actions.nextPhase();
      } else {
        set({ secondsLeft: secondsLeft - 1 });
      }
    },
    nextPhase: () => {
      const { phase, sessionCount, workDuration, breakDuration } = get();
      if (phase === 'work') {
        set({
          phase: 'break',
          isRunning: false,
          secondsLeft: breakDuration * 60,
          sessionCount: sessionCount + 1,
        });
      } else {
        set({
          phase: 'work',
          isRunning: false,
          secondsLeft: workDuration * 60,
        });
      }
    },
    setSubject: (subject) => set({ subject }),
    setWorkDuration: (m) =>
      set((s) => ({
        workDuration: m,
        secondsLeft: s.phase === 'work' && !s.isRunning ? m * 60 : s.secondsLeft,
      })),
    setBreakDuration: (m) =>
      set((s) => ({
        breakDuration: m,
        secondsLeft: s.phase === 'break' && !s.isRunning ? m * 60 : s.secondsLeft,
      })),
    enableFocusMode: () => set({ focusModeActive: true, distractedCount: 0 }),
    disableFocusMode: () => set({ focusModeActive: false }),
    incrementDistracted: () =>
      set((s) => ({ distractedCount: s.distractedCount + 1 })),
  },
}));
