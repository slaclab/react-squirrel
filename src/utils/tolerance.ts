/**
 * Utility functions for checking value tolerances
 */

/**
 * Check if a live value is within tolerance of a saved value
 *
 * @param savedValue - The saved/reference value
 * @param liveValue - The current/live value
 * @param absTolerance - Absolute tolerance (e.g., ±0.001)
 * @param relTolerance - Relative tolerance as fraction (e.g., 0.01 for 1%)
 * @returns true if within tolerance, false otherwise
 */
export function checkTolerance(
  savedValue: number | string | null | undefined,
  liveValue: number | string | null | undefined,
  absTolerance: number = 0,
  relTolerance: number = 0
): boolean {
  // Handle null/undefined - both null means match
  if (savedValue == null && liveValue == null) {
    return true;
  }

  // One null and one not - no match
  if (savedValue == null || liveValue == null) {
    return false;
  }

  // String comparison (exact match required)
  if (typeof savedValue === 'string' || typeof liveValue === 'string') {
    return String(savedValue) === String(liveValue);
  }

  // Both are numbers - check numeric tolerance
  const numSaved = Number(savedValue);
  const numLive = Number(liveValue);

  // Check for NaN
  if (isNaN(numSaved) || isNaN(numLive)) {
    return false;
  }

  // Exact match
  if (numSaved === numLive) {
    return true;
  }

  const diff = Math.abs(numSaved - numLive);

  // Check absolute tolerance first
  if (absTolerance > 0 && diff <= absTolerance) {
    return true;
  }

  // Check relative tolerance
  if (relTolerance > 0 && numSaved !== 0) {
    const relDiff = diff / Math.abs(numSaved);
    if (relDiff <= relTolerance) {
      return true;
    }
  }

  // No tolerance specified and values differ
  if (absTolerance === 0 && relTolerance === 0) {
    // Default to exact match for zero tolerance
    return numSaved === numLive;
  }

  return false;
}

/**
 * Check tolerance for a PV with both setpoint and readback values
 */
export function checkPVTolerance(
  pv: {
    setpoint_data?: { data?: unknown } | null;
    readback_data?: { data?: unknown } | null;
    abs_tolerance?: number;
    rel_tolerance?: number;
  },
  liveValues: Map<string, { data?: unknown }>,
  setpointPV: string,
  _readbackPV?: string
): boolean {
  const savedSetpoint = pv.setpoint_data?.data;
  const liveSetpoint = liveValues.get(setpointPV)?.data;

  return checkTolerance(
    savedSetpoint as number | string | null | undefined,
    liveSetpoint as number | string | null | undefined,
    pv.abs_tolerance ?? 0,
    pv.rel_tolerance ?? 0
  );
}

export default { checkTolerance, checkPVTolerance };
