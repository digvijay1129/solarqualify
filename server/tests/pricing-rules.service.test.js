import { beforeEach, describe, expect, it, vi } from 'vitest';

const modelMocks = vi.hoisted(() => ({
  pricing: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
  subsidies: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
  generation: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
  lock: {
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  },
}));

vi.mock('../src/modules/pricing/pricing-rule.model.js', () => ({
  default: modelMocks.pricing,
}));

vi.mock('../src/modules/subsidies/subsidy-rule.model.js', () => ({
  default: modelMocks.subsidies,
}));

vi.mock('../src/modules/generation/generation-rule.model.js', () => ({
  default: modelMocks.generation,
}));

vi.mock('../src/modules/pricing-rules/rule-management-lock.model.js', () => ({
  default: modelMocks.lock,
}));

import RuleManagementLock from '../src/modules/pricing-rules/rule-management-lock.model.js';
import {
  createRuleVersion,
  getRuleVersions,
  getRuleVersion,
  updateRuleStatus,
  verifySubsidyRule,
} from '../src/modules/pricing-rules/rule-management.service.js';

const STAFF_ID = '507f1f77bcf86cd799439012';
const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const RULE_ID = '507f1f77bcf86cd799439014';

const staff = { id: STAFF_ID, role: 'salesStaff' };
const homeowner = { id: HOMEOWNER_ID, role: 'homeowner' };

function query(value) {
  return {
    sort: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
  };
}

function createdRule(overrides = {}) {
  return {
    _id: RULE_ID,
    ruleName: 'Residential Standard',
    version: 1,
    status: 'draft',
    effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    effectiveTo: null,
    createdBy: STAFF_ID,
    ...overrides,
  };
}

function configureModel(model, { latest = null, conflict = null, existing = null, updated = null, list = [] } = {}) {
  model.findOne.mockImplementation((filter) => (
    filter.status === 'active' ? query(conflict) : query(latest)
  ));
  model.findById.mockReturnValue(query(existing));
  model.find.mockReturnValue(query(list));
  model.findOneAndUpdate.mockReturnValue(query(updated));
}

describe('Rule Management Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const [name, model] of Object.entries(modelMocks)) {
      if (name !== 'lock') {
        configureModel(model);
      }
    }
    RuleManagementLock.findOneAndUpdate.mockReturnValue(
      query({ ownerToken: 'test-lock-owner' })
    );
    RuleManagementLock.updateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it('serializes version operations with a per-rule lock', async () => {
    modelMocks.pricing.findOne.mockReturnValue(query(null));
    modelMocks.pricing.create.mockResolvedValue(createdRule());

    await createRuleVersion(staff, 'pricing', {
      ruleName: 'Locked Residential',
      pricePerKW: 65000,
      effectiveFrom: '2026-12-01',
    });

    expect(RuleManagementLock.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'pricing:locked residential',
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          ruleType: 'pricing',
          ruleName: 'Locked Residential',
        }),
      }),
      expect.objectContaining({ upsert: true, new: true })
    );
    expect(RuleManagementLock.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'pricing:locked residential',
        ownerToken: expect.any(String),
      }),
      expect.objectContaining({
        $set: {
          ownerToken: null,
          lockedUntil: null,
        },
      })
    );
  });

  it('creates the next pricing version as draft and assigns the creator on the server', async () => {
    const saved = createdRule({ version: 4 });
    modelMocks.pricing.findOne.mockReturnValue(query({ version: 3 }));
    modelMocks.pricing.create.mockResolvedValue(saved);

    const result = await createRuleVersion(staff, 'pricing', {
      ruleName: 'Residential Standard',
      pricePerKW: 65000,
      installationCharges: 10000,
      effectiveFrom: '2026-12-01',
    });

    expect(modelMocks.pricing.create).toHaveBeenCalledWith(expect.objectContaining({
      ruleName: 'Residential Standard',
      pricePerKW: 65000,
      installationCharges: 10000,
      effectiveFrom: new Date('2026-12-01T00:00:00.000Z'),
      effectiveTo: null,
      version: 4,
      status: 'draft',
      createdBy: STAFF_ID,
    }));
    expect(result.version).toBe(4);
    expect(result.id).toBe(RULE_ID);
  });

  it('uses case-insensitive rule names when assigning versions', async () => {
    modelMocks.pricing.findOne.mockReturnValue(query({ version: 5 }));
    modelMocks.pricing.create.mockResolvedValue(createdRule({
      ruleName: 'residential standard',
      version: 6,
    }));

    const result = await createRuleVersion(staff, 'pricing', {
      ruleName: 'residential standard',
      pricePerKW: 65000,
      effectiveFrom: '2026-12-01',
    });

    const versionLookup = modelMocks.pricing.findOne.mock.calls[0][0];
    expect(versionLookup.ruleName).toBeInstanceOf(RegExp);
    expect(versionLookup.ruleName.test('Residential Standard')).toBe(true);
    expect(result.version).toBe(6);
  });

  it('checks active-period conflicts without case-sensitive rule-name gaps', async () => {
    const conflict = createdRule({
      ruleName: 'Residential Standard',
      status: 'active',
      effectiveFrom: new Date('2026-01-01'),
      effectiveTo: null,
    });
    modelMocks.pricing.findOne.mockImplementation((filter) => (
      filter.status === 'active' ? query(conflict) : query(null)
    ));

    await expect(createRuleVersion(staff, 'pricing', {
      ruleName: 'residential standard',
      pricePerKW: 70000,
      effectiveFrom: '2026-06-01',
      status: 'active',
    })).rejects.toMatchObject({ statusCode: 409 });

    const conflictQuery = modelMocks.pricing.findOne.mock.calls[0][0];
    expect(conflictQuery.ruleName).toBeInstanceOf(RegExp);
    expect(conflictQuery.ruleName.test('Residential Standard')).toBe(true);
    expect(modelMocks.pricing.create).not.toHaveBeenCalled();
  });

  it('creates subsidy rules as unverified and does not trust client-supplied verification fields', async () => {
    const saved = createdRule({
      verificationStatus: 'unverified',
      slabs: [{ upToKW: 2, amountPerKW: 30000 }],
      maximumSubsidy: 60000,
    });
    modelMocks.subsidies.create.mockResolvedValue(saved);

    await createRuleVersion(staff, 'subsidies', {
      ruleName: 'Residential Subsidy',
      slabs: [{ upToKW: 2, amountPerKW: 30000 }],
      maximumSubsidy: 60000,
      effectiveFrom: '2026-12-01',
    });

    expect(modelMocks.subsidies.create).toHaveBeenCalledWith(expect.objectContaining({
      verificationStatus: 'unverified',
      status: 'draft',
      createdBy: STAFF_ID,
      version: 1,
    }));
  });

  it('creates a directly active generation version when its period does not conflict', async () => {
    modelMocks.generation.findOne.mockImplementation((filter) => (
      filter.status === 'active' ? query(null) : query({ version: 2 })
    ));
    modelMocks.generation.create.mockResolvedValue(
      createdRule({
        version: 3,
        status: 'active',
        unitsPerKWPerYear: 1400,
      })
    );

    const result = await createRuleVersion(staff, 'generation', {
      ruleName: 'Standard Annual Generation',
      unitsPerKWPerYear: 1400,
      effectiveFrom: '2026-12-01',
      status: 'active',
    });

    expect(result.status).toBe('active');
    expect(result.version).toBe(3);
    expect(modelMocks.generation.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        ruleName: expect.any(RegExp),
        status: 'active',
      })
    );

    const conflictRuleNamePattern = modelMocks.generation.findOne.mock.calls[0][0].ruleName;
    expect(conflictRuleNamePattern.test('standard annual generation')).toBe(true);
  });

  it('creates a generation assumption with a new version number', async () => {
    modelMocks.generation.findOne.mockReturnValue(query({ version: 2 }));
    modelMocks.generation.create.mockResolvedValue(
      createdRule({ version: 3, unitsPerKWPerYear: 1400 })
    );

    const result = await createRuleVersion(staff, 'generation', {
      ruleName: 'Standard Annual Generation',
      unitsPerKWPerYear: 1400,
      effectiveFrom: '2026-12-01',
    });

    expect(result.version).toBe(3);
    expect(modelMocks.generation.create).toHaveBeenCalledWith(expect.objectContaining({
      unitsPerKWPerYear: 1400,
      version: 3,
    }));
  });

  it('rejects writes from Homeowners', async () => {
    await expect(createRuleVersion(homeowner, 'pricing', {
      ruleName: 'Blocked',
      pricePerKW: 1,
      effectiveFrom: '2026-12-01',
    })).rejects.toMatchObject({ statusCode: 403 });

    expect(modelMocks.pricing.create).not.toHaveBeenCalled();
  });

  it('rejects unsupported rule types', async () => {
    await expect(getRuleVersions(staff, 'unknown', {}))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects client attempts to set version, creator or verification state', async () => {
    await expect(createRuleVersion(staff, 'pricing', {
      ruleName: 'Injected',
      pricePerKW: 100,
      effectiveFrom: '2026-12-01',
      version: 99,
      createdBy: HOMEOWNER_ID,
    })).rejects.toMatchObject({ statusCode: 400 });

    expect(modelMocks.pricing.create).not.toHaveBeenCalled();
  });

  it('rejects invalid calendar dates', async () => {
    await expect(createRuleVersion(staff, 'pricing', {
      ruleName: 'Invalid Date',
      pricePerKW: 100,
      effectiveFrom: '2026-02-30',
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects an effective-to date that is not later than effective-from', async () => {
    await expect(createRuleVersion(staff, 'pricing', {
      ruleName: 'Invalid Period',
      pricePerKW: 100,
      effectiveFrom: '2026-12-01',
      effectiveTo: '2026-12-01',
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects overlapping active pricing periods', async () => {
    const conflict = createdRule({
      version: 1,
      status: 'active',
      effectiveFrom: new Date('2026-01-01'),
      effectiveTo: new Date('2026-12-31'),
    });
    modelMocks.pricing.findOne.mockImplementation((filter) => (
      filter.status === 'active' ? query(conflict) : query(null)
    ));

    await expect(createRuleVersion(staff, 'pricing', {
      ruleName: 'Residential Standard',
      pricePerKW: 70000,
      effectiveFrom: '2026-06-01',
      status: 'active',
    })).rejects.toMatchObject({ statusCode: 409 });

    expect(modelMocks.pricing.create).not.toHaveBeenCalled();
  });

  it('translates duplicate version index errors into a conflict response', async () => {
    modelMocks.pricing.create.mockRejectedValue(Object.assign(
      new Error('duplicate key'),
      { code: 11000 }
    ));

    await expect(createRuleVersion(staff, 'pricing', {
      ruleName: 'Residential Standard',
      pricePerKW: 65000,
      effectiveFrom: '2026-12-01',
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('returns all requested historical versions in version order', async () => {
    const records = [
      createdRule({ version: 2, status: 'inactive' }),
      createdRule({ version: 1, status: 'inactive' }),
    ];
    modelMocks.pricing.find.mockReturnValue(query(records));

    const result = await getRuleVersions(homeowner, 'pricing', {
      ruleName: 'Residential Standard',
      limit: '10',
    });

    expect(modelMocks.pricing.find).toHaveBeenCalledWith({
      ruleName: 'Residential Standard',
    });
    expect(result.rules).toHaveLength(2);
    expect(result.rules[0].version).toBe(2);
  });

  it('filters versions by the requested effective date without hiding inactive history', async () => {
    modelMocks.generation.find.mockReturnValue(query([]));

    await getRuleVersions(homeowner, 'generation', {
      effectiveOn: '2026-07-01',
    });

    expect(modelMocks.generation.find).toHaveBeenCalledWith({
      effectiveFrom: { $lte: new Date('2026-07-01T00:00:00.000Z') },
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $gte: new Date('2026-07-01T00:00:00.000Z') } },
      ],
    });
  });

  it('retrieves a specific preserved version', async () => {
    modelMocks.pricing.findById.mockReturnValue(query(createdRule({ version: 2 })));

    const result = await getRuleVersion(staff, 'pricing', RULE_ID);

    expect(result.version).toBe(2);
    expect(modelMocks.pricing.findById).toHaveBeenCalledWith(RULE_ID);
  });

  it('rejects invalid rule IDs', async () => {
    await expect(getRuleVersion(staff, 'pricing', 'not-an-id'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('prevents activating an unverified subsidy rule', async () => {
    modelMocks.subsidies.findById.mockReturnValue(query(createdRule({
      verificationStatus: 'unverified',
      effectiveFrom: new Date('2026-01-01'),
    })));

    await expect(updateRuleStatus(staff, 'subsidies', RULE_ID, {
      status: 'active',
    })).rejects.toMatchObject({ statusCode: 409 });

    expect(modelMocks.subsidies.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects activation when an overlapping active version exists', async () => {
    const existing = createdRule({
      status: 'draft',
      effectiveFrom: new Date('2026-01-01'),
    });
    modelMocks.generation.findById.mockReturnValue(query(existing));
    modelMocks.generation.findOne.mockReturnValue(query(createdRule({
      status: 'active',
      version: 1,
    })));

    await expect(updateRuleStatus(staff, 'generation', RULE_ID, {
      status: 'active',
    })).rejects.toMatchObject({ statusCode: 409 });

    expect(modelMocks.generation.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('activates a verified subsidy rule when no conflict exists', async () => {
    const existing = createdRule({
      verificationStatus: 'verified',
      status: 'draft',
    });
    const updated = { ...existing, status: 'active' };
    modelMocks.subsidies.findById.mockReturnValue(query(existing));
    modelMocks.subsidies.findOne.mockReturnValue(query(null));
    modelMocks.subsidies.findOneAndUpdate.mockReturnValue(query(updated));

    const result = await updateRuleStatus(staff, 'subsidies', RULE_ID, {
      status: 'active',
    });

    expect(result.status).toBe('active');
  });

  it('allows closing an active period while preserving its active historical version', async () => {
    const existing = createdRule({
      status: 'active',
      effectiveFrom: new Date('2026-01-01'),
      effectiveTo: null,
    });
    const updated = {
      ...existing,
      effectiveTo: new Date('2026-11-30T00:00:00.000Z'),
    };
    modelMocks.pricing.findById.mockReturnValue(query(existing));
    modelMocks.pricing.findOneAndUpdate.mockReturnValue(query(updated));

    const result = await updateRuleStatus(staff, 'pricing', RULE_ID, {
      status: 'active',
      effectiveTo: '2026-11-30',
    });

    expect(result.status).toBe('active');
    expect(result.effectiveTo).toEqual(new Date('2026-11-30T00:00:00.000Z'));
    expect(modelMocks.pricing.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' }),
      { $set: { status: 'active', effectiveTo: new Date('2026-11-30T00:00:00.000Z') } },
      expect.objectContaining({ runValidators: true })
    );
  });

  it('uses a compare-and-set filter for effective-period changes', async () => {
    const existing = createdRule({
      status: 'active',
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      effectiveTo: null,
    });
    const updated = {
      ...existing,
      effectiveTo: new Date('2026-11-30T00:00:00.000Z'),
    };
    modelMocks.pricing.findById.mockReturnValue(query(existing));
    modelMocks.pricing.findOneAndUpdate.mockReturnValue(query(updated));

    await updateRuleStatus(staff, 'pricing', RULE_ID, {
      status: 'active',
      effectiveTo: '2026-11-30',
    });

    expect(modelMocks.pricing.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        version: existing.version,
        effectiveFrom: existing.effectiveFrom,
        effectiveTo: null,
      }),
      expect.any(Object),
      expect.objectContaining({ runValidators: true })
    );
  });

  it('deactivates a rule without deleting its historical fields', async () => {
    const existing = createdRule({ status: 'active' });
    const updated = { ...existing, status: 'inactive' };
    modelMocks.pricing.findById.mockReturnValue(query(existing));
    modelMocks.pricing.findOneAndUpdate.mockReturnValue(query(updated));

    const result = await updateRuleStatus(staff, 'pricing', RULE_ID, {
      status: 'inactive',
    });

    expect(result.status).toBe('inactive');
    expect(result.version).toBe(1);
    expect(modelMocks.pricing.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' }),
      expect.objectContaining({
        $set: expect.objectContaining({ status: 'inactive' }),
      }),
      expect.objectContaining({ new: true, runValidators: true })
    );
  });

  it('verifies a subsidy but leaves activation as a separate action', async () => {
    const existing = createdRule({ verificationStatus: 'unverified' });
    const updated = { ...existing, verificationStatus: 'verified' };
    modelMocks.subsidies.findById.mockReturnValue(query(existing));
    modelMocks.subsidies.findOneAndUpdate.mockReturnValue(query(updated));

    const result = await verifySubsidyRule(staff, RULE_ID, {
      decision: 'verified',
    });

    expect(result.verificationStatus).toBe('verified');
    expect(result.status).toBe('draft');
  });

  it('deactivates a subsidy when it is rejected', async () => {
    const existing = createdRule({
      status: 'active',
      verificationStatus: 'unverified',
    });
    const updated = { ...existing, status: 'inactive', verificationStatus: 'rejected' };
    modelMocks.subsidies.findById.mockReturnValue(query(existing));
    modelMocks.subsidies.findOneAndUpdate.mockReturnValue(query(updated));

    const result = await verifySubsidyRule(staff, RULE_ID, {
      decision: 'rejected',
    });

    expect(result.status).toBe('inactive');
    expect(result.verificationStatus).toBe('rejected');
  });
});
