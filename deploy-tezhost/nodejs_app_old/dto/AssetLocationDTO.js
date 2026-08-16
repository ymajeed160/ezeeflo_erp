class AssetLocationDTO {
  static toResponse(d) { if (!d) return null; const data = d.toJSON ? d.toJSON() : d; return { id: data.id, tenantId: data.tenantId, locationCode: data.locationCode, locationName: data.locationName, locationType: data.locationType, parentId: data.parentId, parent: data.parent ? { id: data.parent.id, locationCode: data.parent.locationCode, locationName: data.parent.locationName } : null, children: data.children ? data.children.map((c) => ({ id: c.id, locationCode: c.locationCode, locationName: c.locationName, locationType: c.locationType })) : [], description: data.description, isActive: data.isActive, createdBy: data.createdBy, updatedBy: data.updatedBy, createdAt: data.createdAt, updatedAt: data.updatedAt }; }
  static toListResponse(items) { return items?.map((i) => AssetLocationDTO.toResponse(i)) || []; }
  static toCompactResponse(d) { if (!d) return null; const data = d.toJSON ? d.toJSON() : d; return { id: data.id, locationCode: data.locationCode, locationName: data.locationName, locationType: data.locationType }; }
  static toCompactListResponse(items) { return items?.map((i) => AssetLocationDTO.toCompactResponse(i)) || []; }
}
module.exports = AssetLocationDTO;
