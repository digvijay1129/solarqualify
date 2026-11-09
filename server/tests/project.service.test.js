import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  stages: [
    'site_survey',
    'system_design',
    'customer_approval',
    'installation_scheduled',
    'installation_in_progress',
    'inspection',
    'net_metering',
    'completed',
  ],
  project: {
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
  },
  lead: { findOne: vi.fn() },
  quotation: { findById: vi.fn() },
}));

const stages = mocks.stages;

vi.mock('../src/modules/projects/project.model.js', () => ({
  default: mocks.project,
  PROJECT_STAGES: mocks.stages,
}));
vi.mock('../src/modules/leads/lead.model.js', () => ({ default: mocks.lead }));
vi.mock('../src/modules/quotations/quotation.model.js', () => ({ default: mocks.quotation }));

import Project from '../src/modules/projects/project.model.js';
import Lead from '../src/modules/leads/lead.model.js';
import Quotation from '../src/modules/quotations/quotation.model.js';
import {
  createProjectFromAcceptedQuotation,
  listProjects,
  getProject,
  updateProjectStatus,
  issuePublicProjectStatusToken,
  revokePublicProjectStatusToken,
  getPublicProjectStatus,
} from '../src/modules/projects/project.service.js';

const STAFF_ID = '507f1f77bcf86cd799439012';
const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const OTHER_STAFF_ID = '507f1f77bcf86cd799439013';
const LEAD_ID = '507f1f77bcf86cd799439014';
const QUOTATION_ID = '507f1f77bcf86cd799439015';
const PROJECT_ID = '507f1f77bcf86cd799439016';

const staff = { id: STAFF_ID, role: 'salesStaff' };
const homeowner = { id: HOMEOWNER_ID, role: 'homeowner' };

const lead = {
  _id: LEAD_ID,
  homeownerId: HOMEOWNER_ID,
  assignedSalesStaffId: STAFF_ID,
  customerName: 'Test Homeowner',
  email: 'customer@example.com',
  phone: '9876543210',
  propertyAddress: 'Pune, Maharashtra',
  propertyType: 'residential',
};

const quotation = {
  _id: QUOTATION_ID,
  leadId: LEAD_ID,
  quotationStatus: 'accepted',
  quotationNumber: 'SQ-439015',
  customerSnapshot: {
    customerName: 'Accepted Customer Snapshot',
    email: 'accepted@example.com',
    phone: '9123456789',
    propertyAddress: 'Accepted Address, Pune',
    propertyType: 'residential',
  },
  systemCapacityKW: 3,
  estimatedAnnualGeneration: 4200,
  applicableSubsidy: 78000,
  netInstallationCost: 127000,
};

function query(value) {
  const result = {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return result;
}

function milestoneData(currentStage = 'site_survey', currentStatus = 'in_progress') {
  return stages.map((stage, index) => ({
    _id: 'milestone-' + index,
    stage,
    status: stage === currentStage
      ? currentStatus
      : stages.indexOf(stage) < stages.indexOf(currentStage)
        ? 'completed'
        : 'pending',
    note: '',
    updatedBy: STAFF_ID,
    completedAt: null,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    updatedAt: new Date('2026-11-01T00:00:00.000Z'),
  }));
}

function project(overrides = {}) {
  return {
    _id: PROJECT_ID,
    leadId: LEAD_ID,
    quotationId: QUOTATION_ID,
    homeownerId: HOMEOWNER_ID,
    assignedSalesStaffId: STAFF_ID,
    customerSnapshot: { customerName: 'Test Homeowner' },
    quotationSnapshot: {
      quotationNumber: 'SQ-439015',
      systemCapacityKW: 3,
      estimatedAnnualGeneration: 4200,
      netInstallationCost: 127000,
      applicableSubsidy: 78000,
    },
    currentStage: 'site_survey',
    projectStatus: 'active',
    milestoneHistory: milestoneData(),
    projectHistory: [],
    statusTokenIssuedAt: null,
    statusTokenRevokedAt: null,
    updatedAt: new Date('2026-11-09T00:00:00.000Z'),
    createdAt: new Date('2026-11-09T00:00:00.000Z'),
    ...overrides,
  };
}

function mockAccessibleProject(value) {
  Project.findOne.mockReturnValue(query(value));
}

describe('Project Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Quotation.findById.mockReturnValue(query(quotation));
    Lead.findOne.mockReturnValue(query(lead));
    mockAccessibleProject(project());
    Project.findOneAndUpdate.mockReturnValue(query(project({
      currentStage: 'system_design',
      milestoneHistory: milestoneData('system_design'),
    })));
  });

  it('creates a project only from an accepted quotation and initializes ordered milestones', async () => {
    Project.create.mockImplementation(async (data) => ({
      toObject: () => ({
        _id: PROJECT_ID,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    }));

    const result = await createProjectFromAcceptedQuotation(staff, QUOTATION_ID);

    expect(Quotation.findById).toHaveBeenCalledWith(QUOTATION_ID);
    expect(Lead.findOne).toHaveBeenCalledWith({
      _id: LEAD_ID,
      assignedSalesStaffId: STAFF_ID,
    });
    expect(Project.create).toHaveBeenCalledWith(expect.objectContaining({
      leadId: LEAD_ID,
      quotationId: QUOTATION_ID,
      homeownerId: HOMEOWNER_ID,
      assignedSalesStaffId: STAFF_ID,
      customerSnapshot: expect.objectContaining({
        customerName: 'Accepted Customer Snapshot',
        email: 'accepted@example.com',
        propertyAddress: 'Accepted Address, Pune',
      }),
      currentStage: 'site_survey',
      projectStatus: 'active',
      milestoneHistory: expect.arrayContaining([
        expect.objectContaining({ stage: 'site_survey', status: 'in_progress' }),
        expect.objectContaining({ stage: 'system_design', status: 'pending' }),
      ]),
      projectHistory: expect.arrayContaining([
        expect.objectContaining({ eventType: 'project_created' }),
      ]),
    }));
    expect(result.id).toBe(PROJECT_ID);
    expect(result.milestones).toHaveLength(stages.length);
  });

  it('rejects quotations that have not been accepted', async () => {
    Quotation.findById.mockReturnValue(query({ ...quotation, quotationStatus: 'generated' }));

    await expect(createProjectFromAcceptedQuotation(staff, QUOTATION_ID))
      .rejects.toMatchObject({ statusCode: 409 });
    expect(Project.create).not.toHaveBeenCalled();
  });

  it('prevents Sales Staff from creating projects for leads assigned to someone else', async () => {
    Lead.findOne.mockReturnValue(query(null));

    await expect(createProjectFromAcceptedQuotation({
      id: OTHER_STAFF_ID,
      role: 'salesStaff',
    }, QUOTATION_ID)).rejects.toMatchObject({ statusCode: 404 });

    expect(Project.create).not.toHaveBeenCalled();
  });

  it('prevents duplicate projects for the same quotation', async () => {
    Project.create.mockRejectedValue({ code: 11000 });

    await expect(createProjectFromAcceptedQuotation(staff, QUOTATION_ID))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('scopes homeowner project lists to their own records', async () => {
    Project.find.mockReturnValue(query([project()]));
    Project.countDocuments.mockResolvedValue(1);

    const result = await listProjects(homeowner, { status: 'active', page: '1', pageSize: '10' });

    expect(Project.find).toHaveBeenCalledWith({
      homeownerId: HOMEOWNER_ID,
      projectStatus: 'active',
    });
    expect(result.projects).toHaveLength(1);
    expect(result.pagination.totalItems).toBe(1);
  });

  it('scopes Sales Staff project lists to assigned projects', async () => {
    Project.find.mockReturnValue(query([]));
    Project.countDocuments.mockResolvedValue(0);

    await listProjects(staff, { stage: 'site_survey' });

    expect(Project.find).toHaveBeenCalledWith({
      assignedSalesStaffId: STAFF_ID,
      currentStage: 'site_survey',
    });
  });

  it('rejects unsupported list filters', async () => {
    await expect(listProjects(staff, { customerName: 'someone' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns a project only to an authorized homeowner or assigned staff member', async () => {
    mockAccessibleProject(project());

    const result = await getProject(homeowner, PROJECT_ID);

    expect(Project.findOne).toHaveBeenCalledWith({
      _id: PROJECT_ID,
      homeownerId: HOMEOWNER_ID,
    });
    expect(result.id).toBe(PROJECT_ID);
  });

  it('returns 404 when a project is outside the caller scope', async () => {
    mockAccessibleProject(null);

    await expect(getProject({
      id: OTHER_STAFF_ID,
      role: 'salesStaff',
    }, PROJECT_ID)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('completes a milestone and automatically advances to the next stage', async () => {
    const current = project();
    mockAccessibleProject(current);
    const updated = project({
      currentStage: 'system_design',
      milestoneHistory: milestoneData('system_design'),
      projectHistory: [{
        eventType: 'milestone_updated',
        fromStage: 'site_survey',
        toStage: 'system_design',
        milestoneStatus: 'completed',
      }],
    });
    Project.findOneAndUpdate.mockReturnValue(query(updated));

    const result = await updateProjectStatus(staff, PROJECT_ID, {
      stage: 'site_survey',
      milestoneStatus: 'completed',
      note: 'Site survey signed off.',
    });

    const update = Project.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.currentStage).toBe('system_design');
    expect(update.$set.milestoneHistory[0].status).toBe('completed');
    expect(update.$set.milestoneHistory[1].status).toBe('in_progress');
    expect(update.$push.projectHistory.$each[0]).toEqual(expect.objectContaining({
      eventType: 'milestone_updated',
      fromStage: 'site_survey',
      toStage: 'system_design',
      milestoneStatus: 'completed',
      note: 'Site survey signed off.',
    }));
    expect(result.currentStage).toBe('system_design');
  });

  it('prevents skipping ahead to a later project stage', async () => {
    await expect(updateProjectStatus(staff, PROJECT_ID, {
      stage: 'installation_in_progress',
      milestoneStatus: 'completed',
    })).rejects.toMatchObject({ statusCode: 409 });
    expect(Project.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('requires a reason when putting a project on hold', async () => {
    await expect(updateProjectStatus(staff, PROJECT_ID, {
      projectStatus: 'on_hold',
    })).rejects.toMatchObject({ statusCode: 400 });
    expect(Project.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('supports on-hold and resume status transitions with history', async () => {
    mockAccessibleProject(project());
    Project.findOneAndUpdate.mockReturnValue(query(project({ projectStatus: 'on_hold' })));

    await updateProjectStatus(staff, PROJECT_ID, {
      projectStatus: 'on_hold',
      note: 'Waiting for site access.',
    });

    expect(Project.findOneAndUpdate.mock.calls[0][1].$push.projectHistory.$each[0])
      .toEqual(expect.objectContaining({
        fromProjectStatus: 'active',
        toProjectStatus: 'on_hold',
      }));

    mockAccessibleProject(project({
      projectStatus: 'on_hold',
      updatedAt: new Date('2026-11-10T00:00:00.000Z'),
    }));
    Project.findOneAndUpdate.mockReturnValue(query(project({ projectStatus: 'active' })));

    await updateProjectStatus(staff, PROJECT_ID, { projectStatus: 'active' });

    expect(Project.findOneAndUpdate.mock.calls[1][1].$set.projectStatus).toBe('active');
  });

  it('marks the project completed when its final milestone is completed', async () => {
    const finalProject = project({
      currentStage: 'completed',
      milestoneHistory: milestoneData('completed', 'in_progress'),
    });
    mockAccessibleProject(finalProject);
    Project.findOneAndUpdate.mockReturnValue(query(project({
      currentStage: 'completed',
      projectStatus: 'completed',
      milestoneHistory: milestoneData('completed', 'completed'),
    })));

    await updateProjectStatus(staff, PROJECT_ID, {
      stage: 'completed',
      milestoneStatus: 'completed',
    });

    const update = Project.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.currentStage).toBe('completed');
    expect(update.$set.projectStatus).toBe('completed');
  });

  it('does not allow operational changes after a project is completed', async () => {
    mockAccessibleProject(project({ projectStatus: 'completed' }));

    await expect(updateProjectStatus(staff, PROJECT_ID, {
      projectStatus: 'on_hold',
      note: 'Test',
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('issues a high-entropy public token but stores only its SHA-256 hash', async () => {
    mockAccessibleProject(project());
    Project.findOneAndUpdate.mockReturnValue(query(project({
      statusTokenIssuedAt: new Date(),
    })));

    const result = await issuePublicProjectStatusToken(homeowner, PROJECT_ID);
    const update = Project.findOneAndUpdate.mock.calls[0][1];
    const storedHash = update.$set.statusTokenHash;

    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.path).toBe('/api/v1/public/project-status/' + result.token);
    expect(storedHash).toMatch(/^[a-f0-9]{64}$/);
    expect(storedHash).not.toBe(result.token);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('allows revoking a previously issued public token', async () => {
    mockAccessibleProject(project({ statusTokenIssuedAt: new Date() }));
    Project.findOneAndUpdate.mockReturnValue(query(project({ statusTokenHash: null })));

    const result = await revokePublicProjectStatusToken(staff, PROJECT_ID);

    expect(Project.findOneAndUpdate.mock.calls[0][0]).toEqual(expect.objectContaining({
      statusTokenHash: { $type: 'string' },
      statusTokenRevokedAt: null,
    }));
    expect(Project.findOneAndUpdate.mock.calls[0][1].$set).toEqual(expect.objectContaining({
      statusTokenHash: null,
      statusTokenRevokedAt: expect.any(Date),
    }));
    expect(result.revoked).toBe(true);
  });

  it('returns only safe milestone fields from a valid public token', async () => {
    const publicToken = 'a'.repeat(43);
    Project.findOne.mockReturnValue(query(project({
      milestoneHistory: [{
        stage: 'installation_in_progress',
        status: 'in_progress',
        note: 'INTERNAL CUSTOMER PHONE 9876543210',
        completedAt: null,
        updatedAt: new Date(),
      }],
    })));

    const result = await getPublicProjectStatus(publicToken);

    const filter = Project.findOne.mock.calls[0][0];
    expect(filter.statusTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(filter.statusTokenRevokedAt).toBeNull();
    expect(filter.statusTokenExpiresAt.$gt).toBeInstanceOf(Date);
    expect(result.currentStage).toBe('site_survey');
    expect(result.milestones[0]).toEqual(expect.objectContaining({
      stage: 'installation_in_progress',
      status: 'in_progress',
    }));
    expect(JSON.stringify(result)).not.toContain('9876543210');
    expect(JSON.stringify(result)).not.toContain('customerName');
    expect(JSON.stringify(result)).not.toContain('INTERNAL');
  });

  it('returns the same not-found response for malformed, expired or revoked tokens', async () => {
    await expect(getPublicProjectStatus('bad-token')).rejects.toMatchObject({ statusCode: 404 });

    Project.findOne.mockReturnValue(query(null));
    await expect(getPublicProjectStatus('a'.repeat(43))).rejects.toMatchObject({ statusCode: 404 });
  });
});
