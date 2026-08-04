import React from 'react';
import { Box, Typography, Paper, Divider, Chip } from '@mui/material';
import { NewReleases } from '@mui/icons-material';

const releases = [
  {
    version: 'v1.5.0',
    date: 'August 4, 2026',
    highlights: ['Employee Assets', 'Notification System', 'Mobile App Redesign', 'Master Data'],
    sections: [
      {
        title: 'Employee Asset Management',
        items: [
          'Assign assets (laptops, phones, vehicles, etc.) to employees with tracking codes, serial numbers, and status',
          'Full CRUD API at /api/hr/employee-assets with pagination, search, and employee filtering',
          'My Assets screen on mobile app — employees see only their own assigned assets',
          'Asset assignment form on web app with employee selection, brand, model, and dates',
        ],
      },
      {
        title: 'Notification System',
        items: [
          'New notifications infrastructure — model, repository, service, controller, and routes',
          'Notification bell icon in web app top bar with unread badge count',
          'Popover dropdown showing last 10 notifications with mark-as-read',
          'Auto-polling every 30 seconds for new notifications',
          'Leave submission notifies employee: "Your leave application has been submitted"',
          'Leave submission notifies manager: "John Doe submitted a leave for your approval"',
          'Leave approval/rejection notifies employee with status update',
          'Click notification to navigate to relevant page (Leave, Payroll, Attendance)',
        ],
      },
      {
        title: 'Mobile App — Dashboard Redesign',
        items: [
          'Completely redesigned dashboard with layered gradient header and decorative elements',
          'Circular progress indicator for leave usage (green/yellow/red color coding)',
          'Refined attendance status card with pulse indicator and elapsed time',
          'Elegant leave balance cards with "See All" link and progress bars',
          'Upcoming holidays in a grouped card with "View" button and date badges',
          'Payroll status card with net salary display in AED',
          'Dashboard auto-refreshes on tab focus (useFocusEffect)',
        ],
      },
      {
        title: 'Mobile App — Navigation & UX Improvements',
        items: [
          'Back buttons added to Attendance, Leave, Payroll, and Apply Leave screens',
          'Date picker calendar on Apply Leave screen with range highlighting',
          'After check-in/check-out, app navigates back to Dashboard with auto-refresh',
          'Fixed leave balance display — uses correct backend field names (availableBalance)',
          'Fixed payroll net salary calculation — now computed from basic + allowances - deductions',
          'Fixed employee profile lookup — each user sees only their own data',
          'Bottom tab bar redesigned with filled/outline icon toggle and elevated shadow',
        ],
      },
      {
        title: 'Master Data & Localization',
        items: [
          'Seeded 195 ISO 3166-1 countries with Alpha-2/Alpha-3 codes, proper flag emojis, nationalities, phone codes, and currencies',
          'Fixed flag emoji storage — column converted to utf8mb4 for 4-byte Unicode support',
          'Country/nationality dropdowns on Add/Edit Employee with flag + name display',
          'Nationality column added to Employees list table',
        ],
      },
      {
        title: 'Bug Fixes',
        items: [
          'Leave balance creation — fixed year field not being sent, causing validation error',
          'My Assets screen — now filters by authenticated user instead of returning first employee',
          'Dashboard attendance status — now matches the logged-in user\'s employee record',
          'Payroll salary breakdown — fetches allowances and deductions from separate endpoints',
          'Holiday date parsing — handles recurring holidays and MM-DD format gracefully',
          'Leave balance type definition — aligned TypeScript types with backend DTO',
          'Leave application validation — employeeId now included in mobile app requests',
        ],
      },
    ],
  },
  {
    version: 'v1.0.0',
    date: 'July 2026',
    highlights: ['HR & Payroll Module', 'Multi-Tenant Architecture', 'Role-Based Access Control'],
    sections: [
      {
        title: 'Employee Management',
        items: [
          'Full CRUD for employees with departments, designations, and branches',
          'Employee salary management with structures and components',
          'Organization management — departments, designations, branches, cost centers',
          'Document management and employee self-service portal',
        ],
      },
      {
        title: 'Attendance & Leave',
        items: [
          'Attendance tracking with check-in/check-out, late tracking, overtime',
          'Shift management with assignments and roster planning',
          'Leave management with types, balances, approvals workflow',
          'Today summary dashboard for quick workforce overview',
        ],
      },
      {
        title: 'Payroll Processing',
        items: [
          'Payroll runs with period-based processing',
          'Salary structures and components with earning/deduction types',
          'Allowances, deductions, and loan management with approval workflow',
          'Automatic loan installment deductions with remaining balance tracking',
          'Payslip generation and payroll register reports',
        ],
      },
      {
        title: 'Benefits & Loans',
        items: [
          'Loan management with approval flow (Pending → Approved → Active)',
          'Automatic remaining balance and paid installment calculation',
          'Benefits configuration and EOSB calculations',
          'Loan-linked deductions with real-time loan balance updates',
        ],
      },
      {
        title: 'Security & Access Control',
        items: [
          'Role-based access control with 14 predefined roles',
          '22 granular permissions across all modules',
          'User management with lock/unlock and password reset',
          'JWT-based authentication with tenant isolation',
        ],
      },
      {
        title: 'Reports & Settings',
        items: [
          '11 report types using stored procedures (Employee, Attendance, Payroll, etc.)',
          'CSV/Excel/PDF export support',
          'General settings, company profile, localization, working hours',
          'Master data management — countries, states, cities, holidays',
        ],
      },
    ],
  },
];

const ReleaseNotes = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <NewReleases color="primary" /> Release Notes
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track the evolution of EzeeFlo ERP Suite — new features, improvements, and fixes.
      </Typography>

      {releases.map((release, idx) => (
        <Paper key={idx} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Chip label={release.version} color="primary" size="small" />
            <Typography variant="body2" color="text.secondary">{release.date}</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {release.highlights.map((h, i) => (
              <Chip key={i} label={h} size="small" variant="outlined" color="secondary" />
            ))}
          </Box>

          {release.sections.map((section, si) => (
            <Box key={si} sx={{ mb: si < release.sections.length - 1 ? 2 : 0 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                {section.title}
              </Typography>
              <Box component="ul" sx={{ mt: 0.5, pl: 2.5, '& li': { mb: 0.3, fontSize: '0.875rem', color: 'text.secondary' } }}>
                {section.items.map((item, ii) => (
                  <li key={ii}>{item}</li>
                ))}
              </Box>
              {si < release.sections.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          ))}
        </Paper>
      ))}

      <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', mt: 4 }}>
        Powered by EzeeFlo — &copy; {new Date().getFullYear()} All rights reserved.
      </Typography>
    </Box>
  );
};

export default ReleaseNotes;
