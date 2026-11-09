import {
  createSolarCalculation,
  getSolarCalculations,
  getSolarCalculation,
} from './solar-calculation.service.js';

export async function createSolarCalculationController(req, res) {
  const calculation = await createSolarCalculation(
    req.user,
    req.params.leadId,
    req.body
  );

  return res.status(201).json({
    success: true,
    message: 'Solar calculation completed and saved as a draft quotation.',
    data: { calculation },
  });
}

export async function getSolarCalculationsController(req, res) {
  const result = await getSolarCalculations(
    req.user,
    req.params.leadId,
    req.query
  );

  return res.status(200).json({
    success: true,
    message: 'Solar calculation history retrieved successfully.',
    data: result,
  });
}

export async function getSolarCalculationController(req, res) {
  const calculation = await getSolarCalculation(
    req.user,
    req.params.leadId,
    req.params.calculationId
  );

  return res.status(200).json({
    success: true,
    message: 'Solar calculation retrieved successfully.',
    data: { calculation },
  });
}
