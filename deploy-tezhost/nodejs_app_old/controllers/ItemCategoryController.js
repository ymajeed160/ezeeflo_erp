const itemCategoryService = require('../services/ItemCategoryService');
const ItemCategoryDTO = require('../dto/ItemCategoryDTO');
const ApiResponse = require('../utils/apiResponse');
const { StatusCodes } = require('http-status-codes');

class ItemCategoryController {
  /**
   * GET /api/item-categories
   * Get all categories (flat or tree)
   */
  async getAllCategories(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { isActive, tree, page, limit } = req.query;

      const categories = await itemCategoryService.getAllCategories(tenantId, { isActive, tree, page, limit });

      if (tree === 'true') {
        return ApiResponse.success(res, {
          data: categories,
          message: 'Categories tree retrieved successfully',
        });
      }

      if (page && limit) {
        return ApiResponse.paginated(res, {
          data: ItemCategoryDTO.toListResponse(categories.rows),
          pagination: categories.pagination,
          message: 'Categories retrieved successfully',
        });
      }

      return ApiResponse.success(res, {
        data: ItemCategoryDTO.toListResponse(categories),
        message: 'Categories retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/item-categories/:id
   * Get category by ID
   */
  async getCategoryById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      const category = await itemCategoryService.getCategoryById(id, tenantId);
      return ApiResponse.success(res, {
        data: ItemCategoryDTO.toResponse(category),
        message: 'Category retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/item-categories/tree
   * Get category tree structure
   */
  async getCategoryTree(req, res, next) {
    try {
      const tenantId = req.user.tenantId;

      const tree = await itemCategoryService.getCategoryTree(tenantId);
      return ApiResponse.success(res, {
        data: tree,
        message: 'Category tree retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/item-categories/roots
   * Get root categories (no parent)
   */
  async getRootCategories(req, res, next) {
    try {
      const tenantId = req.user.tenantId;

      const categories = await itemCategoryService.getRootCategories(tenantId);
      return ApiResponse.success(res, {
        data: ItemCategoryDTO.toListResponse(categories),
        message: 'Root categories retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/item-categories/:parentId/children
   * Get children of a category
   */
  async getChildCategories(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { parentId } = req.params;

      const categories = await itemCategoryService.getChildCategories(parentId, tenantId);
      return ApiResponse.success(res, {
        data: ItemCategoryDTO.toListResponse(categories),
        message: 'Child categories retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/item-categories
   * Create a new category
   */
  async createCategory(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      const category = await itemCategoryService.createCategory(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: ItemCategoryDTO.toResponse(category),
        message: 'Category created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/item-categories/:id
   * Update a category
   */
  async updateCategory(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;

      const category = await itemCategoryService.updateCategory(id, req.body, tenantId, userId);
      return ApiResponse.success(res, {
        data: ItemCategoryDTO.toResponse(category),
        message: 'Category updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/item-categories/:id
   * Delete a category
   */
  async deleteCategory(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const { id } = req.params;

      await itemCategoryService.deleteCategory(id, tenantId);
      return ApiResponse.success(res, {
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/item-categories/:id/toggle-status
   * Toggle active/inactive status
   */
  async toggleCategoryStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { id } = req.params;

      const category = await itemCategoryService.toggleStatus(id, tenantId, userId);
      return ApiResponse.success(res, {
        data: ItemCategoryDTO.toResponse(category),
        message: 'Category status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ItemCategoryController();