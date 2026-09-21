import hrApi from './hrApi';

const MasterDataApi = {
  // Countries
  getCountries: (params) => hrApi.get('/master-data/countries', { params }),
  createCountry: (data) => hrApi.post('/master-data/countries', data),
  updateCountry: (id, data) => hrApi.put(`/master-data/countries/${id}`, data),
  deleteCountry: (id) => hrApi.delete(`/master-data/countries/${id}`),

  // States
  getStates: (params) => hrApi.get('/master-data/states', { params }),
  createState: (data) => hrApi.post('/master-data/states', data),
  updateState: (id, data) => hrApi.put(`/master-data/states/${id}`, data),
  deleteState: (id) => hrApi.delete(`/master-data/states/${id}`),
  // Cities
  getCities: (params) => hrApi.get('/master-data/cities', { params }),
  createCity: (data) => hrApi.post('/master-data/cities', { name: data.name, stateId: data.stateId || null, countryId: data.countryId, nameAr: data.nameAr || null, isActive: data.isActive, sortOrder: data.sortOrder || 0 }),
  updateCity: (id, data) => hrApi.put(`/master-data/cities/${id}`, { name: data.name, stateId: data.stateId || null, countryId: data.countryId, nameAr: data.nameAr || null, isActive: data.isActive, sortOrder: data.sortOrder || 0 }),
  deleteCity: (id) => hrApi.delete(`/master-data/cities/${id}`),
  // Generic master data
  getData: (type, params) => hrApi.get('/master-data/data', { params: { type, ...params } }),
  createData: (data) => hrApi.post('/master-data/data', data),
  updateData: (id, data) => hrApi.put(`/master-data/data/${id}`, data),
  deleteData: (id) => hrApi.delete(`/master-data/data/${id}`),

  // Audit
  getAuditLogs: (params) => hrApi.get('/master-data/audit', { params }),
};

export default MasterDataApi;
