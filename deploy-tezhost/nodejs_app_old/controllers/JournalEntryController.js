const journalEntryService = require('../services/JournalEntryService');
const { JournalEntryDTO, JournalEntryLineDTO } = require('../dto/JournalEntryDTO');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class JournalEntryController {
  async getAllEntries(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { page, limit, status, startDate, endDate } = req.query;

      const result = await journalEntryService.getAllEntries(tenantId, {
        page,
        limit,
        status,
        startDate,
        endDate,
      });

      if (result.pagination) {
        return ApiResponse.paginated(res, {
          data: JournalEntryDTO.toListResponse(result.rows),
          pagination: result.pagination,
        });
      }

      ApiResponse.success(res, {
        message: 'Journal entries retrieved successfully',
        data: JournalEntryDTO.toListResponse(result),
      });
    } catch (error) {
      next(error);
    }
  }

  async getEntryById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const entry = await journalEntryService.getEntryById(id, tenantId);
      ApiResponse.success(res, {
        message: 'Journal entry retrieved successfully',
        data: JournalEntryDTO.toResponse(entry),
      });
    } catch (error) {
      next(error);
    }
  }

  async getEntryByNumber(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { entryNumber } = req.params;

      const entry = await journalEntryService.getEntryByNumber(entryNumber, tenantId);
      ApiResponse.success(res, {
        message: 'Journal entry retrieved successfully',
        data: JournalEntryDTO.toResponse(entry),
      });
    } catch (error) {
      next(error);
    }
  }

  async createEntry(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      const entry = await journalEntryService.createEntry(req.body, tenantId, userId);
      ApiResponse.created(res, {
        message: 'Journal entry created successfully',
        data: JournalEntryDTO.toResponse(entry),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEntry(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;

      const entry = await journalEntryService.updateEntry(id, req.body, tenantId, userId);
      ApiResponse.success(res, {
        message: 'Journal entry updated successfully',
        data: JournalEntryDTO.toResponse(entry),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteEntry(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      await journalEntryService.deleteEntry(id, tenantId);
      ApiResponse.success(res, {
        message: 'Journal entry deleted successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async postEntry(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;

      const entry = await journalEntryService.postEntry(id, tenantId, userId);
      ApiResponse.success(res, {
        message: 'Journal entry posted successfully',
        data: JournalEntryDTO.toResponse(entry),
      });
    } catch (error) {
      next(error);
    }
  }

  async getNextReference(req, res, next) {
    try {
      const tenantId = req.user.tenantId;

      const reference = await journalEntryService.getNextReference(tenantId);
      ApiResponse.success(res, {
        message: 'Next reference number retrieved successfully',
        data: { reference },
      });
    } catch (error) {
      next(error);
    }
  }

  async reverseEntry(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;

      const reversal = await journalEntryService.reverseEntry(id, tenantId, userId);
      ApiResponse.created(res, {
        message: 'Journal entry reversed successfully',
        data: JournalEntryDTO.toResponse(reversal),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JournalEntryController();