import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, Divider, Collapse, IconButton, Stack } from '@mui/material';
import { ExpandMore, ExpandLess, NewReleases } from '@mui/icons-material';

const RELEASES = [
  {
    version: 'v2.1.0',
    date: '2026-07-22',
    title: 'Audit Trail & History System',
    tag: 'Major',
    tagColor: 'primary',
    changes: [
      { type: 'New', text: 'Enterprise-grade Audit Trail system with centralized audit_logs table recording all system actions' },
      { type: 'New', text: 'Audit Service with 20+ methods: recordCreate, recordUpdate (field-level diff), recordDelete, recordLogin, recordLogout, recordCompanySwitch, recordPermissionChange, recordSubscriptionChange, recordPasswordChange, recordSystem, and more' },
      { type: 'New', text: 'Enhanced Audit Log model with 11 new fields: userEmail, userRole, module, entityReferenceNumber, requestId, sessionId, source (USER/SYSTEM/SCHEDULED_JOB/API/INTEGRATION), status, errorMessage, changedFields, metadata' },
      { type: 'New', text: '9 database indexes on audit_logs for high-performance filtering: tenant, user, action, module, entity, date-range, and entity history' },
      { type: 'New', text: 'Audit middleware factory — declarative audit on any route: router.post("/", audit("CREATE", "Sales", "Customer"), controller.create)' },
      { type: 'New', text: 'Audit Trail page under Administration menu with filter-on-demand: date range, action, module, entity, keyword search' },
      { type: 'New', text: 'Audit Detail page with full log details and side-by-side change comparison (previous value vs new value with highlighting)' },
      { type: 'New', text: 'Super Admin Audit Trail page for cross-company audit visibility' },
      { type: 'New', text: '9 Audit API endpoints: GET list (paginated/filtered), GET by ID, GET entity history, GET by user, GET by module, GET by company, plus 3 report endpoints (user activity, login activity, data changes)' },
      { type: 'New', text: '6 RBAC permissions: audit.view, audit.view_details, audit.export, audit.delete, audit.view_company, audit.view_all_companies' },
      { type: 'New', text: 'Multi-company data isolation — users only see logs for their active company; Super Admin can view all' },
      { type: 'New', text: 'Login/logout/failed login audit tracking with IP, user-agent, and failure reason' },
      { type: 'New', text: 'Company create/update/switch audit events with before/after values' },
      { type: 'New', text: 'Password change audit events (passwords masked as ********)' },
      { type: 'New', text: 'System-generated event support for background jobs, scheduled tasks, automated processes' },
      { type: 'Changed', text: 'Subscription plan update now auto-syncs all active company subscription modules' },
      { type: 'Fixed', text: 'Subscription creation failing due to missing tenantId in License number series generation' },
      { type: 'Fixed', text: 'Super Admin company subscriptions page filtered by selected company (now shows all companies)' },
      { type: 'Fixed', text: 'Second fallback 404 handler blocking React SPA serving in production deployment' },
    ],
  },
  {
    version: 'v2.0.0',
    date: '2026-07-05',
    title: 'Fixed Assets Management Module',
    tag: 'Major',
    tagColor: 'primary',
    changes: [
      { type: 'New', text: 'Asset Categories — Create and manage categories with depreciation settings and GL account mappings' },
      { type: 'New', text: 'Asset Register — Complete asset master with codes, serial numbers, barcodes, condition tracking' },
      { type: 'New', text: 'Asset Acquisition — Manual, bulk, and purchase-invoice-driven asset creation with journal entry posting' },
      { type: 'New', text: 'Asset Transfers — Transfer assets between locations, departments, custodians, warehouses, and branches' },
      { type: 'New', text: 'Asset Depreciation — 5 methods (Straight Line, Declining Balance, DDB, Units of Production, Manual) with monthly/quarterly/yearly frequency' },
      { type: 'New', text: 'Asset Disposal — Sale, scrap, donation, write-off, lost with auto gain/loss calculation and accounting' },
      { type: 'New', text: 'Asset Revaluation — Increase/decrease asset values with history and journal entries' },
      { type: 'New', text: 'Asset Maintenance — Preventive, corrective, and AMC contracts with service provider tracking' },
      { type: 'New', text: 'Asset Insurance — Policy management with premium, coverage, expiry alerts' },
      { type: 'New', text: 'Asset Locations — Hierarchical locations (buildings, floors, rooms, clinics, departments, warehouses)' },
      { type: 'New', text: 'Asset Custodians — Assign ownership to employees, doctors, or departments' },
      { type: 'New', text: 'Asset Audits — Physical verification with barcode/QR scanning, missing/found tracking' },
      { type: 'New', text: '10 Fixed Asset Reports — Asset Register, Depreciation Schedule, Movement, Disposal, Revaluation, Maintenance, Insurance Expiry, Warranty Expiry, Audit, Ledger' },
      { type: 'New', text: 'Accounting Integration — Auto journal entries for acquisition, depreciation, disposal, revaluation' },
      { type: 'New', text: 'Auto Number Series — FAC, AST, ACQ, ATR, DEP, DSP, REV, AMN, INS, AUD sequences' },
      { type: 'New', text: '12 RBAC Permissions — fixedasset.view, create, edit, delete, transfer, dispose, depreciate, revalue, audit, maintenance, insurance, report' },
      { type: 'Changed', text: 'Report workflow redesigned: Select report → Filters → Generate → View on screen → Print/Export' },
      { type: 'Changed', text: 'API version updated to 2.0.0 with complete Swagger documentation for Fixed Assets' },
    ],
  },
  {
    version: 'v1.0.0',
    date: '2026-06-17',
    title: 'Initial ERP Release',
    tag: 'Initial',
    tagColor: 'success',
    changes: [
      { type: 'New', text: 'Multi-tenant architecture with complete tenant isolation' },
      { type: 'New', text: 'JWT-based authentication with role-based access control (RBAC)' },
      { type: 'New', text: 'User management with role assignment' },
      { type: 'New', text: 'Chart of Accounts with hierarchical structure' },
      { type: 'New', text: 'Journal Entries & General Ledger with posting workflow' },
      { type: 'New', text: 'Sales lifecycle: Customers, Quotations, Sales Orders, Delivery Notes, Sales Invoices, Sales Returns, Credit Notes, Customer Payments' },
      { type: 'New', text: 'Purchase lifecycle: Suppliers, Purchase Requests, Purchase Orders, Goods Receipts, Purchase Invoices, Purchase Returns, Debit Notes, Supplier Payments' },
      { type: 'New', text: 'Inventory management: Items, Item Categories, Warehouses, Stock Transfers, Stock Adjustments, Inventory Balances' },
      { type: 'New', text: 'Bank management: Bank Accounts, Transactions, Payment Receipts, Payment Vouchers, Bank Reconciliation' },
      { type: 'New', text: 'Reporting & BI analytics dashboards' },
      { type: 'New', text: 'Security hardening: rate limiting, Helmet, input validation' },
    ],
  },
];

const ReleaseNotes = () => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (version) => {
    setExpanded((prev) => ({ ...prev, [version]: !prev[version] }));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <NewReleases color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Release Notes</Typography>
          <Typography variant="body2" color="text.secondary">Version history and changelog for EzeeFlo ERP</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Chip label="Current: v2.1.0" color="primary" />
      </Box>

      {RELEASES.map((release) => {
        const isExpanded = expanded[release.version] !== false; // default expanded
        return (
          <Paper key={release.version} sx={{ mb: 2, overflow: 'hidden' }}>
            <Box
              sx={{ p: 2, display: 'flex', alignItems: 'center', cursor: 'pointer', bgcolor: 'action.hover' }}
              onClick={() => toggleExpand(release.version)}
            >
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" fontWeight={700}>{release.version}</Typography>
                  <Chip label={release.tag} color={release.tagColor} size="small" />
                  <Typography variant="caption" color="text.secondary">{release.date}</Typography>
                </Stack>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>{release.title}</Typography>
              </Box>
              <IconButton size="small">
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Collapse in={isExpanded}>
              <Box sx={{ px: 2, pb: 2 }}>
                <Divider sx={{ mb: 1.5 }} />
                {release.changes.map((change, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, py: 0.3, alignItems: 'flex-start' }}>
                    <Chip
                      label={change.type}
                      size="small"
                      color={change.type === 'New' ? 'success' : change.type === 'Changed' ? 'warning' : change.type === 'Fixed' ? 'error' : 'default'}
                      variant="outlined"
                      sx={{ minWidth: 80, fontSize: '0.7rem' }}
                    />
                    <Typography variant="body2">{change.text}</Typography>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Paper>
        );
      })}
    </Box>
  );
};

export default ReleaseNotes;
