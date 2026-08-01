import hrApi from './hrApi';

const BenefitsApi = {
  benefitTypes: { list: (p) => hrApi.get('/benefit-types', { params: p }), create: (d) => hrApi.post('/benefit-types', d), update: (id, d) => hrApi.put(`/benefit-types/${id}`, d), delete: (id) => hrApi.delete(`/benefit-types/${id}`) },
  employeeBenefits: { list: (p) => hrApi.get('/employee-benefits', { params: p }), create: (d) => hrApi.post('/employee-benefits', d), update: (id, d) => hrApi.put(`/employee-benefits/${id}`, d), delete: (id) => hrApi.delete(`/employee-benefits/${id}`) },
  eosbCalc: { list: (p) => hrApi.get('/eosb-calculations', { params: p }), calculate: (d) => hrApi.post('/eosb-calculations/calculate', d), update: (id, d) => hrApi.put(`/eosb-calculations/${id}`, d), delete: (id) => hrApi.delete(`/eosb-calculations/${id}`) },
  eosbSettle: { list: (p) => hrApi.get('/eosb-settlements', { params: p }), settle: (d) => hrApi.post('/eosb-settlements/settle', d), approve: (id) => hrApi.post(`/eosb-settlements/${id}/approve`), delete: (id) => hrApi.delete(`/eosb-settlements/${id}`) },
  wps: {
    list: (p) => hrApi.get('/wps', { params: p }), create: (d) => hrApi.post('/wps', d),
    update: (id, d) => hrApi.put(`/wps/${id}`, d), delete: (id) => hrApi.delete(`/wps/${id}`),
    setDefault: (id) => hrApi.post(`/wps/${id}/set-default`),
    generateExport: (d) => hrApi.post('/wps/generate-export', d),
  },
  ess: {
    list: (p) => hrApi.get('/ess-submissions', { params: p }), create: (d) => hrApi.post('/ess-submissions', d),
    update: (id, d) => hrApi.put(`/ess-submissions/${id}`, d),
    approve: (id) => hrApi.post(`/ess-submissions/${id}/approve`),
    reject: (id, remarks) => hrApi.post(`/ess-submissions/${id}/reject`, { remarks }),
  },
};

export default BenefitsApi;
