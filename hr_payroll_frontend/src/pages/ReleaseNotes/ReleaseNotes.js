import React from 'react';
import { Box, Typography, Paper, Divider, Chip } from '@mui/material';
import { NewReleases } from '@mui/icons-material';

const releases = [
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
