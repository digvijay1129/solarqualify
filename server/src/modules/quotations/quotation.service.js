import mongoose from 'mongoose';
import Lead from '../leads/lead.model.js';
import Quotation from './quotation.model.js';
import { createSolarCalculation } from '../solar-calculations/solar-calculation.service.js';
import { generateQuotationPdf, getQuotationPdfFileName } from '../../infrastructure/pdf/quotation-pdf.service.js';
import { AppError } from '../../shared/errors/AppError.js';

const MAX_HISTORY_LIMIT = 50;

function requireUser(user, write = false) {
  const roles = write ? ['salesStaff'] : ['homeowner','salesStaff'];
  if (!user || !mongoose.isValidObjectId(user.id) || !roles.includes(user.role)) {
    throw new AppError(write ? 'Only Sales Staff can generate quotations.' : 'You are not authorized to access quotations.', 403);
  }
}
function validateId(value, label) {
  if (!mongoose.isValidObjectId(value)) throw new AppError('Invalid ' + label + '.', 400);
}
function leadScope(user) {
  return user.role === 'homeowner' ? { homeownerId: user.id } : { assignedSalesStaffId: user.id };
}
function toDTO(q) {
  return {
    id: q._id?.toString?.() ?? String(q._id),
    leadId: q.leadId?.toString?.() ?? String(q.leadId),
    quotationNumber: q.quotationNumber ?? null,
    customerSnapshot: q.customerSnapshot ?? null,
    quotationStatus: q.quotationStatus,
    generatedAt: q.generatedAt ?? null,
    systemCapacityKW: q.systemCapacityKW,
    estimatedAnnualGeneration: q.estimatedAnnualGeneration,
    annualConsumptionUnits: q.annualConsumptionUnits ?? null,
    consumptionCoveragePercent: q.consumptionCoveragePercent ?? null,
    equipmentCost: q.equipmentCost ?? null,
    installationCharges: q.installationCharges ?? null,
    totalInstallationCost: q.totalInstallationCost,
    applicableSubsidy: q.applicableSubsidy,
    netInstallationCost: q.netInstallationCost,
    estimatedAnnualSavings: q.estimatedAnnualSavings ?? null,
    estimatedPaybackYears: q.estimatedPaybackYears ?? null,
    calculationVersion: q.calculationVersion,
    calculationReasons: q.calculationReasons ?? [],
    calculationInputs: q.calculationInputs ?? {},
    pricingSnapshot: q.pricingSnapshot,
    subsidySnapshot: q.subsidySnapshot ?? null,
    generationSnapshot: q.generationSnapshot,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}
async function accessibleLead(user, leadId) {
  const lead = await Lead.findOne({ _id: leadId, ...leadScope(user) }).lean();
  if (!lead) throw new AppError('Lead not found.', 404);
  return lead;
}
async function accessibleQuotation(user, quotationId) {
  const q = await Quotation.findById(quotationId).lean();
  if (!q) throw new AppError('Quotation not found.', 404);
  const lead = await Lead.findOne({ _id: q.leadId, ...leadScope(user) }).select('_id');
  if (!lead) throw new AppError('Quotation not found.', 404);
  return q;
}

export async function createQuotation(user, leadId, payload = {}) {
  requireUser(user, true);
  validateId(leadId, 'lead ID');
  const lead = await accessibleLead(user, leadId);
  if (lead.status !== 'qualified' || !Number.isFinite(lead.leadScore) || !lead.qualificationScoringVersion) {
    throw new AppError('The lead must be qualified and have a completed qualification score before a quotation can be generated.', 409);
  }
  const calculation = await createSolarCalculation(user, leadId, payload);
  const id = calculation.id;
  const number = 'SQ-' + String(id).slice(-8).toUpperCase();
  const updated = await Quotation.findOneAndUpdate(
    { _id: id, leadId: lead._id, createdBy: user.id, quotationStatus: 'draft' },
    { $set: {
      quotationNumber: number,
      customerSnapshot: {
        referenceId: lead.referenceId,
        customerName: lead.customerName,
        email: lead.email,
        phone: lead.phone,
        propertyAddress: lead.propertyAddress,
        propertyType: lead.propertyType,
      },
      generatedAt: new Date(),
      quotationStatus: 'generated',
    } },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) throw new AppError('The calculation was saved but could not be finalized as a quotation. Check its draft status before retrying.', 409);
  return toDTO(updated);
}

export async function getLeadQuotations(user, leadId, filters = {}) {
  requireUser(user);
  validateId(leadId, 'lead ID');
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) throw new AppError('Invalid quotation history filters.', 400);
  if (Object.keys(filters).some((key) => key !== 'limit')) throw new AppError('Unsupported quotation history filter.', 400);
  const limit = filters.limit === undefined ? 20 : Number(filters.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_HISTORY_LIMIT) throw new AppError('Quotation history limit must be an integer between 1 and 50.', 400);
  const lead = await accessibleLead(user, leadId);
  const items = await Quotation.find({ leadId: lead._id }).sort({ createdAt: -1, _id: -1 }).limit(limit).lean();
  return { quotations: items.map(toDTO), count: items.length, limit };
}
export async function getQuotation(user, quotationId) {
  requireUser(user);
  validateId(quotationId, 'quotation ID');
  return toDTO(await accessibleQuotation(user, quotationId));
}
export async function downloadQuotationPdf(user, quotationId) {
  requireUser(user);
  validateId(quotationId, 'quotation ID');
  const q = await accessibleQuotation(user, quotationId);
  if (q.quotationStatus === 'draft') throw new AppError('A draft calculation cannot be downloaded as a formal quotation.', 409);
  return { buffer: generateQuotationPdf(q), fileName: getQuotationPdfFileName(q), quotationNumber: q.quotationNumber ?? null };
}