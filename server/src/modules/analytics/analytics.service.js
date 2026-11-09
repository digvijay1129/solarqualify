import mongoose from 'mongoose';

import Lead from '../leads/lead.model.js';
import Quotation from '../quotations/quotation.model.js';
import Project from '../projects/project.model.js';
import { AppError } from '../../shared/errors/AppError.js';

const DEFAULT_MONTH_COUNT = 12;
const MAX_MONTH_COUNT = 24;

const LEAD_PRIORITIES = ['low', 'medium', 'high'];
const PROJECT_STAGES = [
  'site_survey',
  'system_design',
  'customer_approval',
  'installation_scheduled',
  'installation_in_progress',
  'inspection',
  'net_metering',
  'completed',
];
const PROJECT_STATUSES = ['active', 'on_hold', 'completed', 'cancelled'];
const FORMAL_QUOTATION_STATUSES = ['generated', 'sent', 'accepted', 'rejected', 'expired'];

function requireUser(user) {
  if (
    !user ||
    !mongoose.isValidObjectId(user.id) ||
    !['homeowner', 'salesStaff'].includes(user.role)
  ) {
    throw new AppError('You are not authorized to access dashboard analytics.', 403);
  }
}

function parseDateOnly(value, fieldName) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(fieldName + ' must use the YYYY-MM-DD date format.', 400);
  }

  const date = new Date(value + 'T00:00:00.000Z');
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new AppError(fieldName + ' must be a valid calendar date.', 400);
  }

  return date;
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function getDateRange(filters = {}) {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    throw new AppError('Invalid analytics filters.', 400);
  }

  const allowed = ['startDate', 'endDate'];
  if (Object.keys(filters).some((key) => !allowed.includes(key))) {
    throw new AppError('Unsupported analytics filter.', 400);
  }

  const today = new Date();
  const todayUtc = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  ));

  const endDate = filters.endDate === undefined
    ? todayUtc
    : parseDateOnly(filters.endDate, 'endDate');

  const defaultStart = new Date(Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth() - (DEFAULT_MONTH_COUNT - 1),
    1
  ));

  const startDate = filters.startDate === undefined
    ? defaultStart
    : parseDateOnly(filters.startDate, 'startDate');

  if (startDate.getTime() > endDate.getTime()) {
    throw new AppError('startDate must be on or before endDate.', 400);
  }

  const monthCount =
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    endDate.getUTCMonth() - startDate.getUTCMonth() + 1;

  if (monthCount > MAX_MONTH_COUNT) {
    throw new AppError('Analytics date range cannot exceed 24 calendar months.', 400);
  }

  const endExclusive = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);

  return {
    startDate,
    endDate,
    endExclusive,
    startDateLabel: formatDateOnly(startDate),
    endDateLabel: formatDateOnly(endDate),
  };
}

function getLeadScope(user, userObjectId) {
  if (user.role === 'homeowner') {
    return { homeownerId: userObjectId };
  }

  // Match the lead-list policy: assigned leads and currently unassigned
  // homeowner enquiries visible to Sales Staff.
  return {
    $or: [
      { assignedSalesStaffId: userObjectId },
      { assignedSalesStaffId: null },
    ],
  };
}

function getProjectScope(user, userObjectId) {
  return user.role === 'homeowner'
    ? { homeownerId: userObjectId }
    : { assignedSalesStaffId: userObjectId };
}

function zeroSummary() {
  return {
    totalLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
  };
}

function toCount(value) {
  return Number.isFinite(value) ? value : 0;
}

function toMoney(value) {
  return Math.round((toCount(value) + Number.EPSILON) * 100) / 100;
}

function buildMonthlyTrend(rows, startDate, endDate) {
  const byMonth = new Map(rows.map((row) => [row._id, row]));
  const result = [];
  const cursor = new Date(Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    1
  ));
  const lastMonth = new Date(Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    1
  ));

  while (cursor.getTime() <= lastMonth.getTime()) {
    const key = cursor.toISOString().slice(0, 7);
    const row = byMonth.get(key) ?? {};

    result.push({
      month: key,
      totalLeads: toCount(row.totalLeads),
      qualifiedLeads: toCount(row.qualifiedLeads),
      convertedLeads: toCount(row.convertedLeads),
    });

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return result;
}

function buildDistribution(rows, keys, labelKey = '_id') {
  const counts = new Map(rows.map((row) => [row[labelKey], toCount(row.count)]));
  return keys.map((key) => ({
    key,
    count: counts.get(key) ?? 0,
  }));
}

function getLeadAnalyticsPipeline(match) {
  return [
    { $match: match },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalLeads: { $sum: 1 },
              qualifiedLeads: {
                $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] },
              },
              convertedLeads: {
                $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
              },
            },
          },
        ],
        priorities: [
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 },
            },
          },
        ],
        monthlyTrend: [
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m',
                  date: '$createdAt',
                  timezone: 'UTC',
                },
              },
              totalLeads: { $sum: 1 },
              qualifiedLeads: {
                $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] },
              },
              convertedLeads: {
                $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ];
}

function getQuotationAnalyticsPipeline(dateMatch, leadScope) {
  const leadMatch = leadScope.homeownerId
    ? { 'lead.homeownerId': leadScope.homeownerId }
    : {
        $or: [
          { 'lead.assignedSalesStaffId': leadScope.$or[0].assignedSalesStaffId },
          { 'lead.assignedSalesStaffId': null },
        ],
      };

  return [
    { $match: dateMatch },
    {
      $lookup: {
        from: Lead.collection.name,
        localField: 'leadId',
        foreignField: '_id',
        as: 'lead',
      },
    },
    { $unwind: '$lead' },
    { $match: leadMatch },
    {
      $group: {
        _id: null,
        totalQuotationRecords: { $sum: 1 },
        draftCalculations: {
          $sum: { $cond: [{ $eq: ['$quotationStatus', 'draft'] }, 1, 0] },
        },
        generatedQuotations: {
          $sum: {
            $cond: [
              { $in: ['$quotationStatus', FORMAL_QUOTATION_STATUSES] },
              1,
              0,
            ],
          },
        },
        sentQuotations: {
          $sum: { $cond: [{ $eq: ['$quotationStatus', 'sent'] }, 1, 0] },
        },
        acceptedQuotations: {
          $sum: { $cond: [{ $eq: ['$quotationStatus', 'accepted'] }, 1, 0] },
        },
        rejectedQuotations: {
          $sum: { $cond: [{ $eq: ['$quotationStatus', 'rejected'] }, 1, 0] },
        },
        expiredQuotations: {
          $sum: { $cond: [{ $eq: ['$quotationStatus', 'expired'] }, 1, 0] },
        },
        generatedQuotationValueEstimate: {
          $sum: {
            $cond: [
              { $in: ['$quotationStatus', FORMAL_QUOTATION_STATUSES] },
              { $ifNull: ['$netInstallationCost', 0] },
              0,
            ],
          },
        },
        acceptedQuotationValueEstimate: {
          $sum: {
            $cond: [
              { $eq: ['$quotationStatus', 'accepted'] },
              { $ifNull: ['$netInstallationCost', 0] },
              0,
            ],
          },
        },
      },
    },
  ];
}

function getProjectAnalyticsPipeline(match) {
  return [
    { $match: match },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalProjects: { $sum: 1 },
              activeProjects: {
                $sum: { $cond: [{ $eq: ['$projectStatus', 'active'] }, 1, 0] },
              },
              onHoldProjects: {
                $sum: { $cond: [{ $eq: ['$projectStatus', 'on_hold'] }, 1, 0] },
              },
              completedProjects: {
                $sum: { $cond: [{ $eq: ['$projectStatus', 'completed'] }, 1, 0] },
              },
              cancelledProjects: {
                $sum: { $cond: [{ $eq: ['$projectStatus', 'cancelled'] }, 1, 0] },
              },
            },
          },
        ],
        stages: [
          {
            $group: {
              _id: '$currentStage',
              count: { $sum: 1 },
            },
          },
        ],
        statuses: [
          {
            $group: {
              _id: '$projectStatus',
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ];
}

/**
 * Build role-scoped analytics from live MongoDB records.
 *
 * Lead status counts are current-state counts for leads created in the
 * selected period; this project does not store historical lead-status events.
 * Quotation values are estimates from saved quotation snapshots, not cash
 * receipts or recognized accounting revenue.
 */
export async function getDashboardAnalytics(user, filters = {}) {
  requireUser(user);
  const range = getDateRange(filters);
  const userObjectId = new mongoose.Types.ObjectId(user.id);
  const leadScope = getLeadScope(user, userObjectId);
  const projectScope = getProjectScope(user, userObjectId);
  const createdAtMatch = {
    createdAt: {
      $gte: range.startDate,
      $lt: range.endExclusive,
    },
  };

  const [leadResult, quotationResult, projectResult] = await Promise.all([
    Lead.aggregate(getLeadAnalyticsPipeline({
      ...leadScope,
      ...createdAtMatch,
    })),
    Quotation.aggregate(getQuotationAnalyticsPipeline(
      createdAtMatch,
      leadScope
    )),
    Project.aggregate(getProjectAnalyticsPipeline({
      ...projectScope,
      ...createdAtMatch,
    })),
  ]);

  const leadFacet = leadResult[0] ?? {};
  const leadSummary = leadFacet.summary?.[0] ?? zeroSummary();
  const quotationSummary = quotationResult[0] ?? {};
  const projectFacet = projectResult[0] ?? {};
  const projectSummary = projectFacet.summary?.[0] ?? {};

  const totalLeads = toCount(leadSummary.totalLeads);
  const qualifiedLeads = toCount(leadSummary.qualifiedLeads);
  const convertedLeads = toCount(leadSummary.convertedLeads);
  const generatedQuotations = toCount(quotationSummary.generatedQuotations);
  const acceptedQuotations = toCount(quotationSummary.acceptedQuotations);
  const acceptanceDenominator = generatedQuotations;

  return {
    dataMode: 'live',
    scope: user.role === 'homeowner' ? 'homeowner' : 'sales_staff',
    dateRange: {
      startDate: range.startDateLabel,
      endDate: range.endDateLabel,
      timestampField: 'createdAt',
      timezone: 'UTC',
      monthCount: (range.endDate.getUTCFullYear() - range.startDate.getUTCFullYear()) * 12 +
        range.endDate.getUTCMonth() - range.startDate.getUTCMonth() + 1,
    },
    leads: {
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      qualificationRate: totalLeads > 0
        ? Math.round((qualifiedLeads / totalLeads) * 10000) / 100
        : 0,
      conversionRate: totalLeads > 0
        ? Math.round((convertedLeads / totalLeads) * 10000) / 100
        : 0,
      priorityDistribution: buildDistribution(
        leadFacet.priorities ?? [],
        LEAD_PRIORITIES
      ),
      monthlyTrend: buildMonthlyTrend(
        leadFacet.monthlyTrend ?? [],
        range.startDate,
        range.endDate
      ),
    },
    quotations: {
      totalQuotationRecords: toCount(quotationSummary.totalQuotationRecords),
      draftCalculations: toCount(quotationSummary.draftCalculations),
      generatedQuotations,
      sentQuotations: toCount(quotationSummary.sentQuotations),
      acceptedQuotations,
      rejectedQuotations: toCount(quotationSummary.rejectedQuotations),
      expiredQuotations: toCount(quotationSummary.expiredQuotations),
      acceptanceRate: acceptanceDenominator > 0
        ? Math.round((acceptedQuotations / acceptanceDenominator) * 10000) / 100
        : 0,
    },
    projects: {
      totalProjects: toCount(projectSummary.totalProjects),
      activeProjects: toCount(projectSummary.activeProjects),
      onHoldProjects: toCount(projectSummary.onHoldProjects),
      completedProjects: toCount(projectSummary.completedProjects),
      cancelledProjects: toCount(projectSummary.cancelledProjects),
      stageDistribution: buildDistribution(
        projectFacet.stages ?? [],
        PROJECT_STAGES
      ),
      statusDistribution: buildDistribution(
        projectFacet.statuses ?? [],
        PROJECT_STATUSES
      ),
    },
    financials: {
      currency: 'INR',
      generatedQuotationValueEstimate: toMoney(
        quotationSummary.generatedQuotationValueEstimate
      ),
      acceptedQuotationValueEstimate: toMoney(
        quotationSummary.acceptedQuotationValueEstimate
      ),
      realizedRevenue: null,
      realizedRevenueStatus: 'not_tracked',
      explanation: 'Payment and invoice transactions are not stored by the current application. Quotation totals are estimates and must not be interpreted as received revenue.',
    },
    reportingNotes: [
      'Lead status counts represent the current status of leads created within the selected date range; historical status-transition events are not stored.',
      'Monthly lead trends group records by lead creation month (UTC).',
      'Quotation statistics use quotation creation dates. Generated quotation values sum the saved net installation cost of formal quotations; accepted values include accepted quotations only.',
      'Project stage distribution represents the current stage of projects created within the selected date range.',
      'Realized revenue is unavailable because payment and invoice transactions are not tracked.',
    ],
  };
}
