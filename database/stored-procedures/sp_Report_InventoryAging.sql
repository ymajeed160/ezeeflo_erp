-- =============================================================================
-- sp_Report_InventoryAging
-- Inventory Aging / Cost / Days Held / Valuation report (multi-tenant).
--
-- Costing method: WEIGHTED AVERAGE (inventory_balances.average_cost).
--   Inventory Value = current quantity x average_cost.
--   No FIFO costing is introduced. Aging "layers" are derived ONLY for dates:
--   outflows consume the OLDEST inflows first, so the surviving on-hand quantity
--   is allocated to the NEWEST remaining inflow dates (FIFO-of-dates for aging).
--
-- Result sets (in order):
--   1) Totals summary     : total_items, total_quantity, total_value
--   2) Summary rows       : item_code, item_name, category_name, warehouse_name,
--                           item_type, current_qty, unit_cost, inventory_value,
--                           receipt_date, avg_days_held, max_days_held, aging_bucket
--   3) Pagination         : total, page, page_size
--   4) Detailed layers    : item_code, item_name, category_name, warehouse_name,
--                           layer_date, remaining_qty, unit_cost, layer_value,
--                           days_held, aging_bucket
--
-- MySQL 5.7 compatible (no window functions / CTEs).
-- =============================================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_InventoryAging$$
CREATE PROCEDURE sp_Report_InventoryAging(
    IN p_TenantId CHAR(36),
    IN p_ReportDate DATE,
    IN p_WarehouseId CHAR(36),
    IN p_ItemId CHAR(36),
    IN p_CategoryId CHAR(36),
    IN p_ItemType VARCHAR(20),
    IN p_IncludeZeroStock TINYINT,
    IN p_AgingBucket VARCHAR(20),
    IN p_Page INT,
    IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    DECLARE v_ReportDate DATE;

    IF p_ReportDate IS NULL THEN SET v_ReportDate = CURDATE(); ELSE SET v_ReportDate = p_ReportDate; END IF;
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    -- -------------------------------------------------------------------------
    -- 1. Inflows up to report date (source of acquisition dates)
    -- -------------------------------------------------------------------------
    DROP TEMPORARY TABLE IF EXISTS tmp_inflows;
    CREATE TEMPORARY TABLE tmp_inflows AS
    SELECT t.item_id, t.warehouse_id, DATE(t.transaction_date) AS layer_date,
           t.quantity_in AS layer_qty, t.id AS tx_id
    FROM inventory_transactions t
    WHERE t.tenant_id = p_TenantId
      AND t.quantity_in > 0
      AND t.transaction_date < DATE_ADD(v_ReportDate, INTERVAL 1 DAY);

    -- -------------------------------------------------------------------------
    -- 2. Total outflows (consumed) up to report date
    -- -------------------------------------------------------------------------
    DROP TEMPORARY TABLE IF EXISTS tmp_outflows;
    CREATE TEMPORARY TABLE tmp_outflows AS
    SELECT t.item_id, t.warehouse_id, SUM(t.quantity_out) AS total_out
    FROM inventory_transactions t
    WHERE t.tenant_id = p_TenantId
      AND t.quantity_out > 0
      AND t.transaction_date < DATE_ADD(v_ReportDate, INTERVAL 1 DAY)
    GROUP BY t.item_id, t.warehouse_id;

    -- -------------------------------------------------------------------------
    -- 3. On-hand quantity per item/warehouse (report-date aware)
    -- -------------------------------------------------------------------------
    DROP TEMPORARY TABLE IF EXISTS tmp_onhand;
    CREATE TEMPORARY TABLE tmp_onhand AS
    SELECT t.item_id, t.warehouse_id,
           (SUM(COALESCE(t.quantity_in,0)) - SUM(COALESCE(t.quantity_out,0))) AS on_hand
    FROM inventory_transactions t
    WHERE t.tenant_id = p_TenantId
      AND t.transaction_date < DATE_ADD(v_ReportDate, INTERVAL 1 DAY)
    GROUP BY t.item_id, t.warehouse_id
    HAVING on_hand <> 0;

    -- -------------------------------------------------------------------------
    -- 4. Surviving date layers (newest-first FIFO allocation of on-hand)
    -- -------------------------------------------------------------------------
    DROP TEMPORARY TABLE IF EXISTS tmp_layers;
    CREATE TEMPORARY TABLE tmp_layers (
        item_id CHAR(36),
        warehouse_id CHAR(36),
        layer_date DATE,
        layer_qty DECIMAL(18,4),
        KEY idx_layer (item_id, warehouse_id)
    ) ENGINE=MEMORY;

    SET @qc_item := NULL, @qc_wh := NULL, @qc_alloc := 0;

    INSERT INTO tmp_layers (item_id, warehouse_id, layer_date, layer_qty)
    SELECT x.item_id, x.warehouse_id, x.layer_date,
           LEAST(x.layer_qty, x.on_hand - x.alloc_before) AS surviving_qty
    FROM (
        SELECT f.item_id, f.warehouse_id, f.layer_date, f.layer_qty,
               h.on_hand,
               @qc_alloc := IF(@qc_item = f.item_id AND @qc_wh = f.warehouse_id, @qc_alloc, 0) AS alloc_before,
               @qc_alloc := @qc_alloc + f.layer_qty AS alloc_after,
               @qc_item := f.item_id,
               @qc_wh := f.warehouse_id
        FROM tmp_inflows f
        JOIN tmp_onhand h ON h.item_id = f.item_id AND h.warehouse_id = f.warehouse_id
        ORDER BY f.item_id, f.warehouse_id, f.layer_date DESC, f.tx_id DESC
        LIMIT 18446744073709551615
    ) x
    WHERE x.on_hand > 0
      AND x.alloc_before < x.on_hand
      AND LEAST(x.layer_qty, x.on_hand - x.alloc_before) > 0;

    -- -------------------------------------------------------------------------
    -- 5. Summary rows (per item + warehouse)
    -- -------------------------------------------------------------------------
    DROP TEMPORARY TABLE IF EXISTS tmp_summary;
    CREATE TEMPORARY TABLE tmp_summary AS
    SELECT
        i.id AS item_id,
        l.warehouse_id,
        i.item_code,
        i.name AS item_name,
        ic.name AS category_name,
        w.name AS warehouse_name,
        i.item_type,
        SUM(l.layer_qty) AS current_qty,
        COALESCE(ib.average_cost, i.cost_price, 0) AS unit_cost,
        (SUM(l.layer_qty) * COALESCE(ib.average_cost, i.cost_price, 0)) AS inventory_value,
        MIN(l.layer_date) AS receipt_date,
        DATEDIFF(v_ReportDate, MIN(l.layer_date)) AS max_days_held,
        (SUM(DATEDIFF(v_ReportDate, l.layer_date) * l.layer_qty) / NULLIF(SUM(l.layer_qty), 0)) AS avg_days_held
    FROM tmp_layers l
    JOIN items i ON i.id = l.item_id AND i.tenant_id = p_TenantId
    JOIN warehouses w ON w.id = l.warehouse_id AND w.tenant_id = p_TenantId
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    LEFT JOIN inventory_balances ib ON ib.item_id = l.item_id AND ib.warehouse_id = l.warehouse_id
    GROUP BY i.id, l.warehouse_id, i.item_code, i.name, ic.name, w.name, i.item_type,
             ib.average_cost, i.cost_price;

    -- -------------------------------------------------------------------------
    -- 6. Optional zero-stock rows
    -- -------------------------------------------------------------------------
    IF p_IncludeZeroStock = 1 THEN
        INSERT INTO tmp_summary
            (item_id, warehouse_id, item_code, item_name, category_name, warehouse_name,
             item_type, current_qty, unit_cost, inventory_value, receipt_date, max_days_held, avg_days_held)
        SELECT i.id, w.id, i.item_code, i.name, ic.name, w.name, i.item_type,
               0, COALESCE(ib.average_cost, i.cost_price, 0), 0,
               NULL, 0, 0
        FROM items i
        JOIN warehouses w ON w.tenant_id = i.tenant_id
        LEFT JOIN item_categories ic ON ic.id = i.category_id
        LEFT JOIN inventory_balances ib ON ib.item_id = i.id AND ib.warehouse_id = w.id
        WHERE i.tenant_id = p_TenantId
          AND (p_WarehouseId IS NULL OR w.id = p_WarehouseId)
          AND (p_ItemId IS NULL OR i.id = p_ItemId)
          AND (p_CategoryId IS NULL OR i.category_id = p_CategoryId)
          AND (p_ItemType IS NULL OR i.item_type = p_ItemType)
          AND NOT EXISTS (
              SELECT 1 FROM tmp_layers l WHERE l.item_id = i.id AND l.warehouse_id = w.id
          );
    END IF;

    -- -------------------------------------------------------------------------
    -- 7. Apply filters + aging bucket
    -- -------------------------------------------------------------------------
    DROP TEMPORARY TABLE IF EXISTS tmp_result;
    CREATE TEMPORARY TABLE tmp_result AS
    SELECT s.*,
        CASE
            WHEN s.receipt_date IS NULL THEN NULL
            WHEN s.max_days_held <= 30 THEN '0-30'
            WHEN s.max_days_held <= 60 THEN '31-60'
            WHEN s.max_days_held <= 90 THEN '61-90'
            WHEN s.max_days_held <= 180 THEN '91-180'
            WHEN s.max_days_held <= 365 THEN '181-365'
            ELSE '365+'
        END AS aging_bucket
    FROM tmp_summary s
    WHERE (p_WarehouseId IS NULL OR s.warehouse_id = p_WarehouseId)
      AND (p_ItemId IS NULL OR s.item_id = p_ItemId)
      AND (p_ItemType IS NULL OR s.item_type = p_ItemType);

    DELETE FROM tmp_result
    WHERE (p_CategoryId IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM items i WHERE i.id = tmp_result.item_id AND i.category_id = p_CategoryId
    ));

    IF p_AgingBucket IS NOT NULL AND p_AgingBucket <> '' THEN
        DELETE FROM tmp_result WHERE aging_bucket <> p_AgingBucket;
    END IF;

    -- -------------------------------------------------------------------------
    -- Result set 1: totals
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) AS total_items,
           COALESCE(SUM(current_qty),0) AS total_quantity,
           COALESCE(SUM(inventory_value),0) AS total_value
    FROM tmp_result;

    -- -------------------------------------------------------------------------
    -- Result set 2: summary rows (paged)
    -- -------------------------------------------------------------------------
    SELECT item_code, item_name, category_name, warehouse_name, item_type,
           current_qty, unit_cost, inventory_value,
           receipt_date, avg_days_held, max_days_held, aging_bucket
    FROM tmp_result
    ORDER BY inventory_value DESC, item_code ASC, warehouse_name ASC
    LIMIT p_PageSize OFFSET v_Offset;

    -- -------------------------------------------------------------------------
    -- Result set 3: pagination
    -- -------------------------------------------------------------------------
    SELECT COUNT(*) AS total, p_Page AS page, p_PageSize AS page_size FROM tmp_result;

    -- -------------------------------------------------------------------------
    -- Result set 4: detailed layers
    -- -------------------------------------------------------------------------
    SELECT i.item_code, i.name AS item_name, ic.name AS category_name, w.name AS warehouse_name,
           l.layer_date,
           l.layer_qty AS remaining_qty,
           COALESCE(ib.average_cost, i.cost_price, 0) AS unit_cost,
           (l.layer_qty * COALESCE(ib.average_cost, i.cost_price, 0)) AS layer_value,
           DATEDIFF(v_ReportDate, l.layer_date) AS days_held,
           CASE
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 30 THEN '0-30'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 60 THEN '31-60'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 90 THEN '61-90'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 180 THEN '91-180'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 365 THEN '181-365'
               ELSE '365+'
           END AS aging_bucket
    FROM tmp_layers l
    JOIN items i ON i.id = l.item_id AND i.tenant_id = p_TenantId
    JOIN warehouses w ON w.id = l.warehouse_id AND w.tenant_id = p_TenantId
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    LEFT JOIN inventory_balances ib ON ib.item_id = l.item_id AND ib.warehouse_id = l.warehouse_id
    WHERE (p_WarehouseId IS NULL OR l.warehouse_id = p_WarehouseId)
      AND (p_ItemId IS NULL OR l.item_id = p_ItemId)
      AND (p_CategoryId IS NULL OR i.category_id = p_CategoryId)
      AND (p_ItemType IS NULL OR i.item_type = p_ItemType)
      AND (p_AgingBucket IS NULL OR p_AgingBucket = '' OR
           (CASE
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 30 THEN '0-30'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 60 THEN '31-60'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 90 THEN '61-90'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 180 THEN '91-180'
               WHEN DATEDIFF(v_ReportDate, l.layer_date) <= 365 THEN '181-365'
               ELSE '365+'
           END) = p_AgingBucket)
    ORDER BY i.item_code, l.layer_date ASC;

    DROP TEMPORARY TABLE IF EXISTS tmp_inflows;
    DROP TEMPORARY TABLE IF EXISTS tmp_outflows;
    DROP TEMPORARY TABLE IF EXISTS tmp_onhand;
    DROP TEMPORARY TABLE IF EXISTS tmp_layers;
    DROP TEMPORARY TABLE IF EXISTS tmp_summary;
    DROP TEMPORARY TABLE IF EXISTS tmp_result;
END$$
DELIMITER ;
