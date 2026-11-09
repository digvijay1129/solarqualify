import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

import PricingRule from '../pricing/pricing-rule.model.js';
import SubsidyRule from '../subsidies/subsidy-rule.model.js';
import GenerationRule from '../generation/generation-rule.model.js';
import RuleManagementLock from './rule-management-lock.model.js';
import { AppError } from '../../shared/errors/AppError.js';

const RULE_MODELS = Object.freeze({
  pricing: PricingRule,
  subsidies: SubsidyRule,
  generation: GenerationRule,
});

const RULE_STATUSES = new Set(['draft', 'active', 'inactive']);
const MAX_LIST_LIMIT = 100;
const MAX_SUBSIDY_SLABS = 20;
const MAX_DATE = new Date('9999-12-31T23:59:59.999Z');

const RULE_LOCK_LEASE_MS = 30_000;
const RULE_LOCK_ATTEMPTS = 40;
const RULE_LOCK_RETRY_MS = 50;

function isDuplicateKeyError(error) {
  return error?.code === 11000 || error?.code === 11001;
}

/**
 * Serializes version creation and active-period checks for one named rule.
 * The lease expires automatically if the process stops before it can release.
 */
async function withRuleLock(ruleType, ruleName, operation) {
  const lockId = `${ruleType}:${ruleName.trim().toLocaleLowerCase('en-US')}`;
  const ownerToken = randomUUID();
  let acquired = false;

  for (let attempt = 0; attempt < RULE_LOCK_ATTEMPTS; attempt += 1) {
    const now = new Date();

    try {
      const lock = await RuleManagementLock.findOneAndUpdate(
        {
          _id: lockId,
          $or: [
            { lockedUntil: null },
            { lockedUntil: { $lte: now } },
          ],
        },
        {
          $set: {
            ruleType,
            ruleName,
            ownerToken,
            lockedUntil: new Date(now.getTime() + RULE_LOCK_LEASE_MS),
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      ).lean();

      if (lock) {
        acquired = true;
        break;
      }
    } catch (error) {
      // An upsert against an already-held lock hits its unique _id.
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
    }

    if (attempt < RULE_LOCK_ATTEMPTS - 1) {
      await new Promise((resolve) => setTimeout(resolve, RULE_LOCK_RETRY_MS));
    }
  }

  if (!acquired) {
    throw new AppError(
      'Another request is updating this rule. Retry after a short delay.',
      409
    );
  }

  try {
    return await operation();
  } finally {
    // If releasing fails, the bounded lease prevents a permanent deadlock.
    try {
      await RuleManagementLock.updateOne(
        { _id: lockId, ownerToken },
        {
          $set: {
            ownerToken: null,
            lockedUntil: null,
          },
        }
      );
    } catch {
      // The lock lease is the recovery mechanism for this cleanup failure.
    }
  }
}


function getRuleModel(ruleType) {
  const model = RULE_MODELS[ruleType];

  if (!model) {
    throw new AppError(
      'Rule type must be pricing, subsidies or generation.',
      400
    );
  }

  return model;
}

function requireRuleAccess(user, { write = false } = {}) {
  const allowedRoles = write
    ? ['salesStaff']
    : ['homeowner', 'salesStaff'];

  if (
    !user ||
    !mongoose.isValidObjectId(user.id) ||
    !allowedRoles.includes(user.role)
  ) {
    throw new AppError(
      write
        ? 'Only Sales Staff can manage business rules.'
        : 'You are not authorized to access business rules.',
      403
    );
  }
}

function validateObjectPayload(payload, allowedKeys, message) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw new AppError(message, 400);
  }

  const unsupported = Object.keys(payload).filter(
    (key) => !allowedKeys.includes(key)
  );

  if (unsupported.length > 0) {
    throw new AppError(
      'The request contains unsupported properties.',
      400
    );
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getRuleNamePattern(ruleName) {
  return new RegExp(`^${escapeRegex(ruleName)}$`, 'i');
}

function normalizeRuleName(value) {
  if (typeof value !== 'string') {
    throw new AppError('Rule name is required.', 400);
  }

  const name = value.trim().replace(/\s+/g, ' ');

  if (!name || name.length > 120) {
    throw new AppError(
      'Rule name must contain between 1 and 120 characters.',
      400
    );
  }

  return name;
}

function parseDateOnly(value, fieldName, { optional = false } = {}) {
  if (
    optional &&
    (value === undefined || value === null || value === '')
  ) {
    return null;
  }

  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    throw new AppError(
      `${fieldName} must use the YYYY-MM-DD date format.`,
      400
    );
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new AppError(`${fieldName} must be a valid calendar date.`, 400);
  }

  return parsed;
}

function validateEffectivePeriod(effectiveFrom, effectiveTo) {
  if (
    effectiveTo &&
    effectiveTo.getTime() <= effectiveFrom.getTime()
  ) {
    throw new AppError(
      'Effective-to date must be later than effective-from date.',
      400
    );
  }
}

function validateNumber(value, fieldName, { minimum = 0 } = {}) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < minimum
  ) {
    throw new AppError(
      `${fieldName} must be a valid number greater than or equal to ${minimum}.`,
      400
    );
  }

  return value;
}

function normalizeStatus(value, fallback = 'draft') {
  const status = value ?? fallback;

  if (typeof status !== 'string' || !RULE_STATUSES.has(status)) {
    throw new AppError(
      'Rule status must be draft, active or inactive.',
      400
    );
  }

  return status;
}

function buildCreateData(ruleType, payload, actorId) {
  const commonKeys = [
    'ruleName',
    'effectiveFrom',
    'effectiveTo',
    'status',
  ];

  const allowedKeysByType = {
    pricing: [
      ...commonKeys,
      'pricePerKW',
      'installationCharges',
    ],
    subsidies: [
      ...commonKeys,
      'slabs',
      'maximumSubsidy',
    ],
    generation: [
      ...commonKeys,
      'unitsPerKWPerYear',
    ],
  };

  validateObjectPayload(
    payload,
    allowedKeysByType[ruleType],
    'A valid rule payload is required.'
  );

  const data = {
    ruleName: normalizeRuleName(payload.ruleName),
    effectiveFrom: parseDateOnly(
      payload.effectiveFrom,
      'Effective-from date'
    ),
    effectiveTo: parseDateOnly(
      payload.effectiveTo,
      'Effective-to date',
      { optional: true }
    ),
    status: normalizeStatus(payload.status),
    createdBy: actorId,
  };

  validateEffectivePeriod(data.effectiveFrom, data.effectiveTo);

  if (ruleType === 'pricing') {
    data.pricePerKW = validateNumber(
      payload.pricePerKW,
      'Price per kW'
    );
    data.installationCharges =
      payload.installationCharges === undefined
        ? 0
        : validateNumber(
            payload.installationCharges,
            'Installation charges'
          );
  }

  if (ruleType === 'subsidies') {
    if (
      !Array.isArray(payload.slabs) ||
      payload.slabs.length < 1 ||
      payload.slabs.length > MAX_SUBSIDY_SLABS
    ) {
      throw new AppError(
        `Subsidy slabs must contain between 1 and ${MAX_SUBSIDY_SLABS} entries.`,
        400
      );
    }

    let previousCapacity = 0;
    data.slabs = payload.slabs.map((slab, index) => {
      validateObjectPayload(
        slab,
        ['upToKW', 'amountPerKW'],
        'Each subsidy slab must be an object.'
      );

      const upToKW = validateNumber(
        slab.upToKW,
        `Subsidy slab ${index + 1} capacity`,
        { minimum: 0.1 }
      );
      const amountPerKW = validateNumber(
        slab.amountPerKW,
        `Subsidy slab ${index + 1} amount`
      );

      if (upToKW <= previousCapacity) {
        throw new AppError(
          'Subsidy slab capacity limits must be strictly increasing.',
          400
        );
      }

      previousCapacity = upToKW;
      return { upToKW, amountPerKW };
    });

    data.maximumSubsidy = validateNumber(
      payload.maximumSubsidy,
      'Maximum subsidy'
    );
    data.verificationStatus = 'unverified';
  }

  if (ruleType === 'generation') {
    data.unitsPerKWPerYear = validateNumber(
      payload.unitsPerKWPerYear,
      'Annual generation units per kW',
      { minimum: 0.1 }
    );
  }

  return data;
}

async function findOverlappingActiveRule(
  model,
  ruleName,
  effectiveFrom,
  effectiveTo,
  excludeId = null
) {
  const query = {
    ruleName: getRuleNamePattern(ruleName),
    status: 'active',
    effectiveFrom: {
      $lte: effectiveTo ?? MAX_DATE,
    },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: effectiveFrom } },
    ],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return model.findOne(query)
    .select('_id ruleName version effectiveFrom effectiveTo status')
    .lean();
}

function toRuleDTO(rule) {
  const value = typeof rule?.toObject === 'function'
    ? rule.toObject()
    : rule;

  return {
    ...value,
    id: value._id?.toString?.() ?? String(value._id),
    _id: undefined,
    createdBy: value.createdBy?.toString?.() ?? value.createdBy,
  };
}

function validateRuleId(ruleId) {
  if (!mongoose.isValidObjectId(ruleId)) {
    throw new AppError('Invalid rule ID.', 400);
  }
}

async function findRuleById(model, ruleId) {
  const rule = await model.findById(ruleId).lean();

  if (!rule) {
    throw new AppError('Rule version not found.', 404);
  }

  return rule;
}

/**
 * Creates a new immutable business-rule version.
 * Version numbers are assigned per ruleName. New versions default to draft.
 */
export async function createRuleVersion(user, ruleType, payload) {
  requireRuleAccess(user, { write: true });
  const model = getRuleModel(ruleType);
  const data = buildCreateData(ruleType, payload, user.id);

  return withRuleLock(ruleType, data.ruleName, async () => {
    if (data.status === 'active') {
      if (
        ruleType === 'subsidies' &&
        data.verificationStatus !== 'verified'
      ) {
        throw new AppError(
          'A subsidy rule must be verified before it can be activated.',
          409
        );
      }

      const conflict = await findOverlappingActiveRule(
        model,
        data.ruleName,
        data.effectiveFrom,
        data.effectiveTo
      );

      if (conflict) {
        throw new AppError(
          'This effective period overlaps another active version of the same rule.',
          409
        );
      }
    }

    const latestVersion = await model.findOne({
      ruleName: getRuleNamePattern(data.ruleName),
    })
      .sort({ version: -1 })
      .select('version')
      .lean();

    data.version = (latestVersion?.version ?? 0) + 1;

    try {
      const created = await model.create(data);
      return toRuleDTO(created);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new AppError(
          'A rule version with this name was created concurrently. Refresh and retry.',
          409
        );
      }

      throw error;
    }
  });
}

/**
 * Returns historical and current versions. An effectiveOn filter uses
 * inclusive date boundaries and deliberately does not hide inactive history.
 */
export async function getRuleVersions(user, ruleType, filters = {}) {
  requireRuleAccess(user);
  const model = getRuleModel(ruleType);

  if (
    !filters ||
    typeof filters !== 'object' ||
    Array.isArray(filters)
  ) {
    throw new AppError('Invalid rule filters.', 400);
  }

  const allowedFilters = ['ruleName', 'status', 'effectiveOn', 'limit'];
  const unsupported = Object.keys(filters).filter(
    (key) => !allowedFilters.includes(key)
  );

  if (unsupported.length > 0) {
    throw new AppError('Unsupported rule filter.', 400);
  }

  const query = {};

  if (filters.ruleName !== undefined) {
    query.ruleName = normalizeRuleName(filters.ruleName);
  }

  if (filters.status !== undefined && filters.status !== 'all') {
    query.status = normalizeStatus(filters.status);
  }

  if (filters.effectiveOn !== undefined) {
    const effectiveOn = parseDateOnly(
      filters.effectiveOn,
      'Effective-on date'
    );

    query.effectiveFrom = { $lte: effectiveOn };
    query.$or = [
      { effectiveTo: null },
      { effectiveTo: { $gte: effectiveOn } },
    ];
  }

  const limit = filters.limit === undefined
    ? 50
    : Number(filters.limit);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIST_LIMIT) {
    throw new AppError(
      `Limit must be an integer between 1 and ${MAX_LIST_LIMIT}.`,
      400
    );
  }

  const rules = await model.find(query)
    .sort({ ruleName: 1, version: -1 })
    .limit(limit)
    .lean();

  return {
    rules: rules.map(toRuleDTO),
    count: rules.length,
    limit,
  };
}

/**
 * Retrieves one historical or current version without mutating it.
 */
export async function getRuleVersion(user, ruleType, ruleId) {
  requireRuleAccess(user);
  validateRuleId(ruleId);

  const model = getRuleModel(ruleType);
  const rule = await findRuleById(model, ruleId);

  return toRuleDTO(rule);
}

/**
 * Only status and the end of the effective period can be changed.
 * Pricing values, subsidy slabs, generation assumptions, name and version
 * are immutable once a version has been created.
 */
export async function updateRuleStatus(
  user,
  ruleType,
  ruleId,
  payload
) {
  requireRuleAccess(user, { write: true });
  validateRuleId(ruleId);
  const model = getRuleModel(ruleType);

  validateObjectPayload(
    payload,
    ['status', 'effectiveTo'],
    'A valid rule status update is required.'
  );

  if (!Object.hasOwn(payload, 'status')) {
    throw new AppError('Rule status is required.', 400);
  }

  const status = normalizeStatus(payload.status);

  if (status === 'draft') {
    throw new AppError(
      'A rule version cannot be moved back to draft.',
      400
    );
  }

  const initial = await findRuleById(model, ruleId);

  const performUpdate = async () => {
    // Re-read inside the lock so overlap checks use the latest version state.
    const existing = await findRuleById(model, ruleId);
    const effectiveTo = Object.hasOwn(payload, 'effectiveTo')
      ? parseDateOnly(
          payload.effectiveTo,
          'Effective-to date',
          { optional: true }
        )
      : existing.effectiveTo ?? null;

    validateEffectivePeriod(existing.effectiveFrom, effectiveTo);

    if (status === 'active') {
      if (
        ruleType === 'subsidies' &&
        existing.verificationStatus !== 'verified'
      ) {
        throw new AppError(
          'A subsidy rule must be verified before it can be activated.',
          409
        );
      }

      const conflict = await findOverlappingActiveRule(
        model,
        existing.ruleName,
        existing.effectiveFrom,
        effectiveTo,
        existing._id
      );

      if (conflict) {
        throw new AppError(
          'This effective period overlaps another active version of the same rule.',
          409
        );
      }
    }

    const updated = await model.findOneAndUpdate(
      {
        _id: existing._id,
        status: existing.status,
        version: existing.version,
        effectiveFrom: existing.effectiveFrom,
        effectiveTo: existing.effectiveTo ?? null,
      },
      {
        $set: {
          status,
          effectiveTo,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!updated) {
      throw new AppError(
        'Rule version changed while it was being updated. Refresh and retry.',
        409
      );
    }

    return toRuleDTO(updated);
  };

  if (status === 'active') {
    return withRuleLock(ruleType, initial.ruleName, performUpdate);
  }

  return performUpdate();
}

/**
 * Subsidy policy verification is separate from activation. A rejected
 * subsidy is forced inactive; verified rules still require explicit activation.
 */
export async function verifySubsidyRule(user, ruleId, payload) {
  requireRuleAccess(user, { write: true });
  validateRuleId(ruleId);

  validateObjectPayload(
    payload,
    ['decision'],
    'A valid subsidy verification decision is required.'
  );

  if (!['verified', 'rejected'].includes(payload.decision)) {
    throw new AppError(
      'Subsidy verification decision must be verified or rejected.',
      400
    );
  }

  const existing = await findRuleById(SubsidyRule, ruleId);

  if (existing.verificationStatus !== 'unverified') {
    throw new AppError(
      'This subsidy rule already has a final verification decision.',
      409
    );
  }

  const update = {
    verificationStatus: payload.decision,
  };

  if (payload.decision === 'rejected') {
    update.status = 'inactive';
  }

  const verified = await SubsidyRule.findOneAndUpdate(
    {
      _id: existing._id,
      verificationStatus: 'unverified',
      status: existing.status,
    },
    { $set: update },
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!verified) {
    throw new AppError(
      'Subsidy rule changed while it was being verified. Refresh and retry.',
      409
    );
  }

  return toRuleDTO(verified);
}
