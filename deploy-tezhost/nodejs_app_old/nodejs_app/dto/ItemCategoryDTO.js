class ItemCategoryDTO {
  static toResponse(category) {
    if (!category) return null;

    const data = category.toJSON ? category.toJSON() : category;

    return {
      id: data.id,
      tenantId: data.tenantId,
      name: data.name,
      description: data.description,
      parentCategoryId: data.parentCategoryId,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      // Include parent summary if populated
      parent: data.parent
        ? { id: data.parent.id, name: data.parent.name }
        : null,
      // Children not included in flat response unless explicitly requested
    };
  }

  static toListResponse(categories) {
    if (!categories) return [];
    return categories.map(category => ItemCategoryDTO.toResponse(category));
  }

  /**
   * Build nested tree structure from flat list of categories
   */
  static toTreeResponse(categories, parentId = null) {
    if (!categories) return [];

    return categories
      .filter(c => {
        const cat = c.toJSON ? c.toJSON() : c;
        return cat.parentCategoryId === parentId;
      })
      .map(category => {
        const plain = category.toJSON ? category.toJSON() : category;
        const children = ItemCategoryDTO.toTreeResponse(categories, plain.id);
        return {
          ...ItemCategoryDTO.toResponse(plain),
          children: children.length > 0 ? children : [],
        };
      });
  }

  /**
   * Returns a flat hierarchy representation with level indicator
   */
  static toHierarchyList(categories, parentId = null, level = 0) {
    if (!categories) return [];

    const result = [];

    const roots = categories.filter(c => {
      const cat = c.toJSON ? c.toJSON() : c;
      return cat.parentCategoryId === parentId;
    });

    roots.forEach(category => {
      const plain = category.toJSON ? category.toJSON() : category;
      result.push({
        ...ItemCategoryDTO.toResponse(plain),
        level,
        children: [],
      });

      const descendants = ItemCategoryDTO.toHierarchyList(categories, plain.id, level + 1);
      result.push(...descendants);
    });

    return result;
  }
}

module.exports = ItemCategoryDTO;