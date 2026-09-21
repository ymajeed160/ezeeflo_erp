const axios = require('axios');
const BASE = 'http://localhost:5001/api/hr';
const tenantId = '11111111-1111-1111-1111-111111111111';

const headers = { 'Content-Type': 'application/json', 'x-tenant-id': tenantId };

// Read token from environment or first arg
const token = process.argv[2];
if (!token) { console.log('Usage: node _seed_allowance_deduction.js <JWT_TOKEN>'); process.exit(1); }
const h = { ...headers, 'Authorization': `Bearer ${token}` };

const allowanceTypes = [
  { code: 'HRA', name: 'Housing Allowance', allowanceCategory: 'Housing', isTaxable: false, isActive: true },
  { code: 'TRA', name: 'Transport Allowance', allowanceCategory: 'Transport', isTaxable: false, isActive: true },
  { code: 'MA', name: 'Medical Allowance', allowanceCategory: 'Medical', isTaxable: false, isActive: true },
  { code: 'DA', name: 'Dearness Allowance', allowanceCategory: 'CostofLiving', isTaxable: true, isActive: true },
  { code: 'SPA', name: 'Special Allowance', allowanceCategory: 'Other', isTaxable: true, isActive: true },
];

const deductionTypes = [
  { code: 'LOAN', name: 'Loan Repayment', deductionCategory: 'Loan', isActive: true },
  { code: 'PF', name: 'Provident Fund', deductionCategory: 'Retirement', isEmployee: true, isActive: true },
  { code: 'INS', name: 'Medical Insurance', deductionCategory: 'Insurance', isEmployee: true, isActive: true },
  { code: 'ABS', name: 'Absent Deduction', deductionCategory: 'Attendance', isActive: true },
  { code: 'TAX', name: 'Income Tax', deductionCategory: 'Tax', isActive: true },
];

async function seed() {
  console.log('Seeding allowance types...');
  for (const at of allowanceTypes) {
    try {
      const r = await axios.post(`${BASE}/allowance-types`, at, { headers: h });
      console.log(`  ✅ ${at.code}: ${at.name}`);
    } catch (e) {
      if (e.response?.status === 409) console.log(`  ⚠️ ${at.code}: Already exists`);
      else console.log(`  ❌ ${at.code}: ${e.response?.data?.message || e.message}`);
    }
  }

  console.log('\nSeeding deduction types...');
  for (const dt of deductionTypes) {
    try {
      const r = await axios.post(`${BASE}/deduction-types`, dt, { headers: h });
      console.log(`  ✅ ${dt.code}: ${dt.name}`);
    } catch (e) {
      if (e.response?.status === 409) console.log(`  ⚠️ ${dt.code}: Already exists`);
      else console.log(`  ❌ ${dt.code}: ${e.response?.data?.message || e.message}`);
    }
  }

  console.log('\nDone!');
}

seed().catch(console.error);
