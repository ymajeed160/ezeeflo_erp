import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import {
  Settings, Business, Language, AccessTime, Security, Notifications,
  Email, Sms, Description, Numbers, AccountTree, ShieldOutlined,
  IntegrationInstructions, Backup, History, Tune,
} from '@mui/icons-material';
import GeneralSettings from './GeneralSettings';
import CompanyProfileSettings from './CompanyProfileSettings';
import LocalizationSettings from './LocalizationSettings';
import WorkingHoursSettings from './WorkingHoursSettings';
import AttendanceSettings from './AttendanceSettings';
import LeaveSettings from './LeaveSettings';
import PayrollSettings from './PayrollSettings';
import SecuritySettings from './SecuritySettings';
import NotificationSettings from './NotificationSettings';
import EmailSettings from './EmailSettings';
import SmsSettings from './SmsSettings';

const sections = [
  { key: 'general', label: 'General', icon: <Settings />, component: <GeneralSettings /> },
  { key: 'company', label: 'Company Profile', icon: <Business />, component: <CompanyProfileSettings /> },
  { key: 'localization', label: 'Localization', icon: <Language />, component: <LocalizationSettings /> },
  { key: 'working-hours', label: 'Working Hours', icon: <AccessTime />, component: <WorkingHoursSettings /> },
  { key: 'attendance', label: 'Attendance', icon: <AccountTree />, component: <AttendanceSettings /> },
  { key: 'leave', label: 'Leave', icon: <Description />, component: <LeaveSettings /> },
  { key: 'payroll', label: 'Payroll', icon: <Numbers />, component: <PayrollSettings /> },
  { key: 'security', label: 'Security', icon: <Security />, component: <SecuritySettings /> },
  { key: 'notifications', label: 'Notifications', icon: <Notifications />, component: <NotificationSettings /> },
  { key: 'email', label: 'Email', icon: <Email />, component: <EmailSettings /> },
  { key: 'sms', label: 'SMS', icon: <Sms />, component: <SmsSettings /> },
  { key: 'audit', label: 'Audit Logs', icon: <History /> },
];

const SettingsPage = () => {
  const [tab, setTab] = useState('general');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Master configuration center for EzeeFlo HR & Payroll
      </Typography>

      <Paper sx={{ display: 'flex', minHeight: '70vh' }}>
        <Tabs
          orientation="vertical"
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{
            borderRight: 1, borderColor: 'divider', minWidth: 220,
            '& .MuiTab-root': { alignItems: 'flex-start', textTransform: 'none', fontSize: 13, minHeight: 44, py: 1 },
          }}
        >
          {sections.map((s) => (
            <Tab
              key={s.key}
              value={s.key}
              label={s.label}
              icon={s.icon}
              iconPosition="start"
              disabled={s.disabled}
              sx={{ justifyContent: 'flex-start', pl: 2 }}
            />
          ))}
        </Tabs>

        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {sections.find(s => s.key === tab && s.component)?.component}
          {tab === 'audit' && <AuditLogsPanel />}
        </Box>
      </Paper>
    </Box>
  );
};

const AuditLogsPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../../services/settingsApi').then(({ default: api }) => {
      api.getAuditLogs({ limit: 50 }).then(r => setLogs(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Audit Logs</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Track all settings changes across the system
      </Typography>
      {loading ? <Typography>Loading...</Typography> : logs.length === 0 ? <Typography color="text.secondary">No audit logs yet.</Typography> : (
        <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
          {logs.map((log, i) => (
            <Paper key={i} sx={{ p: 1.5, mb: 1, display: 'flex', gap: 2, fontSize: 12 }}>
              <Box sx={{ minWidth: 80 }}><strong>{log.module}</strong></Box>
              <Box sx={{ minWidth: 60, color: 'text.secondary' }}>{log.section}</Box>
              <Box sx={{ minWidth: 50, color: log.action === 'create' ? 'success.main' : log.action === 'delete' ? 'error.main' : 'warning.main' }}>{log.action}</Box>
              <Box sx={{ flex: 1, color: 'text.secondary' }}>{log.username}</Box>
              <Box sx={{ minWidth: 160, color: 'text.disabled' }}>{new Date(log.createdAt).toLocaleString()}</Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SettingsPage;
