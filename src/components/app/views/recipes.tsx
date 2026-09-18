"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Recipe, type FoodItem, type FoodSearchResult, type CommunityRecipe, type RecipeComment } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChefHat, Plus, Search, Trash2, Loader2, BookOpen, Globe, Sparkles, X, Heart, TrendingUp, Clock, MessageCircle, Star } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/app/star-rating";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export function RecipesView() {
  const [scope, setScope] = useState<"mine" | "community">("mine");
  const [sort, setSort] = useState<"popular" | "recent" | "rated">("popular");
  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipes", scope],
    queryFn: () => api.get<Recipe[]>(`/api/recipes?scope=${scope === "mine" ? "mine" : "public"}`),
    enabled: scope === "mine",
  });
  const { data: community, isLoading: loadingCommunity } = useQuery({
    queryKey: ["community-recipes", sort],
    queryFn: () => api.get<CommunityRecipe[]>(`/api/recipes/likes?sort=${sort}`),
    enabled: scope === "community",
  });

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><ChefHat className="h-5 w-5 text-emerald-500" /> Recipes</h2>
        <RecipeCreator />
      </div>

      <p className="text-xs text-muted-foreground -mt-2">
        Save your favorite meal combinations as reusable recipes. Log a whole recipe to your diary in one tap.
      </p>

      <div className="flex gap-1.5">
        <Button variant={scope === "mine" ? "default" : "outline"} size="sm" className="h-8 flex-1 text-xs" onClick={() => setScope("mine")}>
          <BookOpen className="h-3.5 w-3.5 mr-1" /> My recipes
        </Button>
        <Button variant={scope === "community" ? "default" : "outline"} size="sm" className="h-8 flex-1 text-xs" onClick={() => setScope("community")}>
          <Globe className="h-3.5 w-3.5 mr-1" /> Community
        </Button>
      </div>

      {scope === "community" && (
        <div className="flex gap-1.5">
          <Button variant={sort === "popular" ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setSort("popular")}>
            <TrendingUp className="h-3 w-3 mr-1" /> Popular
          </Button>
          <Button variant={sort === "rated" ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setSort("rated")}>
            <Star className="h-3 w-3 mr-1" /> Top Rated
          </Button>
          <Button variant={sort === "recent" ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={() => setSort("recent")}>
            <Clock className="h-3 w-3 mr-1" /> Recent
          </Button>
        </div>
      )}

      {scope === "mine" && isLoading ? (
        <RecipeListSkeleton />
      ) : scope === "mine" && recipes && recipes.length > 0 ? (
        <ul className="space-y-2">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} scope="mine" />
          ))}
        </ul>
      ) : scope === "community" && loadingCommunity ? (
        <RecipeListSkeleton />
      ) : scope === "community" && community && community.length > 0 ? (
        <ul className="space-y-2">
          {community.map((r) => (
            <CommunityRecipeCard key={r.id} recipe={r} />
          ))}
        </ul>
      ) : (
        <Card className="border-dashed border-border/60">
          <CardContent className="py-12 text-center">
            <ChefHat className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <div className="text-sm font-medium">
              {scope === "mine" ? "No recipes yet" : "No community recipes yet"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              {scope === "mine"
                ? "Create your first recipe — combine foods into a meal you can log in one tap."
                : "Share your recipes publicly to help the community."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecipeCard({ recipe, scope }: { recipe: Recipe; scope: "mine" | "public" }) {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/api/recipes/${recipe.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recipe deleted");
    },
    onError: () => toast.error("Could not delete recipe"),
  });

  return (
    <Card className="border-border/60 overflow-hidden transition-shadow hover:shadow-md hover:shadow-emerald-900/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold truncate">{recipe.name}</h3>
              {recipe.isPublic && scope === "mine" && (
                <Badge variant="secondary" className="text-[9px] h-4 gap-0.5">
                  <Globe className="h-2.5 w-2.5" /> Public
                </Badge>
              )}
            </div>
            {recipe.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{recipe.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-[11px]">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{recipe.calories} kcal</span>
              <span className="text-muted-foreground">P{Math.round(recipe.proteinG)}g</span>
              <span className="text-muted-foreground">C{Math.round(recipe.carbsG)}g</span>
              <span className="text-muted-foreground">F{Math.round(recipe.fatG)}g</span>
              <span className="text-muted-foreground">· {recipe.servings} serv</span>
              <span className="text-muted-foreground">· {recipe.ingredients.length} ingredients</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <Button size="sm" className="h-7 text-xs" onClick={() => setLogOpen(true)}>Log</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(true)}>View</Button>
          </div>
        </div>
      </CardContent>

      {/* Recipe detail dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto scroll-slim">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-emerald-500" /> {recipe.name}
            </DialogTitle>
          </DialogHeader>
          {recipe.description && (
            <p className="text-sm text-muted-foreground">{recipe.description}</p>
          )}
          <div className="grid grid-cols-4 gap-2 rounded-xl bg-accent/40 p-3 text-center">
            <div><div className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{recipe.calories}</div><div className="text-[10px] text-muted-foreground">kcal</div></div>
            <div><div className="text-lg font-bold tabular-nums">{Math.round(recipe.proteinG)}g</div><div className="text-[10px] text-muted-foreground">protein</div></div>
            <div><div className="text-lg font-bold tabular-nums">{Math.round(recipe.carbsG)}g</div><div className="text-[10px] text-muted-foreground">carbs</div></div>
            <div><div className="text-lg font-bold tabular-nums">{Math.round(recipe.fatG)}g</div><div className="text-[10px] text-muted-foreground">fat</div></div>
          </div>
          <div className="text-[10px] text-muted-foreground text-center">per serving · {recipe.servings} servings total</div>
          <div className="pt-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Ingredients</div>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} className="flex items-center justify-between rounded-lg bg-accent/30 px-3 py-1.5 text-xs">
                  <span className="font-medium">{ing.name}</span>
                  <span className="text-muted-foreground">{Math.round(ing.quantityG)}g · {Math.round(ing.calories)} kcal</span>
                </li>
              ))}
            </ul>
          </div>
          {scope === "mine" && (
            <DialogFooter className="gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLogOpen(true)}>Log to diary</Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => { deleteMutation.mutate(); setOpen(false); }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Log to diary dialog */}
      <LogRecipeDialog recipe={recipe} open={logOpen} onOpenChange={setLogOpen} date={selectedDate} />
    </Card>
  );
}

function LogRecipeDialog({
  recipe,
  open,
  onOpenChange,
  date,
}: {
  recipe: Recipe;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: string;
}) {
  const [meal, setMeal] = useState<Meal>("lunch");
  const [servings, setServings] = useState(1);
  const qc = useQueryClient();

  const logMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/recipes/${recipe.id}/log`, { meal, date, servings }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diary", date] });
      qc.invalidateQueries({ queryKey: ["dashboard", date] });
      toast.success(`${recipe.name} logged to ${meal}`);
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to log"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Log recipe</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg bg-accent/40 p-3 text-center">
            <div className="text-xs text-muted-foreground">{recipe.name}</div>
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {Math.round(recipe.calories * servings)} <span className="text-xs font-normal">kcal</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {servings} × {recipe.calories} kcal/serving
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Meal</Label>
            <Select value={meal} onValueChange={(v) => setMeal(v as Meal)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Servings</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setServings(Math.max(0.25, Math.round((servings - 0.25) * 100) / 100))}>
                <span className="text-lg leading-none">−</span>
              </Button>
              <Input type="number" step="0.25" min="0.25" value={servings} onChange={(e) => setServings(Math.max(0.25, parseFloat(e.target.value) || 0.25))} className="text-center" />
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setServings(Math.round((servings + 0.25) * 100) / 100)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => logMutation.mutate()} disabled={logMutation.isPending} className="w-full">
            {logMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Add to {meal}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DraftIngredient {
  id: string; // local key
  foodId?: string;
  name: string;
  quantityG: number;
}

function RecipeCreator() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState(1);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/api/recipes", {
        name,
        description: description || undefined,
        servings,
        ingredients: ingredients.map((i) => ({ foodId: i.foodId, name: i.name, quantityG: i.quantityG })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recipe created");
      setOpen(false);
      setName(""); setDescription(""); setServings(1); setIngredients([]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create recipe"),
  });

  // Computed totals (preview)
  const totals = ingredients.reduce(
    (acc, ing) => {
      acc.calories += 0; // resolved server-side; we show count only
      return acc;
    },
    { calories: 0 },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New recipe</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" /> Create recipe
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto scroll-slim flex-1 -mx-1 px-1">
          <div className="space-y-1.5">
            <Label>Recipe name</Label>
            <Input placeholder="e.g. Morning Power Bowl" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea placeholder="A quick note about this recipe..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label>Servings</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setServings(Math.max(1, servings - 1))}>
                <span className="text-lg leading-none">−</span>
              </Button>
              <Input type="number" min="1" max="50" value={servings} onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))} className="text-center" />
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setServings(servings + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Ingredients ({ingredients.length})</Label>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSearchOpen(true)}>
                <Plus className="h-3 w-3 mr-1" /> Add ingredient
              </Button>
            </div>
            {ingredients.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground">
                Add at least one ingredient
              </div>
            ) : (
              <ul className="space-y-1">
                {ingredients.map((ing) => (
                  <li key={ing.id} className="flex items-center justify-between rounded-lg bg-accent/30 px-3 py-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{ing.name}</div>
                      <div className="text-muted-foreground">{ing.quantityG}g</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        value={ing.quantityG}
                        onChange={(e) =>
                          setIngredients((arr) =>
                            arr.map((x) => (x.id === ing.id ? { ...x, quantityG: Math.max(1, parseInt(e.target.value) || 1) } : x)),
                          )
                        }
                        className="h-7 w-16 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setIngredients((arr) => arr.filter((x) => x.id !== ing.id))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !name.trim() || ingredients.length === 0}
            className="w-full"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create recipe ({totals.calories > 0 ? `${totals.calories} kcal` : `${ingredients.length} items`})</>}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Ingredient search dialog */}
      <IngredientPicker
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onPick={(food) => {
          setIngredients((arr) => [
            ...arr,
            { id: crypto.randomUUID(), foodId: food.id, name: food.name, quantityG: Math.round(food.defaultServingG) },
          ]);
          setSearchOpen(false);
        }}
      />
    </Dialog>
  );
}

function IngredientPicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (food: FoodItem) => void;
}) {
  const [query, setQuery] = useState("");
  const { data, isFetching } = useQuery({
    queryKey: ["food-search", query],
    queryFn: () => api.get<FoodSearchResult>(`/api/foods?query=${encodeURIComponent(query)}&limit=20`),
    enabled: query.length > 1 && open,
  });
  const results = [...(data?.foods ?? []), ...(data?.custom ?? [])];

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQuery(""); }}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>Add ingredient</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input autoFocus placeholder="Search foods..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto scroll-slim -mx-1 px-1 min-h-[200px]">
          {query.length <= 1 && (
            <div className="py-12 text-center text-sm text-muted-foreground">Type at least 2 characters</div>
          )}
          {query.length > 1 && isFetching && (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          )}
          {query.length > 1 && !isFetching && results.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No foods found</div>
          )}
          <ul className="space-y-1">
            {results.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => onPick(f)}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{f.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{f.servingDesc}</div>
                    </div>
                    <Badge variant="outline" className="text-[9px] h-4 capitalize shrink-0">{f.category}</Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="w-full">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecipeListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  );
}

function CommunityRecipeCard({ recipe }: { recipe: CommunityRecipe }) {
  const qc = useQueryClient();
  const selectedDate = useAppStore((s) => s.selectedDate);
  const [logOpen, setLogOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/api/recipes/likes?recipeId=${recipe.id}`),
    onSuccess: (data: { liked: boolean; likeCount: number }) => {
      qc.invalidateQueries({ queryKey: ["community-recipes"] });
      toast.success(data.liked ? "Recipe liked!" : "Like removed");
    },
    onError: () => toast.error("Could not like recipe"),
  });

  const logMutation = useMutation({
    mutationFn: () => api.post(`/api/recipes/${recipe.id}/log`, { meal: "lunch", date: selectedDate, servings: 1 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diary", selectedDate] });
      qc.invalidateQueries({ queryKey: ["dashboard", selectedDate] });
      toast.success("Recipe logged to lunch");
      setLogOpen(false);
    },
    onError: () => toast.error("Could not log recipe"),
  });

  return (
    <Card className="border-border/60 overflow-hidden transition-shadow hover:shadow-md hover:shadow-emerald-900/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold truncate">{recipe.name}</h3>
            </div>
            {recipe.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{recipe.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-[11px]">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{recipe.calories} kcal</span>
              <span className="text-muted-foreground">P{Math.round(recipe.proteinG)}g C{Math.round(recipe.carbsG)}g F{Math.round(recipe.fatG)}g</span>
              {recipe.authorName && (
                <span className="text-muted-foreground">· by {recipe.authorName}</span>
              )}
            </div>
            <div className="mt-1.5">
              <StarRating recipeId={recipe.id} userRating={recipe.userRating} avgRating={recipe.avgRating} ratingCount={recipe.ratingCount} />
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className={cn("h-7 px-2 text-xs gap-1", recipe.liked && "text-rose-500")}
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart className={cn("h-3.5 w-3.5", recipe.liked && "fill-current")} />
              {recipe.likeCount > 0 && recipe.likeCount}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => setCommentsOpen(true)}>
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={() => logMutation.mutate()} disabled={logMutation.isPending}>
              {logMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Log"}
            </Button>
          </div>
        </div>
      </CardContent>

      <CommentsDialog
        recipeId={recipe.id}
        recipeName={recipe.name}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </Card>
  );
}

function CommentsDialog({
  recipeId,
  recipeName,
  open,
  onOpenChange,
}: {
  recipeId: string;
  recipeName: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["recipe-comments", recipeId],
    queryFn: () => api.get<RecipeComment[]>(`/api/recipes/${recipeId}/comments`),
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/recipes/${recipeId}/comments`, { content: commentText.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipe-comments", recipeId] });
      setCommentText("");
      toast.success("Comment added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to comment"),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) =>
      api.del(`/api/recipes/${recipeId}/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipe-comments", recipeId] });
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Could not delete"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setCommentText(""); }}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-emerald-500" /> Comments
          </DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{recipeName}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scroll-slim -mx-1 px-1 min-h-[120px]">
          {isLoading ? (
            <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : comments && comments.length > 0 ? (
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="rounded-lg bg-accent/40 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{c.authorName ?? "Anonymous"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-snug">{c.content}</p>
                  {c.isOwn && (
                    <button
                      onClick={() => deleteMutation.mutate(c.id)}
                      className="text-[10px] text-muted-foreground hover:text-destructive mt-1"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No comments yet. Be the first to share!
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === "Enter" && commentText.trim() && !addMutation.isPending) {
                addMutation.mutate();
              }
            }}
            className="text-xs"
          />
          <Button
            size="sm"
            disabled={!commentText.trim() || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
