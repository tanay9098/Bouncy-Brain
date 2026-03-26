import { create } from 'zustand';

type Phase = 'work' | 'break';

interface TimerState {
  phase: Phase;
  secondsLeft: number;
  isRunning: boolean;
  sessionCount: number;
  workDuration: number;   // minutes
  breakDuration: number;  // minutes
  subject: string;
  actions: {
    start: () => void;
    pause: () => void;
    reset: () => void;
    tick: () => void;
    nextPhase: () => void;
    setSubject: (s: string) => void;
    setWorkDuration: (m: number) => void;
    setBreakDuration: (m: number) => void;
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
  },
}));
