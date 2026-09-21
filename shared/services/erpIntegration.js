/**
 * ERP Integration Service
 * 
 * Handles all communication between the HR & Payroll system and the ERP.
 * All calls are READ-ONLY — HR never modifies ERP data.
 * 
 * Uses the ERP API with JWT token forwarding for authentication.
 */

const axios = require('axios');
const logger = require('../../hr_payroll_backend/utils/logger');

const ERP_API_URL = process.env.ERP_API_URL || 'http://localhost:5000/api';

class ErpIntegrationService {
  /**
   * Build headers for ERP API calls, forwarding the user's JWT token.
   */
  _buildHeaders(bearerToken) {
    const headers = { 'Content-Type': 'application/json' };
    if (bearerToken) {
      headers.Authorization = bearerToken.startsWith('Bearer ')
        ? bearerToken
        : `Bearer ${bearerToken}`;
    }
    return headers;
  }

  /**
   * Validate a user via ERP's /api/auth/me endpoint.
   * Returns user object or null.
   */
  async validateUser(token) {
    try {
      const response = await axios.get(`${ERP_API_URL}/auth/me`, {
        headers: this._buildHeaders(token),
        timeout: 5000,
      });
      return response.data?.data?.user || null;
    } catch (error) {
      logger.warn('ERP user validation failed:', { status: error.response?.status });
      return null;
    }
  }

  /**
   * Validate that a user has access to a company.
   * Checks via ERP's UserTenant association.
   */
  async validateCompanyAccess(userId, companyId, token) {
    try {
      // Use the companies listing to check access
      const response = await axios.get(`${ERP_API_URL}/companies`, {
        headers: this._buildHeaders(token),
        params: { limit: 100 },
        timeout: 5000,
      });

      const companies = response.data?.data || [];
      return companies.some(c => c.id === companyId);
    } catch (error) {
      // If ERP is unreachable, log and deny
      logger.error('ERP company validation failed:', { error: error.message });
      return false;
    }
  }

  /**
   * Check if a company has an active HR_PAYROLL module subscription.
   */
  async checkSubscriptionModule(companyId, moduleCode, token) {
    try {
      const response = await axios.get(
        `${ERP_API_URL}/superadmin/subscriptions/by-company/${companyId}`,
        {
          headers: this._buildHeaders(token),
          timeout: 5000,
        }
      );

      const subscription = response.data?.data;
      if (!subscription) return false;

      // Check subscription is active
      if (subscription.status !== 'active' && subscription.status !== 'trial') {
        return false;
      }

      // Check module is enabled
      const modules = subscription.modules || [];
      const hrModule = modules.find(
        m => (m.code || m.moduleCode) === moduleCode && m.isEnabled
      );

      return !!hrModule;
    } catch (error) {
      logger.error('ERP subscription check failed:', { error: error.message });
      return false;
    }
  }

  /**
   * Get company details from ERP.
   */
  async getCompany(companyId, token) {
    try {
      const response = await axios.get(`${ERP_API_URL}/companies/${companyId}`, {
        headers: this._buildHeaders(token),
        timeout: 5000,
      });
      return response.data?.data || null;
    } catch (error) {
      logger.error('ERP company fetch failed:', { error: error.message });
      return null;
    }
  }

  /**
   * Get list of companies accessible to the user.
   */
  async getCompanies(token) {
    try {
      const response = await axios.get(`${ERP_API_URL}/companies`, {
        headers: this._buildHeaders(token),
        params: { limit: 1000 },
        timeout: 5000,
      });
      return response.data?.data || [];
    } catch (error) {
      logger.error('ERP companies list failed:', { error: error.message });
      return [];
    }
  }

  /**
   * Send an audit event to ERP's audit service.
   */
  async sendAuditEvent(token, auditData) {
    try {
      await axios.post(`${ERP_API_URL}/audit`, auditData, {
        headers: this._buildHeaders(token),
        timeout: 3000,
      });
      return true;
    } catch (error) {
      logger.warn('ERP audit event failed:', { error: error.message });
      return false;
    }
  }

  /**
   * Get assets assigned to a specific employee from ERP Fixed Assets module.
   */
  async getEmployeeAssets(companyId, employeeId, token) {
    try {
      const response = await axios.get(`${ERP_API_URL}/assets`, {
        headers: { ...this._buildHeaders(token), 'X-Company-Id': companyId },
        params: { custodianId: employeeId, limit: 1000 },
        timeout: 5000,
      });
      return response.data?.data || [];
    } catch (error) {
      logger.warn('ERP assets fetch failed:', { error: error.message });
      return [];
    }
  }
}

// Singleton
module.exports = new ErpIntegrationService();
