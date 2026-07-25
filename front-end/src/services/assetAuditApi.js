import axiosInstance from './axiosInstance';
const api = { getAll(p) { return axiosInstance.get('/asset-audits', { params: p }).then((r) => r.data); }, getById(id) { return axiosInstance.get(`/asset-audits/${id}`).then((r) => r.data); }, getNextNumber() { return axiosInstance.get('/asset-audits/next-number').then((r) => r.data); }, create(d) { return axiosInstance.post('/asset-audits', d).then((r) => r.data); }, del(id) { return axiosInstance.delete(`/asset-audits/${id}`).then((r) => r.data); } };
export default api;
