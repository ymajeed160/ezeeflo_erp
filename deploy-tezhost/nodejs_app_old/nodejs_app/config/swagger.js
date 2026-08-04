const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ERP Multi-Tenant API',
      version: '2.0.0',
      description: `
A comprehensive multi-tenant ERP system backend API built with Express.js and MySQL.

## Features
- Multi-tenant architecture with tenant isolation
- Role-based access control (RBAC) with granular permissions
- Complete financial management (Chart of Accounts, Journal Entries, General Ledger)
- Sales & Purchase lifecycle (Quotations → Orders → Invoices → Payments)
- Inventory management (Items, Warehouses, Stock Transfers, Adjustments)
- Bank management (Accounts, Transactions, Reconciliation)
- **Fixed Assets Management** (Categories, Register, Acquisition, Depreciation, Disposal, Transfers, Revaluation, Maintenance, Insurance, Locations, Custodians, Audits, Reports)
- Reporting & BI analytics

---

## Release Notes

### v2.0.0 (2026-07-05)
#### ✨ New Module: Fixed Assets Management
- **Asset Categories** — Create and manage asset categories with depreciation settings and GL account mappings
- **Asset Register** — Complete asset master with codes, serial numbers, barcodes, condition, and status tracking
- **Asset Acquisition** — Record acquisitions manually, from purchase invoices, or bulk-create multiple assets
- **Asset Transfers** — Transfer assets between locations, departments, custodians, warehouses, and branches
- **Asset Depreciation** — Calculate and post depreciation (Straight Line, Declining Balance, Double Declining, Units of Production, Manual) with monthly/quarterly/yearly frequency
- **Asset Disposal** — Dispose assets via sale, scrap, donation, write-off, or lost with automatic gain/loss calculation and journal entry posting
- **Asset Revaluation** — Revalue assets up or down with history tracking and accounting entries
- **Asset Maintenance** — Track preventive, corrective, and AMC contract maintenance with service providers and due date reminders
- **Asset Insurance** — Manage insurance policies with premium, coverage, expiry tracking, and renewal reminders
- **Asset Locations** — Hierarchical location management (building, floor, room, clinic, department, warehouse)
- **Asset Custodians** — Track asset responsibility by employee, doctor, or department
- **Asset Audits** — Physical verification with barcode/QR scanning, missing/found tracking
- **Fixed Asset Reports** — 10 reports including Asset Register, Depreciation Schedule, Movement, Disposal, Revaluation, Maintenance, Insurance Expiry, Warranty Expiry, Audit Report, Fixed Asset Ledger
- **Accounting Integration** — Automatic journal entries for acquisition, depreciation, disposal, and revaluation using existing Journal Entry Service
- **Number Series** — Auto-numbering for all transactions (FAC, AST, ACQ, ATR, DEP, DSP, REV, AMN, INS, AUD)
- **RBAC Permissions** — 12 granular permissions for the Fixed Assets module

### v1.0.0 (2026-06-17)
#### 🎉 Initial Release
- Multi-tenant architecture with tenant isolation
- Authentication & authorization with JWT
- Role-based access control (RBAC)
- User management
- Chart of Accounts
- Journal Entries & General Ledger
- Sales lifecycle: Customers, Quotations, Sales Orders, Delivery Notes, Sales Invoices, Sales Returns, Credit Notes, Customer Payments
- Purchase lifecycle: Suppliers, Purchase Requests, Purchase Orders, Goods Receipts, Purchase Invoices, Purchase Returns, Debit Notes, Supplier Payments
- Inventory management: Items, Item Categories, Warehouses, Stock Transfers, Stock Adjustments, Inventory Balances
- Bank management: Bank Accounts, Bank Transactions, Payment Receipts, Payment Vouchers, Bank Reconciliation
- Reporting & BI analytics
- Email configuration
- System configuration
- Security hardening (rate limiting, helmet, parameter validation)
      `.trim(),
      contact: {
        name: 'ERP MT Suite',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token to authenticate API requests',
        },
      },
      schemas: {
        // ===================== COMMON =====================
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 10 },
                    total: { type: 'integer', example: 100 },
                    totalPages: { type: 'integer', example: 10 },
                    hasNext: { type: 'boolean', example: true },
                    hasPrev: { type: 'boolean', example: false },
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 },
            hasNext: { type: 'boolean', example: true },
            hasPrev: { type: 'boolean', example: false },
          },
        },

        // ===================== AUTH =====================
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@erp.com' },
            password: { type: 'string', format: 'password', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    tenantId: { type: 'integer' },
                  },
                },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },

        // ===================== USER =====================
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            isActive: { type: 'boolean' },
            tenantId: { type: 'integer' },
            roles: { type: 'array', items: { type: 'object' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' },
            phone: { type: 'string', example: '+1234567890' },
            roles: { type: 'array', items: { type: 'integer' }, description: 'Role IDs' },
            isActive: { type: 'boolean', default: true },
          },
        },

        // ===================== ROLE =====================
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            isSystem: { type: 'boolean' },
            permissions: { type: 'array', items: { type: 'object' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ===================== PERMISSION =====================
        Permission: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            name: { type: 'string' },
            group: { type: 'string' },
          },
        },

        // ===================== ACCOUNT =====================
        Account: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['asset', 'liability', 'equity', 'income', 'expense'] },
            parentId: { type: 'integer', nullable: true },
            isActive: { type: 'boolean' },
            description: { type: 'string' },
          },
        },
        CreateAccountRequest: {
          type: 'object',
          required: ['code', 'name', 'type'],
          properties: {
            code: { type: 'string', example: '1000' },
            name: { type: 'string', example: 'Cash & Bank' },
            type: { type: 'string', enum: ['asset', 'liability', 'equity', 'income', 'expense'] },
            parentId: { type: 'integer', nullable: true },
            description: { type: 'string' },
          },
        },

        // ===================== JOURNAL ENTRY =====================
        JournalEntry: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            entryNumber: { type: 'string' },
            entryDate: { type: 'string', format: 'date' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'posted'] },
            lines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  accountId: { type: 'integer' },
                  debit: { type: 'number' },
                  credit: { type: 'number' },
                  description: { type: 'string' },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ===================== ITEM =====================
        Item: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            unit: { type: 'string' },
            categoryId: { type: 'integer' },
            purchasePrice: { type: 'number' },
            sellingPrice: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },

        // ===================== CUSTOMER =====================
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            taxId: { type: 'string' },
            creditLimit: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },

        // ===================== SUPPLIER =====================
        Supplier: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            taxId: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },

        // ===================== SALES =====================
        Quotation: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            number: { type: 'string' },
            customerId: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            validUntil: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['draft', 'sent', 'accepted', 'rejected'] },
            totalAmount: { type: 'number' },
            lines: { type: 'array', items: { type: 'object' } },
          },
        },
        SalesOrder: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            number: { type: 'string' },
            customerId: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'] },
            totalAmount: { type: 'number' },
            lines: { type: 'array', items: { type: 'object' } },
          },
        },
        SalesInvoice: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            number: { type: 'string' },
            customerId: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            dueDate: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['draft', 'posted', 'paid', 'overdue', 'cancelled'] },
            totalAmount: { type: 'number' },
            balanceDue: { type: 'number' },
          },
        },

        // ===================== PURCHASE =====================
        PurchaseOrder: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            number: { type: 'string' },
            supplierId: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['draft', 'sent', 'confirmed', 'received', 'cancelled'] },
            totalAmount: { type: 'number' },
            lines: { type: 'array', items: { type: 'object' } },
          },
        },
        GoodsReceipt: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            number: { type: 'string' },
            purchaseOrderId: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['draft', 'completed', 'cancelled'] },
            lines: { type: 'array', items: { type: 'object' } },
          },
        },

        // ===================== WAREHOUSE =====================
        Warehouse: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            code: { type: 'string' },
            name: { type: 'string' },
            location: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },

        // ===================== BANK =====================
        BankAccount: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            accountNumber: { type: 'string' },
            bankName: { type: 'string' },
            accountType: { type: 'string', enum: ['checking', 'savings', 'credit'] },
            currency: { type: 'string', default: 'USD' },
            isActive: { type: 'boolean' },
          },
        },
        BankTransaction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            bankAccountId: { type: 'integer' },
            transactionDate: { type: 'string', format: 'date' },
            description: { type: 'string' },
            reference: { type: 'string' },
            debit: { type: 'number' },
            credit: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'cleared', 'reconciled'] },
          },
        },
        BankReconciliation: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            bankAccountId: { type: 'integer' },
            statementDate: { type: 'string', format: 'date' },
            statementBalance: { type: 'number' },
            systemBalance: { type: 'number' },
            difference: { type: 'number' },
            status: { type: 'string', enum: ['in-progress', 'completed'] },
          },
        },

        // ===================== FIXED ASSETS =====================
        AssetCategory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            categoryCode: { type: 'string', example: 'FAC-000001' },
            categoryName: { type: 'string', example: 'IT Equipment' },
            usefulLifeYears: { type: 'integer', example: 5 },
            depreciationMethod: { type: 'string', enum: ['straight_line', 'declining_balance', 'double_declining_balance', 'units_of_production', 'manual'] },
            defaultAssetAccountId: { type: 'string', format: 'uuid', nullable: true },
            accumulatedDepreciationAccountId: { type: 'string', format: 'uuid', nullable: true },
            depreciationExpenseAccountId: { type: 'string', format: 'uuid', nullable: true },
            gainOnDisposalAccountId: { type: 'string', format: 'uuid', nullable: true },
            lossOnDisposalAccountId: { type: 'string', format: 'uuid', nullable: true },
            residualValuePercentage: { type: 'number', example: 10 },
            description: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            assetCode: { type: 'string', example: 'AST-000001' },
            assetName: { type: 'string' },
            categoryId: { type: 'string', format: 'uuid' },
            category: { type: 'object' },
            serialNumber: { type: 'string' },
            barcode: { type: 'string' },
            manufacturer: { type: 'string' },
            model: { type: 'string' },
            purchaseDate: { type: 'string', format: 'date' },
            purchaseCost: { type: 'number' },
            residualValue: { type: 'number' },
            usefulLife: { type: 'integer' },
            depreciationMethod: { type: 'string' },
            accumulatedDepreciation: { type: 'number' },
            currentBookValue: { type: 'number' },
            location: { type: 'string' },
            department: { type: 'string' },
            custodian: { type: 'string' },
            warrantyExpiry: { type: 'string', format: 'date' },
            condition: { type: 'string', enum: ['new', 'good', 'fair', 'poor', 'damaged', 'obsolete'] },
            status: { type: 'string', enum: ['draft', 'active', 'disposed', 'sold', 'transferred', 'under_maintenance', 'retired', 'lost'] },
          },
        },
        AssetAcquisition: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            acquisitionNumber: { type: 'string', example: 'ACQ-000001' },
            acquisitionDate: { type: 'string', format: 'date' },
            acquisitionType: { type: 'string', enum: ['manual', 'purchase_invoice', 'goods_receipt', 'bulk'] },
            supplierId: { type: 'string', format: 'uuid', nullable: true },
            totalCost: { type: 'number' },
            isPosted: { type: 'boolean' },
            journalEntryId: { type: 'string', format: 'uuid', nullable: true },
            lines: { type: 'array', items: { type: 'object' } },
          },
        },
        AssetTransfer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            transferNumber: { type: 'string', example: 'ATR-000001' },
            transferDate: { type: 'string', format: 'date' },
            assetId: { type: 'string', format: 'uuid' },
            fromLocation: { type: 'string' },
            toLocation: { type: 'string' },
            fromDepartment: { type: 'string' },
            toDepartment: { type: 'string' },
            fromCustodian: { type: 'string' },
            toCustodian: { type: 'string' },
          },
        },
        AssetDepreciation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            depreciationNumber: { type: 'string', example: 'DEP-000001' },
            assetId: { type: 'string', format: 'uuid' },
            depreciationDate: { type: 'string', format: 'date' },
            frequency: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'] },
            depreciationMethod: { type: 'string' },
            depreciationAmount: { type: 'number' },
            accumulatedDepreciationAfter: { type: 'number' },
            bookValueAfter: { type: 'number' },
            isPosted: { type: 'boolean' },
          },
        },
        AssetDisposal: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            disposalNumber: { type: 'string', example: 'DSP-000001' },
            assetId: { type: 'string', format: 'uuid' },
            disposalDate: { type: 'string', format: 'date' },
            disposalType: { type: 'string', enum: ['sale', 'scrap', 'donation', 'write_off', 'lost'] },
            saleAmount: { type: 'number' },
            netBookValue: { type: 'number' },
            gainOnDisposal: { type: 'number' },
            lossOnDisposal: { type: 'number' },
            isPosted: { type: 'boolean' },
          },
        },
        AssetMaintenance: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            maintenanceNumber: { type: 'string', example: 'AMN-000001' },
            assetId: { type: 'string', format: 'uuid' },
            maintenanceType: { type: 'string', enum: ['preventive', 'corrective', 'amc'] },
            title: { type: 'string' },
            serviceProvider: { type: 'string' },
            maintenanceDate: { type: 'string', format: 'date' },
            nextDueDate: { type: 'string', format: 'date' },
            cost: { type: 'number' },
            status: { type: 'string', enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] },
          },
        },
        AssetRevaluation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            revaluationNumber: { type: 'string', example: 'REV-000001' },
            assetId: { type: 'string', format: 'uuid' },
            revaluationDate: { type: 'string', format: 'date' },
            revaluationType: { type: 'string', enum: ['increase', 'decrease'] },
            previousValue: { type: 'number' },
            revaluationAmount: { type: 'number' },
            newValue: { type: 'number' },
            isPosted: { type: 'boolean' },
          },
        },
        AssetInsurance: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            insuranceNumber: { type: 'string', example: 'INS-000001' },
            assetId: { type: 'string', format: 'uuid' },
            insuranceCompany: { type: 'string' },
            policyNumber: { type: 'string' },
            premium: { type: 'number' },
            coverageAmount: { type: 'number' },
            startDate: { type: 'string', format: 'date' },
            expiryDate: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['active', 'expired', 'cancelled'] },
          },
        },
        AssetLocation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            locationCode: { type: 'string' },
            locationName: { type: 'string' },
            locationType: { type: 'string', enum: ['building', 'floor', 'room', 'clinic', 'department', 'warehouse'] },
            parentId: { type: 'string', format: 'uuid', nullable: true },
            isActive: { type: 'boolean' },
          },
        },
        AssetCustodian: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            custodianCode: { type: 'string' },
            custodianName: { type: 'string' },
            custodianType: { type: 'string', enum: ['employee', 'doctor', 'department'] },
            email: { type: 'string' },
            phone: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        AssetAudit: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            auditNumber: { type: 'string', example: 'AUD-000001' },
            assetId: { type: 'string', format: 'uuid' },
            auditDate: { type: 'string', format: 'date' },
            verifiedLocation: { type: 'string' },
            verifiedCondition: { type: 'string' },
            isVerified: { type: 'boolean' },
            isMissing: { type: 'boolean' },
            remarks: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'API health check' },
      { name: 'Auth', description: 'Authentication & authorization' },
      { name: 'Users', description: 'User management' },
      { name: 'Roles', description: 'Role management & RBAC' },
      { name: 'Permissions', description: 'Permission management' },
      { name: 'Accounts', description: 'Chart of accounts' },
      { name: 'Journal Entries', description: 'Journal entry management' },
      { name: 'General Ledger', description: 'General ledger & reporting' },
      { name: 'Tenant', description: 'Tenant management' },
      { name: 'Item Categories', description: 'Item category master' },
      { name: 'Items', description: 'Item/product master' },
      { name: 'Warehouses', description: 'Warehouse management' },
      { name: 'Inventory', description: 'Inventory balances & transactions' },
      { name: 'Stock Adjustments', description: 'Stock adjustment transactions' },
      { name: 'Stock Transfers', description: 'Stock transfer between warehouses' },
      { name: 'Customers', description: 'Customer master data' },
      { name: 'Quotations', description: 'Sales quotations' },
      { name: 'Sales Orders', description: 'Sales order management' },
      { name: 'Delivery Notes', description: 'Delivery note management' },
      { name: 'Sales Invoices', description: 'Sales invoicing' },
      { name: 'Sales Returns', description: 'Sales returns processing' },
      { name: 'Credit Notes', description: 'Credit note management' },
      { name: 'Customer Payments', description: 'Customer payment collection' },
      { name: 'Suppliers', description: 'Supplier master data' },
      { name: 'Purchase Requests', description: 'Purchase requisitions' },
      { name: 'Purchase Orders', description: 'Purchase order management' },
      { name: 'Goods Receipts', description: 'Goods receipt processing' },
      { name: 'Purchase Invoices', description: 'Purchase invoicing' },
      { name: 'Purchase Returns', description: 'Purchase returns processing' },
      { name: 'Debit Notes', description: 'Debit note management' },
      { name: 'Supplier Payments', description: 'Supplier payment processing' },
      { name: 'Bank Accounts', description: 'Bank account master' },
      { name: 'Bank Transactions', description: 'Bank transaction management' },
      { name: 'Payment Receipts', description: 'Payment receipt vouchers' },
      { name: 'Payment Vouchers', description: 'Payment vouchers' },
      { name: 'Bank Reconciliations', description: 'Bank reconciliation' },
      { name: 'Dashboard', description: 'Dashboard & analytics' },
      { name: 'Reports', description: 'Report generation' },
      { name: 'BI', description: 'Business intelligence' },
      { name: 'Settings', description: 'System configuration' },
      { name: 'Fixed Assets', description: 'Fixed asset management (categories, register, acquisition, depreciation, disposal, transfers, revaluation, maintenance, insurance, locations, custodians, audits, reports)' },
    ],
    paths: {
      // ===================== HEALTH =====================
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          description: 'Returns the current status of the API server',
          responses: {
            200: {
              description: 'API is running',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          uptime: { type: 'number', description: 'Server uptime in seconds' },
                          timestamp: { type: 'string', format: 'date-time' },
                          environment: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ===================== AUTH =====================
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          description: 'Authenticate user credentials and return JWT tokens',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/auth/refresh-token': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh token',
          description: 'Exchange a valid refresh token for a new access token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Token refreshed successfully' },
            401: { description: 'Invalid refresh token' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user',
          description: 'Returns the authenticated user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'User profile retrieved', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout',
          description: 'Invalidate the current session',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Logged out successfully' } },
        },
      },
      '/api/auth/change-password': {
        post: {
          tags: ['Auth'],
          summary: 'Change password',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    currentPassword: { type: 'string' },
                    newPassword: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Password changed successfully' } },
        },
      },

      // ===================== USERS =====================
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'List users',
          description: 'Get a paginated list of users',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by name or email' },
            { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
          ],
          responses: { 200: { description: 'List of users' } },
        },
        post: {
          tags: ['Users'],
          summary: 'Create user',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } } } },
          responses: { 201: { description: 'User created' } },
        },
      },
      '/api/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get user by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'User details' } },
        },
        put: {
          tags: ['Users'],
          summary: 'Update user',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'User updated' } },
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete user',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'User deleted' } },
        },
      },

      // ===================== ROLES =====================
      '/api/roles': {
        get: {
          tags: ['Roles'],
          summary: 'List roles',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of roles' } },
        },
        post: {
          tags: ['Roles'],
          summary: 'Create role',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    permissions: { type: 'array', items: { type: 'integer' }, description: 'Permission IDs' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Role created' } },
        },
      },
      '/api/roles/{id}': {
        get: { tags: ['Roles'], summary: 'Get role by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Role details' } } },
        put: { tags: ['Roles'], summary: 'Update role', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Role updated' } } },
        delete: { tags: ['Roles'], summary: 'Delete role', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Role deleted' } } },
      },

      // ===================== PERMISSIONS =====================
      '/api/permissions': {
        get: {
          tags: ['Permissions'],
          summary: 'List all permissions',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of permissions' } },
        },
      },

      // ===================== ACCOUNTS =====================
      '/api/accounts': {
        get: {
          tags: ['Accounts'],
          summary: 'List accounts',
          description: 'Get paginated list of chart of accounts',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'type', schema: { type: 'string', enum: ['asset', 'liability', 'equity', 'income', 'expense'] } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'List of accounts' } },
        },
        post: {
          tags: ['Accounts'],
          summary: 'Create account',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAccountRequest' } } } },
          responses: { 201: { description: 'Account created' } },
        },
      },
      '/api/accounts/tree': {
        get: {
          tags: ['Accounts'],
          summary: 'Get account tree',
          description: 'Returns accounts in hierarchical tree structure',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Account tree' } },
        },
      },
      '/api/accounts/{id}': {
        get: { tags: ['Accounts'], summary: 'Get account by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Account details' } } },
        put: { tags: ['Accounts'], summary: 'Update account', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Account updated' } } },
        delete: { tags: ['Accounts'], summary: 'Delete account', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Account deleted' } } },
      },

      // ===================== JOURNAL ENTRIES =====================
      '/api/journal-entries': {
        get: {
          tags: ['Journal Entries'],
          summary: 'List journal entries',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['draft', 'posted'] } },
          ],
          responses: { 200: { description: 'List of journal entries' } },
        },
        post: {
          tags: ['Journal Entries'],
          summary: 'Create journal entry',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['entryDate', 'description', 'lines'],
                  properties: {
                    entryDate: { type: 'string', format: 'date' },
                    description: { type: 'string' },
                    lines: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          accountId: { type: 'integer' },
                          debit: { type: 'number' },
                          credit: { type: 'number' },
                          description: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Journal entry created' } },
        },
      },
      '/api/journal-entries/{id}': {
        get: { tags: ['Journal Entries'], summary: 'Get journal entry', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Journal entry details' } } },
      },

      // ===================== GENERAL LEDGER =====================
      '/api/general-ledger': {
        get: {
          tags: ['General Ledger'],
          summary: 'Get general ledger',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'accountId', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'General ledger data' } },
        },
      },

      // ===================== ITEMS =====================
      '/api/items': {
        get: {
          tags: ['Items'],
          summary: 'List items',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'categoryId', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'List of items' } },
        },
        post: {
          tags: ['Items'],
          summary: 'Create item',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code', 'name'],
                  properties: {
                    code: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    unit: { type: 'string' },
                    categoryId: { type: 'integer' },
                    purchasePrice: { type: 'number' },
                    sellingPrice: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Item created' } },
        },
      },
      '/api/items/{id}': {
        get: { tags: ['Items'], summary: 'Get item', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Item details' } } },
        put: { tags: ['Items'], summary: 'Update item', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Item updated' } } },
        delete: { tags: ['Items'], summary: 'Delete item', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Item deleted' } } },
      },

      // ===================== CUSTOMERS =====================
      '/api/customers': {
        get: {
          tags: ['Customers'],
          summary: 'List customers',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'List of customers' } },
        },
        post: {
          tags: ['Customers'],
          summary: 'Create customer',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    code: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    taxId: { type: 'string' },
                    creditLimit: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Customer created' } },
        },
      },
      '/api/customers/{id}': {
        get: { tags: ['Customers'], summary: 'Get customer', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Customer details' } } },
        put: { tags: ['Customers'], summary: 'Update customer', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Customer updated' } } },
        delete: { tags: ['Customers'], summary: 'Delete customer', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Customer deleted' } } },
      },

      // ===================== SUPPLIERS =====================
      '/api/suppliers': {
        get: { tags: ['Suppliers'], summary: 'List suppliers', security: [{ bearerAuth: [] }], parameters: [{ in: 'query', name: 'page', schema: { type: 'integer' } }, { in: 'query', name: 'limit', schema: { type: 'integer' } }, { in: 'query', name: 'search', schema: { type: 'string' } }], responses: { 200: { description: 'List of suppliers' } } },
        post: {
          tags: ['Suppliers'],
          summary: 'Create supplier',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    code: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, taxId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Supplier created' } },
        },
      },
      '/api/suppliers/{id}': {
        get: { tags: ['Suppliers'], summary: 'Get supplier', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Supplier details' } } },
        put: { tags: ['Suppliers'], summary: 'Update supplier', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Supplier updated' } } },
        delete: { tags: ['Suppliers'], summary: 'Delete supplier', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Supplier deleted' } } },
      },

      // ===================== SALES MODULE =====================
      '/api/quotations': {
        get: { tags: ['Quotations'], summary: 'List quotations', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of quotations' } } },
        post: { tags: ['Quotations'], summary: 'Create quotation', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Quotation created' } } },
      },
      '/api/sales-orders': {
        get: { tags: ['Sales Orders'], summary: 'List sales orders', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of sales orders' } } },
        post: { tags: ['Sales Orders'], summary: 'Create sales order', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Sales order created' } } },
      },
      '/api/delivery-notes': {
        get: { tags: ['Delivery Notes'], summary: 'List delivery notes', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of delivery notes' } } },
        post: { tags: ['Delivery Notes'], summary: 'Create delivery note', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Delivery note created' } } },
      },
      '/api/sales-invoices': {
        get: { tags: ['Sales Invoices'], summary: 'List sales invoices', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of sales invoices' } } },
        post: { tags: ['Sales Invoices'], summary: 'Create sales invoice', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Sales invoice created' } } },
      },
      '/api/sales-returns': {
        get: { tags: ['Sales Returns'], summary: 'List sales returns', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of sales returns' } } },
        post: { tags: ['Sales Returns'], summary: 'Create sales return', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Sales return created' } } },
      },
      '/api/credit-notes': {
        get: { tags: ['Credit Notes'], summary: 'List credit notes', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of credit notes' } } },
        post: { tags: ['Credit Notes'], summary: 'Create credit note', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Credit note created' } } },
      },
      '/api/customer-payments': {
        get: { tags: ['Customer Payments'], summary: 'List customer payments', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of customer payments' } } },
        post: { tags: ['Customer Payments'], summary: 'Create customer payment', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Payment created' } } },
      },

      // ===================== PURCHASE MODULE =====================
      '/api/purchase-requests': {
        get: { tags: ['Purchase Requests'], summary: 'List purchase requests', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of purchase requests' } } },
        post: { tags: ['Purchase Requests'], summary: 'Create purchase request', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Purchase request created' } } },
      },
      '/api/purchase-orders': {
        get: { tags: ['Purchase Orders'], summary: 'List purchase orders', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of purchase orders' } } },
        post: { tags: ['Purchase Orders'], summary: 'Create purchase order', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Purchase order created' } } },
      },
      '/api/goods-receipts': {
        get: { tags: ['Goods Receipts'], summary: 'List goods receipts', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of goods receipts' } } },
        post: { tags: ['Goods Receipts'], summary: 'Create goods receipt', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Goods receipt created' } } },
      },
      '/api/purchase-invoices': {
        get: { tags: ['Purchase Invoices'], summary: 'List purchase invoices', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of purchase invoices' } } },
        post: { tags: ['Purchase Invoices'], summary: 'Create purchase invoice', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Purchase invoice created' } } },
      },
      '/api/purchase-returns': {
        get: { tags: ['Purchase Returns'], summary: 'List purchase returns', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of purchase returns' } } },
        post: { tags: ['Purchase Returns'], summary: 'Create purchase return', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Purchase return created' } } },
      },
      '/api/debit-notes': {
        get: { tags: ['Debit Notes'], summary: 'List debit notes', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of debit notes' } } },
        post: { tags: ['Debit Notes'], summary: 'Create debit note', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Debit note created' } } },
      },
      '/api/supplier-payments': {
        get: { tags: ['Supplier Payments'], summary: 'List supplier payments', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of supplier payments' } } },
        post: { tags: ['Supplier Payments'], summary: 'Create supplier payment', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Payment created' } } },
      },

      // ===================== WAREHOUSES =====================
      '/api/warehouses': {
        get: { tags: ['Warehouses'], summary: 'List warehouses', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of warehouses' } } },
        post: { tags: ['Warehouses'], summary: 'Create warehouse', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Warehouse created' } } },
      },

      // ===================== INVENTORY =====================
      '/api/inventory': {
        get: { tags: ['Inventory'], summary: 'Get inventory balances', security: [{ bearerAuth: [] }], parameters: [{ in: 'query', name: 'warehouseId', schema: { type: 'integer' } }, { in: 'query', name: 'itemId', schema: { type: 'integer' } }], responses: { 200: { description: 'Inventory balances' } } },
      },
      '/api/stock-adjustments': {
        get: { tags: ['Stock Adjustments'], summary: 'List stock adjustments', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of stock adjustments' } } },
        post: { tags: ['Stock Adjustments'], summary: 'Create stock adjustment', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Stock adjustment created' } } },
      },
      '/api/stock-transfers': {
        get: { tags: ['Stock Transfers'], summary: 'List stock transfers', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of stock transfers' } } },
        post: { tags: ['Stock Transfers'], summary: 'Create stock transfer', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Stock transfer created' } } },
      },

      // ===================== BANK =====================
      '/api/bank-accounts': {
        get: { tags: ['Bank Accounts'], summary: 'List bank accounts', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of bank accounts' } } },
        post: { tags: ['Bank Accounts'], summary: 'Create bank account', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Bank account created' } } },
      },
      '/api/bank-transactions': {
        get: { tags: ['Bank Transactions'], summary: 'List bank transactions', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of bank transactions' } } },
        post: { tags: ['Bank Transactions'], summary: 'Create bank transaction', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Bank transaction created' } } },
      },
      '/api/bank-reconciliations': {
        get: { tags: ['Bank Reconciliations'], summary: 'List reconciliations', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of reconciliations' } } },
        post: { tags: ['Bank Reconciliations'], summary: 'Create reconciliation', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Reconciliation created' } } },
      },
      '/api/payment-receipts': {
        get: { tags: ['Payment Receipts'], summary: 'List payment receipts', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of payment receipts' } } },
        post: { tags: ['Payment Receipts'], summary: 'Create payment receipt', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Payment receipt created' } } },
      },
      '/api/payment-vouchers': {
        get: { tags: ['Payment Vouchers'], summary: 'List payment vouchers', security: [{ bearerAuth: [] }], responses: { 200: { description: 'List of payment vouchers' } } },
        post: { tags: ['Payment Vouchers'], summary: 'Create payment voucher', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Payment voucher created' } } },
      },

      // ===================== DASHBOARD / BI =====================
      '/api/dashboard': {
        get: { tags: ['Dashboard'], summary: 'Get dashboard data', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Dashboard data' } } },
      },
      '/api/reports': {
        get: { tags: ['Reports'], summary: 'Generate reports', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Report data' } } },
      },
      '/api/bi': {
        get: { tags: ['BI'], summary: 'BI analytics data', security: [{ bearerAuth: [] }], responses: { 200: { description: 'BI data' } } },
      },

      // ===================== SETTINGS =====================
      '/api/settings': {
        get: { tags: ['Settings'], summary: 'Get system settings', security: [{ bearerAuth: [] }], responses: { 200: { description: 'System settings' } } },
        put: { tags: ['Settings'], summary: 'Update system settings', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Settings updated' } } },
      },

      // ===================== FIXED ASSETS =====================

      // -- Asset Categories --
      '/api/asset-categories': {
        get: { tags: ['Fixed Assets'], summary: 'List asset categories', security: [{ bearerAuth: [] }], parameters: [{ in: 'query', name: 'page', schema: { type: 'integer' } }, { in: 'query', name: 'limit', schema: { type: 'integer' } }, { in: 'query', name: 'search', schema: { type: 'string' } }], responses: { 200: { description: 'Paginated list of asset categories' } } },
        post: { tags: ['Fixed Assets'], summary: 'Create asset category', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetCategory' } } } }, responses: { 201: { description: 'Asset category created' } } },
      },
      '/api/asset-categories/active': {
        get: { tags: ['Fixed Assets'], summary: 'Get active asset categories (compact)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Active asset categories' } } },
      },
      '/api/asset-categories/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get asset category by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Asset category details' } } },
        put: { tags: ['Fixed Assets'], summary: 'Update asset category', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Asset category updated' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete asset category', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Asset category deleted' } } },
      },
      '/api/asset-categories/{id}/toggle-status': {
        patch: { tags: ['Fixed Assets'], summary: 'Toggle asset category active status', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Status toggled' } } },
      },

      // -- Asset Register --
      '/api/assets': {
        get: { tags: ['Fixed Assets'], summary: 'List assets', security: [{ bearerAuth: [] }], parameters: [{ in: 'query', name: 'page', schema: { type: 'integer' } }, { in: 'query', name: 'limit', schema: { type: 'integer' } }, { in: 'query', name: 'status', schema: { type: 'string' } }, { in: 'query', name: 'search', schema: { type: 'string' } }], responses: { 200: { description: 'Paginated list of assets' } } },
        post: { tags: ['Fixed Assets'], summary: 'Create asset', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Asset' } } } }, responses: { 201: { description: 'Asset created' } } },
      },
      '/api/assets/active': {
        get: { tags: ['Fixed Assets'], summary: 'Get active assets (compact)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Active assets' } } },
      },
      '/api/assets/next-code': {
        get: { tags: ['Fixed Assets'], summary: 'Get next asset code', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Next asset code' } } },
      },
      '/api/assets/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get asset by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Asset details' } } },
        put: { tags: ['Fixed Assets'], summary: 'Update asset', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Asset updated' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete asset', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Asset deleted' } } },
      },
      '/api/assets/{id}/status': {
        patch: { tags: ['Fixed Assets'], summary: 'Update asset status', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Asset status updated' } } },
      },

      // -- Asset Acquisitions --
      '/api/asset-acquisitions': {
        get: { tags: ['Fixed Assets'], summary: 'List acquisitions', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Paginated list of acquisitions' } } },
        post: { tags: ['Fixed Assets'], summary: 'Create acquisition with asset lines', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetAcquisition' } } } }, responses: { 201: { description: 'Acquisition created' } } },
      },
      '/api/asset-acquisitions/next-number': {
        get: { tags: ['Fixed Assets'], summary: 'Get next acquisition number', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Next ACQ number' } } },
      },
      '/api/asset-acquisitions/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get acquisition by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Acquisition details with lines' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete acquisition', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Acquisition deleted' } } },
      },
      '/api/asset-acquisitions/{id}/post': {
        post: { tags: ['Fixed Assets'], summary: 'Post acquisition (create journal entry)', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Acquisition posted' } } },
      },
      '/api/asset-acquisitions/{id}/reverse': {
        post: { tags: ['Fixed Assets'], summary: 'Reverse acquisition', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Acquisition reversed' } } },
      },

      // -- Asset Transfers --
      '/api/asset-transfers': {
        get: { tags: ['Fixed Assets'], summary: 'List asset transfers', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Paginated list of transfers' } } },
        post: { tags: ['Fixed Assets'], summary: 'Create asset transfer', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetTransfer' } } } }, responses: { 201: { description: 'Transfer created' } } },
      },
      '/api/asset-transfers/next-number': { get: { tags: ['Fixed Assets'], summary: 'Get next transfer number', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Next ATR number' } } } },
      '/api/asset-transfers/by-asset/{assetId}': { get: { tags: ['Fixed Assets'], summary: 'Get transfer history by asset', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'assetId', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Transfer history' } } } },
      '/api/asset-transfers/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get transfer by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Transfer details' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete transfer', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Transfer deleted' } } },
      },

      // -- Asset Depreciation --
      '/api/asset-depreciations': {
        get: { tags: ['Fixed Assets'], summary: 'List depreciation records', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Paginated list of depreciations' } } },
      },
      '/api/asset-depreciations/next-number': { get: { tags: ['Fixed Assets'], summary: 'Get next depreciation number', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Next DEP number' } } } },
      '/api/asset-depreciations/preview': {
        post: { tags: ['Fixed Assets'], summary: 'Preview depreciation calculation', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { assetId: { type: 'string', format: 'uuid' }, frequency: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'] } } } } } }, responses: { 200: { description: 'Depreciation preview with schedule' } } },
      },
      '/api/asset-depreciations/post': {
        post: { tags: ['Fixed Assets'], summary: 'Post depreciation (create journal entry)', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { assetId: { type: 'string', format: 'uuid' }, depreciationDate: { type: 'string', format: 'date' }, frequency: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'] } } } } } }, responses: { 201: { description: 'Depreciation posted' } } },
      },
      '/api/asset-depreciations/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get depreciation by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Depreciation details' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete depreciation record', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Depreciation deleted' } } },
      },
      '/api/asset-depreciations/{id}/reverse': {
        post: { tags: ['Fixed Assets'], summary: 'Reverse depreciation', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Depreciation reversed' } } },
      },

      // -- Asset Disposals --
      '/api/asset-disposals': {
        get: { tags: ['Fixed Assets'], summary: 'List disposals', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Paginated list of disposals' } } },
        post: { tags: ['Fixed Assets'], summary: 'Create disposal', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetDisposal' } } } }, responses: { 201: { description: 'Disposal created' } } },
      },
      '/api/asset-disposals/next-number': { get: { tags: ['Fixed Assets'], summary: 'Get next disposal number', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Next DSP number' } } } },
      '/api/asset-disposals/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get disposal by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Disposal details' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete disposal', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Disposal deleted' } } },
      },
      '/api/asset-disposals/{id}/post': { post: { tags: ['Fixed Assets'], summary: 'Post disposal (create journal entry)', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Disposal posted' } } } },
      '/api/asset-disposals/{id}/reverse': { post: { tags: ['Fixed Assets'], summary: 'Reverse disposal', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Disposal reversed' } } } },

      // -- Asset Revaluations --
      '/api/asset-revaluations': {
        get: { tags: ['Fixed Assets'], summary: 'List revaluations', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Paginated list of revaluations' } } },
        post: { tags: ['Fixed Assets'], summary: 'Create revaluation', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetRevaluation' } } } }, responses: { 201: { description: 'Revaluation created' } } },
      },
      '/api/asset-revaluations/next-number': { get: { tags: ['Fixed Assets'], summary: 'Get next revaluation number', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Next REV number' } } } },
      '/api/asset-revaluations/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get revaluation by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Revaluation details' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete revaluation', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Revaluation deleted' } } },
      },
      '/api/asset-revaluations/{id}/post': { post: { tags: ['Fixed Assets'], summary: 'Post revaluation (create journal entry)', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Revaluation posted' } } } },

      // -- Asset Maintenance --
      '/api/asset-maintenances': {
        get: { tags: ['Fixed Assets'], summary: 'List maintenance records', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Paginated list of maintenance records' } } },
        post: { tags: ['Fixed Assets'], summary: 'Create maintenance record', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetMaintenance' } } } }, responses: { 201: { description: 'Maintenance created' } } },
      },
      '/api/asset-maintenances/next-number': { get: { tags: ['Fixed Assets'], summary: 'Get next maintenance number', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Next AMN number' } } } },
      '/api/asset-maintenances/due-reminders': { get: { tags: ['Fixed Assets'], summary: 'Get upcoming maintenance reminders', security: [{ bearerAuth: [] }], parameters: [{ in: 'query', name: 'days', schema: { type: 'integer' } }], responses: { 200: { description: 'Due maintenance list' } } } },
      '/api/asset-maintenances/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get maintenance by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Maintenance details' } } },
        put: { tags: ['Fixed Assets'], summary: 'Update maintenance record', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Maintenance updated' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete maintenance record', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Maintenance deleted' } } },
      },

      // -- Asset Insurance --
      '/api/asset-insurances': {
        get: { tags: ['Fixed Assets'], summary: 'List insurance policies', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Paginated list of insurance policies' } } },
        post: { tags: ['Fixed Assets'], summary: 'Create insurance policy', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetInsurance' } } } }, responses: { 201: { description: 'Insurance created' } } },
      },
      '/api/asset-insurances/next-number': { get: { tags: ['Fixed Assets'], summary: 'Get next insurance number', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Next INS number' } } } },
      '/api/asset-insurances/expiring': { get: { tags: ['Fixed Assets'], summary: 'Get expiring insurance policies', security: [{ bearerAuth: [] }], parameters: [{ in: 'query', name: 'days', schema: { type: 'integer' } }], responses: { 200: { description: 'Expiring policies' } } } },
      '/api/asset-insurances/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get insurance by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Insurance details' } } },
        put: { tags: ['Fixed Assets'], summary: 'Update insurance policy', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Insurance updated' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete insurance policy', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Insurance deleted' } } },
      },

      // -- Asset Locations --
      '/api/asset-locations': {
        get: { tags: ['Fixed Assets'], summary: 'List asset locations', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Paginated list of locations' } } },
        post: { tags: ['Fixed Assets'], summary: 'Create location', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetLocation' } } } }, responses: { 201: { description: 'Location created' } } },
      },
      '/api/asset-locations/active': { get: { tags: ['Fixed Assets'], summary: 'Get active locations', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Active locations' } } } },
      '/api/asset-locations/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get location by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Location details' } } },
        put: { tags: ['Fixed Assets'], summary: 'Update location', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Location updated' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete location', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Location deleted' } } },
      },
      '/api/asset-locations/{id}/toggle-status': { patch: { tags: ['Fixed Assets'], summary: 'Toggle location status', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Status toggled' } } } },

      // -- Asset Custodians --
      '/api/asset-custodians': {
        get: { tags: ['Fixed Assets'], summary: 'List custodians', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Paginated list of custodians' } } },
        post: { tags: ['Fixed Assets'], summary: 'Create custodian', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetCustodian' } } } }, responses: { 201: { description: 'Custodian created' } } },
      },
      '/api/asset-custodians/active': { get: { tags: ['Fixed Assets'], summary: 'Get active custodians', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Active custodians' } } } },
      '/api/asset-custodians/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get custodian by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Custodian details' } } },
        put: { tags: ['Fixed Assets'], summary: 'Update custodian', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Custodian updated' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete custodian', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Custodian deleted' } } },
      },
      '/api/asset-custodians/{id}/toggle-status': { patch: { tags: ['Fixed Assets'], summary: 'Toggle custodian status', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Status toggled' } } } },

      // -- Asset Audits --
      '/api/asset-audits': {
        get: { tags: ['Fixed Assets'], summary: 'List audits', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Paginated list of audits' } } },
        post: { tags: ['Fixed Assets'], summary: 'Create audit record', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/AssetAudit' } } } }, responses: { 201: { description: 'Audit created' } } },
      },
      '/api/asset-audits/next-number': { get: { tags: ['Fixed Assets'], summary: 'Get next audit number', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Next AUD number' } } } },
      '/api/asset-audits/{id}': {
        get: { tags: ['Fixed Assets'], summary: 'Get audit by ID', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Audit details' } } },
        delete: { tags: ['Fixed Assets'], summary: 'Delete audit record', security: [{ bearerAuth: [] }], parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Audit deleted' } } },
      },

      // -- Fixed Asset Reports --
      '/api/fixed-asset-reports/asset-register': { post: { tags: ['Fixed Assets'], summary: 'Asset register report', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Asset register data with summary' } } } },
      '/api/fixed-asset-reports/depreciation-schedule': { post: { tags: ['Fixed Assets'], summary: 'Depreciation schedule report', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Depreciation schedule with summary' } } } },
      '/api/fixed-asset-reports/movements': { post: { tags: ['Fixed Assets'], summary: 'Asset movement report', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Movement report with summary' } } } },
      '/api/fixed-asset-reports/disposals': { post: { tags: ['Fixed Assets'], summary: 'Disposal report', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Disposal report with gain/loss summary' } } } },
      '/api/fixed-asset-reports/revaluations': { post: { tags: ['Fixed Assets'], summary: 'Revaluation report', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Revaluation report with summary' } } } },
      '/api/fixed-asset-reports/maintenance': { post: { tags: ['Fixed Assets'], summary: 'Maintenance report', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Maintenance report with cost summary' } } } },
      '/api/fixed-asset-reports/insurance': { post: { tags: ['Fixed Assets'], summary: 'Insurance report', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Insurance report with premium/coverage summary' } } } },
      '/api/fixed-asset-reports/warranty-expiry': { post: { tags: ['Fixed Assets'], summary: 'Warranty expiry report', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Warranty expiry report' } } } },
      '/api/fixed-asset-reports/audits': { post: { tags: ['Fixed Assets'], summary: 'Audit report', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Audit report with verification summary' } } } },
      '/api/fixed-asset-reports/ledger': { post: { tags: ['Fixed Assets'], summary: 'Fixed asset ledger', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Complete fixed asset ledger' } } } },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
