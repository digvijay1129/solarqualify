import {
  createRuleVersion,
  getRuleVersions,
  getRuleVersion,
  updateRuleStatus,
  verifySubsidyRule,
} from './rule-management.service.js';

export async function createRuleVersionController(req, res) {
  const rule = await createRuleVersion(
    req.user,
    req.params.ruleType,
    req.body
  );

  return res.status(201).json({
    success: true,
    message: 'Business rule version created successfully.',
    data: { rule },
  });
}

export async function getRuleVersionsController(req, res) {
  const result = await getRuleVersions(
    req.user,
    req.params.ruleType,
    req.query
  );

  return res.status(200).json({
    success: true,
    message: 'Business rule versions retrieved successfully.',
    data: result,
  });
}

export async function getRuleVersionController(req, res) {
  const rule = await getRuleVersion(
    req.user,
    req.params.ruleType,
    req.params.ruleId
  );

  return res.status(200).json({
    success: true,
    message: 'Business rule version retrieved successfully.',
    data: { rule },
  });
}

export async function updateRuleStatusController(req, res) {
  const rule = await updateRuleStatus(
    req.user,
    req.params.ruleType,
    req.params.ruleId,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: 'Business rule status updated successfully.',
    data: { rule },
  });
}

export async function verifySubsidyRuleController(req, res) {
  const rule = await verifySubsidyRule(
    req.user,
    req.params.ruleId,
    req.body
  );

  return res.status(200).json({
    success: true,
    message: 'Subsidy rule verification completed successfully.',
    data: { rule },
  });
}
