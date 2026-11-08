import {
  assignLead,
  createLead,
  getLeadById,
  getLeads,
  getLeadsOverview,
  updateLead,
} from './lead.service.js';

export async function createLeadController(req, res) {
  const lead = await createLead(req.user, req.body);

  return res.status(201).json({
    success: true,
    message: 'Lead created successfully.',
    data: { lead },
  });
}

export async function getLeadsController(req, res) {
  const result = await getLeads(req.user, req.query);

  return res.status(200).json({
    success: true,
    message: 'Leads retrieved successfully.',
    data: result,
  });
}

export async function getLeadsOverviewController(req, res) {
  const overview = await getLeadsOverview(req.user);

  return res.status(200).json({
    success: true,
    message: 'Lead overview retrieved successfully.',
    data: overview,
  });
}

export async function getLeadByIdController(req, res) {
  const lead = await getLeadById(req.user, req.params.leadId);

  return res.status(200).json({
    success: true,
    message: 'Lead retrieved successfully.',
    data: { lead },
  });
}

export async function updateLeadController(req, res) {
  const lead = await updateLead(
    req.user,
    req.params.leadId,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: 'Lead updated successfully.',
    data: { lead },
  });
}

export async function assignLeadController(req, res) {
  const lead = await assignLead(
    req.user,
    req.params.leadId,
    req.body?.salesStaffId
  );

  return res.status(200).json({
    success: true,
    message: 'Lead assigned successfully.',
    data: { lead },
  });
}