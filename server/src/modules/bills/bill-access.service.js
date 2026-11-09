
import mongoose from 'mongoose';
import Lead from '../leads/lead.model.js';
import { AppError } from '../../shared/errors/AppError.js';

/**
 * Resolve a lead only when the authenticated user is permitted
 * to access its sensitive electricity bill documents.
 *
 * Homeowner: must own the lead.
 * Sales Staff: must currently be assigned to the lead.
 *
 * Unassigned leads are deliberately excluded from bill access.
 */
export async function getAuthorizedBillLead(user, leadId) {
  if (
    !user ||
    !mongoose.isValidObjectId(user.id) ||
    !['homeowner', 'salesStaff'].includes(user.role)
  ) {
    throw new AppError(
      'You are not authorized to access bill documents.',
      403
    );
  }

  if (!mongoose.isValidObjectId(leadId)) {
    throw new AppError('Invalid lead ID.', 400);
  }

  const accessFilter =
    user.role === 'homeowner'
      ? { homeownerId: user.id }
      : { assignedSalesStaffId: user.id };

  const lead = await Lead.findOne({
    _id: leadId,
    ...accessFilter,
  })
    .select('_id homeownerId assignedSalesStaffId billAnalysisId')
    .lean();

  if (!lead) {
    throw new AppError('Lead not found.', 404);
  }

  return lead;
}
