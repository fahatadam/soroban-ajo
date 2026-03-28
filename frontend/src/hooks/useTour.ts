'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TourStepConfig {
  id: string;
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TourState {
  isActive: boolean;
  currentStepIndex: number;
  steps: TourStepConfig[];
  setSteps: (steps: TourStepConfig[]) => void;
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  hasCompletedTour: boolean;
  setHasCompletedTour: (completed: boolean) => void;
}

/**
 * Core Zustand store for managing interactive product tours.
 * Handles step sequence, visibility state, and completion status.
 */
export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentStepIndex: 0,
      steps: [],
      hasCompletedTour: false,

      setSteps: (steps) => set({ steps }),
      
      startTour: () => {
        const { steps } = get();
        if (steps.length > 0) {
          set({ isActive: true, currentStepIndex: 0 });
        }
      },

      stopTour: () => set({ isActive: false, hasCompletedTour: true }),

      nextStep: () => {
        const { currentStepIndex, steps } = get();
        if (currentStepIndex < steps.length - 1) {
          set({ currentStepIndex: currentStepIndex + 1 });
        } else {
          set({ isActive: false, hasCompletedTour: true });
        }
      },

      prevStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
        }
      },

      goToStep: (index) => {
        const { steps } = get();
        if (index >= 0 && index < steps.length) {
          set({ currentStepIndex: index });
        }
      },

      setHasCompletedTour: (completed) => set({ hasCompletedTour: completed }),
    }),
    {
      name: 'ajo-tour-storage',
    }
  )
);

/**
 * Convenience hook for accessing the global tour state.
 * 
 * @returns The tour store state and actions
 */
export function useTour() {
  return useTourStore();
}
