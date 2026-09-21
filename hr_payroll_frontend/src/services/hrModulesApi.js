import hrApi from './hrApi';

const HRModulesApi = {
  performanceGoals: { list: (p) => hrApi.get('/performance-goals', { params: p }), create: (d) => hrApi.post('/performance-goals', d), update: (id, d) => hrApi.put(`/performance-goals/${id}`, d), delete: (id) => hrApi.delete(`/performance-goals/${id}`) },
  performanceKpis: { list: (p) => hrApi.get('/performance-kpis', { params: p }), create: (d) => hrApi.post('/performance-kpis', d), update: (id, d) => hrApi.put(`/performance-kpis/${id}`, d), delete: (id) => hrApi.delete(`/performance-kpis/${id}`) },
  performanceAppraisals: { list: (p) => hrApi.get('/performance-appraisals', { params: p }), create: (d) => hrApi.post('/performance-appraisals', d), update: (id, d) => hrApi.put(`/performance-appraisals/${id}`, d), delete: (id) => hrApi.delete(`/performance-appraisals/${id}`) },
  trainingCourses: { list: (p) => hrApi.get('/training-courses', { params: p }), create: (d) => hrApi.post('/training-courses', d), update: (id, d) => hrApi.put(`/training-courses/${id}`, d), delete: (id) => hrApi.delete(`/training-courses/${id}`) },
  trainingSessions: { list: (p) => hrApi.get('/training-sessions', { params: p }), create: (d) => hrApi.post('/training-sessions', d), update: (id, d) => hrApi.put(`/training-sessions/${id}`, d), delete: (id) => hrApi.delete(`/training-sessions/${id}`) },
  trainingAttendees: { list: (p) => hrApi.get('/training-attendees', { params: p }), create: (d) => hrApi.post('/training-attendees', d), update: (id, d) => hrApi.put(`/training-attendees/${id}`, d), delete: (id) => hrApi.delete(`/training-attendees/${id}`) },
  jobPositions: { list: (p) => hrApi.get('/job-positions', { params: p }), create: (d) => hrApi.post('/job-positions', d), update: (id, d) => hrApi.put(`/job-positions/${id}`, d), delete: (id) => hrApi.delete(`/job-positions/${id}`) },
  jobApplicants: { list: (p) => hrApi.get('/job-applicants', { params: p }), create: (d) => hrApi.post('/job-applicants', d), update: (id, d) => hrApi.put(`/job-applicants/${id}`, d), delete: (id) => hrApi.delete(`/job-applicants/${id}`) },
  interviews: { list: (p) => hrApi.get('/interviews', { params: p }), create: (d) => hrApi.post('/interviews', d), update: (id, d) => hrApi.put(`/interviews/${id}`, d), delete: (id) => hrApi.delete(`/interviews/${id}`) },
  offerLetters: { list: (p) => hrApi.get('/offer-letters', { params: p }), create: (d) => hrApi.post('/offer-letters', d), update: (id, d) => hrApi.put(`/offer-letters/${id}`, d), delete: (id) => hrApi.delete(`/offer-letters/${id}`) },
  onboardingChecklists: { list: (p) => hrApi.get('/onboarding-checklists', { params: p }), create: (d) => hrApi.post('/onboarding-checklists', d), update: (id, d) => hrApi.put(`/onboarding-checklists/${id}`, d), delete: (id) => hrApi.delete(`/onboarding-checklists/${id}`) },
  onboardingProgress: { list: (p) => hrApi.get('/onboarding-progress', { params: p }), initialize: (employeeId) => hrApi.post('/onboarding-progress/initialize', { employeeId }), update: (id, d) => hrApi.put(`/onboarding-progress/${id}`, d) },
  offboardingChecklists: { list: (p) => hrApi.get('/offboarding-checklists', { params: p }), create: (d) => hrApi.post('/offboarding-checklists', d), update: (id, d) => hrApi.put(`/offboarding-checklists/${id}`, d), delete: (id) => hrApi.delete(`/offboarding-checklists/${id}`) },
  offboardingProgress: { list: (p) => hrApi.get('/offboarding-progress', { params: p }), initialize: (employeeId) => hrApi.post('/offboarding-progress/initialize', { employeeId }), update: (id, d) => hrApi.put(`/offboarding-progress/${id}`, d) },
  exitInterviews: { list: (p) => hrApi.get('/exit-interviews', { params: p }), create: (d) => hrApi.post('/exit-interviews', d), update: (id, d) => hrApi.put(`/exit-interviews/${id}`, d), delete: (id) => hrApi.delete(`/exit-interviews/${id}`) },
};

export default HRModulesApi;
