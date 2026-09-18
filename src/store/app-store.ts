import { create } from "zustand";
import { todayLocalString, addDays, toLocalDateString } from "@/lib/utils/date";

export type ViewName =
  | "dashboard"
  | "diary"
  | "progress"
  | "plan"
  | "reports"
  | "profile";

interface AppState {
  view: ViewName;
  selectedDate: string;
  setView: (v: ViewName) => void;
  setDate: (d: string) => void;
  prevDay: () => void;
  nextDay: () => void;
  goToday: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "dashboard",
  selectedDate: todayLocalString(),
  setView: (v) => set({ view: v }),
  setDate: (d) => set({ selectedDate: d }),
  prevDay: () =>
    set((s) => ({
      selectedDate: toLocalDateString(
        addDays(new Date(s.selectedDate + "T00:00:00"), -1),
      ),
    })),
  nextDay: () =>
    set((s) => ({
      selectedDate: toLocalDateString(
        addDays(new Date(s.selectedDate + "T00:00:00"), 1),
      ),
    })),
  goToday: () => set({ selectedDate: todayLocalString() }),
}));