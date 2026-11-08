export const GENERATION_UNITS_PER_KW_PER_YEAR = 1400;

export const DEFAULT_SUBSIDY_RULE = Object.freeze({
  firstTwoKwPerKw: 30000,
  thirdKw: 18000,
  maximumSubsidy: 78000,
});

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function toPositiveNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function formatINR(value, options = {}) {
  if (!isFiniteNumber(value)) return "Awaiting verified input";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatINRCompact(value) {
  if (!isFiniteNumber(value)) return "Awaiting verified input";
  return `₹ ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
}

export function calculateAnnualGeneration(
  capacityKw,
  unitsPerKwPerYear = GENERATION_UNITS_PER_KW_PER_YEAR
) {
  if (
    !isFiniteNumber(capacityKw) ||
    capacityKw <= 0 ||
    !isFiniteNumber(unitsPerKwPerYear) ||
    unitsPerKwPerYear <= 0
  ) {
    return null;
  }
  return Math.round(capacityKw * unitsPerKwPerYear);
}

export function calculateSubsidy(capacityKw, rule = DEFAULT_SUBSIDY_RULE) {
  if (!isFiniteNumber(capacityKw) || capacityKw <= 0 || !rule) return null;
  const firstTwoKw = Math.min(capacityKw, 2);
  const thirdKw = Math.max(0, Math.min(capacityKw - 2, 1));
  const rawAmount =
    firstTwoKw * rule.firstTwoKwPerKw + thirdKw * rule.thirdKw;
  return Math.min(rawAmount, rule.maximumSubsidy);
}

export function calculateDraftGrossCost(rate) {
  if (!rate) return null;
  const equipment = toPositiveNumber(rate.equipmentCost);
  const installation = toPositiveNumber(rate.installationCost);
  if (equipment === null || installation === null) return null;
  return equipment + installation;
}

export function calculateApprovedGrossCost(rate) {
  if (!rate || rate.approvalStatus !== "approved") return null;
  return calculateDraftGrossCost(rate);
}

export function calculateNetInstallationCost(grossCost, subsidy, isVerified = false) {
  if (!isVerified || !isFiniteNumber(grossCost) || !isFiniteNumber(subsidy)) {
    return null;
  }
  return Math.max(0, grossCost - subsidy);
}

export function validateEffectiveDates(effectiveFrom, effectiveTo = "") {
  const errors = {};
  const fromDate = parseISODate(effectiveFrom);
  const toDate = effectiveTo ? parseISODate(effectiveTo) : null;

  if (!effectiveFrom || !fromDate) {
    errors.effectiveFrom = "Enter a valid effective-from date.";
  }
  if (effectiveTo && !toDate) {
    errors.effectiveTo = "Enter a valid effective-to date.";
  }
  if (fromDate && toDate && toDate < fromDate) {
    errors.effectiveTo = "Effective-to date cannot be earlier than effective-from date.";
  }
  return errors;
}

export function parseISODate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

export function getNextEffectiveDate(referenceDate) {
  const parsed = parseISODate(referenceDate);
  if (!parsed) return "";
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString().slice(0, 10);
}

export function getVersionStatus(version, referenceDate = "2026-11-14") {
  if (!version) return "unknown";
  if (version.status === "draft") return "draft";
  if (version.status === "revoked") return "revoked";
  const from = parseISODate(version.effectiveFrom);
  const to = version.effectiveTo ? parseISODate(version.effectiveTo) : null;
  const reference = parseISODate(referenceDate);
  if (!from || !reference) return version.status ?? "unknown";
  if (reference < from) return "scheduled";
  if (to && reference > to) return "expired";
  return "active";
}

export function sortVersionsNewestFirst(versions = []) {
  return [...versions].sort((a, b) => {
    const aDate = parseISODate(a.effectiveFrom)?.getTime() ?? 0;
    const bDate = parseISODate(b.effectiveFrom)?.getTime() ?? 0;
    return bDate - aDate;
  });
}

export function validateNewVersion({ version, effectiveFrom, effectiveTo }, existingVersions = []) {
  const errors = { ...validateEffectiveDates(effectiveFrom, effectiveTo) };
  const versionPattern = /^v\d+\.\d+$/;
  if (!versionPattern.test(String(version ?? "").trim())) {
    errors.version = "Use a version label such as v2.1.";
  } else if (existingVersions.some((item) => item.version === version.trim())) {
    errors.version = "This version label already exists.";
  }
  return errors;
}

export function createDraftVersion(input, existingVersions = []) {
  const errors = validateNewVersion(input, existingVersions);
  if (Object.keys(errors).length > 0) return { version: null, errors };
  const version = {
    id: `draft-${input.version.trim().replace(/[^a-zA-Z0-9.-]/g, "")}`,
    version: input.version.trim(),
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo || null,
    status: "draft",
    note: String(input.note ?? "").trim(),
    createdInSession: true,
  };
  return { version, errors: {} };
}

export function getRateForCapacity(rates = [], capacityKw) {
  return rates.find((rate) => rate.systemSizeKw === capacityKw) ?? null;
}

export function getRateDisplayState(rate) {
  if (!rate) return "awaiting";
  if (rate.approvalStatus === "approved") return "approved";
  if (calculateDraftGrossCost(rate) !== null) return "draft";
  return "awaiting";
}

export function getNextVersionLabel(versions = []) {
  const majorMinor = versions
    .map((item) => /^v(\d+)\.(\d+)$/.exec(item.version ?? ""))
    .filter(Boolean)
    .map((match) => ({ major: Number(match[1]), minor: Number(match[2]) }))
    .sort((a, b) => b.major - a.major || b.minor - a.minor)[0];
  if (!majorMinor) return "v1.0";
  return `v${majorMinor.major}.${majorMinor.minor + 1}`;
}
