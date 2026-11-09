import mongoose from 'mongoose';

import Lead from '../leads/lead.model.js';
import BillAnalysis from '../bills/bill-analysis.model.js';
import PricingRule from '../pricing/pricing-rule.model.js';
import SubsidyRule from '../subsidies/subsidy-rule.model.js';
import GenerationRule from '../generation/generation-rule.model.js';
import Quotation from '../quotations/quotation.model.js';
import { AppError } from '../../shared/errors/AppError.js';

export const SOLAR_CALCULATION_VERSION = '1.0.0';

const CAPACITY_INCREMENT_KW = 0.5;
const MAX_CALCULATION_HISTORY = 50;
const MAX_DATE = new Date('9999-12-31T23:59:59.999Z');

function requireUser(user, { write = false } = {}) {
  const roles = write ? ['salesStaff'] : ['homeowner', 'salesStaff'];

  if (
    !user ||
    !mongoose.isValidObjectId(user.id) ||
    !roles.includes(user.role)
  ) {
    throw new AppError(
      write
        ? 'Only Sales Staff can create solar calculations.'
        : 'You are not authorized to access solar calculations.',
      403
    );
  }
}

function validateId(value, label) {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError('Invalid ' + label + '.', 400);
  }
}

function validatePayload(payload) {
  if (
    payload === undefined ||
    payload === null
  ) {
    return {};
  }

  if (typeof payload !== 'object' || Array.isArray(payload)) {
    throw new AppError('A valid solar calculation request body is required.', 400);
  }

  const allowed = [
    'effectiveOn',
    'pricingRuleId',
    'subsidyRuleId',
    'generationRuleId',
  ];
  const unsupported = Object.keys(payload).filter((key) => !allowed.includes(key));

  if (unsupported.length > 0) {
    throw new AppError('The calculation request contains unsupported properties.', 400);
  }

  for (const key of ['pricingRuleId', 'subsidyRuleId', 'generationRuleId']) {
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
      validateId(payload[key], key);
    }
  }

  return payload;
}

function parseDateOnly(value) {
  if (value === undefined || value === null || value === '') {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError('effectiveOn must use the YYYY-MM-DD date format.', 400);
  }

  const date = new Date(value + 'T00:00:00.000Z');

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError('effectiveOn must be a valid calendar date.', 400);
  }

  return date;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundTo(value, decimalPlaces = 2) {
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function toId(value) {
  return value?.toString?.() ?? value;
}

function isEffectiveOn(rule, effectiveOn) {
  const from = new Date(rule.effectiveFrom);
  const to = rule.effectiveTo ? new Date(rule.effectiveTo) : null;

  return (
    rule.status === 'active' &&
    from.getTime() <= effectiveOn.getTime() &&
    (!to || to.getTime() >= effectiveOn.getTime())
  );
}

function activeRuleQuery(effectiveOn, extra = {}) {
  return {
    ...extra,
    status: 'active',
    effectiveFrom: { $lte: effectiveOn },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: effectiveOn } },
    ],
  };
}

async function selectRule({
  model,
  ruleId,
  effectiveOn,
  ruleLabel,
  optional = false,
  verifiedSubsidy = false,
}) {
  const filters = activeRuleQuery(
    effectiveOn,
    verifiedSubsidy ? { verificationStatus: 'verified' } : {}
  );

  if (ruleId) {
    const rule = await model.findOne({
      _id: ruleId,
      ...filters,
    }).lean();

    if (!rule) {
      throw new AppError(
        ruleLabel + ' version is not active, verified where required, and effective on the requested date.',
        409
      );
    }

    return rule;
  }

  const candidates = await model.find(filters)
    .sort({ effectiveFrom: -1, version: -1 })
    .limit(2)
    .lean();

  if (candidates.length === 0) {
    if (optional) return null;
    throw new AppError(
      'No active ' + ruleLabel.toLowerCase() + ' rule is effective on the requested date. Configure and activate a rule first.',
      409
    );
  }

  if (candidates.length > 1) {
    throw new AppError(
      'Multiple active ' + ruleLabel.toLowerCase() + ' rules are applicable. Supply the desired ' + ruleLabel.toLowerCase() + ' rule ID.',
      409
    );
  }

  return candidates[0];
}

function selectConsumption(lead, verifiedBill) {
  const billUnits = verifiedBill?.monthlyUnits;
  if (Number.isFinite(billUnits) && billUnits > 0) {
    return {
      monthlyUnits: billUnits,
      source: 'verified_bill',
    };
  }

  const leadUnits = lead.monthlyUnits;
  if (Number.isFinite(leadUnits) && leadUnits > 0) {
    return {
      monthlyUnits: leadUnits,
      source: 'lead_form',
    };
  }

  throw new AppError(
    'Monthly electricity consumption is required. Add a positive monthly unit value or upload and verify a bill containing consumption data.',
    422
  );
}

function calculateCapacity(annualConsumptionUnits, unitsPerKWPerYear, verifiedBill) {
  const rawRequiredCapacity = annualConsumptionUnits / unitsPerKWPerYear;
  const roundedCapacity = Math.max(
    CAPACITY_INCREMENT_KW,
    Math.ceil(rawRequiredCapacity / CAPACITY_INCREMENT_KW) * CAPACITY_INCREMENT_KW
  );

  const sanctionedLoad = verifiedBill?.sanctionedLoad;
  const sanctionedLoadUnit = verifiedBill?.sanctionedLoadUnit ?? null;
  const hasComparableSanctionedLoad =
    sanctionedLoadUnit === 'kW' &&
    Number.isFinite(sanctionedLoad) &&
    sanctionedLoad > 0;

  const recommendedCapacity = hasComparableSanctionedLoad
    ? Math.min(roundedCapacity, sanctionedLoad)
    : roundedCapacity;

  return {
    rawRequiredCapacityKW: roundTo(rawRequiredCapacity, 4),
    roundedCapacityKW: roundTo(roundedCapacity, 2),
    recommendedCapacityKW: roundTo(recommendedCapacity, 2),
    capacityIncrementKW: CAPACITY_INCREMENT_KW,
    sanctionedLoad,
    sanctionedLoadUnit,
    sanctionedLoadCapApplied:
      hasComparableSanctionedLoad && recommendedCapacity < roundedCapacity,
  };
}

function calculateSubsidy(capacityKW, subsidyRule, grossCost) {
  if (!subsidyRule) {
    return {
      amount: 0,
      uncappedAmount: 0,
      ruleMaximum: 0,
      appliedSlabs: [],
      reason: 'No active, verified subsidy rule was available for the effective date.',
    };
  }

  let previousLimit = 0;
  let uncappedAmount = 0;
  const appliedSlabs = [];

  for (const slab of subsidyRule.slabs) {
    const upperLimit = Math.min(capacityKW, slab.upToKW);
    const eligibleSegmentKW = Math.max(0, upperLimit - previousLimit);
    const slabAmount = eligibleSegmentKW * slab.amountPerKW;

    if (eligibleSegmentKW > 0) {
      appliedSlabs.push({
        fromKW: previousLimit,
        upToKW: upperLimit,
        eligibleCapacityKW: roundTo(eligibleSegmentKW, 4),
        amountPerKW: slab.amountPerKW,
        amount: roundMoney(slabAmount),
      });
      uncappedAmount += slabAmount;
    }

    previousLimit = slab.upToKW;

    if (capacityKW <= slab.upToKW) break;
  }

  const ruleCappedAmount = Math.min(uncappedAmount, subsidyRule.maximumSubsidy);
  const amount = Math.min(ruleCappedAmount, grossCost);

  return {
    amount: roundMoney(amount),
    uncappedAmount: roundMoney(uncappedAmount),
    ruleMaximum: subsidyRule.maximumSubsidy,
    appliedSlabs,
    reason: amount < ruleCappedAmount
      ? 'The calculated subsidy was additionally limited to the gross system cost.'
      : amount < uncappedAmount
        ? 'The calculated subsidy was limited by the configured maximum subsidy.'
        : 'The configured verified subsidy slabs were applied to eligible capacity bands.',
  };
}

function buildReason(code, label, formula, detail, output) {
  return { code, label, formula, detail, output };
}

function buildPricingSnapshot(rule) {
  return {
    ruleId: rule._id,
    ruleName: rule.ruleName,
    version: rule.version,
    pricePerKW: rule.pricePerKW,
    installationCharges: rule.installationCharges,
  };
}

function buildSubsidySnapshot(rule) {
  if (!rule) return null;

  return {
    ruleId: rule._id,
    ruleName: rule.ruleName,
    version: rule.version,
    slabs: rule.slabs.map((slab) => ({
      upToKW: slab.upToKW,
      amountPerKW: slab.amountPerKW,
    })),
    maximumSubsidy: rule.maximumSubsidy,
    verificationStatus: rule.verificationStatus,
  };
}

function buildGenerationSnapshot(rule) {
  return {
    ruleId: rule._id,
    ruleName: rule.ruleName,
    version: rule.version,
    unitsPerKWPerYear: rule.unitsPerKWPerYear,
  };
}

function toCalculationDTO(quotation) {
  const value = typeof quotation?.toObject === 'function'
    ? quotation.toObject()
    : quotation;

  return {
    id: toId(value._id),
    leadId: toId(value.leadId),
    systemCapacityKW: value.systemCapacityKW,
    estimatedAnnualGeneration: value.estimatedAnnualGeneration,
    annualConsumptionUnits: value.annualConsumptionUnits ?? null,
    consumptionCoveragePercent: value.consumptionCoveragePercent ?? null,
    totalInstallationCost: value.totalInstallationCost,
    applicableSubsidy: value.applicableSubsidy,
    netInstallationCost: value.netInstallationCost,
    estimatedAnnualSavings: value.estimatedAnnualSavings ?? null,
    estimatedPaybackYears: value.estimatedPaybackYears ?? null,
    calculationVersion: value.calculationVersion ?? SOLAR_CALCULATION_VERSION,
    calculationReasons: value.calculationReasons ?? [],
    calculationInputs: value.calculationInputs ?? {},
    pricingSnapshot: value.pricingSnapshot,
    subsidySnapshot: value.subsidySnapshot ?? null,
    generationSnapshot: value.generationSnapshot,
    quotationStatus: value.quotationStatus,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

async function findLeadForCalculation(user, leadId) {
  const scope = user.role === 'homeowner'
    ? { homeownerId: user.id }
    : { assignedSalesStaffId: user.id };

  const lead = await Lead.findOne({
    _id: leadId,
    ...scope,
  }).lean();

  if (!lead) {
    throw new AppError('Lead not found.', 404);
  }

  return lead;
}

async function findVerifiedBill(lead) {
  if (!lead.billAnalysisId) return null;

  return BillAnalysis.findOne({
    _id: lead.billAnalysisId,
    leadId: lead._id,
    deletionStatus: 'active',
    ocrStatus: 'completed',
    verificationStatus: 'verified',
  })
    .select('monthlyUnits sanctionedLoad sanctionedLoadUnit verificationStatus ocrStatus')
    .lean();
}

/**
 * Calculates and stores an explainable draft quotation.
 * All prices, generation rates and subsidy slabs come from active,
 * effective-dated rule versions, which are copied into immutable snapshots.
 */
export async function createSolarCalculation(user, leadId, payload = {}) {
  requireUser(user, { write: true });
  validateId(leadId, 'lead ID');
  const input = validatePayload(payload);
  const effectiveOn = parseDateOnly(input.effectiveOn);

  const lead = await findLeadForCalculation(user, leadId);
  const verifiedBill = await findVerifiedBill(lead);
  const consumption = selectConsumption(lead, verifiedBill);
  const monthlyBill = Number.isFinite(lead.monthlyElectricityBill) &&
    lead.monthlyElectricityBill > 0
    ? lead.monthlyElectricityBill
    : null;

  const [pricingRule, generationRule, subsidyRule] = await Promise.all([
    selectRule({
      model: PricingRule,
      ruleId: input.pricingRuleId,
      effectiveOn,
      ruleLabel: 'Pricing',
    }),
    selectRule({
      model: GenerationRule,
      ruleId: input.generationRuleId,
      effectiveOn,
      ruleLabel: 'Generation',
    }),
    selectRule({
      model: SubsidyRule,
      ruleId: input.subsidyRuleId,
      effectiveOn,
      ruleLabel: 'Subsidy',
      optional: true,
      verifiedSubsidy: true,
    }),
  ]);

  const monthlyConsumptionUnits = consumption.monthlyUnits;
  const annualConsumptionUnits = monthlyConsumptionUnits * 12;
  const capacity = calculateCapacity(
    annualConsumptionUnits,
    generationRule.unitsPerKWPerYear,
    verifiedBill
  );
  const systemCapacityKW = capacity.recommendedCapacityKW;
  const estimatedAnnualGeneration = Math.round(
    systemCapacityKW * generationRule.unitsPerKWPerYear
  );
  const coveredUnits = Math.min(
    estimatedAnnualGeneration,
    annualConsumptionUnits
  );
  const consumptionCoveragePercent = roundTo(
    (coveredUnits / annualConsumptionUnits) * 100,
    2
  );

  const equipmentAndInstallationCost =
    systemCapacityKW * pricingRule.pricePerKW +
    pricingRule.installationCharges;
  const totalInstallationCost = roundMoney(equipmentAndInstallationCost);
  const subsidy = calculateSubsidy(
    systemCapacityKW,
    subsidyRule,
    totalInstallationCost
  );
  const applicableSubsidy = subsidy.amount;
  const netInstallationCost = roundMoney(
    Math.max(0, totalInstallationCost - applicableSubsidy)
  );

  const impliedAverageTariffPerUnit = monthlyBill !== null
    ? monthlyBill / monthlyConsumptionUnits
    : null;
  const estimatedAnnualSavings = impliedAverageTariffPerUnit === null
    ? null
    : roundMoney(coveredUnits * impliedAverageTariffPerUnit);
  const estimatedPaybackYears = estimatedAnnualSavings === null
    ? null
    : estimatedAnnualSavings > 0
      ? roundTo(netInstallationCost / estimatedAnnualSavings, 2)
      : null;

  const reasons = [
    buildReason(
      'ANNUAL_CONSUMPTION',
      'Annual electricity consumption',
      'Monthly consumption × 12',
      'Monthly consumption of ' + monthlyConsumptionUnits +
        ' units was taken from ' + consumption.source + '.',
      annualConsumptionUnits
    ),
    buildReason(
      'RECOMMENDED_CAPACITY',
      'Recommended solar capacity',
      'Annual consumption ÷ configured annual generation per kW, rounded up to the next 0.5 kW',
      'Required unrounded capacity is ' + capacity.rawRequiredCapacityKW +
        ' kW; rounded design capacity is ' + capacity.roundedCapacityKW + ' kW.',
      systemCapacityKW
    ),
    buildReason(
      'ANNUAL_GENERATION',
      'Estimated annual generation',
      'Recommended capacity × configured units per kW per year',
      systemCapacityKW + ' kW × ' + generationRule.unitsPerKWPerYear + ' units/kW/year.',
      estimatedAnnualGeneration
    ),
    buildReason(
      'CONSUMPTION_COVERAGE',
      'Expected consumption coverage',
      'Minimum(annual generation, annual consumption) ÷ annual consumption × 100',
      coveredUnits + ' units are counted against ' + annualConsumptionUnits +
        ' annual consumption units. Exported surplus is not credited.',
      consumptionCoveragePercent
    ),
    buildReason(
      'SYSTEM_COST',
      'Estimated system cost',
      'Recommended capacity × price per kW + fixed installation charges',
      systemCapacityKW + ' kW × ₹' + pricingRule.pricePerKW +
        ' + ₹' + pricingRule.installationCharges +
        ' (pricing rule v' + pricingRule.version + ').',
      totalInstallationCost
    ),
    buildReason(
      'SUBSIDY',
      'Configured subsidy estimate',
      'Sum of eligible marginal capacity slabs, limited by configured maximum and gross system cost',
      subsidy.reason + (subsidyRule
        ? ' Subsidy rule v' + subsidyRule.version + ' is marked verified; individual government eligibility is not determined by this calculation.'
        : ' No verified active subsidy rule was found; subsidy is set to ₹0.'),
      applicableSubsidy
    ),
    buildReason(
      'NET_SYSTEM_COST',
      'Estimated net installation cost',
      'Maximum(0, gross system cost − configured subsidy estimate)',
      '₹' + totalInstallationCost + ' − ₹' + applicableSubsidy + '.',
      netInstallationCost
    ),
  ];

  if (monthlyBill !== null) {
    reasons.push(buildReason(
      'ANNUAL_SAVINGS',
      'Estimated annual bill offset',
      'Covered generation × (monthly bill ÷ monthly consumption)',
      'Uses the lead-form monthly bill amount as an implied average tariff of ₹' +
        roundTo(impliedAverageTariffPerUnit, 4) +
        '/unit. This is a simplified estimate, not a tariff schedule.',
      estimatedAnnualSavings
    ));
    reasons.push(buildReason(
      'PAYBACK_PERIOD',
      'Estimated simple payback period',
      'Net installation cost ÷ estimated annual bill offset',
      estimatedAnnualSavings > 0
        ? 'Simple payback; excludes financing, maintenance, tariff changes, degradation and discounting.'
        : 'Payback cannot be estimated because calculated annual bill offset is zero.',
      estimatedPaybackYears
    ));
  } else {
    reasons.push(buildReason(
      'ANNUAL_SAVINGS_UNAVAILABLE',
      'Estimated annual bill offset',
      'Covered generation × observed average tariff per unit',
      'A positive monthly electricity bill is required to estimate savings. Generation and system cost are still calculated.',
      null
    ));
    reasons.push(buildReason(
      'PAYBACK_UNAVAILABLE',
      'Estimated simple payback period',
      'Net installation cost ÷ estimated annual bill offset',
      'Payback is unavailable until a positive monthly electricity bill is provided.',
      null
    ));
  }

  if (capacity.sanctionedLoadCapApplied) {
    reasons.push(buildReason(
      'SANCTIONED_LOAD_LIMIT',
      'Verified sanctioned-load limit applied',
      'Minimum(calculated capacity, verified sanctioned load in kW)',
      'The verified bill reports a sanctioned load of ' +
        capacity.sanctionedLoad + ' kW; the recommendation was limited accordingly.',
      systemCapacityKW
    ));
  } else if (
    verifiedBill?.sanctionedLoadUnit &&
    verifiedBill.sanctionedLoadUnit !== 'kW'
  ) {
    reasons.push(buildReason(
      'SANCTIONED_LOAD_NOT_CONVERTED',
      'Sanctioned load not used as a capacity cap',
      'No kVA or HP to kW conversion is assumed',
      'The bill reports sanctioned load in ' + verifiedBill.sanctionedLoadUnit +
        '; the engine does not assume an electrical conversion factor.',
      null
    ));
  }

  reasons.push(buildReason(
    'ROOF_AREA_NOT_AVAILABLE',
    'Roof-area constraint',
    'No roof-area value is available in the current lead schema',
    'The recommendation is consumption-based and must be checked against usable roof area and site conditions during technical survey.',
    null
  ));

  const calculationInputs = {
    effectiveOn,
    monthlyConsumptionUnits,
    monthlyConsumptionSource: consumption.source,
    annualConsumptionUnits,
    monthlyElectricityBill: monthlyBill,
    monthlyElectricityBillSource: monthlyBill === null ? 'unavailable' : 'lead_form',
    impliedAverageTariffPerUnit: impliedAverageTariffPerUnit === null
      ? null
      : roundTo(impliedAverageTariffPerUnit, 4),
    sanctionedLoad: capacity.sanctionedLoad ?? null,
    sanctionedLoadUnit: capacity.sanctionedLoadUnit,
    capacityIncrementKW: CAPACITY_INCREMENT_KW,
    subsidySlabCalculation: subsidy.appliedSlabs,
  };

  const quotation = await Quotation.create({
    leadId: lead._id,
    createdBy: user.id,
    systemCapacityKW,
    estimatedAnnualGeneration,
    annualConsumptionUnits,
    consumptionCoveragePercent,
    totalInstallationCost,
    applicableSubsidy,
    netInstallationCost,
    estimatedAnnualSavings,
    estimatedPaybackYears,
    calculationVersion: SOLAR_CALCULATION_VERSION,
    calculationReasons: reasons,
    calculationInputs,
    pricingSnapshot: buildPricingSnapshot(pricingRule),
    subsidySnapshot: buildSubsidySnapshot(subsidyRule),
    generationSnapshot: buildGenerationSnapshot(generationRule),
    quotationStatus: 'draft',
  });

  return toCalculationDTO(quotation);
}

/**
 * Returns previous calculation records from their stored rule snapshots.
 * It never recalculates against today's rules.
 */
export async function getSolarCalculations(user, leadId, filters = {}) {
  requireUser(user);
  validateId(leadId, 'lead ID');

  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    throw new AppError('Invalid calculation history filters.', 400);
  }

  const unsupported = Object.keys(filters).filter((key) => key !== 'limit');
  if (unsupported.length > 0) {
    throw new AppError('Unsupported calculation history filter.', 400);
  }

  const limit = filters.limit === undefined ? 20 : Number(filters.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CALCULATION_HISTORY) {
    throw new AppError(
      'Calculation history limit must be an integer between 1 and ' +
        MAX_CALCULATION_HISTORY + '.',
      400
    );
  }

  const lead = await findLeadForCalculation(user, leadId);
  const calculations = await Quotation.find({ leadId: lead._id })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();

  return {
    calculations: calculations.map(toCalculationDTO),
    count: calculations.length,
    limit,
  };
}

export async function getSolarCalculation(user, leadId, calculationId) {
  requireUser(user);
  validateId(leadId, 'lead ID');
  validateId(calculationId, 'calculation ID');

  const lead = await findLeadForCalculation(user, leadId);
  const calculation = await Quotation.findOne({
    _id: calculationId,
    leadId: lead._id,
  }).lean();

  if (!calculation) {
    throw new AppError('Solar calculation not found.', 404);
  }

  return toCalculationDTO(calculation);
}
