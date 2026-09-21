import axiosInstance from './axiosInstance';

const tenantApi = {
  /**
   * Get current tenant / company profile
   */
  getMyTenant: async () => {
    const { data } = await axiosInstance.get('/tenant/my');
    return data;
  },

  /**
   * Update company profile
   * @param {Object} payload - Fields to update
   */
  updateMyTenant: async (payload) => {
    const { data } = await axiosInstance.put('/tenant/my', payload);
    return data;
  },

  /**
   * Upload company logo
   * @param {FormData} formData - Form data with 'logo' field
   */
  uploadLogo: async (formData) => {
    const { data } = await axiosInstance.put('/tenant/my/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /**
   * Remove company logo
   */
  removeLogo: async () => {
    const { data } = await axiosInstance.delete('/tenant/my/logo');
    return data;
  },
};

export default tenantApi;
