import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import Project from '../src/modules/projects/project.model.js';

describe('Project Model', () => {
  const validProject = () => ({
    leadId: new mongoose.Types.ObjectId(),
    quotationId: new mongoose.Types.ObjectId(),
    homeownerId: new mongoose.Types.ObjectId(),
    customerSnapshot: {
      customerName: 'Test Homeowner',
      email: 'homeowner@example.com',
      phone: '9876543210',
      propertyAddress: 'Pune, Maharashtra',
      propertyType: 'residential',
    },
    quotationSnapshot: {
      quotationNumber: 'SQ-12345678',
      systemCapacityKW: 3,
      estimatedAnnualGeneration: 4200,
      netInstallationCost: 127000,
      applicableSubsidy: 78000,
    },
  });

  it('should create a valid project with default values', async () => {
    const project = new Project(validProject());

    await expect(project.validate()).resolves.toBeUndefined();

    expect(project.currentStage).toBe('site_survey');
    expect(project.projectStatus).toBe('active');
    expect(project.milestoneHistory).toEqual([]);
    expect(project.projectDocuments).toEqual([]);
  });

  it('should accept valid milestone and document records', async () => {
    const project = new Project({
      ...validProject(),
      milestoneHistory: [
        {
          stage: 'site_survey',
          status: 'completed',
          note: 'Site survey completed.',
          updatedBy: new mongoose.Types.ObjectId(),
        },
      ],
      projectDocuments: [
        {
          documentType: 'other',
          documentKey: 'private/projects/document.pdf',
          originalFileName: 'document.pdf',
          contentType: 'application/pdf',
          uploadedBy: new mongoose.Types.ObjectId(),
        },
      ],
    });

    await expect(project.validate()).resolves.toBeUndefined();
    expect(project.milestoneHistory).toHaveLength(1);
    expect(project.projectDocuments).toHaveLength(1);
  });

  it('stores append-only project events and hides token lifecycle fields', () => {
    expect(Project.schema.path('statusTokenHash').options.select).toBe(false);
    expect(Project.schema.path('statusTokenIssuedAt').options.select).toBe(false);
    expect(Project.schema.path('statusTokenExpiresAt').options.select).toBe(false);
    expect(Project.schema.path('statusTokenRevokedAt').options.select).toBe(false);

    const project = new Project({
      ...validProject(),
      projectHistory: [{
        eventType: 'project_created',
        toStage: 'site_survey',
        toProjectStatus: 'active',
        note: 'Created from accepted quotation.',
      }],
    });

    expect(project.projectHistory).toHaveLength(1);
    expect(project.projectHistory[0].eventType).toBe('project_created');
  });

  it('should reject a project without a lead ID', async () => {
    const data = validProject();
    delete data.leadId;

    const project = new Project(data);

    await expect(project.validate()).rejects.toHaveProperty('errors.leadId');
  });

  it('should reject a project without a quotation ID', async () => {
    const data = validProject();
    delete data.quotationId;

    const project = new Project(data);

    await expect(project.validate()).rejects.toHaveProperty(
      'errors.quotationId'
    );
  });

  it('should reject an unsupported current stage', async () => {
    const project = new Project({
      ...validProject(),
      currentStage: 'payment_completed',
    });

    await expect(project.validate()).rejects.toHaveProperty(
      'errors.currentStage'
    );
  });

  it('should reject an unsupported project status', async () => {
    const project = new Project({
      ...validProject(),
      projectStatus: 'pending',
    });

    await expect(project.validate()).rejects.toHaveProperty(
      'errors.projectStatus'
    );
  });

  it('should reject an unsupported milestone stage', async () => {
    const project = new Project({
      ...validProject(),
      milestoneHistory: [
        {
          stage: 'unsupported_stage',
          status: 'completed',
        },
      ],
    });

    const validationError = await project.validate().catch((error) => error);

    expect(
      validationError.errors['milestoneHistory.0.stage']
    ).toBeDefined();
  });

  it('should reject a project document without an uploader ID', async () => {
    const project = new Project({
      ...validProject(),
      projectDocuments: [
        {
          documentType: 'other',
          documentKey: 'private/projects/document.pdf',
        },
      ],
    });

    const validationError = await project.validate().catch((error) => error);

    expect(
      validationError.errors['projectDocuments.0.uploadedBy']
    ).toBeDefined();
  });

  it('should exclude statusTokenHash from query results by default', () => {
    expect(Project.schema.path('statusTokenHash').options.select).toBe(false);
  });
});
