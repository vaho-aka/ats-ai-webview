import { create } from 'zustand';
import type { DarkModeState } from './interfaces/interfaces';

export const useDarkMode = create<DarkModeState>((set) => ({
  darkMode: false,
  changeTheme: () => set((state) => ({ darkMode: !state.darkMode })),
}));
