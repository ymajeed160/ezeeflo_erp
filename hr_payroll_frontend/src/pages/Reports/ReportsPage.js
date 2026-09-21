import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Chip, IconButton, Tooltip,
} from '@mui/material';
import {
  Assessment, People, AccessTime, MonetizationOn, EventNote,
  Timer, Business, Group, MilitaryTech, CreditCard, TrendingUp, School,
  Download as DownloadIcon, Refresh as RefreshIcon, PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import hrApi from '../../services/hrApi';
import { showSuccess, showError } from '../../utils/toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EmployeeSelect from '../../components/Shared/EmployeeSelect';
import DepartmentSelect from '../../components/Shared/DepartmentSelect';
import PayrollRunSelect from '../../components/Shared/PayrollRunSelect';
import CourseSelect from '../../components/Shared/CourseSelect';

const REPORTS = [
  { key: 'employee', label: 'Employee Report', icon: <People />, params: [{ name: 'status', label: 'Status', type: 'select', options: ['', 'Active', 'Inactive', 'On Leave', 'Terminated'] }, { name: 'departmentId', label: 'Department', type: 'department' }] },
  { key: 'attendance', label: 'Attendance Report', icon: <AccessTime />, params: [{ name: 'dateFrom', label: 'Date From', type: 'date' }, { name: 'dateTo', label: 'Date To', type: 'date' }, { name: 'employeeId', label: 'Employee', type: 'employee' }] },
  { key: 'payroll', label: 'Payroll Register', icon: <MonetizationOn />, params: [{ name: 'payrollRunId', label: 'Payroll Run', type: 'payrollRun' }] },
  { key: 'leaveBalance', label: 'Leave Balance', icon: <EventNote />, params: [{ name: 'year', label: 'Year', type: 'number', default: new Date().getFullYear() }, { name: 'employeeId', label: 'Employee', type: 'employee' }] },
  { key: 'overtime', label: 'Overtime Report', icon: <Timer />, params: [{ name: 'dateFrom', label: 'Date From', type: 'date' }, { name: 'dateTo', label: 'Date To', type: 'date' }, { name: 'employeeId', label: 'Employee', type: 'employee' }] },
  { key: 'department', label: 'Department Summary', icon: <Business />, params: [] },
  { key: 'headcount', label: 'Headcount Report', icon: <Group />, params: [{ name: 'asOfDate', label: 'As Of Date', type: 'date' }] },
  { key: 'eosb', label: 'EOSB Report', icon: <MilitaryTech />, params: [{ name: 'dateFrom', label: 'Date From', type: 'date' }, { name: 'dateTo', label: 'Date To', type: 'date' }] },
  { key: 'loan', label: 'Loan Report', icon: <CreditCard />, params: [{ name: 'status', label: 'Status', type: 'select', options: ['', 'Active', 'Closed', 'Suspended'] }] },
  { key: 'performance', label: 'Performance Report', icon: <TrendingUp />, params: [{ name: 'employeeId', label: 'Employee', type: 'employee' }] },
  { key: 'training', label: 'Training Report', icon: <School />, params: [{ name: 'courseId', label: 'Course', type: 'course' }] },
];

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [params, setParams] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setLoading(true);
    try {
      const queryParams = {};
      Object.entries(params).forEach(([k, v]) => { if (v) queryParams[k] = v; });
      const res = await hrApi.get(`/reports/${selectedReport}`, { params: queryParams });
      setData(res.data?.data || []);
      showSuccess(`Report generated: ${res.data?.data?.length || 0} rows`);
    } catch (e) {
      showError(e.response?.data?.message || 'Failed to generate report');
    } finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${selectedReport}_report.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!data || data.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    const headers = Object.keys(data[0]).map(k => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    const rows = data.map(row => Object.values(row).map(val => val === null ? '—' : String(val)));
    doc.setFontSize(14);
    doc.text(currentReport?.label || 'Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
    autoTable(doc, { head: [headers], body: rows, startY: 26, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [25, 118, 210] } });
    doc.save(`${selectedReport}_report.pdf`);
    showSuccess('PDF downloaded');
  };

  const currentReport = REPORTS.find(r => r.key === selectedReport);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Reports</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Generate and export HR & Payroll reports using stored procedures
      </Typography>

      {/* Report Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom><Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />Select Report</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {REPORTS.map(r => (
              <Grid item xs={6} sm={4} md={2} key={r.key}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2, textAlign: 'center', cursor: 'pointer',
                    bgcolor: selectedReport === r.key ? 'primary.light' : 'background.paper',
                    color: selectedReport === r.key ? 'primary.main' : 'text.primary',
                    borderColor: selectedReport === r.key ? 'primary.main' : 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => { setSelectedReport(r.key); setData(null); setParams({}); }}
                >
                  <Box sx={{ mb: 0.5 }}>{r.icon}</Box>
                  <Typography variant="caption" fontWeight={600}>{r.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Parameters & Generate */}
      {currentReport && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>{currentReport.label} — Parameters</Typography>
            <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
              {currentReport.params.map(p => (
                <Grid item xs={12} sm={4} md={3} key={p.name}>
                  {p.type === 'select' ? (
                    <TextField select fullWidth size="small" label={p.label} value={params[p.name] || ''} onChange={e => setParams({ ...params, [p.name]: e.target.value })}>
                      {p.options.map(o => <MenuItem key={o} value={o}>{o || 'All'}</MenuItem>)}
                    </TextField>
                  ) : p.type === 'employee' ? (
                    <EmployeeSelect value={params[p.name]} onChange={v => setParams({ ...params, [p.name]: v })} label={p.label} />
                  ) : p.type === 'department' ? (
                    <DepartmentSelect value={params[p.name]} onChange={v => setParams({ ...params, [p.name]: v })} label={p.label} />
                  ) : p.type === 'payrollRun' ? (
                    <PayrollRunSelect value={params[p.name]} onChange={v => setParams({ ...params, [p.name]: v })} label={p.label} />
                  ) : p.type === 'course' ? (
                    <CourseSelect value={params[p.name]} onChange={v => setParams({ ...params, [p.name]: v })} label={p.label} />
                  ) : (
                    <TextField fullWidth size="small" label={p.label} type={p.type} value={params[p.name] || ''} onChange={e => setParams({ ...params, [p.name]: e.target.value })} InputLabelProps={p.type === 'date' ? { shrink: true } : undefined} />
                  )}
                </Grid>
              ))}
              <Grid item xs={12} sm={4} md={3} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button variant="contained" onClick={handleGenerate} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}>
                  Generate
                </Button>
                {data && data.length > 0 && (
                  <><Tooltip title="Export CSV"><IconButton color="primary" onClick={exportCSV}><DownloadIcon /></IconButton></Tooltip>
                  <Tooltip title="Export PDF"><IconButton color="error" onClick={exportPDF}><PdfIcon /></IconButton></Tooltip></>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data && data.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Results <Chip label={`${data.length} rows`} size="small" color="primary" sx={{ ml: 1 }} />
            </Typography>
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {Object.keys(data[0]).map(key => (
                      <TableCell key={key} sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, i) => (
                    <TableRow key={i} hover>
                      {Object.values(row).map((val, j) => (
                        <TableCell key={j}>
                          {val === null ? '—' : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {data && data.length === 0 && (
        <Card><CardContent><Typography color="text.secondary" align="center">No data found for the selected parameters.</Typography></CardContent></Card>
      )}
    </Box>
  );
};

export default ReportsPage;
