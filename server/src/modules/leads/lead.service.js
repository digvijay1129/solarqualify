import mongoose from 'mongoose';
import Lead from './lead.model.js';
import User from '../users/user.model.js';
import { AppError } from '../../shared/errors/AppError.js';

const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'quotation_created',
  'converted',
  'lost',
];

const PRIORITIES = ['low', 'medium', 'high'];
const PROPERTY_TYPES = ['residential', 'commercial', 'industrial', 'other'];
const OWNERSHIP_TYPES = ['owner', 'tenant', 'other', 'unknown'];

const STATUS_LABELS = {
  new: 'New',
  contacted: 'In Progress',
  qualified: 'Qualified',
  quotation_created: 'In Progress',
  converted: 'Converted',
  lost: 'Lost',
};

const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function requireAuthenticatedRole(user) {
  if (
    !user ||
    !mongoose.isValidObjectId(user.id) ||
    !['homeowner', 'salesStaff'].includes(user.role)
  ) {
    throw new AppError('You are not authorized to access leads.', 403);
  }
}

function getScopeFilter(user) {
  requireAuthenticatedRole(user);

  if (user.role === 'homeowner') {
    return { homeownerId: user.id };
  }

  return {
    $or: [
      { assignedSalesStaffId: user.id },
      { assignedSalesStaffId: null },
    ],
  };
}

function getAssignedScopeFilter(user) {
  requireAuthenticatedRole(user);

  if (user.role === 'homeowner') {
    return { homeownerId: user.id };
  }

  return { assignedSalesStaffId: user.id };
}

function validateLeadId(leadId) {
  if (!mongoose.isValidObjectId(leadId)) {
    throw new AppError('Invalid lead ID.', 400);
  }
}

function toLeadDTO(lead) {
  return {
    id: lead._id.toString(),
    referenceId: lead.referenceId,
    name: lead.customerName,
    email: lead.email,
    phone: lead.phone,
    location: lead.propertyAddress || null,
    pincode: lead.pincode ?? null,
    propertyType: lead.propertyType,
    roofType: lead.roofType ?? null,
    roofAreaSqFt: lead.roofAreaSqFt ?? null,
    sanctionedLoad: lead.sanctionedLoad ?? null,
    sanctionedLoadUnit: lead.sanctionedLoadUnit ?? null,
    ownership:
      lead.ownership === 'owner'
        ? 'Owner'
        : lead.ownership === 'tenant'
          ? 'Tenant'
          : lead.ownership === 'other'
            ? 'Other'
            : 'Unknown',
    monthlyBill: lead.monthlyElectricityBill,
    monthlyUnits: lead.monthlyUnits,
    recommendedSystemKw: lead.recommendedSystemKw,
    priority: PRIORITY_LABELS[lead.priority] ?? 'Low',
    priorityCode: lead.priority,
    status: STATUS_LABELS[lead.status] ?? lead.status,
    statusCode: lead.status,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

function validateOptionalNumber(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new AppError(`${fieldName} must be a non-negative number.`, 400);
  }

  return number;
}

function validateString(value, fieldName, maxLength, minLength = 1) {
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  const normalized = value.trim();

  if (
    normalized.length < minLength ||
    normalized.length > maxLength
  ) {
    throw new AppError(
      `${fieldName} must contain between ${minLength} and ${maxLength} characters.`,
      400
    );
  }

  return normalized;
}

function buildStatusFilter(status) {
  if (!status || status === 'all') {
    return null;
  }

  if (status === 'in-progress') {
    return {
      status: { $in: ['contacted', 'quotation_created'] },
    };
  }

  if (LEAD_STATUSES.includes(status)) {
    return { status };
  }

  throw new AppError('Invalid lead status filter.', 400);
}

function buildListFilter(user, filters) {
  const scope = getScopeFilter(user);
  const query = {};
  const andConditions = [];

  // Preserve the user's authorized record scope.
  if (scope.$or) {
    andConditions.push({ $or: scope.$or });
  } else {
    Object.assign(query, scope);
  }

  const statusFilter = buildStatusFilter(filters.status);

  if (statusFilter) {
    Object.assign(query, statusFilter);
  }

  const priority = filters.priority ?? 'all';

  if (priority !== 'all') {
    if (!PRIORITIES.includes(priority)) {
      throw new AppError('Invalid priority filter.', 400);
    }

    query.priority = priority;
  }

  const location = filters.location ?? 'all';

  if (location === 'not-provided') {
    query.propertyAddress = { $in: [null, ''] };
  } else if (location !== 'all') {
    if (typeof location !== 'string' || location.length > 100) {
      throw new AppError('Invalid location filter.', 400);
    }

    query.propertyAddress = {
      $regex: escapeRegex(location.trim()),
      $options: 'i',
    };
  }

  const search = String(filters.search ?? '').trim();

  if (search.length > 100) {
    throw new AppError('Search must not exceed 100 characters.', 400);
  }

  if (search) {
    const expression = {
      $regex: escapeRegex(search),
      $options: 'i',
    };

    andConditions.push({
      $or: [
        { customerName: expression },
        { referenceId: expression },
        { phone: expression },
        { email: expression },
        { propertyAddress: expression },
      ],
    });
  }

  // Keep access restrictions and search conditions separate.
  // Neither condition can overwrite the other.
  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  return query;
}

function getPagination(filters) {
  const page = Number(filters.page ?? 1);
  const pageSize = Number(filters.pageSize ?? 5);

  if (!Number.isInteger(page) || page < 1 || page > 100000) {
    throw new AppError('Page must be a positive integer.', 400);
  }

  if (![5, 10, 20].includes(pageSize)) {
    throw new AppError('Page size must be 5, 10, or 20.', 400);
  }

  return { page, pageSize };
}

/**
 * Create a lead for the authenticated user.
 *
 * Homeowner-created leads belong to the homeowner.
 * Sales Staff-created leads are initially assigned to the creator.
 */
export async function createLead(user, input) {
  requireAuthenticatedRole(user);

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError('A valid lead request body is required.', 400);
  }

  if (input.consent !== true) {
    throw new AppError(
      'Customer consent is required before creating a lead.',
      400
    );
  }

  const customerName = validateString(
    input.customerName ?? (user.role === 'homeowner' ? user.name : undefined),
    'Customer name',
    100,
    2
  );

  const email = validateString(
    input.email ?? (user.role === 'homeowner' ? user.email : undefined),
    'Email',
    254
  ).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Enter a valid email address.', 400);
  }

  const phone = validateString(
    input.phone ?? (user.role === 'homeowner' ? user.phone : undefined),
    'Phone',
    20
  );

  const propertyAddress = validateString(
    input.propertyAddress,
    'Property address',
    500,
    2
  );

  const propertyType = input.propertyType ?? 'residential';

  if (!PROPERTY_TYPES.includes(propertyType)) {
    throw new AppError('Invalid property type.', 400);
  }

  const ownership = input.ownership ?? 'unknown';

  if (!OWNERSHIP_TYPES.includes(ownership)) {
    throw new AppError('Invalid property ownership type.', 400);
  }

  const pincode = input.pincode === undefined || input.pincode === null || input.pincode === ''
    ? null
    : validateString(input.pincode, 'Pincode', 6, 6);

  if (pincode !== null && !/^\\d{6}$/.test(pincode)) {
    throw new AppError('Pincode must contain exactly 6 digits.', 400);
  }

  const allowedRoofTypes = ['RCC Flat Roof', 'Tiled Roof', 'Metal Sheet', 'Other'];
  const roofType = input.roofType ?? null;
  if (roofType !== null && !allowedRoofTypes.includes(roofType)) {
    throw new AppError('Invalid roof type.', 400);
  }

  const roofAreaSqFt = validateOptionalNumber(input.roofAreaSqFt, 'Roof area');
  if (roofAreaSqFt !== null && roofAreaSqFt <= 0) {
    throw new AppError('Roof area must be greater than zero.', 400);
  }

  const sanctionedLoad = validateOptionalNumber(input.sanctionedLoad, 'Sanctioned load');
  if (sanctionedLoad !== null && sanctionedLoad <= 0) {
    throw new AppError('Sanctioned load must be greater than zero.', 400);
  }

  const lead = await Lead.create({
    homeownerId: user.role === 'homeowner' ? user.id : null,
    assignedSalesStaffId: user.role === 'salesStaff' ? user.id : null,
    customerName,
    email,
    phone,
    propertyAddress,
    propertyType,
    ownership,
    pincode,
    roofType,
    roofAreaSqFt,
    sanctionedLoad,
    sanctionedLoadUnit: sanctionedLoad === null ? null : 'kW',
    monthlyElectricityBill: validateOptionalNumber(
      input.monthlyElectricityBill,
      'Monthly electricity bill'
    ),
    monthlyUnits: validateOptionalNumber(
      input.monthlyUnits,
      'Monthly electricity units'
    ),
    consent: true,
  });

  return toLeadDTO(lead);
}

/**
 * Retrieve permitted leads using MongoDB filtering and pagination.
 */
export async function getLeads(user, filters = {}) {
  const query = buildListFilter(user, filters);
  const { page, pageSize } = getPagination(filters);

  const skip = (page - 1) * pageSize;

  const [records, totalItems] = await Promise.all([
    Lead.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),

    Lead.countDocuments(query),
  ]);

  return {
    items: records.map(toLeadDTO),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}

/**
 * Retrieve one lead only when it belongs to the requesting user
 * or is assigned to the requesting Sales Staff member.
 */
export async function getLeadById(user, leadId) {
  validateLeadId(leadId);

  const lead = await Lead.findOne({
    _id: leadId,
    ...getScopeFilter(user),
  }).lean();

  if (!lead) {
    throw new AppError('Lead not found.', 404);
  }

  return toLeadDTO(lead);
}

/**
 * Return real database overview statistics.
 * Growth percentages remain null until historical comparison
 * data is available.
 */
export async function getLeadsOverview(user) {
  const scope = getScopeFilter(user);

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    inProgressLeads,
    convertedLeads,
    lostLeads,
  ] = await Promise.all([
    Lead.countDocuments(scope),

    Lead.countDocuments({ ...scope, status: 'new' }),

    Lead.countDocuments({ ...scope, status: 'qualified' }),

    Lead.countDocuments({
      ...scope,
      status: { $in: ['contacted', 'quotation_created'] },
    }),

    Lead.countDocuments({ ...scope, status: 'converted' }),

    Lead.countDocuments({ ...scope, status: 'lost' }),
  ]);

  return {
    dataMode: 'live',
    dataLabel: 'Live records from the SolarQualify database.',
    dataNote:
      'Growth comparisons are unavailable until sufficient historical data exists.',

    summary: {
      totalLeads,
      newLeads,
      qualifiedLeads,
      inProgressLeads,
      growth: {
        totalLeads: null,
        newLeads: null,
        qualifiedLeads: null,
        inProgressLeads: null,
      },
    },

    statusCounts: {
      all: totalLeads,
      new: newLeads,
      qualified: qualifiedLeads,
      'in-progress': inProgressLeads,
      converted: convertedLeads,
      lost: lostLeads,
    },

    statuses: [
      { id: 'all', label: 'All Leads' },
      { id: 'new', label: 'New' },
      { id: 'qualified', label: 'Qualified' },
      { id: 'in-progress', label: 'In Progress' },
      { id: 'converted', label: 'Converted' },
      { id: 'lost', label: 'Lost' },
    ],

    priorities: [
      { id: 'high', label: 'High' },
      { id: 'medium', label: 'Medium' },
      { id: 'low', label: 'Low' },
    ],
  };
}

/**
 * Update only fields permitted for the authenticated role.
 */
export async function updateLead(user, leadId, input) {
  validateLeadId(leadId);
  requireAuthenticatedRole(user);

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError('A valid update request body is required.', 400);
  }

  const allowedFields = [
    'customerName',
    'email',
    'phone',
    'propertyAddress',
    'propertyType',
    'ownership',
  ];

  if (user.role === 'salesStaff') {
    allowedFields.push('status', 'priority');
  }

  const updates = {};

  for (const field of allowedFields) {
    if (input[field] === undefined) {
      continue;
    }

    updates[field] = input[field];
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No permitted lead fields were provided.', 400);
  }

  if (updates.customerName !== undefined) {
    updates.customerName = validateString(
      updates.customerName,
      'Customer name',
      100,
      2
    );
  }

  if (updates.email !== undefined) {
    updates.email = validateString(updates.email, 'Email', 254).toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
      throw new AppError('Enter a valid email address.', 400);
    }
  }

  if (updates.phone !== undefined) {
    updates.phone = validateString(updates.phone, 'Phone', 20);
  }

  if (updates.propertyAddress !== undefined) {
    updates.propertyAddress = validateString(
      updates.propertyAddress,
      'Property address',
      500,
      2
    );
  }

  if (
    updates.propertyType !== undefined &&
    !PROPERTY_TYPES.includes(updates.propertyType)
  ) {
    throw new AppError('Invalid property type.', 400);
  }

  if (
    updates.ownership !== undefined &&
    !OWNERSHIP_TYPES.includes(updates.ownership)
  ) {
    throw new AppError('Invalid property ownership type.', 400);
  }

  if (
    updates.status !== undefined &&
    !LEAD_STATUSES.includes(updates.status)
  ) {
    throw new AppError('Invalid lead status.', 400);
  }

  if (
    updates.priority !== undefined &&
    !PRIORITIES.includes(updates.priority)
  ) {
    throw new AppError('Invalid lead priority.', 400);
  }

  const updatedLead = await Lead.findOneAndUpdate(
    {
      _id: leadId,
      ...getAssignedScopeFilter(user),
    },
    { $set: updates },
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!updatedLead) {
    throw new AppError('Lead not found.', 404);
  }

  return toLeadDTO(updatedLead);
}

/**
 * Reassign a lead to another active Sales Staff account.
 * The requester must currently have access to the lead.
 */
export async function assignLead(user, leadId, salesStaffId) {
  validateLeadId(leadId);
  requireAuthenticatedRole(user);

  if (user.role !== 'salesStaff') {
    throw new AppError('Only sales staff can assign leads.', 403);
  }

  if (!mongoose.isValidObjectId(salesStaffId)) {
    throw new AppError('A valid Sales Staff user ID is required.', 400);
  }

  const lead = await Lead.findOne({
    _id: leadId,
    ...getScopeFilter(user),
  });

  if (!lead) {
    throw new AppError('Lead not found.', 404);
  }

  const isUnassigned = !lead.assignedSalesStaffId;

  if (isUnassigned && salesStaffId !== user.id) {
    throw new AppError(
      'Unassigned leads can only be claimed by assigning them to yourself.',
      403
    );
  }

  const targetUser = await User.findOne({
    _id: salesStaffId,
    role: 'salesStaff',
    isActive: true,
  }).select('_id');

  if (!targetUser) {
    throw new AppError(
      'The selected Sales Staff account does not exist or is inactive.',
      404
    );
  }

  // Atomic update prevents two staff members from claiming
  // the same unassigned lead at the same time.
  const updatedLead = await Lead.findOneAndUpdate(
    {
      _id: leadId,
      assignedSalesStaffId: isUnassigned ? null : user.id,
    },
    {
      $set: {
        assignedSalesStaffId: targetUser._id,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();

  if (!updatedLead) {
    throw new AppError(
      'Lead assignment changed. Refresh and try again.',
      409
    );
  }

  return toLeadDTO(updatedLead);
}