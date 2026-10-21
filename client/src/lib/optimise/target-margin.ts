import type { Platform } from "../../data/types";
import { calculateMarketplace, type MarketplaceConfigMap, type SharedComparisonScenario } from "../compare/adapters";
import type { CalculationResult } from "../types";

export interface TargetMarginResult {
  platform: Platform;
  /** Lowest unit sale price (within tolerance) that reaches the target margin. */
  unitPrice: number;
  /** Target profit margin as a percentage, e.g. 30 for 30%. */
  targetMarginPct: number;
  result: CalculationResult;
}

export interface TargetMarginOptions {
  tolerance?: number;
  maxIterations?: number;
  maxUnitPrice?: number;
}

/**
 * Finds the lowest unit sale price at which the profit margin reaches the
 * target, using the verified engine as a black box (same approach as
 * findBreakEvenUnitPrice). Returns null when the target can't be reached
 * below maxUnitPrice — e.g. a 95% margin is impossible once percentage fees
 * take more than 5% of every sale.
 */
export function findTargetMarginUnitPrice<P extends Platform>(
  platform: P,
  base: SharedComparisonScenario,
  config: MarketplaceConfigMap[P],
  targetMarginPct: number,
  options: TargetMarginOptions = {},
): TargetMarginResult | null {
  const tolerance = options.tolerance ?? 0.005;
  const maxIterations = options.maxIterations ?? 80;
  const maxUnitPrice = options.maxUnitPrice ?? 1_000_000;

  if (!Number.isFinite(targetMarginPct) || targetMarginPct <= 0 || targetMarginPct >= 100) {
    throw new Error("Target margin must be greater than 0% and less than 100%.");
  }
  if (!Number.isFinite(tolerance) || tolerance <= 0) throw new Error("Target margin tolerance must be greater than 0.");
  if (!Number.isInteger(maxIterations) || maxIterations < 1) throw new Error("Target margin maxIterations must be a positive whole number.");
  if (!Number.isFinite(maxUnitPrice) || maxUnitPrice <= 0) throw new Error("Target margin maxUnitPrice must be greater than 0.");

  const at = (unitPrice: number) => calculateMarketplace(platform, { ...base, soldPrice: unitPrice }, config);
  const reaches = (r: CalculationResult) => r.marginPct !== null && r.marginPct >= targetMarginPct;

  let low = 0;
  let high = Math.max(base.soldPrice, 1);
  let highResult = at(high);
  let iterations = 0;

  while (!reaches(highResult) && high < maxUnitPrice) {
    low = high;
    high = Math.min(high * 2, maxUnitPrice);
    highResult = at(high);
    iterations += 1;
  }
  if (!reaches(highResult)) return null;

  while (high - low > tolerance && iterations < maxIterations) {
    const mid = (low + high) / 2;
    if (reaches(at(mid))) high = mid;
    else low = mid;
    iterations += 1;
  }

  return { platform, unitPrice: high, targetMarginPct, result: at(high) };
}
