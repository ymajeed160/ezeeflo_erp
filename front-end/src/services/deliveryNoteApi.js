import axiosInstance from './axiosInstance';

const deliveryNoteApi = {
  /**
   * List delivery notes with pagination
   */
  list: async (params = {}) => {
    const response = await axiosInstance.get('/delivery-notes', { params });
    return response.data;
  },

  /**
   * Get delivery note by ID
   */
  getById: async (id) => {
    const response = await axiosInstance.get(`/delivery-notes/${id}`);
    return response.data;
  },

  /**
   * Get next delivery number
   */
  getNextNumber: async () => {
    const response = await axiosInstance.get('/delivery-notes/next-number');
    return response.data;
  },

  /**
   * Create delivery note
   */
  create: async (data) => {
    const response = await axiosInstance.post('/delivery-notes', data);
    return response.data;
  },

  /**
   * Generate delivery note from sales order
   */
  generateFromSalesOrder: async (data) => {
    const response = await axiosInstance.post('/delivery-notes/generate-from-sales-order', data);
    return response.data;
  },

  /**
   * Update delivery note
   */
  update: async (id, data) => {
    const response = await axiosInstance.put(`/delivery-notes/${id}`, data);
    return response.data;
  },

  /**
   * Delete delivery note
   */
  delete: async (id) => {
    const response = await axiosInstance.delete(`/delivery-notes/${id}`);
    return response.data;
  },

  /**
   * Update delivery note status
   */
  updateStatus: async (id, status) => {
    const response = await axiosInstance.patch(`/delivery-notes/${id}/status`, { status });
    return response.data;
  },

  /**
   * Generate sales invoice from a delivered delivery note
   */
  generateInvoice: async (id) => {
    const response = await axiosInstance.post(`/sales-invoices/from-delivery-note/${id}`);
    return response.data;
  },
};

export default deliveryNoteApi;