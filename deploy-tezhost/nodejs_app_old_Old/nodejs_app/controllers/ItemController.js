const itemService = require('../services/ItemService');
const ItemDTO = require('../dto/ItemDTO');
const ApiResponse = require('../utils/apiResponse');

class ItemController {
  /**
   * GET /api/items
   * Get all items with pagination and filters
   */
  async getItems(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const query = req.query;

      const result = await itemService.getItems(tenantId, query);

      return ApiResponse.paginated(res, {
        data: ItemDTO.toCompactListResponse(result.rows),
        pagination: result.pagination,
        message: 'Items retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/items/:id
   * Get item by ID
   */
  async getItemById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const item = await itemService.getItemById(id, tenantId);
      return ApiResponse.success(res, {
        data: ItemDTO.toResponse(item),
        message: 'Item retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/items
   * Create a new item
   */
  async createItem(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      const item = await itemService.createItem(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: ItemDTO.toResponse(item),
        message: 'Item created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/items/:id
   * Update an item
   */
  async updateItem(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;

      const item = await itemService.updateItem(id, req.body, tenantId, userId);
      return ApiResponse.success(res, {
        data: ItemDTO.toResponse(item),
        message: 'Item updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/items/:id
   * Delete an item
   */
  async deleteItem(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      await itemService.deleteItem(id, tenantId);
      return ApiResponse.success(res, {
        message: 'Item deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/items/:id/toggle-status
   * Toggle active/inactive status
   */
  async toggleItemStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;

      const item = await itemService.toggleStatus(id, tenantId, userId);
      return ApiResponse.success(res, {
        data: ItemDTO.toResponse(item),
        message: 'Item status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ItemController();