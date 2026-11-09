import {
  createProjectFromAcceptedQuotation,
  listProjects,
  getProject,
  updateProjectStatus,
  issuePublicProjectStatusToken,
  revokePublicProjectStatusToken,
  getPublicProjectStatus,
} from './project.service.js';

export async function createProjectFromQuotationController(req, res) {
  const project = await createProjectFromAcceptedQuotation(
    req.user,
    req.params.quotationId
  );
  return res.status(201).json({
    success: true,
    message: 'Project created from accepted quotation.',
    data: { project },
  });
}

export async function listProjectsController(req, res) {
  const result = await listProjects(req.user, req.query);
  return res.status(200).json({
    success: true,
    message: 'Projects retrieved successfully.',
    data: result,
  });
}

export async function getProjectController(req, res) {
  const project = await getProject(req.user, req.params.projectId);
  return res.status(200).json({
    success: true,
    message: 'Project retrieved successfully.',
    data: { project },
  });
}

export async function updateProjectStatusController(req, res) {
  const project = await updateProjectStatus(
    req.user,
    req.params.projectId,
    req.body
  );
  return res.status(200).json({
    success: true,
    message: 'Project status updated successfully.',
    data: { project },
  });
}

export async function issuePublicProjectStatusTokenController(req, res) {
  const result = await issuePublicProjectStatusToken(req.user, req.params.projectId);
  return res.status(201).json({
    success: true,
    message: 'Public project status link issued. Copy the token now; it will not be shown again.',
    data: result,
  });
}

export async function revokePublicProjectStatusTokenController(req, res) {
  const result = await revokePublicProjectStatusToken(req.user, req.params.projectId);
  return res.status(200).json({
    success: true,
    message: 'Public project status link revoked.',
    data: result,
  });
}

export async function getPublicProjectStatusController(req, res) {
  const result = await getPublicProjectStatus(req.params.token);
  res.set({
    'Cache-Control': 'private, no-store, max-age=0',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow',
  });
  return res.status(200).json({
    success: true,
    message: 'Public project status retrieved successfully.',
    data: result,
  });
}
