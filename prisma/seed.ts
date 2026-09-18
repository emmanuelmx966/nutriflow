/**
 * Seed script — populates the food + exercise database.
 * Run with: bun run db:seed
 */
import { db } from "../src/lib/db";

interface FoodSeed {
  name: string;
  brand?: string;
  barcode?: string;
  category: string;
  servingDesc: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumPer100g?: number;
  defaultServingG: number;
}

const foods: FoodSeed[] = [
  // Fruits
  { name: "Apple", category: "produce", servingDesc: "1 medium (182g)", caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, fiberPer100g: 2.4, sugarPer100g: 10, defaultServingG: 182 },
  { name: "Banana", category: "produce", servingDesc: "1 medium (118g)", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, fiberPer100g: 2.6, sugarPer100g: 12, defaultServingG: 118 },
  { name: "Orange", category: "produce", servingDesc: "1 medium (131g)", caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1, fiberPer100g: 2.4, sugarPer100g: 9, defaultServingG: 131 },
  { name: "Strawberries", category: "produce", servingDesc: "1 cup (152g)", caloriesPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3, fiberPer100g: 2, sugarPer100g: 4.9, defaultServingG: 152 },
  { name: "Blueberries", category: "produce", servingDesc: "1 cup (148g)", caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3, fiberPer100g: 2.4, sugarPer100g: 10, defaultServingG: 148 },
  { name: "Grapes", category: "produce", servingDesc: "1 cup (151g)", caloriesPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18, fatPer100g: 0.2, fiberPer100g: 0.9, sugarPer100g: 16, defaultServingG: 151 },
  { name: "Watermelon", category: "produce", servingDesc: "1 cup (152g)", caloriesPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 7.6, fatPer100g: 0.2, fiberPer100g: 0.4, sugarPer100g: 6, defaultServingG: 152 },
  { name: "Avocado", category: "produce", servingDesc: "1/2 avocado (100g)", caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, fiberPer100g: 7, defaultServingG: 100 },
  { name: "Mango", category: "produce", servingDesc: "1 cup (165g)", caloriesPer100g: 60, proteinPer100g: 0.8, carbsPer100g: 15, fatPer100g: 0.4, fiberPer100g: 1.6, sugarPer100g: 14, defaultServingG: 165 },

  // Vegetables
  { name: "Broccoli", category: "produce", servingDesc: "1 cup (91g)", caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, fiberPer100g: 2.6, defaultServingG: 91 },
  { name: "Carrots", category: "produce", servingDesc: "1 cup (128g)", caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2, fiberPer100g: 2.8, defaultServingG: 128 },
  { name: "Spinach", category: "produce", servingDesc: "1 cup (30g)", caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, fiberPer100g: 2.2, defaultServingG: 30 },
  { name: "Sweet Potato", category: "produce", servingDesc: "1 medium (151g)", caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, fiberPer100g: 3, defaultServingG: 151 },
  { name: "Potato", category: "produce", servingDesc: "1 medium (213g)", caloriesPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1, fiberPer100g: 2.2, defaultServingG: 213 },
  { name: "Tomato", category: "produce", servingDesc: "1 medium (123g)", caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, fiberPer100g: 1.2, defaultServingG: 123 },
  { name: "Cucumber", category: "produce", servingDesc: "1 cup (104g)", caloriesPer100g: 15, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1, fiberPer100g: 0.5, defaultServingG: 104 },
  { name: "Bell Pepper", category: "produce", servingDesc: "1 medium (119g)", caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3, fiberPer100g: 2.1, defaultServingG: 119 },
  { name: "Lettuce", category: "produce", servingDesc: "1 cup (36g)", caloriesPer100g: 15, proteinPer100g: 1.4, carbsPer100g: 2.9, fatPer100g: 0.2, fiberPer100g: 1.3, defaultServingG: 36 },

  // Meat & Protein
  { name: "Chicken Breast", category: "meat", servingDesc: "100g grilled", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, defaultServingG: 120 },
  { name: "Chicken Thigh", category: "meat", servingDesc: "100g", caloriesPer100g: 209, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 11, defaultServingG: 100 },
  { name: "Ground Beef 85% Lean", category: "meat", servingDesc: "100g", caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15, defaultServingG: 100 },
  { name: "Steak (Sirloin)", category: "meat", servingDesc: "100g", caloriesPer100g: 271, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 19, defaultServingG: 100 },
  { name: "Salmon", category: "fish", servingDesc: "100g", caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, defaultServingG: 100 },
  { name: "Tuna (canned in water)", category: "fish", servingDesc: "1 can (142g)", caloriesPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1, defaultServingG: 142 },
  { name: "Shrimp", category: "fish", servingDesc: "100g", caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3, defaultServingG: 100 },
  { name: "Egg", category: "dairy", servingDesc: "1 large (50g)", caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, defaultServingG: 50 },
  { name: "Egg White", category: "dairy", servingDesc: "1 white (33g)", caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2, defaultServingG: 33 },
  { name: "Bacon", category: "meat", servingDesc: "2 slices (16g)", caloriesPer100g: 541, proteinPer100g: 37, carbsPer100g: 1.4, fatPer100g: 42, sodiumPer100g: 1717, defaultServingG: 16 },
  { name: "Turkey Breast (deli)", category: "meat", servingDesc: "1 slice (21g)", caloriesPer100g: 104, proteinPer100g: 22, carbsPer100g: 2, fatPer100g: 1, sodiumPer100g: 1080, defaultServingG: 21 },

  // Dairy
  { name: "Milk (Whole)", category: "dairy", servingDesc: "1 cup (244g)", caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3, defaultServingG: 244 },
  { name: "Milk (Skim)", category: "dairy", servingDesc: "1 cup (245g)", caloriesPer100g: 34, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1, defaultServingG: 245 },
  { name: "Greek Yogurt (Plain)", category: "dairy", servingDesc: "1 cup (245g)", caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4, defaultServingG: 170 },
  { name: "Cheddar Cheese", category: "dairy", servingDesc: "1 slice (28g)", caloriesPer100g: 403, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33, sodiumPer100g: 621, defaultServingG: 28 },
  { name: "Mozzarella Cheese", category: "dairy", servingDesc: "1 oz (28g)", caloriesPer100g: 280, proteinPer100g: 28, carbsPer100g: 3.1, fatPer100g: 17, defaultServingG: 28 },
  { name: "Cottage Cheese (Low Fat)", category: "dairy", servingDesc: "1 cup (226g)", caloriesPer100g: 72, proteinPer100g: 11, carbsPer100g: 6.2, fatPer100g: 1, defaultServingG: 226 },
  { name: "Butter", category: "dairy", servingDesc: "1 tbsp (14g)", caloriesPer100g: 717, proteinPer100g: 0.9, carbsPer100g: 0.1, fatPer100g: 81, defaultServingG: 14 },

  // Grains
  { name: "White Rice (cooked)", category: "grains", servingDesc: "1 cup (158g)", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, defaultServingG: 158 },
  { name: "Brown Rice (cooked)", category: "grains", servingDesc: "1 cup (195g)", caloriesPer100g: 112, proteinPer100g: 2.6, carbsPer100g: 24, fatPer100g: 0.9, fiberPer100g: 1.8, defaultServingG: 195 },
  { name: "Quinoa (cooked)", category: "grains", servingDesc: "1 cup (185g)", caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9, fiberPer100g: 2.8, defaultServingG: 185 },
  { name: "Oatmeal (cooked)", category: "grains", servingDesc: "1 cup (234g)", caloriesPer100g: 71, proteinPer100g: 2.5, carbsPer100g: 12, fatPer100g: 1.5, fiberPer100g: 1.7, defaultServingG: 234 },
  { name: "Whole Wheat Bread", category: "grains", servingDesc: "1 slice (28g)", caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4, fiberPer100g: 7, defaultServingG: 28 },
  { name: "White Bread", category: "grains", servingDesc: "1 slice (28g)", caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2, defaultServingG: 28 },
  { name: "Pasta (cooked)", category: "grains", servingDesc: "1 cup (140g)", caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1, defaultServingG: 140 },
  { name: "Tortilla (Flour)", category: "grains", servingDesc: "1 medium (45g)", caloriesPer100g: 304, proteinPer100g: 8, carbsPer100g: 50, fatPer100g: 7.5, defaultServingG: 45 },
  { name: "Bagel", category: "grains", servingDesc: "1 medium (95g)", caloriesPer100g: 257, proteinPer100g: 10, carbsPer100g: 51, fatPer100g: 1.5, defaultServingG: 95 },
  { name: "Corn Flakes", brand: "Kellogg's", barcode: "038000001114", category: "grains", servingDesc: "1 cup (28g)", caloriesPer100g: 357, proteinPer100g: 7, carbsPer100g: 84, fatPer100g: 0.4, defaultServingG: 28 },

  // Legumes & Nuts
  { name: "Black Beans (cooked)", category: "legumes", servingDesc: "1 cup (172g)", caloriesPer100g: 132, proteinPer100g: 8.9, carbsPer100g: 24, fatPer100g: 0.5, fiberPer100g: 8.7, defaultServingG: 172 },
  { name: "Chickpeas (cooked)", category: "legumes", servingDesc: "1 cup (164g)", caloriesPer100g: 164, proteinPer100g: 9, carbsPer100g: 27, fatPer100g: 2.6, fiberPer100g: 7.6, defaultServingG: 164 },
  { name: "Lentils (cooked)", category: "legumes", servingDesc: "1 cup (198g)", caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, fiberPer100g: 7.9, defaultServingG: 198 },
  { name: "Almonds", category: "nuts", servingDesc: "1 oz (28g)", caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, fiberPer100g: 12, defaultServingG: 28 },
  { name: "Walnuts", category: "nuts", servingDesc: "1 oz (28g)", caloriesPer100g: 654, proteinPer100g: 15, carbsPer100g: 14, fatPer100g: 65, fiberPer100g: 6.7, defaultServingG: 28 },
  { name: "Peanut Butter", category: "nuts", servingDesc: "2 tbsp (32g)", caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, fiberPer100g: 6, defaultServingG: 32 },
  { name: "Cashews", category: "nuts", servingDesc: "1 oz (28g)", caloriesPer100g: 553, proteinPer100g: 18, carbsPer100g: 30, fatPer100g: 44, defaultServingG: 28 },

  // Fast food / Snacks
  { name: "Big Mac", brand: "McDonald's", barcode: "0000000000505", category: "fastfood", servingDesc: "1 burger (214g)", caloriesPer100g: 257, proteinPer100g: 11, carbsPer100g: 21, fatPer100g: 14, sodiumPer100g: 460, defaultServingG: 214 },
  { name: "Cheeseburger", brand: "McDonald's", barcode: "0000000000604", category: "fastfood", servingDesc: "1 burger (116g)", caloriesPer100g: 263, proteinPer100g: 12, carbsPer100g: 26, fatPer100g: 12, sodiumPer100g: 480, defaultServingG: 116 },
  { name: "French Fries", brand: "McDonald's", barcode: "0000000000703", category: "fastfood", servingDesc: "Medium (117g)", caloriesPer100g: 312, proteinPer100g: 3.4, carbsPer100g: 41, fatPer100g: 15, sodiumPer100g: 210, defaultServingG: 117 },
  { name: "Pizza (Cheese)", category: "fastfood", servingDesc: "1 slice (107g)", caloriesPer100g: 266, proteinPer100g: 11, carbsPer100g: 33, fatPer100g: 10, sodiumPer100g: 598, defaultServingG: 107 },
  { name: "Hot Dog", category: "fastfood", servingDesc: "1 (98g)", caloriesPer100g: 290, proteinPer100g: 10, carbsPer100g: 18, fatPer100g: 21, sodiumPer100g: 810, defaultServingG: 98 },
  { name: "Taco (Beef)", category: "fastfood", servingDesc: "1 (102g)", caloriesPer100g: 226, proteinPer100g: 9, carbsPer100g: 19, fatPer100g: 12, defaultServingG: 102 },

  // Beverages
  { name: "Coffee (Black)", category: "beverage", servingDesc: "1 cup (240ml)", caloriesPer100g: 1, proteinPer100g: 0.1, carbsPer100g: 0, fatPer100g: 0, defaultServingG: 240 },
  { name: "Orange Juice", category: "beverage", servingDesc: "1 cup (248g)", caloriesPer100g: 45, proteinPer100g: 0.7, carbsPer100g: 10, fatPer100g: 0.2, sugarPer100g: 8.4, defaultServingG: 248 },
  { name: "Coca-Cola", brand: "Coca-Cola", barcode: "049000028904", category: "beverage", servingDesc: "1 can (355ml)", caloriesPer100g: 42, proteinPer100g: 0, carbsPer100g: 10.6, fatPer100g: 0, sugarPer100g: 10.6, defaultServingG: 355 },
  { name: "Green Tea", category: "beverage", servingDesc: "1 cup (245ml)", caloriesPer100g: 1, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0, defaultServingG: 245 },
  { name: "Beer (Regular)", category: "beverage", servingDesc: "1 can (355ml)", caloriesPer100g: 43, proteinPer100g: 0.5, carbsPer100g: 3.6, fatPer100g: 0, defaultServingG: 355 },

  // Sweets
  { name: "Dark Chocolate (70%)", category: "sweets", servingDesc: "1 oz (28g)", caloriesPer100g: 598, proteinPer100g: 7.8, carbsPer100g: 46, fatPer100g: 43, fiberPer100g: 11, defaultServingG: 28 },
  { name: "Chocolate Chip Cookie", category: "sweets", servingDesc: "1 (16g)", caloriesPer100g: 502, proteinPer100g: 5.7, carbsPer100g: 64, fatPer100g: 25, defaultServingG: 16 },
  { name: "Vanilla Ice Cream", category: "sweets", servingDesc: "1/2 cup (66g)", caloriesPer100g: 207, proteinPer100g: 3.5, carbsPer100g: 24, fatPer100g: 11, sugarPer100g: 21, defaultServingG: 66 },
  { name: "Honey", category: "sweets", servingDesc: "1 tbsp (21g)", caloriesPer100g: 304, proteinPer100g: 0.3, carbsPer100g: 82, fatPer100g: 0, defaultServingG: 21 },

  // Condiments
  { name: "Olive Oil", category: "condiment", servingDesc: "1 tbsp (14ml)", caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, defaultServingG: 14 },
  { name: "Ketchup", category: "condiment", servingDesc: "1 tbsp (15g)", caloriesPer100g: 112, proteinPer100g: 1.7, carbsPer100g: 26, fatPer100g: 0.4, sodiumPer100g: 907, defaultServingG: 15 },
  { name: "Mayonnaise", category: "condiment", servingDesc: "1 tbsp (14g)", caloriesPer100g: 680, proteinPer100g: 1, carbsPer100g: 0.6, fatPer100g: 75, defaultServingG: 14 },
  { name: "Soy Sauce", category: "condiment", servingDesc: "1 tbsp (16g)", caloriesPer100g: 53, proteinPer100g: 8.1, carbsPer100g: 4.9, fatPer100g: 0.6, sodiumPer100g: 5493, defaultServingG: 16 },
];

interface ExerciseSeed {
  name: string;
  category: string;
  metValue: number;
  description: string;
}

const exercises: ExerciseSeed[] = [
  { name: "Walking (3 mph)", category: "cardio", metValue: 3.5, description: "Leisurely walk" },
  { name: "Walking (4 mph, brisk)", category: "cardio", metValue: 5.0, description: "Brisk walk" },
  { name: "Running (5 mph / 12 min/mi)", category: "cardio", metValue: 8.3, description: "Jogging pace" },
  { name: "Running (8 mph / 7.5 min/mi)", category: "cardio", metValue: 13.5, description: "Fast run" },
  { name: "Cycling (12-14 mph)", category: "cardio", metValue: 8.0, description: "Moderate cycling" },
  { name: "Cycling (16-19 mph)", category: "cardio", metValue: 10.0, description: "Vigorous cycling" },
  { name: "Swimming (moderate)", category: "cardio", metValue: 7.0, description: "Freestyle, moderate" },
  { name: "Swimming (vigorous)", category: "cardio", metValue: 10.0, description: "Freestyle, fast" },
  { name: "Jump Rope", category: "cardio", metValue: 12.3, description: "Moderate pace" },
  { name: "Rowing (moderate)", category: "cardio", metValue: 7.0, description: "100W effort" },
  { name: "Elliptical (moderate)", category: "cardio", metValue: 5.0, description: "Moderate intensity" },
  { name: "Hiking", category: "cardio", metValue: 6.0, description: "Hill hiking with pack" },
  { name: "Weight Lifting (general)", category: "strength", metValue: 5.0, description: "Moderate effort" },
  { name: "Weight Lifting (vigorous)", category: "strength", metValue: 6.0, description: "Heavy effort" },
  { name: "Bodyweight Squats", category: "strength", metValue: 5.0, description: "Vigorous effort" },
  { name: "Push-ups", category: "strength", metValue: 8.0, description: "Vigorous effort" },
  { name: "Pull-ups", category: "strength", metValue: 8.0, description: "Vigorous effort" },
  { name: "Plank", category: "strength", metValue: 4.0, description: "Isometric hold" },
  { name: "Yoga (Hatha)", category: "flexibility", metValue: 2.5, description: "Gentle yoga" },
  { name: "Yoga (Power/Vinyasa)", category: "flexibility", metValue: 4.0, description: "Power yoga" },
  { name: "Pilates", category: "flexibility", metValue: 3.0, description: "General Pilates" },
  { name: "Stretching", category: "flexibility", metValue: 2.3, description: "Gentle stretching" },
  { name: "Basketball (game)", category: "sports", metValue: 8.0, description: "Competitive game" },
  { name: "Soccer (casual)", category: "sports", metValue: 7.0, description: "Casual play" },
  { name: "Tennis (singles)", category: "sports", metValue: 8.0, description: "Singles match" },
  { name: "Dancing (general)", category: "sports", metValue: 4.8, description: "Social dancing" },
  { name: "Stair Climbing", category: "cardio", metValue: 8.8, description: "Climbing stairs" },
];

async function seed() {
  console.log("Seeding foods...");
  let foodCount = 0;
  for (const f of foods) {
    const existing = f.barcode
      ? await db.food.findUnique({ where: { barcode: f.barcode } })
      : await db.food.findFirst({ where: { name: f.name } });
    if (existing) continue;
    await db.food.create({ data: f });
    foodCount++;
  }
  console.log(`Inserted ${foodCount} new foods`);

  console.log("Seeding exercises...");
  let exCount = 0;
  for (const e of exercises) {
    const existing = await db.exercise.findFirst({ where: { name: e.name } });
    if (existing) continue;
    await db.exercise.create({ data: e });
    exCount++;
  }
  console.log(`Inserted ${exCount} new exercises`);

  console.log("Seed complete.");
  await db.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
