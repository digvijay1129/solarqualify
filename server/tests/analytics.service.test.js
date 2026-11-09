import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  lead: { aggregate: vi.fn(), collection: { name: 'leads' } },
  quotation: { aggregate: vi.fn() },
  project: { aggregate: vi.fn() },
}));

vi.mock('../src/modules/leads/lead.model.js', () => ({ default: mocks.lead }));
vi.mock('../src/modules/quotations/quotation.model.js', () => ({ default: mocks.quotation }));
vi.mock('../src/modules/projects/project.model.js', () => ({ default: mocks.project }));

import Lead from '../src/modules/leads/lead.model.js';
import Quotation from '../src/modules/quotations/quotation.model.js';
import Project from '../src/modules/projects/project.model.js';
import { getDashboardAnalytics } from '../src/modules/analytics/analytics.service.js';

const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';

const leadResult = [{
  summary: [{ _id: null, totalLeads: 4, qualifiedLeads: 2, convertedLeads: 1 }],
  priorities: [
    { _id: 'high', count: 2 },
    { _id: 'low', count: 2 },
  ],
  monthlyTrend: [
    { _id: '2026-01', totalLeads: 2, qualifiedLeads: 1, convertedLeads: 0 },
    { _id: '2026-03', totalLeads: 2, qualifiedLeads: 1, convertedLeads: 1 },
  ],
}];

const quotationResult = [{
  totalQuotationRecords: 5,
  draftCalculations: 1,
  generatedQuotations: 4,
  sentQuotations: 1,
  acceptedQuotations: 2,
  rejectedQuotations: 1,
  expiredQuotations: 0,
  generatedQuotationValueEstimate: 510000,
  acceptedQuotationValueEstimate: 255000,
}];

const projectResult = [{
  summary: [{
    totalProjects: 3,
    activeProjects: 1,
    onHoldProjects: 1,
    completedProjects: 1,
    cancelledProjects: 0,
  }],
  stages: [
    { _id: 'site_survey', count: 1 },
    { _id: 'completed', count: 2 },
  ],
  statuses: [
    { _id: 'active', count: 1 },
    { _id: 'on_hold', count: 1 },
    { _id: 'completed', count: 1 },
  ],
}];

describe('Dashboard Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Lead.aggregate.mockResolvedValue(leadResult);
    Quotation.aggregate.mockResolvedValue(quotationResult);
    Project.aggregate.mockResolvedValue(projectResult);
  });

  it('returns live, date-filtered dashboard analytics with zero-filled months', async () => {
    const result = await getDashboardAnalytics(
      { id: HOMEOWNER_ID, role: 'homeowner' },
      { startDate: '2026-01-01', endDate: '2026-03-31' }
    );

    expect(result.dataMode).toBe('live');
    expect(result.scope).toBe('homeowner');
    expect(result.dateRange).toEqual(expect.objectContaining({
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      timezone: 'UTC',
      monthCount: 3,
    }));

    expect(result.leads).toEqual(expect.objectContaining({
      totalLeads: 4,
      qualifiedLeads: 2,
      convertedLeads: 1,
      qualificationRate: 50,
      conversionRate: 25,
    }));
    expect(result.leads.priorityDistribution).toEqual([
      { key: 'low', count: 2 },
      { key: 'medium', count: 0 },
      { key: 'high', count: 2 },
    ]);
    expect(result.leads.monthlyTrend).toEqual([
      { month: '2026-01', totalLeads: 2, qualifiedLeads: 1, convertedLeads: 0 },
      { month: '2026-02', totalLeads: 0, qualifiedLeads: 0, convertedLeads: 0 },
      { month: '2026-03', totalLeads: 2, qualifiedLeads: 1, convertedLeads: 1 },
    ]);

    expect(result.quotations).toEqual(expect.objectContaining({
      totalQuotationRecords: 5,
      draftCalculations: 1,
      generatedQuotations: 4,
      sentQuotations: 1,
      acceptedQuotations: 2,
      rejectedQuotations: 1,
      acceptanceRate: 50,
    }));

    expect(result.projects).toEqual(expect.objectContaining({
      totalProjects: 3,
      activeProjects: 1,
      onHoldProjects: 1,
      completedProjects: 1,
      cancelledProjects: 0,
    }));
    expect(result.projects.stageDistribution).toHaveLength(8);

    expect(result.financials).toEqual(expect.objectContaining({
      currency: 'INR',
      generatedQuotationValueEstimate: 510000,
      acceptedQuotationValueEstimate: 255000,
      realizedRevenue: null,
      realizedRevenueStatus: 'not_tracked',
    }));
  });

  it('scopes homeowner leads, quotation joins and projects to the homeowner ID', async () => {
    await getDashboardAnalytics(
      { id: HOMEOWNER_ID, role: 'homeowner' },
      { startDate: '2026-01-01', endDate: '2026-03-31' }
    );

    const leadMatch = Lead.aggregate.mock.calls[0][0][0].$match;
    expect(leadMatch.homeownerId.toString()).toBe(HOMEOWNER_ID);
    expect(leadMatch.createdAt.$gte).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(leadMatch.createdAt.$lt).toEqual(new Date('2026-04-01T00:00:00.000Z'));

    const quotationPipeline = Quotation.aggregate.mock.calls[0][0];
    expect(quotationPipeline[0].$match.createdAt.$gte).toEqual(
      new Date('2026-01-01T00:00:00.000Z')
    );
    expect(quotationPipeline.some((stage) =>
      stage.$match?.['lead.homeownerId']?.toString?.() === HOMEOWNER_ID
    )).toBe(true);
    expect(quotationPipeline.find((stage) => stage.$lookup)?.$lookup.from).toBe('leads');

    const projectMatch = Project.aggregate.mock.calls[0][0][0].$match;
    expect(projectMatch.homeownerId.toString()).toBe(HOMEOWNER_ID);
  });

  it('scopes Sales Staff leads to assigned and unassigned records', async () => {
    await getDashboardAnalytics(
      { id: STAFF_ID, role: 'salesStaff' },
      { startDate: '2026-01-01', endDate: '2026-03-31' }
    );

    const leadMatch = Lead.aggregate.mock.calls[0][0][0].$match;
    expect(leadMatch.$or[0].assignedSalesStaffId.toString()).toBe(STAFF_ID);
    expect(leadMatch.$or[1]).toEqual({ assignedSalesStaffId: null });

    const quotationPipeline = Quotation.aggregate.mock.calls[0][0];
    expect(quotationPipeline.some((stage) =>
      stage.$match?.$or?.some((condition) =>
        Object.hasOwn(condition, 'lead.assignedSalesStaffId')
      )
    )).toBe(true);

    const projectMatch = Project.aggregate.mock.calls[0][0][0].$match;
    expect(projectMatch.assignedSalesStaffId.toString()).toBe(STAFF_ID);
  });

  it('rejects unsupported roles before querying MongoDB', async () => {
    await expect(getDashboardAnalytics({
      id: STAFF_ID,
      role: 'installer',
    })).rejects.toMatchObject({ statusCode: 403 });

    expect(Lead.aggregate).not.toHaveBeenCalled();
    expect(Quotation.aggregate).not.toHaveBeenCalled();
    expect(Project.aggregate).not.toHaveBeenCalled();
  });

  it('rejects malformed or impossible dates', async () => {
    await expect(getDashboardAnalytics(
      { id: HOMEOWNER_ID, role: 'homeowner' },
      { startDate: '2026-02-30', endDate: '2026-03-01' }
    )).rejects.toMatchObject({ statusCode: 400 });

    expect(Lead.aggregate).not.toHaveBeenCalled();
  });

  it('rejects reversed or excessively wide date ranges', async () => {
    await expect(getDashboardAnalytics(
      { id: HOMEOWNER_ID, role: 'homeowner' },
      { startDate: '2026-04-01', endDate: '2026-03-01' }
    )).rejects.toMatchObject({ statusCode: 400 });

    await expect(getDashboardAnalytics(
      { id: HOMEOWNER_ID, role: 'homeowner' },
      { startDate: '2024-01-01', endDate: '2026-03-31' }
    )).rejects.toMatchObject({ statusCode: 400 });

    expect(Lead.aggregate).not.toHaveBeenCalled();
  });

  it('rejects unrecognized filters', async () => {
    await expect(getDashboardAnalytics(
      { id: HOMEOWNER_ID, role: 'homeowner' },
      { status: 'qualified' }
    )).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns safe zero values and avoids divide-by-zero rates when no records exist', async () => {
    Lead.aggregate.mockResolvedValue([]);
    Quotation.aggregate.mockResolvedValue([]);
    Project.aggregate.mockResolvedValue([]);

    const result = await getDashboardAnalytics(
      { id: HOMEOWNER_ID, role: 'homeowner' },
      { startDate: '2026-02-01', endDate: '2026-02-28' }
    );

    expect(result.leads.totalLeads).toBe(0);
    expect(result.leads.qualificationRate).toBe(0);
    expect(result.leads.conversionRate).toBe(0);
    expect(result.quotations.acceptanceRate).toBe(0);
    expect(result.projects.totalProjects).toBe(0);
    expect(result.financials.generatedQuotationValueEstimate).toBe(0);
    expect(result.leads.monthlyTrend).toEqual([{
      month: '2026-02',
      totalLeads: 0,
      qualifiedLeads: 0,
      convertedLeads: 0,
    }]);
  });
});
