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
  alpha,
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
  KeyboardArrowRight,
} from '@mui/icons-material';

const DRAWER_WIDTH = 280;
const MINI_WIDTH = 68;

// Enterprise dark theme colors
const SIDEBAR_BG = '#111827';
const SIDEBAR_PAPER = '#111827';
const SIDEBAR_TEXT = '#d1d5db';
const SIDEBAR_TEXT_DIM = '#9ca3af';
const SIDEBAR_HOVER = 'rgba(255,255,255,0.06)';
const SIDEBAR_ACTIVE_BG = 'rgba(99,102,241,0.16)';
const SIDEBAR_ACTIVE_BORDER = '#6366f1';
const SIDEBAR_ACTIVE_TEXT = '#e0e7ff';
const SIDEBAR_DIVIDER = 'rgba(255,255,255,0.08)';
const SIDEBAR_HEADER = 'rgba(255,255,255,0.04)';
const SIDEBAR_SCROLLBAR = 'rgba(255,255,255,0.12)';
const SIDEBAR_BRAND_TEXT = '#f9fafb';
const SIDEBAR_CHEVRON_COLOR = '#6b7280';

// Assign a subtle accent color per module for the active left-border
const MODULE_ACCENT = {
  'Dashboard': '#6366f1',
  'Sales': '#f59e0b',
  'Purchases': '#10b981',
  'Inventory': '#3b82f6',
  'Accounting': '#8b5cf6',
  'Banks': '#06b6d4',
  'Fixed Assets': '#f97316',
  'POS': '#ec4899',
  'Report Center': '#14b8a6',
  'BI Report': '#ef4444',
  'Settings': '#6b7280',
  'Administration': '#78716c',
  'Super Admin': '#dc2626',
};

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
      { text: 'Cash Receipt Voucher', path: '/app/sales/crv' },
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
      { text: 'Cash Payment Voucher', path: '/app/purchases/cpv' },
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
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: SIDEBAR_PAPER,
          backgroundImage: `linear-gradient(180deg, ${SIDEBAR_BG} 0%, #0f172a 100%)`,
          overflowX: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          borderRight: 'none',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: SIDEBAR_SCROLLBAR, borderRadius: 4 },
        },
      }}
    >
      {/* Brand Header */}
      <Toolbar sx={{
        minHeight: { xs: 56, sm: 64 },
        px: sidebarOpen ? 2.5 : 0.5,
        justifyContent: sidebarOpen ? 'flex-start' : 'center',
        gap: 1.5,
        borderBottom: `1px solid ${SIDEBAR_DIVIDER}`,
      }}>
        {sidebarOpen ? (
          <>
            <Box sx={{
              width: 34, height: 34, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
              flexShrink: 0,
            }}>
              <Typography fontSize={18} fontWeight={800} color="#fff" lineHeight={1}>E</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} color={SIDEBAR_BRAND_TEXT} noWrap
              sx={{ letterSpacing: '-0.02em', fontSize: '1.1rem' }}>
              ezeeflo
            </Typography>
          </>
        ) : (
          <Box sx={{
            width: 34, height: 34, borderRadius: 2.5,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
          }}>
            <Typography fontSize={18} fontWeight={800} color="#fff" lineHeight={1}>E</Typography>
          </Box>
        )}
      </Toolbar>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        {filteredMenuItems.map((item, idx) => {
          const active = item.subItems ? isParentActive(item.subItems) : isActive(item.path);
          const accent = MODULE_ACCENT[item.text] || SIDEBAR_ACTIVE_BORDER;
          const isOpen = openMenus[item.text];

          // Section divider before certain categories
          const sectionBreaks = ['Report Center', 'Settings'];
          const showDivider = sectionBreaks.includes(item.text);

          return (
            <React.Fragment key={item.text}>
              {showDivider && sidebarOpen && (
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                  <Divider sx={{ borderColor: SIDEBAR_DIVIDER }} />
                </Box>
              )}

              <Tooltip title={!sidebarOpen ? item.text : ''} placement="right" arrow
                componentsProps={{ tooltip: { sx: { bgcolor: '#1f2937', color: '#f3f4f6', fontSize: '0.75rem', fontWeight: 600, borderRadius: 1.5, py: 0.8, px: 1.5 } } }}>
              <ListItemButton
                id={`sidebar-btn-${item.text}`}
                onClick={() => handleMenuClick(item)}
                selected={active}
                disableRipple
                sx={{
                  borderRadius: sidebarOpen ? '0 8px 8px 0' : 2,
                  mb: 0.2,
                  mx: sidebarOpen ? 0 : 0.8,
                  mr: sidebarOpen ? 1 : 0.8,
                  justifyContent: sidebarOpen ? 'initial' : 'center',
                  px: sidebarOpen ? 2 : 0.5,
                  minHeight: 44,
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  borderLeft: sidebarOpen && active ? `3px solid ${accent}` : '3px solid transparent',
                  bgcolor: active ? alpha(accent, 0.12) : 'transparent',
                  '&:hover': {
                    bgcolor: active ? alpha(accent, 0.18) : SIDEBAR_HOVER,
                  },
                  '&.Mui-selected': {
                    bgcolor: alpha(accent, 0.12),
                    '&:hover': { bgcolor: alpha(accent, 0.18) },
                  },
                  // Subtle glow dot for active items in mini mode
                  '&::before': !sidebarOpen && active ? {
                    content: '""',
                    position: 'absolute',
                    top: 6, right: 4,
                    width: 6, height: 6,
                    borderRadius: '50%',
                    bgcolor: accent,
                    boxShadow: `0 0 6px ${accent}`,
                  } : {},
                }}
              >
                <ListItemIcon sx={{
                  minWidth: sidebarOpen ? 40 : 0,
                  justifyContent: 'center',
                  color: active ? accent : SIDEBAR_TEXT_DIM,
                  transition: 'color 0.15s ease',
                  '.MuiSvgIcon-root': { fontSize: sidebarOpen ? '1.35rem' : '1.4rem' },
                }}>
                  {item.icon}
                </ListItemIcon>
                {sidebarOpen && (
                  <>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: active ? 600 : 400,
                        fontSize: '0.875rem',
                        color: active ? SIDEBAR_ACTIVE_TEXT : SIDEBAR_TEXT,
                        letterSpacing: '0.01em',
                      }}
                    />
                    {item.subItems && (
                      <Box sx={{
                        color: isOpen ? accent : SIDEBAR_CHEVRON_COLOR,
                        transition: 'transform 0.2s ease, color 0.15s ease',
                        transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        display: 'flex',
                      }}>
                        <KeyboardArrowRight fontSize="small" />
                      </Box>
                    )}
                  </>
                )}
              </ListItemButton>
              </Tooltip>

              {/* Sub-items */}
              {sidebarOpen && item.subItems && (
                <Collapse in={isOpen} timeout={200} unmountOnExit>
                  <List component="div" disablePadding sx={{ pb: 0.5 }}>
                    {item.subItems.map((sub) => {
                      const subActive = isActive(sub.path);
                      return (
                        <ListItemButton
                          key={sub.text}
                          onClick={() => navigate(sub.path + location.search)}
                          selected={subActive}
                          disableRipple
                          sx={{
                            pl: 6.5,
                            pr: 2,
                            py: 0.5,
                            borderRadius: '0 8px 8px 0',
                            mr: 1,
                            mb: 0.1,
                            minHeight: 36,
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            borderLeft: subActive ? `3px solid ${accent}` : '3px solid transparent',
                            bgcolor: subActive ? alpha(accent, 0.1) : 'transparent',
                            '&:hover': {
                              bgcolor: subActive ? alpha(accent, 0.15) : SIDEBAR_HOVER,
                            },
                            '&.Mui-selected': {
                              bgcolor: alpha(accent, 0.1),
                              '&:hover': { bgcolor: alpha(accent, 0.15) },
                            },
                          }}
                        >
                          {/* Dot indicator for active sub-item */}
                          {subActive && (
                            <Box sx={{
                              width: 5, height: 5, borderRadius: '50%',
                              bgcolor: accent,
                              position: 'absolute', left: 18,
                              boxShadow: `0 0 6px ${accent}`,
                            }} />
                          )}
                          <ListItemText
                            primary={sub.text}
                            primaryTypographyProps={{
                              fontSize: '0.8rem',
                              fontWeight: subActive ? 600 : 400,
                              color: subActive ? SIDEBAR_ACTIVE_TEXT : SIDEBAR_TEXT_DIM,
                              letterSpacing: '0.01em',
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </Box>

      {/* Footer */}
      {sidebarOpen && (
        <Box sx={{
          borderTop: `1px solid ${SIDEBAR_DIVIDER}`,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: SIDEBAR_HEADER,
        }}>
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%',
            bgcolor: '#10b981',
            boxShadow: '0 0 6px rgba(16,185,129,0.5)',
            flexShrink: 0,
          }} />
          <Typography variant="caption" color={SIDEBAR_TEXT_DIM} noWrap sx={{ fontWeight: 500 }}>
            ezeeflo ERP v2.0
          </Typography>
        </Box>
      )}
      </Drawer>

      {/* Mini-mode Popover Flyout */}
      <Popover
        open={Boolean(miniMenu.anchor)}
        anchorEl={miniMenu.anchor}
        onClose={handleMiniMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              minWidth: 220,
              ml: 1,
              bgcolor: '#1f2937',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            },
          },
        }}
      >
        {miniMenu.item && (
          <Paper sx={{ bgcolor: 'transparent', py: 0.5 }} elevation={0}>
            <Typography variant="subtitle2" fontWeight={700}
              sx={{ px: 2, py: 1.2, color: '#e0e7ff', fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {miniMenu.item.text}
            </Typography>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 0.5 }} />
            <List disablePadding>
              {miniMenu.item.subItems?.map((sub) => (
                <ListItemButton
                  key={sub.text}
                  onClick={() => handleMiniSubClick(sub.path)}
                  selected={isActive(sub.path)}
                  disableRipple
                  sx={{
                    px: 2, py: 0.8, borderRadius: '0 8px 8px 0', mr: 1, mx: 0.5,
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                    '&.Mui-selected': {
                      bgcolor: 'rgba(99,102,241,0.16)',
                      borderLeft: '3px solid #6366f1',
                      '&:hover': { bgcolor: 'rgba(99,102,241,0.22)' },
                    },
                  }}
                >
                  <ListItemText
                    primary={sub.text}
                    primaryTypographyProps={{
                      fontSize: '0.8rem',
                      fontWeight: isActive(sub.path) ? 600 : 400,
                      color: isActive(sub.path) ? '#e0e7ff' : '#d1d5db',
                    }}
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