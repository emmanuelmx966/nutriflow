"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type RatingInfo } from "@/lib/api-client";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  recipeId: string;
  userRating: number | null;
  avgRating: number;
  ratingCount: number;
  size?: "sm" | "md";
}

/**
 * StarRating — interactive 1-5 star rating for recipes.
 * Shows user's rating (filled stars) + average (text).
 */
export function StarRating({ recipeId, userRating, avgRating, ratingCount, size = "sm" }: StarRatingProps) {
  const qc = useQueryClient();
  const [hoverRating, setHoverRating] = useState(0);
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  const rateMutation = useMutation({
    mutationFn: (rating: number) =>
      api.post<RatingInfo>(`/api/recipes/${recipeId}/rating`, { rating }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["community-recipes"] });
      toast.success(`Rated ${data.userRating} star${data.userRating === 1 ? "" : "s"}`);
    },
    onError: () => toast.error("Could not rate recipe"),
  });

  const unrateMutation = useMutation({
    mutationFn: () => api.del<RatingInfo>(`/api/recipes/${recipeId}/rating`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-recipes"] });
      toast.success("Rating removed");
    },
    onError: () => toast.error("Could not remove rating"),
  });

  const displayRating = hoverRating || userRating || 0;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => {
              if (userRating === star) {
                unrateMutation.mutate();
              } else {
                rateMutation.mutate(star);
              }
            }}
            className="transition-transform hover:scale-110"
            aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
          >
            <Star
              className={cn(
                starSize,
                star <= displayRating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      {ratingCount > 0 && (
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {avgRating.toFixed(1)} ({ratingCount})
        </span>
      )}
    </div>
  );
}
