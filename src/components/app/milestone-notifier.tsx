"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type MilestonesData } from "@/lib/api-client";
import { toast } from "sonner";
import { Trophy } from "lucide-react";

/**
 * MilestoneNotifier — silently checks for newly unlocked milestones
 * and shows a celebratory toast when one is unlocked.
 * Uses localStorage to track previously-seen unlocked milestones.
 */
export function MilestoneNotifier() {
  const prevUnlockedRef = useRef<Set<string> | null>(null);
  const initialized = useRef(false);

  const { data } = useQuery({
    queryKey: ["milestones"],
    queryFn: () => api.get<MilestonesData>("/api/milestones"),
    refetchInterval: 60 * 1000, // check every minute
  });

  useEffect(() => {
    if (!data) return;

    const currentUnlocked = new Set(
      data.milestones.filter((m) => m.unlocked).map((m) => m.id),
    );

    if (!initialized.current) {
      // First load — initialize without showing notifications
      prevUnlockedRef.current = currentUnlocked;
      initialized.current = true;
      return;
    }

    const prev = prevUnlockedRef.current ?? new Set<string>();
    const newlyUnlocked = data.milestones.filter(
      (m) => m.unlocked && !prev.has(m.id),
    );

    for (const milestone of newlyUnlocked) {
      toast.success(`Milestone unlocked: ${milestone.title}!`, {
        description: milestone.description,
        icon: <span className="text-lg">{milestone.icon}</span>,
        duration: 6000,
      });
    }

    prevUnlockedRef.current = currentUnlocked;
  }, [data]);

  return null;
}
