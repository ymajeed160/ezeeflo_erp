'use strict';

class SellingResourceDTO {
  static toTypeResponse(record) {
    if (!record) return null;
    const json = record.toJSON ? record.toJSON() : record;
    return {
      id: json.id,
      typeCode: json.typeCode,
      typeName: json.typeName,
      description: json.description,
      isActive: json.isActive,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }

  static toResponse(record) {
    if (!record) return null;
    const json = record.toJSON ? record.toJSON() : record;
    return {
      id: json.id,
      resourceCode: json.resourceCode,
      resourceName: json.resourceName,
      resourceTypeId: json.resourceTypeId,
      resourceType: json.resourceType ? SellingResourceDTO.toTypeResponse(json.resourceType) : null,
      resourceTypeName: json.resourceType ? json.resourceType.typeName : '',
      description: json.description,
      isActive: json.isActive,
      createdBy: json.createdBy,
      updatedBy: json.updatedBy,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }

  static toListResponse(records) {
    return records.map(SellingResourceDTO.toResponse);
  }

  static toCompactResponse(record) {
    if (!record) return null;
    const json = record.toJSON ? record.toJSON() : record;
    return {
      id: json.id,
      resourceCode: json.resourceCode,
      resourceName: json.resourceName,
      resourceTypeId: json.resourceTypeId,
      resourceTypeName: json.resourceType ? json.resourceType.typeName : '',
      label: `${json.resourceCode} - ${json.resourceName}`,
    };
  }

  static toCompactListResponse(records) {
    return records.map(SellingResourceDTO.toCompactResponse);
  }
}

module.exports = SellingResourceDTO;
