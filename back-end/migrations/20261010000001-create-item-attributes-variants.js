'use strict';

/**
 * Configurable Item Variants & Dynamic Attributes — additive migration.
 *
 * Creates:
 *  - item_attributes
 *  - item_attribute_options
 *  - item_attribute_templates
 *  - item_attribute_template_attributes
 *  - item_variants
 *  - item_variant_attribute_values
 *
 * Alters:
 *  - items: add is_variant_enabled, attribute_template_id
 *  - inventory_transactions: add variant_id, reference_line_id
 *  - inventory_balances: add variant_id + widen unique key
 *  - purchase/sales/stock line tables: add variant_id, variant_description
 *
 * NOTE: Foreign key constraints are intentionally omitted on the new tables to
 * keep the migration portable across environments where UUID columns were
 * created with different collations (sync vs. migrations). Referential
 * integrity is enforced by service-level validation and unique indexes.
 */

const LINE_TABLES = [
  'purchase_request_details',
  'purchaseorderdetails',
  'goodsreceiptdetails',
  'purchaseinvoicedetails',
  'purchasereturndetails',
  'sales_order_details',
  'delivery_note_details',
  'sales_invoice_details',
  'sales_return_details',
  'stock_adjustment_details',
  'stock_transfer_details',
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ── item_attributes ────────────────────────────────────────────────
    await queryInterface.createTable('item_attributes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      code: { type: Sequelize.STRING(100), allowNull: false },
      data_type: {
        type: Sequelize.ENUM('dropdown', 'text', 'number'),
        allowNull: false,
        defaultValue: 'dropdown',
      },
      is_variant_defining: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      display_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('item_attributes', ['tenant_id'], { name: 'idx_item_attrs_tenant' });
    await queryInterface.addIndex('item_attributes', ['tenant_id', 'code'], { unique: true, name: 'unique_item_attr_code_tenant' });
    await queryInterface.addIndex('item_attributes', ['is_active'], { name: 'idx_item_attrs_active' });

    // ── item_attribute_options ─────────────────────────────────────────
    await queryInterface.createTable('item_attribute_options', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      attribute_id: { type: Sequelize.UUID, allowNull: false },
      value: { type: Sequelize.STRING(200), allowNull: false },
      display_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('item_attribute_options', ['attribute_id'], { name: 'idx_item_attr_options_attr' });
    await queryInterface.addIndex('item_attribute_options', ['attribute_id', 'value'], { unique: true, name: 'unique_item_attr_option_value' });

    // ── item_attribute_templates ───────────────────────────────────────
    await queryInterface.createTable('item_attribute_templates', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.STRING(255), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('item_attribute_templates', ['tenant_id'], { name: 'idx_item_attr_templates_tenant' });

    // ── item_attribute_template_attributes ─────────────────────────────
    await queryInterface.createTable('item_attribute_template_attributes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      template_id: { type: Sequelize.UUID, allowNull: false },
      attribute_id: { type: Sequelize.UUID, allowNull: false },
      is_required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      is_variant_defining: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      display_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('item_attribute_template_attributes', ['template_id'], { name: 'idx_item_attr_tpl_attrs_tpl' });
    await queryInterface.addIndex('item_attribute_template_attributes', ['template_id', 'attribute_id'], { unique: true, name: 'unique_item_attr_tpl_attr' });

    // ── item_variants ──────────────────────────────────────────────────
    await queryInterface.createTable('item_variants', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      item_id: { type: Sequelize.UUID, allowNull: false },
      sku: { type: Sequelize.STRING(100), allowNull: false },
      configuration_key: { type: Sequelize.STRING(255), allowNull: true },
      description: { type: Sequelize.STRING(500), allowNull: true },
      cost_price: { type: Sequelize.DECIMAL(18, 4), allowNull: true, defaultValue: 0 },
      selling_price: { type: Sequelize.DECIMAL(18, 4), allowNull: true, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('item_variants', ['tenant_id'], { name: 'idx_item_variants_tenant' });
    await queryInterface.addIndex('item_variants', ['item_id'], { name: 'idx_item_variants_item' });
    await queryInterface.addIndex('item_variants', ['tenant_id', 'sku'], { unique: true, name: 'unique_item_variant_sku_tenant' });
    await queryInterface.addIndex('item_variants', ['tenant_id', 'item_id', 'configuration_key'], { unique: true, name: 'unique_item_variant_config_tenant_item' });
    await queryInterface.addIndex('item_variants', ['item_id', 'is_active'], { name: 'idx_item_variants_item_active' });

    // ── item_variant_attribute_values ──────────────────────────────────
    await queryInterface.createTable('item_variant_attribute_values', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      tenant_id: { type: Sequelize.UUID, allowNull: false },
      variant_id: { type: Sequelize.UUID, allowNull: false },
      attribute_id: { type: Sequelize.UUID, allowNull: false },
      option_id: { type: Sequelize.UUID, allowNull: true },
      value: { type: Sequelize.STRING(500), allowNull: true },
      display_value: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('item_variant_attribute_values', ['variant_id'], { name: 'idx_item_var_attr_values_variant' });
    await queryInterface.addIndex('item_variant_attribute_values', ['variant_id', 'attribute_id'], { unique: true, name: 'unique_item_var_attr_value' });

    // ── items: variant flags ───────────────────────────────────────────
    await queryInterface.addColumn('items', 'is_variant_enabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('items', 'attribute_template_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addIndex('items', ['attribute_template_id'], { name: 'idx_item_attribute_template' });

    // ── inventory_transactions: variant identity ───────────────────────
    await queryInterface.addColumn('inventory_transactions', 'variant_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('inventory_transactions', 'reference_line_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addIndex('inventory_transactions', ['variant_id'], { name: 'idx_inv_trans_variant' });
    await queryInterface.addIndex('inventory_transactions', ['item_id', 'variant_id'], { name: 'idx_inv_trans_item_variant' });

    // ── inventory_balances: variant identity ───────────────────────────
    await queryInterface.addColumn('inventory_balances', 'variant_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });
    // Widen the uniqueness key so variant stock is tracked separately.
    // NULL variant_id keeps backward compatibility for non-variant items.
    await queryInterface.removeIndex('inventory_balances', 'unique_warehouse_item');
    await queryInterface.addIndex('inventory_balances', ['warehouse_id', 'item_id', 'variant_id'], {
      unique: true,
      name: 'unique_warehouse_item_variant',
    });
    await queryInterface.addIndex('inventory_balances', ['variant_id'], { name: 'idx_inventory_balances_variant' });

    // ── line tables: variant identity ──────────────────────────────────
    for (const table of LINE_TABLES) {
      await queryInterface.addColumn(table, 'variant_id', { type: Sequelize.UUID, allowNull: true });
      await queryInterface.addColumn(table, 'variant_description', { type: Sequelize.STRING(500), allowNull: true });
      await queryInterface.addIndex(table, ['variant_id'], { name: `idx_${table}_variant` });
    }
  },

  down: async (queryInterface, Sequelize) => {
    for (const table of LINE_TABLES) {
      await queryInterface.removeIndex(table, `idx_${table}_variant`);
      await queryInterface.removeColumn(table, 'variant_description');
      await queryInterface.removeColumn(table, 'variant_id');
    }

    await queryInterface.removeIndex('inventory_balances', 'idx_inventory_balances_variant');
    await queryInterface.removeIndex('inventory_balances', 'unique_warehouse_item_variant');
    await queryInterface.addIndex('inventory_balances', ['warehouse_id', 'item_id'], {
      unique: true,
      name: 'unique_warehouse_item',
    });
    await queryInterface.removeColumn('inventory_balances', 'variant_id');

    await queryInterface.removeIndex('inventory_transactions', 'idx_inv_trans_item_variant');
    await queryInterface.removeIndex('inventory_transactions', 'idx_inv_trans_variant');
    await queryInterface.removeColumn('inventory_transactions', 'reference_line_id');
    await queryInterface.removeColumn('inventory_transactions', 'variant_id');

    await queryInterface.removeIndex('items', 'idx_item_attribute_template');
    await queryInterface.removeColumn('items', 'attribute_template_id');
    await queryInterface.removeColumn('items', 'is_variant_enabled');

    await queryInterface.dropTable('item_variant_attribute_values');
    await queryInterface.dropTable('item_variants');
    await queryInterface.dropTable('item_attribute_template_attributes');
    await queryInterface.dropTable('item_attribute_templates');
    await queryInterface.dropTable('item_attribute_options');
    await queryInterface.dropTable('item_attributes');
  },
};
