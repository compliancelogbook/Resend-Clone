import type { Platform } from "../../data/types";
import { calculateMarketplace, type MarketplaceConfigMap, type SharedComparisonScenario } from "../compare/adapters";
import type { CalculationResult } from "../types";

export interface BreakEvenResult {
  platform: Platform;
  unitPrice: number;
  result: CalculationResult;
  iterations: number;
  tolerance: number;
}

export interface BreakEvenOptions {
  tolerance?: number;
  maxIterations?: number;
  maxUnitPrice?: number;
}

function calculateAtPrice<P extends Platform>(
  platform: P,
  base: SharedComparisonScenario,
  config: MarketplaceConfigMap[P],
  unitPrice: number,
): CalculationResult {
  return calculateMarketplace(platform, { ...base, soldPrice: unitPrice }, config);
}

/**
 * Finds the lowest unit sale price, within tolerance, at which estimated
 * profit is non-negative. It deliberately treats the verified engine as a
 * black box so fixed, tiered and marketplace-specific fee mechanics remain
 * authoritative.
 */
export function findBreakEvenUnitPrice<P extends Platform>(
  platform: P,
  base: SharedComparisonScenario,
  config: MarketplaceConfigMap[P],
  options: BreakEvenOptions = {},
): BreakEvenResult | null {
  const tolerance = options.tolerance ?? 0.005;
  const maxIterations = options.maxIterations ?? 80;
  const maxUnitPrice = options.maxUnitPrice ?? 1_000_000;

  if (!Number.isFinite(tolerance) || tolerance <= 0) throw new Error("Break-even tolerance must be greater than 0.");
  if (!Number.isInteger(maxIterations) || maxIterations < 1) throw new Error("Break-even maxIterations must be a positive whole number.");
  if (!Number.isFinite(maxUnitPrice) || maxUnitPrice <= 0) throw new Error("Break-even maxUnitPrice must be greater than 0.");

  let low = 0;
  let high = Math.max(base.soldPrice, 1);
  let highResult = calculateAtPrice(platform, base, config, high);
  let expansionSteps = 0;

  while (highResult.estimatedProfit < 0 && high < maxUnitPrice) {
    low = high;
    high = Math.min(high * 2, maxUnitPrice);
    highResult = calculateAtPrice(platform, base, config, high);
    expansionSteps += 1;
    if (high === maxUnitPrice) break;
  }

  if (highResult.estimatedProfit < 0) return null;

  let iterations = expansionSteps;
  while (high - low > tolerance && iterations < maxIterations) {
    const mid = (low + high) / 2;
    const result = calculateAtPrice(platform, base, config, mid);
    if (result.estimatedProfit >= 0) high = mid;
    else low = mid;
    iterations += 1;
  }

  const unitPrice = high;
  return {
    platform,
    unitPrice,
    result: calculateAtPrice(platform, base, config, unitPrice),
    iterations,
    tolerance,
  };
}
