import { toLocalDateString, parseLocalDate, addDays } from "@/lib/utils/date";

export const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export const MEAL_IDS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealId = (typeof MEAL_IDS)[number];

export const MEAL_LABELS: Record<MealId, string> = {
  breakfast: "Desayuno",
  lunch: "Comida",
  dinner: "Cena",
  snack: "Snack",
};

/** Returns the Monday (or same day) of the week containing `date` */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalDateString(d);
}

/** "12 sep – 18 sep" */
export function getWeekRange(weekStart: string): string {
  const start = parseLocalDate(weekStart);
  const end = addDays(start, 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}