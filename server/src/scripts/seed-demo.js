import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { connectDatabase } from '../config/database.js';
import User from '../modules/users/user.model.js';
import Lead from '../modules/leads/lead.model.js';
import PricingRule from '../modules/pricing/pricing-rule.model.js';
import SubsidyRule from '../modules/subsidies/subsidy-rule.model.js';
import GenerationRule from '../modules/generation/generation-rule.model.js';
import { qualifyLead } from '../modules/lead-scoring/lead-scoring.service.js';

const DEMO_SALES_EMAIL = process.env.DEMO_SALES_EMAIL ?? 'sales.demo@solarqualify.local';
const DEMO_SALES_PASSWORD = process.env.DEMO_SALES_PASSWORD ?? 'SolarQualifyDemo!2026';
const DEMO_HOMEOWNER_EMAIL = process.env.DEMO_HOMEOWNER_EMAIL ?? 'homeowner.demo@solarqualify.local';
const DEMO_HOMEOWNER_PASSWORD = process.env.DEMO_HOMEOWNER_PASSWORD ?? 'SolarHomeownerDemo!2026';
const EFFECTIVE_FROM = new Date('2026-01-01T00:00:00.000Z');

async function upsertDemoUser({ name, email, password, role, phone }) {
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Demo passwords must be 12–72 UTF-8 bytes.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  return User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: { name, email: email.toLowerCase(), passwordHash, role, phone, isActive: true },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function upsertRule(Model, ruleName, version, values) {
  return Model.findOneAndUpdate(
    { ruleName, version },
    { $set: { ruleName, version, ...values } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function seedLead(salesStaff, sample) {
  const lead = await Lead.findOneAndUpdate(
    { referenceId: sample.referenceId },
    {
      $set: {
        assignedSalesStaffId: salesStaff._id,
        homeownerId: null,
        customerName: sample.customerName,
        email: sample.email,
        phone: sample.phone,
        propertyAddress: 'Synthetic demonstration property, Nagpur, Maharashtra',
        pincode: '000000',
        propertyType: 'residential',
        ownership: sample.ownership,
        roofType: sample.roofType,
        roofAreaSqFt: sample.roofAreaSqFt,
        sanctionedLoad: null,
        sanctionedLoadUnit: null,
        monthlyElectricityBill: sample.monthlyElectricityBill,
        monthlyUnits: sample.monthlyUnits,
        consent: true,
        status: 'new',
      },
      $setOnInsert: { referenceId: sample.referenceId },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  const qualification = await qualifyLead(
    { id: String(salesStaff._id), role: 'salesStaff' },
    String(lead._id)
  );

  return { referenceId: lead.referenceId, score: qualification.leadScore, priority: qualification.priority };
}

async function main() {
  if (env.NODE_ENV === 'production') {
    throw new Error('The demo seeder is disabled in production. Create reviewer accounts and data through a private, controlled process.');
  }

  await connectDatabase();

  const salesStaff = await upsertDemoUser({
    name: 'SolarQualify Demo Sales',
    email: DEMO_SALES_EMAIL,
    password: DEMO_SALES_PASSWORD,
    role: 'salesStaff',
    phone: '0000000001',
  });

  await upsertDemoUser({
    name: 'SolarQualify Demo Homeowner',
    email: DEMO_HOMEOWNER_EMAIL,
    password: DEMO_HOMEOWNER_PASSWORD,
    role: 'homeowner',
    phone: '0000000002',
  });

  await upsertRule(PricingRule, 'DEMO ONLY - Illustrative Equipment Pricing', 1, {
    pricePerKW: 65000,
    installationCharges: 15000,
    effectiveFrom: EFFECTIVE_FROM,
    effectiveTo: null,
    status: 'active',
    createdBy: salesStaff._id,
  });

  await upsertRule(SubsidyRule, 'DEMO ONLY - Client Brief Subsidy (Unverified)', 1, {
    slabs: [
      { upToKW: 2, amountPerKW: 30000 },
      { upToKW: 3, amountPerKW: 18000 },
    ],
    maximumSubsidy: 78000,
    effectiveFrom: EFFECTIVE_FROM,
    effectiveTo: null,
    verificationStatus: 'unverified',
    status: 'active',
    createdBy: salesStaff._id,
  });

  await upsertRule(GenerationRule, 'DEMO ONLY - 1,400 Units per kW per Year', 1, {
    unitsPerKWPerYear: 1400,
    effectiveFrom: EFFECTIVE_FROM,
    effectiveTo: null,
    status: 'active',
    createdBy: salesStaff._id,
  });

  const samples = [
    {
      referenceId: 'LD-30881',
      customerName: 'Prashant Wankhede',
      email: 'prashant.demo@example.test',
      phone: '0000000301',
      ownership: 'owner',
      monthlyElectricityBill: 3200,
      monthlyUnits: 340,
      roofType: 'RCC Flat Roof',
      roofAreaSqFt: 900,
    },
    {
      referenceId: 'LD-30902',
      customerName: 'Rohit Meshram',
      email: 'rohit.demo@example.test',
      phone: '0000000302',
      ownership: 'tenant',
      monthlyElectricityBill: 1900,
      monthlyUnits: 210,
      roofType: 'Tiled Roof',
      roofAreaSqFt: 700,
    },
    {
      referenceId: 'LD-30915',
      customerName: 'Ayesha Siddiqui',
      email: 'ayesha.demo@example.test',
      phone: '0000000303',
      ownership: 'owner',
      monthlyElectricityBill: 650,
      monthlyUnits: 85,
      roofType: 'Metal Sheet',
      roofAreaSqFt: 450,
    },
  ];

  const results = [];
  for (const sample of samples) {
    results.push(await seedLead(salesStaff, sample));
  }

  console.log('SolarQualify synthetic demo data seeded successfully.');
  console.log('Sales Staff:', DEMO_SALES_EMAIL);
  console.log('Homeowner:', DEMO_HOMEOWNER_EMAIL);
  console.table(results);
  console.log('Demo pricing is illustrative; subsidy remains unverified and is therefore excluded from quotations until an authorised reviewer verifies the rule.');
}

main()
  .catch((error) => {
    console.error('Demo seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
