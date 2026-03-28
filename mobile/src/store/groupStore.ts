import { create } from 'zustand';
import { fetchGroups, fetchGroup } from '../services/api';
import type { Group } from '../types';

interface GroupState {
  groups: Group[];
  selectedGroup: Group | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;

  loadGroups: (refresh?: boolean) => Promise<void>;
  loadGroup: (id: string) => Promise<void>;
  setSelectedGroup: (group: Group | null) => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  selectedGroup: null,
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,

  loadGroups: async (refresh = false) => {
    const { page, isLoading } = get();
    if (isLoading) return;

    const nextPage = refresh ? 1 : page;
    set({ isLoading: true, error: null });

    try {
      const result = await fetchGroups(nextPage, 20);
      set((state) => ({
        groups: refresh ? result.data : [...state.groups, ...result.data],
        page: nextPage + 1,
        hasMore: result.data.length === 20,
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load groups',
        isLoading: false,
      });
    }
  },

  loadGroup: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const group = await fetchGroup(id);
      set({ selectedGroup: group, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load group',
        isLoading: false,
      });
    }
  },

  setSelectedGroup: (group) => set({ selectedGroup: group }),
}));
