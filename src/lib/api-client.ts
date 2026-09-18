/**
 * Typed API client — thin fetch wrappers with consistent error handling.
 * All requests are same-origin (cookies sent automatically for auth).
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // not json
    }
  }
  if (!res.ok) {
    const errBody = json as { error?: string; code?: string; details?: unknown } | null;
    throw new ApiError(
      errBody?.error ?? `Request failed (${res.status})`,
      res.status,
      errBody?.code,
      errBody?.details,
    );
  }
  return (json as { data: T }).data ?? (json as T);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ---------- Types ----------
export interface FoodItem {
  id: string;
  name: string;
  brand?: string | null;
  category: string;
  servingDesc: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number | null;
  sugarPer100g?: number | null;
  sodiumPer100g?: number | null;
  defaultServingG: number;
}

export interface CustomFoodItem extends FoodItem {
  userId: string;
}

export interface FoodSearchResult {
  foods: FoodItem[];
  custom: CustomFoodItem[];
}

export interface FoodLogEntry {
  id: string;
  meal: string;
  foodName: string;
  quantityG: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DiaryDay {
  date: string;
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  burned: number;
  logs: FoodLogEntry[];
}

export interface ExerciseItem {
  id: string;
  name: string;
  category: string;
  metValue: number;
  description?: string | null;
}

export interface ExerciseLogEntry {
  id: string;
  date: string;
  exerciseId: string | null;
  exerciseName: string;
  durationMin: number;
  caloriesBurned: number;
}

export interface WeightLogEntry {
  id: string;
  date: string;
  weightKg: number;
  note?: string | null;
}

export interface Goal {
  id: string;
  calorieGoal: number;
  proteinGoalG: number;
  carbGoalG: number;
  fatGoalG: number;
  waterGoalMl: number;
  weightGoalKg?: number | null;
  active: boolean;
}

export interface FastSession {
  id: string;
  startTime: string;
  endTime: string | null;
  protocolHours: number;
  status: string;
}

export interface DashboardData {
  date: string;
  consumed: DiaryDay["consumed"];
  burned: number;
  waterMl: number;
  goal: {
    calorieGoal: number;
    proteinGoalG: number;
    carbGoalG: number;
    fatGoalG: number;
    waterGoalMl: number;
  } | null;
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
  exerciseLogs: ExerciseLogEntry[];
  activeFast: FastSession | null;
  weight: { weightKg: number; date: string } | null;
  weekly: Array<{
    date: string;
    consumed: DiaryDay["consumed"];
    burned: number;
    net: number;
    waterMl: number;
  }>;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  gender: string | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: string | null;
  goalType: string | null;
  weeklyGoalKg: number | null;
  createdAt: string;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  isPublic: boolean;
  likeCount: number;
  createdAt: string;
  ingredients: RecipeIngredient[];
}

export interface BarcodeLookupResult {
  type: "food" | "custom";
  food: FoodItem;
}

export interface AnalyzedFood {
  name: string;
  portionGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: number;
}

export interface MealAnalysisResult {
  foods: AnalyzedFood[];
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  summary: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string | null;
  totalDaysLogged: number;
}

export interface WeeklyAverage {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface InsightsData {
  streak: StreakInfo;
  weeklyAverages: WeeklyAverage[];
  achievements: Achievement[];
  weeklyAvgCalories: number;
  weeklyAvgProtein: number;
  goalAdherence: number;
  totalFoodsLogged: number;
  totalExercisesLogged: number;
  totalWaterLogged: number;
  memberSince: string;
}

export interface MealPlanEntry {
  id: string;
  weekStartDate: string;
  dayIndex: number;
  meal: string;
  recipeId: string | null;
  recipeName: string | null;
  customName: string | null;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface GroceryItem {
  name: string;
  totalGrams: number;
  recipeCount: number;
  estimatedCalories: number;
}

export interface GroceryList {
  items: GroceryItem[];
  totalItems: number;
  totalCalories: number;
  weekStartDate: string;
}

export interface ImportResult {
  imported: {
    foodLogs: number;
    exerciseLogs: number;
    weightLogs: number;
    waterLogs: number;
    recipes: number;
    goals: number;
  };
  skipped: number;
  errors: string[];
}

export interface FavoriteFood {
  id: string;
  foodId: string | null;
  customFoodId: string | null;
  name: string;
  quantityG: number;
  meal: string;
  lastUsedAt: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface RecipeRecommendation {
  recipe: {
    id: string;
    name: string;
    description: string | null;
    servings: number;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  reason: string;
  matchScore: number;
}

export interface FoodRecommendation {
  id: string;
  name: string;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  defaultServingG: number;
  suggestedPortionG: number;
  suggestedCalories: number;
  suggestedProtein: number;
  reason: string;
  targetMacro: "protein" | "carbs" | "fat" | "calories";
}

export interface Recommendations {
  recipes: RecipeRecommendation[];
  foods: FoodRecommendation[];
}

export interface CommunityRecipe {
  id: string;
  name: string;
  description: string | null;
  servings: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  likeCount: number;
  avgRating: number;
  ratingCount: number;
  userRating: number | null;
  authorName: string | null;
  liked: boolean;
  createdAt: string;
}

export interface MealPlanTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  theme: string;
  targetCalories: string;
  tags: string[];
}

export interface PerMealTarget {
  meal: string;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  percentage: number;
}

export interface NutritionScore {
  todayScore: number;
  weekScore: number;
  trend: number;
  components: {
    macroAdherence: number;
    foodVariety: number;
    consistency: number;
    hydration: number;
  };
  grade: "A" | "B" | "C" | "D" | "F";
  message: string;
}

export interface RecipeComment {
  id: string;
  recipeId: string;
  content: string;
  createdAt: string;
  authorName: string | null;
  isOwn: boolean;
}

export interface AutocompleteFood {
  id: string;
  type: "food" | "custom";
  name: string;
  caloriesPer100g: number;
  defaultServingG: number;
  category: string;
  servingCalories: number;
}

export interface RatingInfo {
  userRating: number | null;
  avgRating: number;
  ratingCount: number;
}

export interface ScoreHistoryEntry {
  date: string;
  score: number;
  grade: string;
  macroAdherence: number;
  foodVariety: number;
  consistency: number;
  hydration: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  unlockedDate?: string;
}

export interface MilestonesData {
  milestones: Milestone[];
  unlockedCount: number;
  totalCount: number;
  nextMilestone?: Milestone;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string | null;
  score: number;
  grade: string;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
  totalUsers: number;
}

export interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
}

export interface WeeklySummary {
  days: DailyNutrition[];
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  totalWater: number;
  trendCalories: number;
  trendProtein: number;
  daysLogged: number;
  bestDay: { date: string; calories: number } | null;
  consistencyScore: number;
}

export interface GoalPrediction {
  currentWeightKg: number;
  goalWeightKg: number | null;
  goalType: string | null;
  weeklyChangeKg: number;
  daysToGoal: number | null;
  projectedDate: string | null;
  onTrack: boolean;
  message: string;
  confidence: "low" | "medium" | "high";
}
