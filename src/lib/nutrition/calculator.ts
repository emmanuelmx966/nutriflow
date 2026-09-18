/**
 * Nutrition calculation service — Mifflin-St Jeor BMR + activity TDEE.
 * Single Responsibility: derive calorie/macro targets from user profile.
 */

export type Gender = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type GoalType = "lose" | "maintain" | "gain";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcAge(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return Math.max(0, age);
}

/**
 * Mifflin-St Jeor equation (most accurate for general population).
 */
export function calcBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  ageYears: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return gender === "male" ? base + 5 : base - 161;
}

export function calcTDEE(bmr: number, activity: ActivityLevel): number {
  return bmr * (ACTIVITY_FACTORS[activity] ?? 1.2);
}

export function applyGoalAdjustment(
  tdee: number,
  goal: GoalType,
  weeklyGoalKg: number,
): number {
  // 1 kg fat ~ 7700 kcal; weekly surplus/deficit
  const weeklyDelta = (weeklyGoalKg || 0.5) * 7700;
  const dailyDelta = weeklyDelta / 7;
  if (goal === "lose") return tdee - dailyDelta;
  if (goal === "gain") return tdee + dailyDelta;
  return tdee;
}

export interface MacroSplit {
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Macro split based on goal: higher protein for weight loss,
 * higher carbs for maintenance/performance.
 */
export function calcMacros(calories: number, goal: GoalType): MacroSplit {
  let pRatio: number, cRatio: number, fRatio: number;
  if (goal === "lose") {
    pRatio = 0.4;
    cRatio = 0.35;
    fRatio = 0.25;
  } else if (goal === "gain") {
    pRatio = 0.3;
    cRatio = 0.45;
    fRatio = 0.25;
  } else {
    pRatio = 0.3;
    cRatio = 0.4;
    fRatio = 0.3;
  }
  return {
    protein: Math.round((calories * pRatio) / 4),
    carbs: Math.round((calories * cRatio) / 4),
    fat: Math.round((calories * fRatio) / 9),
  };
}

export interface CalorieEstimate {
  bmr: number;
  tdee: number;
  calorieGoal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  waterGoalMl: number;
}

export function estimateGoals(params: {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activity: ActivityLevel;
  goal: GoalType;
  weeklyGoalKg?: number;
}): CalorieEstimate {
  const bmr = calcBMR(
    params.gender,
    params.weightKg,
    params.heightCm,
    params.ageYears,
  );
  const tdee = calcTDEE(bmr, params.activity);
  const calorieGoal = Math.round(
    Math.max(
      1200,
      applyGoalAdjustment(tdee, params.goal, params.weeklyGoalKg ?? 0.5),
    ),
  );
  const macros = calcMacros(calorieGoal, params.goal);
  // Water: 35ml/kg baseline, clamped
  const waterGoalMl = Math.round(
    Math.min(4000, Math.max(1500, params.weightKg * 35)),
  );
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieGoal,
    proteinG: macros.protein,
    carbG: macros.carbs,
    fatG: macros.fat,
    waterGoalMl,
  };
}

/**
 * Exercise calories: MET * kg * hours
 */
export function calcExerciseCalories(
  met: number,
  weightKg: number,
  durationMin: number,
): number {
  const hours = durationMin / 60;
  return Math.round(met * weightKg * hours);
}
