import { CoinDenomination, COIN_SPECS } from './types';

/**
 * Solves the change-making problem with limited inventory:
 * Finds the set of coins that has the maximum total value ≤ requestedAmount,
 * and among those, minimizes the coin count to deliver a efficient payout.
 */
export function solveOptimalWithdrawal(
  requestedAmount: number,
  inventory: Record<CoinDenomination, number>
): { coins: Record<CoinDenomination, number>; total: number } {
  const denominations: CoinDenomination[] = [50, 10, 5, 1];
  let bestValue = -1;
  let bestCoinCount = Infinity;
  let bestCombination: Record<CoinDenomination, number> = { 50: 0, 10: 0, 5: 0, 1: 0 };

  // Helper backtracking search
  function search(
    index: number,
    currentSum: number,
    currentCoins: Record<CoinDenomination, number>,
    totalCoinsCount: number
  ) {
    if (currentSum > requestedAmount) return;

    if (currentSum > bestValue) {
      bestValue = currentSum;
      bestCoinCount = totalCoinsCount;
      bestCombination = { ...currentCoins };
    } else if (currentSum === bestValue && totalCoinsCount < bestCoinCount) {
      bestCoinCount = totalCoinsCount;
      bestCombination = { ...currentCoins };
    }

    if (index >= denominations.length) return;

    const denom = denominations[index];
    const available = inventory[denom];

    // Try starting from maximum possible of this denomination downwards
    for (let count = available; count >= 0; count--) {
      const addedValue = count * denom;
      if (currentSum + addedValue <= requestedAmount) {
        currentCoins[denom] = count;
        search(index + 1, currentSum + addedValue, currentCoins, totalCoinsCount + count);
        currentCoins[denom] = 0; // backtrack
      }
    }
  }

  const initialCoins: Record<CoinDenomination, number> = { 50: 0, 10: 0, 5: 0, 1: 0 };
  search(0, 0, initialCoins, 0);

  return {
    coins: bestCombination,
    total: bestValue,
  };
}

/**
 * Synthesizes a bright, metallic clink sound using Web Audio API to simulate physical coins.
 */
export function playCoinSound(frequencyMultiplier = 1) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // High quality metallic sound consists of multiple high-frequency oscillators
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Taiwan coins clinking are high pitch, nickel/brass alloys
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(850 * frequencyMultiplier, now);
    osc1.frequency.exponentialRampToValueAtTime(1200 * frequencyMultiplier, now + 0.08);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1450 * frequencyMultiplier, now);
    osc2.frequency.exponentialRampToValueAtTime(2500 * frequencyMultiplier, now + 0.12);

    // Envelope
    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  } catch (e) {
    console.warn('Web Audio API not supported or dynamic gesture block', e);
  }
}

/**
 * Calculates current actual physical coin weight of the chamber inside the wallet.
 */
export function getInventoryWeight(inventory: Record<CoinDenomination, number>): number {
  return (
    inventory[50] * COIN_SPECS[50].weightGrams +
    inventory[10] * COIN_SPECS[10].weightGrams +
    inventory[5] * COIN_SPECS[5].weightGrams +
    inventory[1] * COIN_SPECS[1].weightGrams
  );
}

/**
 * Back-engine combined model solver:
 * If the user has a mixed compartment weight sensor, what are the most likely coin quantities?
 * Returns a list of possible matching coin counts that equal exactly or nearest to the measured weight.
 */
export interface WeightMatchResult {
  coins: Record<CoinDenomination, number>;
  totalValue: number;
  totalWeightGrams: number;
  errorGrams: number;
}

export function solveCoinsFromTotalWeight(
  measuredWeightGrams: number,
  maxCoinsPerDenom = 30
): WeightMatchResult[] {
  // We want to find combinations {c50, c10, c5, c1} such that
  // c50*10.0 + c10*7.5 + c5*4.4 + c1*3.8 is close to measuredWeightGrams
  const results: WeightMatchResult[] = [];
  const target = measuredWeightGrams;

  // Search a reasonable subset of space to keep performance snappy
  for (let c50 = 0; c50 <= Math.min(maxCoinsPerDenom, Math.floor(target / 10.0)); c50++) {
    const w50 = c50 * 10.0;
    if (w50 > target + 5) break;

    for (let c10 = 0; c10 <= Math.min(maxCoinsPerDenom, Math.floor((target - w50) / 7.5) + 1); c10++) {
      const w50_10 = w50 + c10 * 7.5;
      if (w50_10 > target + 5) break;

      for (let c5 = 0; c5 <= Math.min(maxCoinsPerDenom, Math.floor((target - w50_10) / 4.4) + 1); c5++) {
        const w50_10_5 = w50_10 + c5 * 4.4;
        if (w50_10_5 > target + 5) break;

        // Calculate needed w1
        const remainingWeight = target - w50_10_5;
        if (remainingWeight < -1) continue;

        // Approximate 1元 coin counts needed
        const c1 = Math.max(0, Math.round(remainingWeight / 3.8));
        if (c1 > maxCoinsPerDenom) continue;

        const totalW = w50_10_5 + c1 * 3.8;
        const err = Math.abs(totalW - target);

        if (err < 0.3) { // Very high match
          results.push({
            coins: { 50: c50, 10: c10, 5: c5, 1: c1 },
            totalValue: c50 * 50 + c10 * 10 + c5 * 5 + c1 * 1,
            totalWeightGrams: Number(totalW.toFixed(2)),
            errorGrams: Number(err.toFixed(2)),
          });
        }
      }
    }
  }

  // Sort by lowest error first, then highest value, then fewer coins
  return results
    .sort((a, b) => {
      if (a.errorGrams !== b.errorGrams) {
        return a.errorGrams - b.errorGrams;
      }
      return b.totalValue - a.totalValue;
    })
    .slice(0, 5); // Return top 5 matches
}
