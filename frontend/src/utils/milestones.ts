/**
 * Milestone thresholds for project progress
 */
export const MILESTONE_THRESHOLDS = [25, 50, 75, 100] as const;

/**
 * Get the current milestone that the progress has reached or exceeded.
 * Returns the highest milestone threshold that has been reached.
 * 
 * @param progress - Current progress percentage (0-100)
 * @returns The milestone percentage reached, or null if no milestone reached
 */
export const getCurrentMilestone = (progress: number): number | null => {
  if (progress >= 100) return 100;
  if (progress >= 75) return 75;
  if (progress >= 50) return 50;
  if (progress >= 25) return 25;
  return null;
};

/**
 * Check if a milestone was crossed when progress changed from previous to current.
 * Returns the milestone that was just crossed (first time reached), or null if no milestone was crossed.
 * 
 * @param previousProgress - Previous progress percentage (0-100)
 * @param currentProgress - Current progress percentage (0-100)
 * @returns The milestone percentage that was just crossed, or null if no milestone was crossed
 */
export const getMilestoneReached = (previousProgress: number, currentProgress: number): number | null => {
  // If progress decreased, no milestone was crossed
  if (currentProgress <= previousProgress) {
    return null;
  }

  // Check each milestone threshold in order
  for (const threshold of MILESTONE_THRESHOLDS) {
    // Check if we crossed this threshold (previous was below, current is at or above)
    if (previousProgress < threshold && currentProgress >= threshold) {
      return threshold;
    }
  }

  return null;
};

