import type { Platform } from "../../data/types";
import { calculateMarketplace, type MarketplaceConfigMap, type SharedComparisonScenario } from "../compare/adapters";
import type { CalculationResult } from "../types";
import { findBreakEvenUnitPrice } from "./break-even";
import { findTargetMarginUnitPrice } from "./target-margin";

/**
 * Turns a solver price (accurate to within half a penny) into the lowest
 * whole-penny price that the engine confirms meets the goal.
 */
function snapToPenny<P extends Platform>(
  platform: P,
  scenario: SharedComparisonScenario,
  config: MarketplaceConfigMap[P],
  unitPrice: number,
  meets: (r: CalculationResult) => boolean,
): number {
  let pennies = Math.max(0, Math.floor((unitPrice - 0.01) * 100));
  for (let i = 0; i < 4; i++, pennies++) {
    const price = pennies / 100;
    if (meets(calculateMarketplace(platform, { ...scenario, soldPrice: price }, config))) return price;
  }
  return Math.ceil(unitPrice * 100) / 100;
}

/** Lowest whole-penny unit price with profit of at least £0, or null if unreachable. */
export function suggestBreakEvenPrice<P extends Platform>(
  platform: P,
  scenario: SharedComparisonScenario,
  config: MarketplaceConfigMap[P],
): number | null {
  const found = findBreakEvenUnitPrice(platform, scenario, config);
  if (!found) return null;
  return snapToPenny(platform, scenario, config, found.unitPrice, (r) => r.estimatedProfit >= 0);
}

/**
 * Unit price for a target margin. The suggested price never falls short of the target:
 * - if the current price already gives the target, to the precision the person typed it
 *   (e.g. "66.7" when the real margin is 66.666…%), the current price is the answer;
 * - otherwise, the lowest whole-penny price whose exact margin is at least the target.
 * Returns the price and the exact margin it gives, or null when percentage fees make
 * the target unreachable.
 */
export function suggestTargetMarginPrice<P extends Platform>(
  platform: P,
  scenario: SharedComparisonScenario,
  config: MarketplaceConfigMap[P],
  targetMarginPct: number,
  typedDecimals = 1,
): { price: number; marginPct: number } | null {
  const current = calculateMarketplace(platform, scenario, config);
  const factor = 10 ** Math.max(0, Math.min(typedDecimals, 4));
  if (current.marginPct !== null && Math.round(current.marginPct * factor) / factor === Math.round(targetMarginPct * factor) / factor) {
    return { price: scenario.soldPrice, marginPct: current.marginPct };
  }

  const found = findTargetMarginUnitPrice(platform, scenario, config, targetMarginPct);
  if (!found) return null;
  const price = snapToPenny(platform, scenario, config, found.unitPrice, (r) => r.marginPct !== null && r.marginPct >= targetMarginPct);
  const atPrice = calculateMarketplace(platform, { ...scenario, soldPrice: price }, config);
  return { price, marginPct: atPrice.marginPct ?? targetMarginPct };
}
