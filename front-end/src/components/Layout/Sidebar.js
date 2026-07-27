import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../../services/axiosInstance';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Toolbar,
  Box,
  Typography,
  Popover,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as SalesIcon,
  LocalShipping as PurchaseIcon,
  Inventory as InventoryIcon,
  AccountBalance as AccountingIcon,
  AccountBalanceWallet as BankIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Security as RoleIcon,
  Person as UserIcon,
  ExpandLess,
  ExpandMore,
  BarChart as BIIcon,
  PrecisionManufacturing as FixedAssetIcon,
  AdminPanelSettings as SuperAdminIcon,
  CardMembership as PlanIcon,
  Extension as ModuleIcon,
  AssuredWorkload as SubscriptionIcon,
  History as AuditIcon,
  PointOfSale as POSIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 280;
const MINI_WIDTH = 65;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/app/dashboard' },
  {
    text: 'Sales',
    icon: <SalesIcon />,
    subItems: [
      { text: 'Customers', path: '/app/sales/customers' },
      { text: 'Quotations', path: '/app/sales/quotations' },
      { text: 'Sales Orders', path: '/app/sales/sales-orders' },
      { text: 'Delivery Notes', path: '/app/sales/delivery-notes' },
      { text: 'Sales Invoices', path: '/app/sales/invoices' },
      { text: 'Sales Returns', path: '/app/sales/returns' },
      { text: 'Credit Notes', path: '/app/sales/credit-notes' },
      { text: 'Customer Payments', path: '/app/sales/payments' },
    ],
  },
  {
    text: 'Purchases',
    icon: <PurchaseIcon />,
    subItems: [
      { text: 'Suppliers', path: '/app/purchases/suppliers' },
      { text: 'Purchase Requests', path: '/app/purchases/purchase-requests' },
      { text: 'Purchase Orders', path: '/app/purchases/purchase-orders' },
      { text: 'Goods Receipts', path: '/app/purchases/goods-receipts' },
      { text: 'Purchase Invoices', path: '/app/purchases/purchase-invoices' },
      { text: 'Purchase Returns', path: '/app/purchases/purchase-returns' },
      { text: 'Debit Notes', path: '/app/purchases/debit-notes' },
      { text: 'Supplier Payments', path: '/app/purchases/payments' },
    ],
  },
  {
    text: 'Inventory',
    icon: <InventoryIcon />,
    subItems: [
      { text: 'Items', path: '/app/inventory/items' },
      { text: 'Item Categories', path: '/app/inventory/item-categories' },
      { text: 'Warehouses', path: '/app/inventory/warehouses' },
      { text: 'Stock Transfers', path: '/app/inventory/transfers' },
      { text: 'Stock Adjustments', path: '/app/inventory/adjustments' },
      { text: 'Inventory Balances', path: '/app/inventory/balances' },
      { text: 'Transaction History', path: '/app/inventory/transactions' },
    ],
  },
  {
    text: 'Accounting',
    icon: <AccountingIcon />,
    subItems: [
      { text: 'Chart of Accounts', path: '/app/accounting/chart-of-accounts' },
      { text: 'Journal Entries', path: '/app/accounting/journal-entries' },
      { text: 'General Ledger', path: '/app/accounting/general-ledger' },
      { text: 'Trial Balance', path: '/app/accounting/trial-balance' },
      { text: 'Profit & Loss', path: '/app/accounting/profit-loss' },
      { text: 'Balance Sheet', path: '/app/reports/balance-sheet' },
    ],
  },
  {
    text: 'Banks',
    icon: <BankIcon />,
    subItems: [
      { text: 'Bank Accounts', path: '/app/banks/accounts' },
      { text: 'Transactions', path: '/app/banks/transactions' },
      { text: 'Payment Receipts', path: '/app/banks/receipts' },
      { text: 'Payment Vouchers', path: '/app/banks/vouchers' },
      { text: 'Reconciliation', path: '/app/banks/reconciliation' },
    ],
  },
  {
    text: 'Fixed Assets',
    icon: <FixedAssetIcon />,
    subItems: [
      { text: 'Asset Categories', path: '/app/fixed-assets/categories' },
      { text: 'Asset Register', path: '/app/fixed-assets/register' },
      { text: 'Asset Acquisition', path: '/app/fixed-assets/acquisitions' },
      { text: 'Asset Transfers', path: '/app/fixed-assets/transfers' },
      { text: 'Asset Depreciation', path: '/app/fixed-assets/depreciation' },
      { text: 'Asset Disposal', path: '/app/fixed-assets/disposals' },
      { text: 'Asset Maintenance', path: '/app/fixed-assets/maintenance' },
      { text: 'Asset Revaluation', path: '/app/fixed-assets/revaluations' },
      { text: 'Asset Insurance', path: '/app/fixed-assets/insurance' },
      { text: 'Asset Locations', path: '/app/fixed-assets/locations' },
      { text: 'Asset Custodians', path: '/app/fixed-assets/custodians' },
      { text: 'Asset Audits', path: '/app/fixed-assets/audits' },
      { text: 'Asset Reports', path: '/app/fixed-assets/reports' },
    ],
  },
  {
    text: 'POS',
    icon: <POSIcon />,
    subItems: [
      { text: 'Dashboard', path: '/app/pos/dashboard' },
      { text: 'Terminals', path: '/app/pos/terminals' },
      { text: 'Sessions', path: '/app/pos/sessions' },
      { text: 'POS Register', path: '/app/pos/register' },
      { text: 'Held Orders', path: '/app/pos/held-orders' },
      { text: 'Returns', path: '/app/pos/returns' },
      { text: 'Cash Management', path: '/app/pos/cash' },
      { text: 'End of Day', path: '/app/pos/end-of-day' },
      { text: 'Reports', path: '/app/pos/reports' },
    ],
  },
  { text: 'Report Center', icon: <ReportIcon />, path: '/app/reports' },
  {
    text: 'BI Report',
    icon: <BIIcon />,
    subItems: [
      { text: 'Sales Dashboard', path: '/app/bi/sales' },
      { text: 'Purchase Dashboard', path: '/app/bi/purchase' },
      { text: 'Inventory Dashboard', path: '/app/bi/inventory' },
      { text: 'Financial Dashboard', path: '/app/bi/financial' },
    ],
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    subItems: [
      { text: 'Users', path: '/app/settings/users' },
      { text: 'Roles & Permissions', path: '/app/settings/roles' },
      { text: 'Company Profile', path: '/app/settings/company' },
      { text: 'System Config', path: '/app/settings/system' },
      { text: 'Release Notes', path: '/app/release-notes' },
    ],
  },
  {
    text: 'Administration',
    icon: <AuditIcon />,
    subItems: [
      { text: 'Audit & History', path: '/app/audit' },
    ],
  },
  {
    text: 'Super Admin',
    icon: <SuperAdminIcon />,
    superAdminOnly: true,
    subItems: [
      { text: 'Dashboard', path: '/superadmin' },
      { text: 'Subscription Plans', path: '/superadmin/plans' },
      { text: 'Subscription Modules', path: '/superadmin/modules' },
      { text: 'Company Subscriptions', path: '/superadmin/subscriptions' },
      { text: 'Audit Trail', path: '/superadmin/audit' },
    ],
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useSelector((state) => state.theme.sidebarOpen);
  const currentUser = useSelector((state) => state.auth.user);
  const isSuperAdmin = currentUser?.isSuperAdmin;
  const [openMenus, setOpenMenus] = React.useState({});

  React.useEffect(() => {
    const newOpenMenus = {};
    const items = menuItems.filter(item => !item.superAdminOnly || isSuperAdmin);
    items.forEach((item) => {
      if (item.subItems) {
        const isActive = item.subItems.some((sub) => location.pathname.startsWith(sub.path));
        if (isActive) newOpenMenus[item.text] = true;
      }
    });
    setOpenMenus((prev) => ({ ...prev, ...newOpenMenus }));
  }, [location.pathname, isSuperAdmin]);

  const handleMenuClick = (item) => {
    if (!sidebarOpen && item.subItems) {
      // Mini mode: open popover flyout instead of expanding inline
      setMiniMenu({ anchor: document.getElementById(`sidebar-btn-${item.text}`), item });
      return;
    }
    if (item.subItems) {
      setOpenMenus((prev) => ({ ...prev, [item.text]: !prev[item.text] }));
    } else if (item.path) {
      navigate(item.path + location.search);
    }
  };

  const [miniMenu, setMiniMenu] = React.useState({ anchor: null, item: null });

  const handleMiniMenuClose = () => setMiniMenu({ anchor: null, item: null });

  const handleMiniSubClick = (path) => {
    handleMiniMenuClose();
    navigate(path + location.search);
  };

  const isActive = (path) => location.pathname === path;
  const isParentActive = (subItems) => subItems?.some((sub) => location.pathname.startsWith(sub.path));

  // Map menu item texts to subscription module codes
  const MODULE_CODE_MAP = {
    'Dashboard': 'dashboard',
    'Sales': 'sales',
    'Purchases': 'purchases',
    'Inventory': 'inventory',
    'Accounting': 'accounting',
    'Banks': 'banks',
    'Fixed Assets': 'fixed-assets',
    'Report Center': 'reports',
    'BI Report': 'bi-report',
    'Settings': 'settings',
  };

  const drawerWidth = sidebarOpen ? DRAWER_WIDTH : MINI_WIDTH;
  const [enabledModules, setEnabledModules] = useState(null);
  const activeCompanyId = useSelector((state) => state.company?.activeCompanyId);

  useEffect(() => {
    setEnabledModules(null);
    axiosInstance.get('/companies/enabled-modules')
      .then(({ data }) => {
        if (data?.data) setEnabledModules(data.data);
      })
      .catch(() => {});
  }, [activeCompanyId]);

  // Filter by subscription modules (if loaded)
  const filteredMenuItems = menuItems.filter(item => {
    // Always show super admin items
    if (item.superAdminOnly) return isSuperAdmin;
    // If subscription modules haven't loaded yet, show everything
    if (!enabledModules) return true;
    // Check if this menu item is in the enabled modules
    const moduleCode = MODULE_CODE_MAP[item.text];
    return moduleCode ? enabledModules.includes(moduleCode) : true;
  });

  return (
    <>
    <Drawer
      variant="persistent"
      open={true}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        transition: 'width 0.2s ease',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          overflowX: 'hidden',
          transition: 'width 0.2s ease',
        },
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: sidebarOpen ? 2 : 0.5, justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
        {sidebarOpen ? (
          <Typography variant="h6" fontWeight={700} color="primary" noWrap>
            ezeeflo
          </Typography>
        ) : (
          <Typography variant="h6" fontWeight={700} color="primary">
            E
          </Typography>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ px: sidebarOpen ? 1 : 0.5, py: 1, overflowY: 'auto', flex: 1 }}>
        {filteredMenuItems.map((item) => (
          <React.Fragment key={item.text}>
            <Tooltip title={!sidebarOpen ? item.text : ''} placement="right" arrow>
            <ListItemButton
              id={`sidebar-btn-${item.text}`}
              onClick={() => handleMenuClick(item)}
              selected={item.subItems ? isParentActive(item.subItems) : isActive(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.3,
                justifyContent: sidebarOpen ? 'initial' : 'center',
                px: sidebarOpen ? 1.5 : 0.5,
                minHeight: 44,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: sidebarOpen ? 40 : 0, justifyContent: 'center' }}>
                {item.icon}
              </ListItemIcon>
              {sidebarOpen && (
                <>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }} />
                  {item.subItems && (openMenus[item.text] ? <ExpandLess /> : <ExpandMore />)}
                </>
              )}
            </ListItemButton>
            </Tooltip>
            {sidebarOpen && item.subItems && (
              <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((sub) => (
                    <ListItemButton
                      key={sub.text}
                      onClick={() => navigate(sub.path + location.search)}
                      selected={isActive(sub.path)}
                      sx={{
                        pl: 5,
                        borderRadius: 2,
                        mb: 0.2,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': { bgcolor: 'primary.dark' },
                        },
                      }}
                    >
                      <ListItemText
                        primary={sub.text}
                        primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive(sub.path) ? 600 : 400 }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
      {sidebarOpen && (
        <>
          <Divider />
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              ezeeflo ERP v2.0
            </Typography>
          </Box>
        </>
      )}
      </Drawer>
      <Popover
        open={Boolean(miniMenu.anchor)}
        anchorEl={miniMenu.anchor}
        onClose={handleMiniMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 2, boxShadow: 4, minWidth: 220, ml: 0.5 } } }}
      >
        {miniMenu.item && (
          <Paper sx={{ py: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ px: 2, py: 1, color: 'primary.main' }}>
              {miniMenu.item.text}
            </Typography>
            <Divider sx={{ mb: 0.5 }} />
            <List disablePadding>
              {miniMenu.item.subItems?.map((sub) => (
                <ListItemButton
                  key={sub.text}
                  onClick={() => handleMiniSubClick(sub.path)}
                  selected={isActive(sub.path)}
                  sx={{
                    px: 2,
                    py: 0.8,
                    borderRadius: 1,
                    mx: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                >
                  <ListItemText
                    primary={sub.text}
                    primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive(sub.path) ? 600 : 400 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}
      </Popover>
    </>
  );
};

export default Sidebar;