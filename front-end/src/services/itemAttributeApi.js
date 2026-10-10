import axiosInstance from './axiosInstance';

const itemAttributeApi = {
  getAll(params = {}) {
    return axiosInstance.get('/item-attributes', { params }).then((res) => res.data);
  },
  getById(id) {
    return axiosInstance.get(`/item-attributes/${id}`).then((res) => res.data);
  },
  create(data) {
    return axiosInstance.post('/item-attributes', data).then((res) => res.data);
  },
  update(id, data) {
    return axiosInstance.put(`/item-attributes/${id}`, data).then((res) => res.data);
  },
  delete(id) {
    return axiosInstance.delete(`/item-attributes/${id}`).then((res) => res.data);
  },
};

export default itemAttributeApi;
