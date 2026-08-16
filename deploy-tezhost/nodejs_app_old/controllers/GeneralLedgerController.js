const generalLedgerService = require('../services/GeneralLedgerService');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * GeneralLedgerController
 *
 * Handles HTTP requests for the General Ledger module.
 * All endpoints require JWT authentication and RBAC permissions.
 */
class GeneralLedgerController {
  /**
   * GET /api/general-ledger
   *
   * Query Parameters:
   *   - accountId      (UUID, optional)
   *   - dateFrom       (YYYY-MM-DD, optional)
   *   - dateTo         (YYYY-MM-DD, optional)
   *   - accountType    (asset|liability|equity|revenue|expense, optional)
   *   - journalNumber  (string, optional)
   *   - referenceNumber(string, optional)
   *   - page           (integer, default: 1)
   *   - limit          (integer, default: 50)
   *
   * Response:
   *   {
   *     success: true,
   *     message: "General ledger retrieved successfully",
   *     data: {
   *       account: { id, code, name, type, parentAccountId },
   *       openingBalance: number,
   *       totalDebit: number,
   *       totalCredit: number,
   *       closingBalance: number,
   *       transactions: [...],
   *       pagination: { page, limit, total, totalPages, hasNext, hasPrev }
   *     }
   *   }
   */
  async getGeneralLedger(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { accountId, dateFrom, dateTo, accountType, journalNumber, referenceNumber, page, limit } = req.query;

      const result = await generalLedgerService.getGeneralLedger(
        tenantId,
        {
          accountId,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          accountType: accountType || null,
          journalNumber: journalNumber || null,
          referenceNumber: referenceNumber || null,
        },
        {
          page: page || 1,
          limit: limit || 50,
        }
      );

      ApiResponse.success(res, {
        message: 'General ledger retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/general-ledger/accounts
   *
   * Returns the list of active accounts for the ledger account dropdown filter.
   *
   * Query Parameters:
   *   - type (optional) - Filter accounts by type
   */
  async getLedgerAccounts(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { type } = req.query;

      const accounts = await generalLedgerService.getLedgerAccounts(tenantId, {
        type: type || null,
      });

      ApiResponse.success(res, {
        message: 'Ledger accounts retrieved successfully',
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/general-ledger/account/:accountId/hierarchy
   *
   * Returns a single account along with its child account hierarchy.
   * Useful for displaying which child accounts are included when viewing a parent.
   */
  async getAccountHierarchy(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { accountId } = req.params;

      const result = await generalLedgerService.getAccountWithHierarchy(accountId, tenantId);

      ApiResponse.success(res, {
        message: 'Account hierarchy retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/general-ledger/export
   *
   * Exports the full ledger (unpaginated) for the given filters.
   * Returns all transactions in the date range for client-side Excel/PDF export.
   */
  async exportLedger(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { accountId, dateFrom, dateTo, accountType, journalNumber, referenceNumber } = req.query;

      // Fetch all records without pagination (up to a safe maximum)
      const result = await generalLedgerService.getGeneralLedger(
        tenantId,
        {
          accountId,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          accountType: accountType || null,
          journalNumber: journalNumber || null,
          referenceNumber: referenceNumber || null,
        },
        {
          page: 1,
          limit: 10000, // Safe ceiling for exports
        }
      );

      ApiResponse.success(res, {
        message: 'General ledger export data retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GeneralLedgerController();