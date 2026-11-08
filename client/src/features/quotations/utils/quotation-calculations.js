export function calculateAnnualGeneration(capacityKw, unitsPerKwPerYear = 1400) {
  const capacity = Number(capacityKw);
  const generationRate = Number(unitsPerKwPerYear);

  if (!Number.isFinite(capacity) || capacity <= 0) return 0;
  if (!Number.isFinite(generationRate) || generationRate < 0) return 0;

  return Math.round(capacity * generationRate);
}

/**
 * Calculates only the illustrative demo subsidy value supplied in the project brief.
 * This is not an eligibility decision or a verified policy calculation.
 */
export function calculateIllustrativeSubsidy(capacityKw, rule) {
  const capacity = Number(capacityKw);
  if (!Number.isFinite(capacity) || capacity <= 0 || !rule) return 0;

  const firstBlockKw = Math.min(capacity, 2);
  const thirdBlockKw = Math.min(Math.max(capacity - 2, 0), 1);
  const uncapped =
    firstBlockKw * Number(rule.firstTwoKwPerKw || 0) +
    thirdBlockKw * Number(rule.thirdKw || 0);

  return Math.min(uncapped, Number(rule.maximumAmount || 0));
}

export function formatINR(value) {
  if (value === null || value === undefined || value === "") {
    return "Awaiting verified input";
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Awaiting verified input";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
