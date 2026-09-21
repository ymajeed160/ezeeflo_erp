import supplierApi from '../services/supplierApi';
import customerApi from '../services/customerApi';
import itemApi from '../services/itemApi';
import itemCategoryApi from '../services/itemCategoryApi';
import warehouseApi from '../services/warehouseApi';
import accountApi from '../services/accountApi';
import assetCategoryApi from '../services/assetCategoryApi';

// Random, human-friendly code suffix (avoids ambiguous chars like 0/O/1/I).
const rand = (len = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

const toStr = (v) => (v === undefined || v === null ? '' : String(v).trim());

const ACCOUNT_TYPES = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
];

const ITEM_TYPES = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
];

const DEPRECIATION_METHODS = [
  { value: 'straight_line', label: 'Straight Line' },
  { value: 'declining_balance', label: 'Declining Balance' },
  { value: 'double_declining_balance', label: 'Double Declining Balance' },
  { value: 'units_of_production', label: 'Units of Production' },
  { value: 'manual', label: 'Manual' },
];

/**
 * Central registry for the Global Quick Create feature.
 *
 * Each entity describes:
 *  - label          : display name for the modal title / button tooltip
 *  - permission     : RBAC code required to show the [+] button
 *  - api            : existing master-data service (must expose `create`)
 *  - fields         : minimal form fields (name/label/type/required/options)
 *  - buildPayload   : builds the create payload (auto-generates required codes)
 *  - labelOf        : how to display the entity in dropdowns
 *
 * All create APIs resolve to the axios body ({ success, data: entity }), so the
 * created record is available at `result.data`.
 */
export const QUICK_CREATE_ENTITIES = {
  supplier: {
    key: 'supplier',
    label: 'Supplier',
    permission: 'supplier.create',
    api: supplierApi,
    fields: [
      { name: 'name', label: 'Supplier Name', type: 'text', required: true },
      { name: 'contactPerson', label: 'Contact Person', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
    ],
    buildPayload: (values) => ({
      code: `SUP-${rand()}`,
      name: toStr(values.name),
      contactPerson: toStr(values.contactPerson) || null,
      phone: toStr(values.phone) || null,
      email: toStr(values.email) || null,
      status: 'active',
    }),
    labelOf: (e) => e?.name || '',
  },

  customer: {
    key: 'customer',
    label: 'Customer',
    permission: 'customer.create',
    api: customerApi,
    fields: [
      { name: 'name', label: 'Customer Name', type: 'text', required: true },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
    ],
    buildPayload: (values) => ({
      code: `CUS-${rand()}`,
      name: toStr(values.name),
      phone: toStr(values.phone) || null,
      email: toStr(values.email) || null,
      status: 'active',
    }),
    labelOf: (e) => e?.name || '',
  },

  item: {
    key: 'item',
    label: 'Item',
    permission: 'item.create',
    api: itemApi,
    fields: [
      { name: 'name', label: 'Item Name', type: 'text', required: true },
      { name: 'itemType', label: 'Type', type: 'select', required: true, options: ITEM_TYPES, defaultValue: 'product' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'unitOfMeasure', label: 'Unit of Measure', type: 'text', defaultValue: 'pcs' },
      { name: 'costPrice', label: 'Purchase Price', type: 'number' },
      { name: 'sellingPrice', label: 'Sales Price', type: 'number' },
      { name: 'taxPercentage', label: 'Tax %', type: 'number' },
    ],
    buildPayload: (values) => ({
      itemCode: `ITM-${rand()}`,
      name: toStr(values.name),
      itemType: values.itemType || 'product',
      description: toStr(values.description) || null,
      unitOfMeasure: toStr(values.unitOfMeasure) || 'pcs',
      costPrice: values.costPrice === '' || values.costPrice == null ? 0 : Number(values.costPrice),
      sellingPrice: values.sellingPrice === '' || values.sellingPrice == null ? 0 : Number(values.sellingPrice),
      taxPercentage: values.taxPercentage === '' || values.taxPercentage == null ? 0 : Number(values.taxPercentage),
      isInventoryTracked: values.itemType === 'service' ? false : true,
    }),
    labelOf: (e) => e?.name || '',
  },

  itemCategory: {
    key: 'itemCategory',
    label: 'Item Category',
    permission: 'category.create',
    api: itemCategoryApi,
    fields: [
      { name: 'name', label: 'Category Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'text' },
    ],
    buildPayload: (values) => ({
      name: toStr(values.name),
      description: toStr(values.description) || null,
    }),
    labelOf: (e) => e?.name || '',
  },

  warehouse: {
    key: 'warehouse',
    label: 'Warehouse',
    permission: 'warehouse.create',
    api: warehouseApi,
    fields: [
      { name: 'name', label: 'Warehouse Name', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text' },
    ],
    buildPayload: (values) => ({
      code: `WH-${rand()}`,
      name: toStr(values.name),
      location: toStr(values.location) || null,
    }),
    labelOf: (e) => e?.name || '',
  },

  account: {
    key: 'account',
    label: 'Account',
    permission: 'chart-of-accounts.create',
    api: accountApi,
    fields: [
      { name: 'name', label: 'Account Name', type: 'text', required: true },
      { name: 'type', label: 'Account Type', type: 'select', required: true, options: ACCOUNT_TYPES },
      { name: 'description', label: 'Description', type: 'text' },
    ],
    buildPayload: (values) => ({
      code: `ACC-${rand()}`,
      name: toStr(values.name),
      type: values.type,
      description: toStr(values.description) || null,
    }),
    labelOf: (e) => e?.name || '',
  },

  assetCategory: {
    key: 'assetCategory',
    label: 'Asset Category',
    permission: 'fixedasset.create',
    api: assetCategoryApi,
    fields: [
      { name: 'categoryName', label: 'Category Name', type: 'text', required: true },
      { name: 'usefulLifeYears', label: 'Useful Life (Years)', type: 'number', required: true, defaultValue: 5 },
      { name: 'depreciationMethod', label: 'Depreciation Method', type: 'select', required: true, options: DEPRECIATION_METHODS, defaultValue: 'straight_line' },
      { name: 'residualValuePercentage', label: 'Residual Value %', type: 'number' },
    ],
    buildPayload: (values) => ({
      categoryCode: `AC-${rand()}`,
      categoryName: toStr(values.categoryName),
      usefulLifeYears: values.usefulLifeYears === '' || values.usefulLifeYears == null ? 5 : Number(values.usefulLifeYears),
      depreciationMethod: values.depreciationMethod || 'straight_line',
      residualValuePercentage: values.residualValuePercentage === '' || values.residualValuePercentage == null ? 0 : Number(values.residualValuePercentage),
    }),
    labelOf: (e) => e?.categoryName || '',
  },
};

export default QUICK_CREATE_ENTITIES;
