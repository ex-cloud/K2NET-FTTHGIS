import { create } from "zustand";

interface TaskState {
  unreadB2BCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  unreadB2BCount: 0,
  setUnreadCount: (count) => set({ unreadB2BCount: Math.max(0, count) }),
  incrementUnreadCount: () => set((state) => ({ unreadB2BCount: state.unreadB2BCount + 1 })),
  decrementUnreadCount: () => set((state) => ({ unreadB2BCount: Math.max(0, state.unreadB2BCount - 1) })),
  resetUnreadCount: () => set({ unreadB2BCount: 0 }),
}));
