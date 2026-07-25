import axiosInstance from './axiosInstance';

const journalEntryApi = {
  getAll: async (params = {}) => {
    const { data } = await axiosInstance.get('/journal-entries', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await axiosInstance.get(`/journal-entries/${id}`);
    return data;
  },
  getByNumber: async (entryNumber) => {
    const { data } = await axiosInstance.get(`/journal-entries/number/${entryNumber}`);
    return data;
  },
  create: async (entryData) => {
    const { data } = await axiosInstance.post('/journal-entries', entryData);
    return data;
  },
  update: async (id, entryData) => {
    const { data } = await axiosInstance.put(`/journal-entries/${id}`, entryData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/journal-entries/${id}`);
    return data;
  },
  post: async (id) => {
    const { data } = await axiosInstance.post(`/journal-entries/${id}/post`);
    return data;
  },
  reverse: async (id) => {
    const { data } = await axiosInstance.post(`/journal-entries/${id}/reverse`);
    return data;
  },
  getNextReference: async () => {
    const { data } = await axiosInstance.get('/journal-entries/next-reference');
    return data;
  },
};

export default journalEntryApi;
