import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const projectService = vi.hoisted(() => ({
  createProjectFromAcceptedQuotation: vi.fn(),
  listProjects: vi.fn(),
  getProject: vi.fn(),
  updateProjectStatus: vi.fn(),
  issuePublicProjectStatusToken: vi.fn(),
  revokePublicProjectStatusToken: vi.fn(),
  getPublicProjectStatus: vi.fn(),
}));

vi.mock('../src/modules/projects/project.service.js', () => ({ ...projectService }));
vi.mock('../src/modules/users/user.model.js', () => ({
  default: { findById: vi.fn() },
}));

import User from '../src/modules/users/user.model.js';
import { env } from '../src/config/env.js';
import app from '../src/app.js';

const HOMEOWNER_ID = '507f1f77bcf86cd799439011';
const STAFF_ID = '507f1f77bcf86cd799439012';
const LEAD_ID = '507f1f77bcf86cd799439014';
const QUOTATION_ID = '507f1f77bcf86cd799439015';
const PROJECT_ID = '507f1f77bcf86cd799439016';
const PUBLIC_TOKEN = 'a'.repeat(43);

function token(id, role = 'homeowner') {
  return jwt.sign({ role }, env.JWT_SECRET, {
    subject: id,
    expiresIn: '1h',
    issuer: 'solarqualify-api',
  });
}
function auth(id, role = 'homeowner') {
  return { Authorization: 'Bearer ' + token(id, role) };
}
function mockUser(id, role) {
  User.findById.mockReturnValue({
    select: vi.fn().mockResolvedValue({
      _id: { toString: () => id },
      name: 'Test User',
      email: 'test@example.com',
      role,
      phone: '9876543210',
      isActive: true,
    }),
  });
}

const project = {
  id: PROJECT_ID,
  leadId: LEAD_ID,
  quotationId: QUOTATION_ID,
  currentStage: 'site_survey',
  projectStatus: 'active',
  milestones: [],
  history: [],
};

describe('Project HTTP API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication to list projects', async () => {
    await request(app).get('/api/v1/projects').expect(401);
    expect(projectService.listProjects).not.toHaveBeenCalled();
  });

  it('allows a homeowner to list only service-authorized projects', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    projectService.listProjects.mockResolvedValue({
      projects: [project],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });

    const response = await request(app)
      .get('/api/v1/projects')
      .set(auth(HOMEOWNER_ID))
      .expect(200);

    expect(response.body.data.projects[0].id).toBe(PROJECT_ID);
    expect(projectService.listProjects).toHaveBeenCalledWith(
      expect.objectContaining({ id: HOMEOWNER_ID, role: 'homeowner' }),
      {}
    );
  });

  it('allows assigned Sales Staff to retrieve a project', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    projectService.getProject.mockResolvedValue(project);

    const response = await request(app)
      .get('/api/v1/projects/' + PROJECT_ID)
      .set(auth(STAFF_ID, 'salesStaff'))
      .expect(200);

    expect(response.body.data.project.currentStage).toBe('site_survey');
  });

  it('requires Sales Staff to create a project from an accepted quotation', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    projectService.createProjectFromAcceptedQuotation.mockResolvedValue(project);

    const response = await request(app)
      .post('/api/v1/quotations/' + QUOTATION_ID + '/project')
      .set(auth(STAFF_ID, 'salesStaff'))
      .send({})
      .expect(201);

    expect(response.body.data.project.id).toBe(PROJECT_ID);
    expect(projectService.createProjectFromAcceptedQuotation).toHaveBeenCalledWith(
      expect.objectContaining({ id: STAFF_ID, role: 'salesStaff' }),
      QUOTATION_ID
    );
  });

  it('prevents homeowners from creating a project from a quotation', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');

    await request(app)
      .post('/api/v1/quotations/' + QUOTATION_ID + '/project')
      .set(auth(HOMEOWNER_ID))
      .send({})
      .expect(403);

    expect(projectService.createProjectFromAcceptedQuotation).not.toHaveBeenCalled();
  });

  it('allows Sales Staff to update project milestones', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    projectService.updateProjectStatus.mockResolvedValue({
      ...project,
      currentStage: 'system_design',
    });

    const response = await request(app)
      .patch('/api/v1/projects/' + PROJECT_ID + '/status')
      .set(auth(STAFF_ID, 'salesStaff'))
      .send({
        stage: 'site_survey',
        milestoneStatus: 'completed',
        note: 'Survey approved.',
      })
      .expect(200);

    expect(response.body.data.project.currentStage).toBe('system_design');
  });

  it('prevents homeowners from changing project status', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');

    await request(app)
      .patch('/api/v1/projects/' + PROJECT_ID + '/status')
      .set(auth(HOMEOWNER_ID))
      .send({ projectStatus: 'on_hold', note: 'Please pause.' })
      .expect(403);

    expect(projectService.updateProjectStatus).not.toHaveBeenCalled();
  });

  it('allows an authorized user to issue a public status token', async () => {
    mockUser(HOMEOWNER_ID, 'homeowner');
    projectService.issuePublicProjectStatusToken.mockResolvedValue({
      token: PUBLIC_TOKEN,
      path: '/api/v1/public/project-status/' + PUBLIC_TOKEN,
      expiresAt: new Date('2027-02-07T00:00:00.000Z'),
      rotated: false,
    });

    const response = await request(app)
      .post('/api/v1/projects/' + PROJECT_ID + '/public-status-token')
      .set(auth(HOMEOWNER_ID))
      .expect(201);

    expect(response.body.data.token).toBe(PUBLIC_TOKEN);
  });

  it('allows an authorized user to revoke a public status token', async () => {
    mockUser(STAFF_ID, 'salesStaff');
    projectService.revokePublicProjectStatusToken.mockResolvedValue({
      projectId: PROJECT_ID,
      revoked: true,
    });

    const response = await request(app)
      .delete('/api/v1/projects/' + PROJECT_ID + '/public-status-token')
      .set(auth(STAFF_ID, 'salesStaff'))
      .expect(200);

    expect(response.body.data.revoked).toBe(true);
  });

  it('provides the limited public project status without requiring JWT authentication', async () => {
    projectService.getPublicProjectStatus.mockResolvedValue({
      projectReference: 'SQP-439015',
      currentStage: 'installation_in_progress',
      projectStatus: 'active',
      milestones: [{ stage: 'site_survey', status: 'completed' }],
      lastUpdatedAt: new Date('2026-11-09T00:00:00.000Z'),
    });

    const response = await request(app)
      .get('/api/v1/public/project-status/' + PUBLIC_TOKEN)
      .expect(200);

    expect(response.body.data.projectReference).toBe('SQP-439015');
    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(projectService.getPublicProjectStatus).toHaveBeenCalledWith(PUBLIC_TOKEN);
  });
});
