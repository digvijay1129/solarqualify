import {
  getLeadQualification,
  qualifyLead,
} from './lead-scoring.service.js';

export async function qualifyLeadController(req, res) {
  const qualification = await qualifyLead(req.user, req.params.leadId);

  return res.status(200).json({
    success: true,
    message: 'Lead qualification completed successfully.',
    data: { qualification },
  });
}

export async function getLeadQualificationController(req, res) {
  const qualification = await getLeadQualification(req.user, req.params.leadId);

  return res.status(200).json({
    success: true,
    message: 'Lead qualification retrieved successfully.',
    data: { qualification },
  });
}
