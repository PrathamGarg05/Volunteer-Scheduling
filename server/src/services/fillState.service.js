/**
 * Derives a shift's fill state from its signup count vs required headcount.
 * Pure function: no DB access, no side effects — takes numbers, returns a string.
 * Deliberately never returns "Closed" — that's a separate, manually-set state
 * that only a coordinator can trigger.
 */
export function deriveFillState(activeSignupCount, requiredHeadcount) {
    if (activeSignupCount < 0 || requiredHeadcount < 1) {
      throw new Error("Invalid input: activeSignupCount must be >= 0, requiredHeadcount must be >= 1.");
    }
  
    if (activeSignupCount === 0) {
      return "Open";
    }
    if (activeSignupCount < requiredHeadcount) {
      return "Partially Filled";
    }
    // activeSignupCount >= requiredHeadcount
    return "Filled";
  }