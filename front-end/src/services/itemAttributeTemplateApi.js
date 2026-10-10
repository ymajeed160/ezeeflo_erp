import axiosInstance from './axiosInstance';

const itemAttributeTemplateApi = {
  getAll(params = {}) {
    return axiosInstance.get('/item-attribute-templates', { params }).then((res) => res.data);
  },
  getById(id) {
    return axiosInstance.get(`/item-attribute-templates/${id}`).then((res) => res.data);
  },
  create(data) {
    return axiosInstance.post('/item-attribute-templates', data).then((res) => res.data);
  },
  update(id, data) {
    return axiosInstance.put(`/item-attribute-templates/${id}`, data).then((res) => res.data);
  },
  delete(id) {
    return axiosInstance.delete(`/item-attribute-templates/${id}`).then((res) => res.data);
  },
};

export default itemAttributeTemplateApi;
