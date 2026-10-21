import type { Platform } from "../../data/types";
import { calculateMarketplace, type MarketplaceConfigMap, type SharedComparisonScenario } from "../compare/adapters";
import type { CalculationResult } from "../types";

export interface TargetProfitResult {
  platform: Platform;
  /** Lowest unit sale price (within tolerance) that keeps at least the target profit on the order. */
  unitPrice: number;
  targetProfit: number;
  result: CalculationResult;
}

/**
 * Finds the lowest unit sale price at which the order's estimated profit reaches
 * the target, using the verified engine as a black box — the same approach as
 * findBreakEvenUnitPrice (which is this with a target of £0). Returns null if the
 * target isn't reached below maxUnitPrice.
 */
export function findTargetProfitUnitPrice<P extends Platform>(
  platform: P,
  base: SharedComparisonScenario,
  config: MarketplaceConfigMap[P],
  targetProfit: number,
  options: { tolerance?: number; maxIterations?: number; maxUnitPrice?: number } = {},
): TargetProfitResult | null {
  const tolerance = options.tolerance ?? 0.005;
  const maxIterations = options.maxIterations ?? 80;
  const maxUnitPrice = options.maxUnitPrice ?? 1_000_000;

  if (!Number.isFinite(targetProfit)) throw new Error("Target profit must be a finite number.");
  if (!Number.isFinite(tolerance) || tolerance <= 0) throw new Error("Target profit tolerance must be greater than 0.");
  if (!Number.isInteger(maxIterations) || maxIterations < 1) throw new Error("Target profit maxIterations must be a positive whole number.");
  if (!Number.isFinite(maxUnitPrice) || maxUnitPrice <= 0) throw new Error("Target profit maxUnitPrice must be greater than 0.");

  const at = (unitPrice: number) => calculateMarketplace(platform, { ...base, soldPrice: unitPrice }, config);
  const reaches = (r: CalculationResult) => r.estimatedProfit >= targetProfit;

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

  return { platform, unitPrice: high, targetProfit, result: at(high) };
}
