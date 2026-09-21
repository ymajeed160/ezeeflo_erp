import axiosInstance from './axiosInstance';

const assetMaintenanceApi = {
  getAll(p) { return axiosInstance.get('/asset-maintenances', { params: p }).then((r) => r.data); },
  getById(id) { return axiosInstance.get(`/asset-maintenances/${id}`).then((r) => r.data); },
  getNextNumber() { return axiosInstance.get('/asset-maintenances/next-number').then((r) => r.data); },
  getDueReminders(days = 30) { return axiosInstance.get('/asset-maintenances/due-reminders', { params: { days } }).then((r) => r.data); },
  create(d) { return axiosInstance.post('/asset-maintenances', d).then((r) => r.data); },
  update(id, d) { return axiosInstance.put(`/asset-maintenances/${id}`, d).then((r) => r.data); },
  del(id) { return axiosInstance.delete(`/asset-maintenances/${id}`).then((r) => r.data); },
};

export default assetMaintenanceApi;
