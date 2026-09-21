import api from './api';

class SystemConfigApi {
  /**
   * Get all system configs grouped by category with reference data
   */
  static async getAll() {
    const response = await api.get('/settings');
    return response.data;
  }

  /**
   * Get reference data (accounts, warehouses, etc.)
   */
  static async getReferences() {
    const response = await api.get('/settings/references');
    return response.data;
  }

  /**
   * Save all configs
   * @param {object} configs - { category: { key: value } }
   */
  static async saveConfigs(configs) {
    const response = await api.put('/settings', { configs });
    return response.data;
  }

  /**
   * Save email settings
   */
  static async saveEmailSettings(data) {
    const response = await api.put('/settings/email', data);
    return response.data;
  }

  /**
   * Test email connection
   * @param {string} recipientEmail - Email to send the test to
   */
  static async testEmail(recipientEmail) {
    const response = await api.post('/settings/email/test', { recipientEmail });
    return response.data;
  }

  /**
   * Get number series
   */
  static async getNumberSeries() {
    const response = await api.get('/settings/number-series');
    return response.data;
  }

  /**
   * Save number series
   */
  static async saveNumberSeries(series) {
    const response = await api.put('/settings/number-series', { series });
    return response.data;
  }

  /**
   * Reset settings to defaults
   */
  static async resetToDefaults(category) {
    const response = await api.delete('/settings/reset', { params: { category } });
    return response.data;
  }

  /**
   * Get all VAT category codes
   */
  static async getVatCategoryCodes() {
    const response = await api.get('/settings/vat-codes');
    return response.data;
  }

  /**
   * Create or update a VAT category code
   * @param {object} data - { id?, code, name, description }
   */
  static async saveVatCategoryCode(data) {
    const method = data.id ? 'put' : 'post';
    const response = await api[method]('/settings/vat-codes', data);
    return response.data;
  }

  /**
   * Delete a VAT category code
   * @param {number} id
   */
  static async deleteVatCategoryCode(id) {
    const response = await api.delete(`/settings/vat-codes/${id}`);
    return response.data;
  }

  /**
   * Get all item definitions (model, size, ram, etc.)
   */
  static async getItemDefinitions() {
    const response = await api.get('/settings/definitions');
    return response.data;
  }

  /**
   * Create or update an item definition
   * @param {object} data - { id?, category, name, sortOrder }
   */
  static async saveItemDefinition(data) {
    const method = data.id ? 'put' : 'post';
    const response = await api[method]('/settings/definitions', data);
    return response.data;
  }

  /**
   * Delete an item definition
   * @param {number} id
   */
  static async deleteItemDefinition(id) {
    const response = await api.delete(`/settings/definitions/${id}`);
    return response.data;
  }
}

export default SystemConfigApi;
