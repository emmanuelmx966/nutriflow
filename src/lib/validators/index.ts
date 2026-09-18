import { z } from "zod";

/**
 * Zod validators — input boundary validation (Single Responsibility).
 * Every API input is validated before reaching services.
 */

// ---------- AUTH ----------
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email format")
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  gender: z.enum(["male", "female"]).optional(),
  birthDate: z.string().datetime().optional(),
  heightCm: z.number().min(80).max(250).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  activityLevel: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .optional(),
  goalType: z.enum(["lose", "maintain", "gain"]).optional(),
  weeklyGoalKg: z.number().min(0).max(2).optional(),
});

// ---------- FOODS ----------
export const foodSearchSchema = z.object({
  query: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
});

export const customFoodSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(80).optional(),
  barcode: z.string().trim().max(30).optional(),
  category: z.string().trim().max(40).default("custom"),
  servingDesc: z.string().trim().max(120).default("1 serving"),
  caloriesPer100g: z.number().min(0).max(2000),
  proteinPer100g: z.number().min(0).max(200),
  carbsPer100g: z.number().min(0).max(500),
  fatPer100g: z.number().min(0).max(200),
  fiberPer100g: z.number().min(0).max(100).optional(),
  sugarPer100g: z.number().min(0).max(200).optional(),
  sodiumPer100g: z.number().min(0).max(5000).optional(),
  defaultServingG: z.number().min(1).max(1000).default(100),
});

// ---------- FOOD LOGS ----------
export const mealSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const foodLogCreateSchema = z.object({
  date: z.string().datetime(),
  meal: mealSchema,
  foodId: z.string().cuid().optional(),
  customFoodId: z.string().cuid().optional(),
  quantityG: z.number().min(1).max(5000),
});

export const foodLogUpdateSchema = z.object({
  quantityG: z.number().min(1).max(5000),
});

export const diaryDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

// ---------- EXERCISE ----------
export const exerciseSearchSchema = z.object({
  query: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const exerciseLogCreateSchema = z.object({
  date: z.string().datetime(),
  exerciseId: z.string().cuid().optional(),
  exerciseName: z.string().trim().min(1).max(120),
  durationMin: z.number().min(1).max(600),
  // optional manual calories; otherwise computed from MET
  caloriesBurned: z.number().min(0).max(5000).optional(),
});

export const exerciseLogUpdateSchema = z.object({
  durationMin: z.number().min(1).max(600).optional(),
  caloriesBurned: z.number().min(0).max(5000).optional(),
});

// ---------- WEIGHT ----------
export const weightLogSchema = z.object({
  date: z.string().datetime(),
  weightKg: z.number().min(30).max(300),
  note: z.string().trim().max(280).optional(),
});

// ---------- WATER ----------
export const waterLogSchema = z.object({
  date: z.string().datetime(),
  amountMl: z.number().int().min(0).max(10000),
});

// ---------- GOALS ----------
export const goalSchema = z.object({
  calorieGoal: z.number().min(800).max(6000),
  proteinGoalG: z.number().min(0).max(500),
  carbGoalG: z.number().min(0).max(800),
  fatGoalG: z.number().min(0).max(300),
  waterGoalMl: z.number().int().min(0).max(10000).default(2000),
  weightGoalKg: z.number().min(30).max(300).optional(),
});

// ---------- FASTING ----------
export const fastStartSchema = z.object({
  protocolHours: z.number().int().min(8).max(48),
});

// ---------- STATS ----------
export const statsRangeSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});
