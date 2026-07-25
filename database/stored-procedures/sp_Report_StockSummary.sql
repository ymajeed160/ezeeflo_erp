DELIMITER $$
DROP PROCEDURE IF EXISTS sp_Report_StockSummary$$
CREATE PROCEDURE sp_Report_StockSummary(
    IN p_TenantId CHAR(36), IN p_WarehouseId CHAR(36), IN p_ItemId CHAR(36),
    IN p_CategoryId CHAR(36), IN p_ItemType VARCHAR(20),
    IN p_IncludeZeroStock TINYINT, IN p_IncludeInactive TINYINT,
    IN p_Page INT, IN p_PageSize INT
)
BEGIN
    DECLARE v_Offset INT DEFAULT 0;
    IF p_Page IS NULL OR p_Page < 1 THEN SET p_Page = 1; END IF;
    IF p_PageSize IS NULL OR p_PageSize < 1 THEN SET p_PageSize = 50; END IF;
    SET v_Offset = (p_Page - 1) * p_PageSize;

    DROP TEMPORARY TABLE IF EXISTS tmp_stock;
    CREATE TEMPORARY TABLE tmp_stock AS
    SELECT i.item_code, i.name AS item_name,
           ic.name AS category_name, i.item_type,
           w.name AS warehouse_name,
           COALESCE(ib.quantity_on_hand, 0) AS quantity_on_hand,
           COALESCE(ib.average_cost, 0) AS avg_cost,
           COALESCE(ib.quantity_on_hand * ib.average_cost, 0) AS stock_value,
           CASE WHEN COALESCE(ib.quantity_on_hand, 0) <= 0 THEN 'Out of Stock'
                WHEN COALESCE(ib.quantity_on_hand, 0) <= 5 THEN 'Low Stock'
                ELSE 'In Stock' END AS stock_status
    FROM items i
    LEFT JOIN item_categories ic ON ic.id = i.category_id
    LEFT JOIN warehouses w ON w.tenant_id = i.tenant_id
    LEFT JOIN inventory_balances ib ON ib.item_id = i.id AND ib.warehouse_id = w.id
    WHERE i.tenant_id = p_TenantId
      AND (p_ItemId IS NULL OR i.id = p_ItemId)
      AND (p_CategoryId IS NULL OR i.category_id = p_CategoryId)
      AND (p_ItemType IS NULL OR i.item_type = p_ItemType)
      AND (p_WarehouseId IS NULL OR w.id = p_WarehouseId)
      AND (p_IncludeInactive = 1 OR i.is_active = 1)
    HAVING (p_IncludeZeroStock = 1 OR quantity_on_hand > 0);

    SELECT COUNT(*) AS total_items, COALESCE(SUM(quantity_on_hand),0) AS total_quantity,
           COALESCE(SUM(stock_value),0) AS total_value FROM tmp_stock;

    SELECT * FROM tmp_stock
    LIMIT p_PageSize OFFSET v_Offset;

    SELECT COUNT(*) AS total FROM tmp_stock;
    DROP TEMPORARY TABLE tmp_stock;
END$$
DELIMITER ;
