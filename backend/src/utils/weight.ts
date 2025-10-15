/**
 * Calculate total weight in grams
 */
export function calculateTotalWeight(items: Array<{ weightGram: number; qty: number }>): number {
  return items.reduce((sum, item) => sum + item.weightGram * item.qty, 0);
}

/**
 * Convert grams to kilograms
 */
export function gramsToKilograms(grams: number): number {
  return Math.ceil(grams / 1000);
}
