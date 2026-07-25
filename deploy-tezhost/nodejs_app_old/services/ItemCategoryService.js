const itemCategoryRepository = require('../repositories/ItemCategoryRepository');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');

class ItemCategoryService {
  /**
   * Build a nested tree structure from flat list of categories
   */
  buildTree(categories, parentId = null) {
    return categories
      .filter(c => {
        const cat = c.toJSON ? c.toJSON() : c;
        return cat.parentCategoryId === parentId;
      })
      .map(category => {
        const plain = category.toJSON ? category.toJSON() : category;
        const children = this.buildTree(categories, plain.id);
        return {
          ...plain,
          children: children.length > 0 ? children : [],
        };
      });
  }

  async getAllCategories(tenantId, { isActive, tree = false, page, limit } = {}) {
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true' || isActive === true;

    if (tree) {
      const categories = await itemCategoryRepository.findAll(tenantId, filters, {
        order: [['name', 'ASC']],
      });
      return this.buildTree(categories);
    }

    if (page && limit) {
      return await itemCategoryRepository.findAndCountAll(tenantId, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        filters,
        order: [['name', 'ASC']],
      });
    }

    return await itemCategoryRepository.findAll(tenantId, filters, {
      order: [['name', 'ASC']],
    });
  }

  async getCategoryById(id, tenantId) {
    const category = await itemCategoryRepository.findById(id, tenantId);
    if (!category) {
      throw new NotFoundError('Item category not found');
    }
    return category;
  }

  async getCategoryTree(tenantId) {
    const categories = await itemCategoryRepository.findTree(tenantId);
    return this.buildTree(categories);
  }

  async getRootCategories(tenantId) {
    return await itemCategoryRepository.findRoots(tenantId);
  }

  async getChildCategories(parentCategoryId, tenantId) {
    // Verify parent exists
    const parent = await itemCategoryRepository.findById(parentCategoryId, tenantId);
    if (!parent) {
      throw new NotFoundError('Parent category not found');
    }
    return await itemCategoryRepository.findChildren(parentCategoryId, tenantId);
  }

  async createCategory(data, tenantId, userId) {
    // Validate name uniqueness within tenant
    const existing = await itemCategoryRepository.findByName(data.name, tenantId);
    if (existing) {
      throw new ConflictError(`Category name "${data.name}" already exists in this tenant`);
    }

    // If parentCategoryId provided, verify parent exists and is within same tenant
    if (data.parentCategoryId) {
      const parent = await itemCategoryRepository.findById(data.parentCategoryId, tenantId);
      if (!parent) {
        throw new BadRequestError('Parent category not found');
      }
      // Prevent self-referencing
      if (data.parentCategoryId === data.id) {
        throw new BadRequestError('A category cannot be its own parent');
      }
    }

    const category = await itemCategoryRepository.create(data, tenantId, userId);
    logger.info(`Item category created: ${category.name} by user ${userId}`);
    return category;
  }

  async updateCategory(id, data, tenantId, userId) {
    const category = await itemCategoryRepository.findById(id, tenantId);
    if (!category) {
      throw new NotFoundError('Item category not found');
    }

    // If changing name, validate uniqueness
    if (data.name && data.name !== category.name) {
      const existing = await itemCategoryRepository.findByName(data.name, tenantId);
      if (existing) {
        throw new ConflictError(`Category name "${data.name}" already exists`);
      }
    }

    // Prevent circular parent reference
    if (data.parentCategoryId) {
      if (data.parentCategoryId === id) {
        throw new BadRequestError('A category cannot be its own parent');
      }
      // Verify parent exists
      const parent = await itemCategoryRepository.findById(data.parentCategoryId, tenantId);
      if (!parent) {
        throw new BadRequestError('Parent category not found');
      }
      // Prevent setting a descendant as parent (circular)
      const descendants = await itemCategoryRepository.findWithDescendants(id, tenantId);
      const descendantIds = descendants.map(d => d.id);
      if (descendantIds.includes(data.parentCategoryId)) {
        throw new BadRequestError('Cannot set a child category as parent');
      }
    }

    // If parentCategoryId is explicitly null, allow removing the parent
    if (data.parentCategoryId === null) {
      data.parentCategoryId = null;
    }

    const updated = await itemCategoryRepository.update(id, data, tenantId, userId);
    logger.info(`Item category updated: ${id} by user ${userId}`);
    return updated;
  }

  async deleteCategory(id, tenantId) {
    const category = await itemCategoryRepository.findById(id, tenantId);
    if (!category) {
      throw new NotFoundError('Item category not found');
    }

    // Check for children
    const children = await itemCategoryRepository.findChildren(id, tenantId);
    if (children.length > 0) {
      throw new BadRequestError('Cannot delete category with child categories. Remove or reassign children first.');
    }

    await itemCategoryRepository.delete(id, tenantId, false);
    logger.info(`Item category deleted: ${id} (${category.name}) from tenant ${tenantId}`);
    return true;
  }

  async toggleStatus(id, tenantId, userId) {
    const category = await itemCategoryRepository.findById(id, tenantId);
    if (!category) {
      throw new NotFoundError('Item category not found');
    }

    const updated = await itemCategoryRepository.update(
      id,
      { isActive: !category.isActive },
      tenantId,
      userId
    );
    logger.info(
      `Item category ${category.name} ${updated.isActive ? 'activated' : 'deactivated'} by user ${userId}`
    );
    return updated;
  }
}

module.exports = new ItemCategoryService();