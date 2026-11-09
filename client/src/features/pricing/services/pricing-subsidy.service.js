import { apiRequest } from "../../../services/api/api-client.js";

function unwrap(response) {
  return response?.data ?? response;
}

function toDateOnly(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function isEffective(rule, date) {
  const from = toDateOnly(rule.effectiveFrom);
  const to = toDateOnly(rule.effectiveTo);
  return rule.status === "active" && (!from || from <= date) && (!to || to >= date);
}

function latestFirst(rules = []) {
  return [...rules].sort((left, right) => {
    const dateDifference = new Date(right.effectiveFrom ?? 0) - new Date(left.effectiveFrom ?? 0);
    return dateDifference || Number(right.version ?? 0) - Number(left.version ?? 0);
  });
}

function currentRules(rules, date, predicate = () => true) {
  return latestFirst(rules.filter((rule) => isEffective(rule, date) && predicate(rule)));
}

function mapRates(activePricing) {
  return [1, 2, 3].map((systemSizeKw) => ({
    id: activePricing ? `${activePricing.id}-${systemSizeKw}kw` : `awaiting-${systemSizeKw}kw`,
    ruleId: activePricing?.id ?? null,
    ruleName: activePricing?.ruleName ?? null,
    version: activePricing?.version ?? null,
    systemSizeKw,
    equipmentCost: activePricing ? activePricing.pricePerKW * systemSizeKw : null,
    installationCost: activePricing?.installationCharges ?? null,
    approvalStatus: activePricing ? "active" : "awaiting-approval",
    currency: "INR",
  }));
}

function mapSubsidyRule(rule) {
  if (!rule) {
    return {
      id: null,
      title: "No active subsidy rule",
      ruleName: null,
      version: null,
      slabs: [],
      maximumSubsidy: 0,
      verificationStatus: "unverified",
      status: "not-configured",
      effectiveFrom: null,
      effectiveTo: null,
      firstTwoKwPerKw: 0,
      thirdKw: 0,
    };
  }

  const firstSlab = rule.slabs?.[0];
  const secondSlab = rule.slabs?.[1];
  return {
    ...rule,
    title: rule.ruleName,
    firstTwoKwPerKw: firstSlab?.amountPerKW ?? 0,
    thirdKw: secondSlab?.amountPerKW ?? 0,
    effectiveFrom: toDateOnly(rule.effectiveFrom),
    effectiveTo: toDateOnly(rule.effectiveTo),
  };
}

export async function fetchPricingSubsidyConfiguration() {
  const [pricingResponse, subsidyResponse, generationResponse] = await Promise.all([
    apiRequest("/rules/pricing?limit=100"),
    apiRequest("/rules/subsidies?limit=100"),
    apiRequest("/rules/generation?limit=100"),
  ]);

  const referenceDate = new Date().toISOString().slice(0, 10);
  const pricingRules = latestFirst(unwrap(pricingResponse)?.rules ?? []);
  const subsidyRules = latestFirst(unwrap(subsidyResponse)?.rules ?? []);
  const generationRules = latestFirst(unwrap(generationResponse)?.rules ?? []);

  const activePricingRules = currentRules(pricingRules, referenceDate);
  const verifiedSubsidyRules = currentRules(
    subsidyRules,
    referenceDate,
    (rule) => rule.verificationStatus === "verified"
  );
  const displaySubsidyRules = currentRules(subsidyRules, referenceDate);
  const activeGenerationRules = currentRules(generationRules, referenceDate);

  const activePricing = activePricingRules.length === 1 ? activePricingRules[0] : null;
  const activeSubsidy = verifiedSubsidyRules.length === 1 ? verifiedSubsidyRules[0] : null;
  const displaySubsidy = (verifiedSubsidyRules.length === 1 ? verifiedSubsidyRules[0] : null) ?? displaySubsidyRules[0] ?? subsidyRules[0] ?? null;
  const subsidyRuleHasConflict = verifiedSubsidyRules.length > 1;
  const activeGeneration = activeGenerationRules.length === 1 ? activeGenerationRules[0] : null;

  return {
    dataMode: "live",
    dataLabel: "Live versioned business rules retrieved from the authenticated SolarQualify API.",
    referenceDate,
    selectedCapacityKw: 3,
    rules: {
      pricing: pricingRules,
      subsidies: subsidyRules,
      generation: generationRules,
    },
    activeRules: {
      pricing: activePricing,
      subsidies: activeSubsidy,
      generation: activeGeneration,
    },
    conflicts: {
      pricing: activePricingRules.length > 1,
      subsidies: verifiedSubsidyRules.length > 1,
      generation: activeGenerationRules.length > 1,
    },
    activeVersion: activePricing ? `v${activePricing.version}` : "Not configured",
    rates: mapRates(activePricing),
    generation: {
      unitsPerKwPerYear: activeGeneration?.unitsPerKWPerYear ?? null,
      label: activeGeneration
        ? `${activeGeneration.unitsPerKWPerYear.toLocaleString("en-IN")} units per kW per year`
        : "No active generation rule",
      rule: activeGeneration,
    },
    subsidyRule: {
      ...mapSubsidyRule(displaySubsidy),
      status: subsidyRuleHasConflict ? "conflict" : (displaySubsidy?.status ?? "not-configured"),
    },
    effectiveDates: {
      effectiveFrom: activePricing ? toDateOnly(activePricing.effectiveFrom) : referenceDate,
      effectiveTo: activePricing ? toDateOnly(activePricing.effectiveTo) ?? "" : "",
    },
    systemSizesKw: [1, 2, 3],
    settings: {
      currency: "INR",
      requireEffectiveFrom: true,
      preserveIssuedQuotations: true,
      showUnverifiedRuleWarning: true,
    },
  };
}

export async function createRuleVersion(ruleType, payload) {
  if (!["pricing", "subsidies", "generation"].includes(ruleType)) {
    throw new Error("Unsupported business rule type.");
  }
  const result = unwrap(await apiRequest(`/rules/${ruleType}`, {
    method: "POST",
    body: payload,
  }));
  return result?.rule ?? null;
}

export async function updateRuleVersionStatus(ruleType, ruleId, payload) {
  const result = unwrap(await apiRequest(`/rules/${ruleType}/${ruleId}/status`, {
    method: "PATCH",
    body: payload,
  }));
  return result?.rule ?? null;
}

export async function verifySubsidyRule(ruleId, decision) {
  const result = unwrap(await apiRequest(`/rules/subsidies/${ruleId}/verification`, {
    method: "PATCH",
    body: { decision },
  }));
  return result?.rule ?? null;
}
