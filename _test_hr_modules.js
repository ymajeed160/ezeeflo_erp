const axios = require('axios');
const BASE = 'http://localhost:5001/api/hr';
const tenantId = '11111111-1111-1111-1111-111111111111';

const headers = {
  'Content-Type': 'application/json',
  'x-tenant-id': tenantId,
};

// Use a valid JWT token from the session
const authHeaders = (token) => ({ ...headers, 'Authorization': `Bearer ${token}` });

function getToken() {
  // Read from process arg or env
  return process.env.HR_TOKEN || '';
}

async function test() {
  if (!process.argv[2]) {
    console.log('Usage: node _test_hr_modules.js <JWT_TOKEN>');
    console.log('Get token from browser localStorage: localStorage.getItem("token")');
    return;
  }
  const token = process.argv[2];
  const h = authHeaders(token);
  
  const results = {};
  const test = async (name, fn) => {
    try { const r = await fn(); results[name] = `✅ ${r}`; } catch(e) { results[name] = `❌ ${e.response?.status || e.code}: ${e.response?.data?.message || e.message}`; }
  };

  // Get employee ID first
  let employeeId, courseId, sessionId, positionId, applicantId;
  
  console.log('Fetching existing data...');
  const empRes = await axios.get(`${BASE}/employees`, { headers: h, params: { limit: 1 } });
  employeeId = empRes.data?.data?.data?.[0]?.id || empRes.data?.data?.[0]?.id;
  console.log('Employee:', employeeId);

  const courseRes = await axios.get(`${BASE}/training-courses`, { headers: h, params: { limit: 1 } });
  courseId = courseRes.data?.data?.data?.[0]?.id || courseRes.data?.data?.[0]?.id;
  console.log('Course:', courseId);

  // Test Training Attendees
  await test('Create Attendee', async () => {
    const r = await axios.post(`${BASE}/training-attendees`, { employeeId, sessionId: courseId, attendanceStatus: 'Enrolled' }, { headers: h });
    return `Created: ${r.data?.data?.id || 'OK'}`;
  });

  // Test Recruitment - Position
  await test('Create Position', async () => {
    const r = await axios.post(`${BASE}/job-positions`, { positionCode: 'POS-TEST', title: 'Test Position', vacancies: 2, minExperience: 2 }, { headers: h });
    if (r.data?.data?.id) positionId = r.data.data.id;
    return `Created: ${positionId || 'OK'}`;
  });

  // Test Recruitment - Applicant  
  await test('Create Applicant', async () => {
    if (!positionId) { const pRes = await axios.get(`${BASE}/job-positions`, { headers: h, params: { limit: 1 } }); positionId = pRes.data?.data?.data?.[0]?.id || pRes.data?.data?.[0]?.id; }
    const r = await axios.post(`${BASE}/job-applicants`, { positionId, firstName: 'Test', lastName: 'Applicant', email: 'test@test.com', source: 'Website' }, { headers: h });
    if (r.data?.data?.id) applicantId = r.data.data.id;
    return `Created: ${applicantId || 'OK'}`;
  });

  // Test Recruitment - Interview
  await test('Create Interview', async () => {
    if (!applicantId) { const aRes = await axios.get(`${BASE}/job-applicants`, { headers: h, params: { limit: 1 } }); applicantId = aRes.data?.data?.data?.[0]?.id || aRes.data?.data?.[0]?.id; }
    const r = await axios.post(`${BASE}/interviews`, { applicantId, interviewDate: '2026-08-05', interviewType: 'InPerson', roundNumber: 1 }, { headers: h });
    return `Created: ${r.data?.data?.id || 'OK'}`;
  });

  // Test Recruitment - Offer Letter
  await test('Create Offer Letter', async () => {
    if (!applicantId) { const aRes = await axios.get(`${BASE}/job-applicants`, { headers: h, params: { limit: 1 } }); applicantId = aRes.data?.data?.data?.[0]?.id || aRes.data?.data?.[0]?.id; }
    if (!positionId) { const pRes = await axios.get(`${BASE}/job-positions`, { headers: h, params: { limit: 1 } }); positionId = pRes.data?.data?.data?.[0]?.id || pRes.data?.data?.[0]?.id; }
    const r = await axios.post(`${BASE}/offer-letters`, { applicantId, positionId, offerDate: '2026-08-10', offeredSalary: 50000 }, { headers: h });
    return `Created: ${r.data?.data?.id || 'OK'}`;
  });

  // Test Onboarding Checklist
  await test('Create Onb Checklist', async () => {
    const r = await axios.post(`${BASE}/onboarding-checklists`, { taskName: 'Setup Laptop', category: 'IT', sortOrder: 1 }, { headers: h });
    return `Created: ${r.data?.data?.id || 'OK'}`;
  });

  // Test Offboarding Checklist
  await test('Create Offb Checklist', async () => {
    const r = await axios.post(`${BASE}/offboarding-checklists`, { taskName: 'Return Assets', category: 'AssetReturn', sortOrder: 1 }, { headers: h });
    return `Created: ${r.data?.data?.id || 'OK'}`;
  });

  // Test Exit Interview
  await test('Create Exit Interview', async () => {
    const r = await axios.post(`${BASE}/exit-interviews`, { employeeId, interviewDate: '2026-08-15', reasonForLeaving: 'Better opportunity', rehireRecommendation: true }, { headers: h });
    return `Created: ${r.data?.data?.id || 'OK'}`;
  });

  // Test existing data - Sessions
  await test('List Sessions', async () => {
    const r = await axios.get(`${BASE}/training-sessions`, { headers: h, params: { limit: 1 } });
    const count = r.data?.data?.total || r.data?.data?.data?.length || r.data?.data?.length || 0;
    return `Found ${count} sessions`;
  });

  // Test existing data - Goals
  await test('List Goals', async () => {
    const r = await axios.get(`${BASE}/performance-goals`, { headers: h, params: { limit: 1 } });
    const count = r.data?.data?.total || r.data?.data?.data?.length || r.data?.data?.length || 0;
    return `Found ${count} goals`;
  });

  // Summary
  console.log('\n========== TEST RESULTS ==========');
  Object.entries(results).forEach(([name, result]) => console.log(`${result}  ${name}`));
  const passCount = Object.values(results).filter(r => r.startsWith('✅')).length;
  const failCount = Object.values(results).filter(r => r.startsWith('❌')).length;
  console.log(`\n${passCount} passed, ${failCount} failed out of ${Object.keys(results).length}`);
}

test().catch(console.error);
