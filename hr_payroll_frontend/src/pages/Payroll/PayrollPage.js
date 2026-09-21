import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Button, TextField,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, CircularProgress, InputAdornment, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  MonetizationOn, AccountBalance, Receipt, Assessment, PlayArrow,
  CheckCircle as ApproveIcon, Undo as ReverseIcon, CreditCard, MoneyOff,
  AttachMoney, Payment, Cancel as RejectIcon, PlayArrow as ActivateIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import {
  fetchSalStructures, createSalStructure, updateSalStructure, deleteSalStructure,
  fetchSalComponents, createSalComponent, updateSalComponent, deleteSalComponent,
  fetchEmpSalaries, createEmpSalary, updateEmpSalary, deleteEmpSalary,
  fetchAllowTypes, createAllowType, updateAllowType, deleteAllowType,
  fetchEmpAllowances, createEmpAllowance, updateEmpAllowance, deleteEmpAllowance,
  fetchDedTypes, createDedType, updateDedType, deleteDedType,
  fetchEmpDeductions, createEmpDeduction, updateEmpDeduction, deleteEmpDeduction,
  fetchLoans, createLoan, updateLoan, deleteLoan,
  fetchPeriods, createPeriod, updatePeriod, deletePeriod,
  fetchRuns, fetchDetails, fetchPayslips,
  processPayrollRun,
} from '../../store/slices/payrollSlices';
import PayrollApi from '../../services/payrollApi';
import hrApi from '../../services/hrApi';
import { showSuccess, showError } from '../../utils/toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EmployeeSelect from '../../components/Shared/EmployeeSelect';
import StructureSelect from '../../components/Shared/StructureSelect';
import AllowanceTypeSelect from '../../components/Shared/AllowanceTypeSelect';
import DeductionTypeSelect from '../../components/Shared/DeductionTypeSelect';
import LoanSelect from '../../components/Shared/LoanSelect';

const TABS = [
  { key: 'runs', label: 'Payroll Runs', icon: <PlayArrow /> },
  { key: 'periods', label: 'Pay Periods', icon: <Assessment /> },
  { key: 'salaries', label: 'Employee Salaries', icon: <MonetizationOn /> },
  { key: 'structures', label: 'Salary Structures', icon: <AccountBalance /> },
  { key: 'components', label: 'Salary Components', icon: <Receipt /> },
  { key: 'allowances', label: 'Allowances', icon: <AttachMoney /> },
  { key: 'deductions', label: 'Deductions', icon: <MoneyOff /> },
  { key: 'loans', label: 'Loans', icon: <CreditCard /> },
  { key: 'payslips', label: 'Payslips', icon: <Payment /> },
];

const RUN_STATUS = { Draft: 'default', Processed: 'info', Approved: 'success', Reversed: 'error' };
const LOAN_STATUS = { Pending: 'warning', Approved: 'info', Active: 'success', Closed: 'default', Suspended: 'error', Rejected: 'error' };

const PayrollPage = () => {
  const dispatch = useDispatch();
  const [tabKey, setTabKey] = useState('runs');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({});
  const [processOpen, setProcessOpen] = useState(false);
  const [processPeriodId, setProcessPeriodId] = useState('');
  const [periodList, setPeriodList] = useState([]);


  const sliceMap = {
    runs: (s) => s.runs, periods: (s) => s.periods, salaries: (s) => s.empSalaries,
    structures: (s) => s.salStructures, components: (s) => s.salComponents,
    allowances: (s) => s.empAllowances, deductions: (s) => s.empDeductions,
    loans: (s) => s.loans, payslips: (s) => s.payslips,
  };
  const sliceState = useSelector(sliceMap[tabKey]) || { list: [], loading: false, saving: false };

  const thunkMap = {
    runs: { fetch: fetchRuns, extra: true }, periods: { fetch: fetchPeriods, create: createPeriod, update: updatePeriod, remove: deletePeriod },
    salaries: { fetch: fetchEmpSalaries, create: createEmpSalary, update: updateEmpSalary, remove: deleteEmpSalary }, structures: { fetch: fetchSalStructures, create: createSalStructure, update: updateSalStructure, remove: deleteSalStructure },
    components: { fetch: fetchSalComponents, create: createSalComponent }, allowances: { fetch: fetchEmpAllowances, create: createEmpAllowance },
    deductions: { fetch: fetchEmpDeductions, create: createEmpDeduction, update: updateEmpDeduction, remove: deleteEmpDeduction }, loans: { fetch: fetchLoans, create: createLoan, update: updateLoan, remove: deleteLoan },
    payslips: { fetch: fetchPayslips, extra: true },
  };

  const loadData = useCallback(() => {
    const t = thunkMap[tabKey];
    if (t?.fetch) dispatch(t.fetch({ page: page + 1, limit: rowsPerPage, search: search || undefined }));
  }, [dispatch, tabKey, page, rowsPerPage, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = () => {
    const defaults = {};
    if (tabKey === 'periods') defaults.frequency = 'Monthly';
    if (tabKey === 'components') { defaults.componentType = 'Earning'; defaults.calculationMethod = 'Fixed'; }
    setFormData(defaults); setEditMode(false); setDialogOpen(true);
  };
  const handleEdit = (item) => { setFormData({ ...item }); setEditMode(true); setSelectedId(item.id); setDialogOpen(true); };
  const handleDeleteConfirm = (id) => { setSelectedId(id); setDeleteOpen(true); };

  const handleDelete = async () => {
    const t = thunkMap[tabKey];
    try {
      // Handle runs and payslips (no thunk remove) via direct API call
      if (tabKey === 'runs') {
        await PayrollApi.payrollRuns.delete(selectedId);
      } else if (tabKey === 'payslips') {
        await PayrollApi.payslips.delete(selectedId);
      } else if (t?.remove) {
        const r = await dispatch(t.remove(selectedId));
        if (r.meta.requestStatus !== 'fulfilled') throw new Error(r.payload || 'Failed');
      } else {
        return;
      }
      showSuccess('Deleted'); setDeleteOpen(false); loadData();
    } catch (e) {
      showError(e.message || 'Failed');
    }
  };

  const handleSubmit = async () => {
    const t = thunkMap[tabKey]; if (!t) return;
    if (editMode && t.update) {
      const r = await dispatch(t.update({ id: selectedId, data: formData }));
      if (r.meta.requestStatus === 'fulfilled') { showSuccess('Updated'); setDialogOpen(false); loadData(); }
      else showError(r.payload || 'Failed');
    } else if (t.create) {
      const r = await dispatch(t.create(formData));
      if (r.meta.requestStatus === 'fulfilled') { showSuccess('Created'); setDialogOpen(false); loadData(); }
      else showError(r.payload || 'Failed');
    }
  };

  const handleProcessPayroll = () => {
    setProcessPeriodId('');
    setProcessOpen(true);
    hrApi.get('/payroll-periods', { params: { limit: 100 } }).then(r => {
      setPeriodList(r.data?.data?.data || r.data?.data || r.data || []);
    }).catch(() => setPeriodList([]));
  };
  const handleProcessConfirm = async () => {
    if (!processPeriodId) { showError('Please select a pay period'); return; }
    const r = await dispatch(processPayrollRun(processPeriodId));
    if (r.meta.requestStatus === 'fulfilled') { showSuccess('Payroll processed'); setProcessOpen(false); loadData(); }
    else showError(r.payload || 'Failed');
  };

  const handleApprove = async (id) => { try { await PayrollApi.payrollRuns.approve(id); showSuccess('Approved'); loadData(); } catch (e) { showError('Failed'); } };
  const handleReverse = async (id) => { try { await PayrollApi.payrollRuns.reverse(id); showSuccess('Reversed'); loadData(); } catch (e) { showError('Failed'); } };

  const handleLoanApprove = async (id) => { try { await hrApi.post(`/employee-loans/${id}/approve`); showSuccess('Loan approved'); loadData(); } catch (e) { showError(e.response?.data?.message || 'Failed'); } };
  const handleLoanReject = async (id) => { try { await hrApi.post(`/employee-loans/${id}/reject`); showSuccess('Loan rejected'); loadData(); } catch (e) { showError(e.response?.data?.message || 'Failed'); } };
  const handleLoanActivate = async (id) => { try { await hrApi.post(`/employee-loans/${id}/activate`); showSuccess('Loan activated'); loadData(); } catch (e) { showError(e.response?.data?.message || 'Failed'); } };

  const handlePrintPayslip = (p) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const empName = p.employee ? `${p.employee.firstName || ''} ${p.employee.lastName || ''}`.trim() : 'N/A';

    // Parse breakdowns
    const ab = p.allowanceBreakdown ? (typeof p.allowanceBreakdown === 'string' ? JSON.parse(p.allowanceBreakdown) : p.allowanceBreakdown) : [];
    const db = p.deductionBreakdown ? (typeof p.deductionBreakdown === 'string' ? JSON.parse(p.deductionBreakdown) : p.deductionBreakdown) : [];
    const allowanceItems = Array.isArray(ab) ? ab.map(a => ({ name: a.name || 'Allowance', amount: parseFloat(a.allowances || a.amount || 0) })) : [];
    const deductionItems = Array.isArray(db) ? db.map(d => ({ name: d.name || 'Deduction', amount: parseFloat(d.deductions || d.amount || 0) })) : [];

    // Header
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('EzeeFlo HR & Payroll', 14, 14);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text('Payslip / Salary Slip', 14, 22);

    // Payslip info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Payslip #: ${p.payslipNumber}`, 196, 14, { align: 'right' });
    doc.text(`Period: ${p.periodStart} \u2014 ${p.periodEnd}`, 196, 19, { align: 'right' });
    doc.text(`Status: ${p.status}`, 196, 24, { align: 'right' });

    // Employee info
    let y = 40;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Employee Information', 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${empName}`, 14, y);
    doc.text(`Code: ${p.employee?.employeeCode || 'N/A'}`, 100, y);
    y += 5;
    doc.text(`Payment Date: ${p.paymentDate || 'N/A'}`, 14, y);
    doc.text(`Generated: ${p.generatedAt ? new Date(p.generatedAt).toLocaleDateString() : 'N/A'}`, 100, y);
    y += 7;

    // Build table
    const tableRows = [];
    tableRows.push(['Basic Salary', String(Number(p.basicSalary).toLocaleString()), '', '']);
    const maxRows = Math.max(allowanceItems.length, deductionItems.length, 0);
    for (let i = 0; i < maxRows; i++) {
      tableRows.push([
        allowanceItems[i]?.name || '',
        allowanceItems[i] ? Number(allowanceItems[i].amount).toLocaleString() : '',
        deductionItems[i]?.name || '',
        deductionItems[i] ? `(${Number(deductionItems[i].amount).toLocaleString()})` : '',
      ]);
    }

    autoTable(doc, {
      head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
      body: tableRows,
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right', textColor: [211, 47, 47] } },
    });

    // Totals
    const finalY = (doc.lastAutoTable?.finalY || y) + 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Gross Pay:', 120, finalY);
    doc.text(Number(p.grossPay).toLocaleString(), 196, finalY, { align: 'right' });
    doc.setTextColor(25, 118, 210);
    doc.setFontSize(13);
    doc.text('Net Pay:', 120, finalY + 7);
    doc.text(Number(p.netPay).toLocaleString(), 196, finalY + 7, { align: 'right' });

    // Footer
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('This is a computer-generated payslip.', 105, 285, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });

    // Open PDF in new tab
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    showSuccess('Payslip PDF opened in new tab');
  };

  const { list = [], loading } = sliceState;
  const pagination = sliceState.pagination || { total: 0 };

  const renderRunsTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Run #</TableCell><TableCell>Period</TableCell><TableCell>Date</TableCell><TableCell>Employees</TableCell><TableCell>Gross</TableCell><TableCell>Deductions</TableCell><TableCell>Net</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No payroll runs</Typography></TableCell></TableRow> :
        list.map(r => (
          <TableRow key={r.id} hover>
            <TableCell><Chip label={r.runNumber} size="small" variant="outlined" /></TableCell>
            <TableCell>{r.period?.periodName || '—'}</TableCell>
            <TableCell>{r.runDate}</TableCell>
            <TableCell>{r.totalEmployees}</TableCell>
            <TableCell>{Number(r.totalGross).toLocaleString()}</TableCell>
            <TableCell>{Number(r.totalDeductions).toLocaleString()}</TableCell>
            <TableCell fontWeight={600}>{Number(r.totalNetPay).toLocaleString()}</TableCell>
            <TableCell><Chip label={r.status} size="small" color={RUN_STATUS[r.status] || 'default'} /></TableCell>
            <TableCell align="right">
              {r.status === 'Draft' && (
                <>
                  <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(r)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(r.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </>
              )}
              {r.status === 'Processed' && <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleApprove(r.id)}><ApproveIcon fontSize="small" /></IconButton></Tooltip>}
              {r.status === 'Approved' && <Tooltip title="Reverse"><IconButton size="small" color="error" onClick={() => handleReverse(r.id)}><ReverseIcon fontSize="small" /></IconButton></Tooltip>}
            </TableCell>
          </TableRow>
        ))}</TableBody>
    </Table>
  );

  const renderPeriodsTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Frequency</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No periods</Typography></TableCell></TableRow> :
        list.map(p => (
          <TableRow key={p.id} hover>
            <TableCell><Chip label={p.periodCode} size="small" variant="outlined" /></TableCell>
            <TableCell>{p.periodName}</TableCell>
            <TableCell>{p.frequency}</TableCell>
            <TableCell>{p.startDate}</TableCell>
            <TableCell>{p.endDate}</TableCell>
            <TableCell><Chip label={p.status} size="small" color={p.isLocked ? 'error' : 'success'} /></TableCell>
            <TableCell align="right">
              <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(p.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </TableCell>
          </TableRow>
        ))}</TableBody>
    </Table>
  );

  const renderSalariesTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Structure</TableCell><TableCell>Basic</TableCell><TableCell>Gross</TableCell><TableCell>Net</TableCell><TableCell>Effective</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No salaries</Typography></TableCell></TableRow> :
        list.map(s => (
          <TableRow key={s.id} hover>
            <TableCell><Typography fontWeight={600}>{s.employee?.name || '—'}</Typography></TableCell>
            <TableCell>{s.structure?.name || '—'}</TableCell>
            <TableCell>{Number(s.basicSalary).toLocaleString()}</TableCell>
            <TableCell>{Number(s.grossSalary).toLocaleString()}</TableCell>
            <TableCell>{Number(s.netSalary).toLocaleString()}</TableCell>
            <TableCell>{s.effectiveFrom}</TableCell>
            <TableCell align="right">
              <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
            </TableCell>
          </TableRow>
        ))}</TableBody>
    </Table>
  );

  const renderStructuresTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Description</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No structures</Typography></TableCell></TableRow> :
        list.map(s => (
          <TableRow key={s.id} hover>
            <TableCell><Chip label={s.code} size="small" variant="outlined" /></TableCell>
            <TableCell><Typography fontWeight={600}>{s.name}</Typography></TableCell>
            <TableCell>{s.description || '—'}</TableCell>
            <TableCell><Chip label={s.isActive ? 'Active' : 'Inactive'} size="small" color={s.isActive ? 'success' : 'default'} /></TableCell>
            <TableCell align="right">
              <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(s.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </TableCell>
          </TableRow>
        ))}</TableBody>
    </Table>
  );

  const renderSimpleTable = (fields, extra) => (
    <Table size="small">
      <TableHead><TableRow>{fields.map((f, i) => <TableCell key={i}>{f}</TableCell>)}</TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={fields.length} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No records</Typography></TableCell></TableRow> :
        list.map(item => (
          <TableRow key={item.id} hover>
            {extra ? extra(item).map((v, i) => <TableCell key={i}>{v}</TableCell>) :
              Object.keys(item).filter(k => !['id', 'tenantId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(k)).slice(0, fields.length - 1).map(k => <TableCell key={k}>{typeof item[k] === 'object' ? JSON.stringify(item[k]) : String(item[k] || '—')}</TableCell>)}
            <TableCell align="right">
              <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              {thunkMap[tabKey]?.remove && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(item.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}
            </TableCell>
          </TableRow>
        ))}</TableBody>
    </Table>
  );

  const renderAllowancesTable = () => renderSimpleTable(['Employee', 'Type', 'Amount', 'Category', 'Effective', 'Status', 'Actions'],
    (a) => [a.employee ? `${a.employee.firstName || ''} ${a.employee.lastName || ''}`.trim() || '—' : '—', a.allowanceType?.name || '—', Number(a.amount).toLocaleString(), a.allowanceType?.allowanceCategory || '—', a.effectiveFrom || '—', <Chip label={a.isActive ? 'Active' : 'Inactive'} size="small" color={a.isActive ? 'success' : 'default'} />]);

  const renderDeductionsTable = () => renderSimpleTable(['Employee', 'Type', 'Amount', 'Category', 'Effective', 'Status', 'Actions'],
    (d) => [d.employee ? `${d.employee.firstName || ''} ${d.employee.lastName || ''}`.trim() || '—' : '—', d.deductionType?.name || '—', Number(d.amount).toLocaleString(), d.deductionType?.deductionCategory || '—', d.effectiveFrom || '—', <Chip label={d.isActive ? 'Active' : 'Inactive'} size="small" color={d.isActive ? 'success' : 'default'} />]);

  const renderLoansTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Loan #</TableCell><TableCell>Employee</TableCell><TableCell>Type</TableCell><TableCell>Principal</TableCell><TableCell>Monthly</TableCell><TableCell>Remaining</TableCell><TableCell>Paid/Total</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No loans</Typography></TableCell></TableRow> :
        list.map(l => (
          <TableRow key={l.id} hover>
            <TableCell><Chip label={l.loanNumber} size="small" variant="outlined" /></TableCell>
            <TableCell><Typography fontWeight={600}>{l.employee ? `${l.employee.firstName || ''} ${l.employee.lastName || ''}`.trim() || '—' : '—'}</Typography></TableCell>
            <TableCell>{l.loanType}</TableCell>
            <TableCell>{Number(l.principalAmount).toLocaleString()}</TableCell>
            <TableCell>{Number(l.monthlyInstallment).toLocaleString()}</TableCell>
            <TableCell>{Number(l.remainingAmount).toLocaleString()}</TableCell>
            <TableCell>{l.paidInstallments}/{l.totalInstallments}</TableCell>
            <TableCell><Chip label={l.status} size="small" color={LOAN_STATUS[l.status] || 'default'} /></TableCell>
            <TableCell align="right">
              {l.status === 'Pending' && (
                <>
                  <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(l)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleLoanApprove(l.id)}><ApproveIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleLoanReject(l.id)}><RejectIcon fontSize="small" /></IconButton></Tooltip>
                </>
              )}
              {l.status === 'Approved' && (
                <Tooltip title="Activate"><IconButton size="small" color="primary" onClick={() => handleLoanActivate(l.id)}><ActivateIcon fontSize="small" /></IconButton></Tooltip>
              )}
              {['Active'].includes(l.status) && (
                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(l)}><EditIcon fontSize="small" /></IconButton></Tooltip>
              )}
            </TableCell>
          </TableRow>
        ))}</TableBody>
    </Table>
  );

  const renderPayslipsTable = () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Payslip #</TableCell><TableCell>Employee</TableCell><TableCell>Period</TableCell><TableCell>Gross</TableCell><TableCell>Net</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No payslips</Typography></TableCell></TableRow> :
        list.map(p => (
          <TableRow key={p.id} hover>
            <TableCell>{p.payslipNumber}</TableCell>
            <TableCell><Typography fontWeight={600}>{p.employee ? `${p.employee.firstName || ''} ${p.employee.lastName || ''}`.trim() || '—' : '—'}</Typography></TableCell>
            <TableCell>{p.periodStart} → {p.periodEnd}</TableCell>
            <TableCell>{Number(p.grossPay).toLocaleString()}</TableCell>
            <TableCell fontWeight={700}>{Number(p.netPay).toLocaleString()}</TableCell>
            <TableCell><Chip label={p.status} size="small" color="success" /></TableCell>
            <TableCell align="right">
              <Tooltip title="Print Payslip"><IconButton size="small" color="primary" onClick={() => handlePrintPayslip(p)}><PrintIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(p.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
            </TableCell>
          </TableRow>
        ))}</TableBody>
    </Table>
  );

  const renderComponentsTable = () => renderSimpleTable(['Code', 'Name', 'Status', 'Actions'],
    (c) => [c.code, c.name, <Chip label={c.isActive ? 'Active' : 'Inactive'} size="small" color={c.isActive ? 'success' : 'default'} />]);

  const renderTable = () => {
    switch (tabKey) {
      case 'runs': return renderRunsTable();
      case 'periods': return renderPeriodsTable();
      case 'salaries': return renderSalariesTable();
      case 'structures': return renderStructuresTable();
      case 'components': return renderComponentsTable();
      case 'allowances': return renderAllowancesTable();
      case 'deductions': return renderDeductionsTable();
      case 'loans': return renderLoansTable();
      case 'payslips': return renderPayslipsTable();
      default: return renderSimpleTable(['Code', 'Name', 'Status', 'Actions']);
    }
  };

  const renderFormFields = () => {
    switch (tabKey) {
      case 'periods': return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={6}><TextField fullWidth size="small" label="Period Code *" value={formData.periodCode || ''} onChange={e => setFormData({ ...formData, periodCode: e.target.value })} required /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Period Name *" value={formData.periodName || ''} onChange={e => setFormData({ ...formData, periodName: e.target.value })} required /></Grid>
        <Grid item xs={4}><TextField select fullWidth size="small" label="Frequency" value={formData.frequency || 'Monthly'} onChange={e => setFormData({ ...formData, frequency: e.target.value })}><MenuItem value="Monthly">Monthly</MenuItem><MenuItem value="Weekly">Weekly</MenuItem><MenuItem value="BiWeekly">Bi-Weekly</MenuItem><MenuItem value="Daily">Daily</MenuItem></TextField></Grid>
        <Grid item xs={4}><TextField fullWidth size="small" label="Start Date *" type="date" value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
        <Grid item xs={4}><TextField fullWidth size="small" label="End Date *" type="date" value={formData.endDate || ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
      </Grid>);
      case 'structures': return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={6}><TextField fullWidth size="small" label="Code *" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} required /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Name *" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></Grid>
        <Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline rows={2} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></Grid>
      </Grid>);
      case 'salaries': return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid>
        <Grid item xs={6}><StructureSelect value={formData.structureId} onChange={v => setFormData({ ...formData, structureId: v })} label="Salary Structure" /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Basic Salary *" type="number" value={formData.basicSalary || ''} onChange={e => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) })} required /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Effective From *" type="date" value={formData.effectiveFrom || ''} onChange={e => setFormData({ ...formData, effectiveFrom: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
        <Grid item xs={4}><TextField select fullWidth size="small" label="Payment Mode" value={formData.paymentMode || 'Bank Transfer'} onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}><MenuItem value="Bank Transfer">Bank Transfer</MenuItem><MenuItem value="Cash">Cash</MenuItem><MenuItem value="Cheque">Cheque</MenuItem><MenuItem value="WPS">WPS</MenuItem></TextField></Grid>
        <Grid item xs={4}><TextField fullWidth size="small" label="Bank Name" value={formData.bankName || ''} onChange={e => setFormData({ ...formData, bankName: e.target.value })} /></Grid>
        <Grid item xs={4}><TextField fullWidth size="small" label="IBAN" value={formData.iban || ''} onChange={e => setFormData({ ...formData, iban: e.target.value })} /></Grid>
      </Grid>);
      case 'allowances': return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid>
        <Grid item xs={6}><AllowanceTypeSelect value={formData.allowanceTypeId} onChange={v => setFormData({ ...formData, allowanceTypeId: v })} label="Allowance Type" required /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Amount *" type="number" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Effective From" type="date" value={formData.effectiveFrom || ''} onChange={e => setFormData({ ...formData, effectiveFrom: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
      </Grid>);
      case 'deductions': return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid>
        <Grid item xs={6}><DeductionTypeSelect value={formData.deductionTypeId} onChange={v => setFormData(prev => ({ ...prev, deductionTypeId: v }))} label="Deduction Type" required={!formData.loanId} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Amount *" type="number" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} required /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Effective From" type="date" value={formData.effectiveFrom || ''} onChange={e => setFormData({ ...formData, effectiveFrom: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
        {!editMode && <Grid item xs={12}><LoanSelect value={formData.loanId} onChange={v => setFormData(prev => ({ ...prev, loanId: v }))} onAmountChange={v => setFormData(prev => ({ ...prev, amount: v }))} label="Link to Loan" employeeId={formData.employeeId} /></Grid>}
      </Grid>);
      case 'components': return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={6}><StructureSelect value={formData.structureId} onChange={v => setFormData({ ...formData, structureId: v })} label="Salary Structure *" required /></Grid>
        <Grid item xs={6}><TextField select fullWidth size="small" label="Component Type *" value={formData.componentType || 'Earning'} onChange={e => setFormData({ ...formData, componentType: e.target.value })} required><MenuItem value="Earning">Earning</MenuItem><MenuItem value="Deduction">Deduction</MenuItem><MenuItem value="EmployerContribution">Employer Contribution</MenuItem><MenuItem value="EmployeeContribution">Employee Contribution</MenuItem></TextField></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Code *" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} required /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Name *" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></Grid>
        <Grid item xs={6}><TextField select fullWidth size="small" label="Calculation Method" value={formData.calculationMethod || 'Fixed'} onChange={e => setFormData({ ...formData, calculationMethod: e.target.value })}><MenuItem value="Fixed">Fixed</MenuItem><MenuItem value="Percentage">Percentage</MenuItem><MenuItem value="Formula">Formula</MenuItem></TextField></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Value" type="number" value={formData.value || 0} onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="% Of (e.g. basic_salary)" value={formData.percentageOf || ''} onChange={e => setFormData({ ...formData, percentageOf: e.target.value })} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Sort Order" type="number" value={formData.sortOrder || 0} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} /></Grid>
      </Grid>);
      case 'loans': return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid>
        <Grid item xs={6}><TextField select fullWidth size="small" label="Loan Type" value={formData.loanType || 'Personal'} onChange={e => setFormData({ ...formData, loanType: e.target.value })}><MenuItem value="Personal">Personal</MenuItem><MenuItem value="Housing">Housing</MenuItem><MenuItem value="Vehicle">Vehicle</MenuItem><MenuItem value="Education">Education</MenuItem><MenuItem value="Medical">Medical</MenuItem></TextField></Grid>
        <Grid item xs={4}><TextField fullWidth size="small" label="Principal *" type="number" value={formData.principalAmount || ''} onChange={e => setFormData({ ...formData, principalAmount: parseFloat(e.target.value) })} required /></Grid>
        <Grid item xs={4}><TextField fullWidth size="small" label="Monthly Installment *" type="number" value={formData.monthlyInstallment || ''} onChange={e => setFormData({ ...formData, monthlyInstallment: parseFloat(e.target.value) })} required /></Grid>
        <Grid item xs={4}><TextField fullWidth size="small" label="Total Installments *" type="number" value={formData.totalInstallments || ''} onChange={e => setFormData({ ...formData, totalInstallments: parseInt(e.target.value) })} required /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Start Date *" type="date" value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Interest Rate %" type="number" value={formData.interestRate || 0} onChange={e => setFormData({ ...formData, interestRate: parseFloat(e.target.value) })} /></Grid>
        {editMode && <>
          <Grid item xs={6}><TextField select fullWidth size="small" label="Status" value={formData.status || 'Pending'} onChange={e => setFormData({ ...formData, status: e.target.value })}><MenuItem value="Pending">Pending</MenuItem><MenuItem value="Approved">Approved</MenuItem><MenuItem value="Active">Active</MenuItem><MenuItem value="Closed">Closed</MenuItem><MenuItem value="Suspended">Suspended</MenuItem><MenuItem value="Rejected">Rejected</MenuItem></TextField></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" label="Paid Installments" type="number" value={formData.paidInstallments ?? 0} onChange={e => setFormData({ ...formData, paidInstallments: parseInt(e.target.value) || 0 })} helperText={`Remaining: ${((formData.principalAmount || 0) - ((formData.paidInstallments ?? 0) * (formData.monthlyInstallment || 0))).toLocaleString()}`} /></Grid>
        </>}
      </Grid>);
      case 'runs': return (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={6}><TextField fullWidth size="small" label="Run Number" value={formData.runNumber || ''} InputProps={{ readOnly: true }} /></Grid>
        <Grid item xs={6}><TextField fullWidth size="small" label="Run Date" type="date" value={formData.runDate || ''} onChange={e => setFormData({ ...formData, runDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12}><TextField fullWidth size="small" label="Period" value={formData.period?.periodName || '—'} InputProps={{ readOnly: true }} /></Grid>
        <Grid item xs={12}><TextField fullWidth size="small" label="Notes" multiline rows={2} value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></Grid>
      </Grid>);
      default: return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Payroll & Salary Management</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>Process payroll, manage salary structures, allowances, deductions, and loans</Typography>

      <Tabs value={tabKey} onChange={(e, v) => { setTabKey(v); setPage(0); setSearch(''); }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
        {TABS.map(t => <Tab key={t.key} value={t.key} icon={t.icon} label={t.label} iconPosition="start" />)}
      </Tabs>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '8px !important' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={tabKey === 'runs' ? 6 : 8}>
              <TextField fullWidth size="small" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><RefreshIcon /></InputAdornment> }} />
            </Grid>
            {tabKey === 'runs' && <Grid item xs={6} md={3}><Button fullWidth variant="contained" color="primary" startIcon={<PlayArrow />} onClick={handleProcessPayroll}>Process Payroll</Button></Grid>}
            <Grid item xs={tabKey === 'runs' ? 6 : 6} md={tabKey === 'runs' ? 3 : 2}>
              <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>Refresh</Button>
            </Grid>
            {tabKey !== 'runs' && tabKey !== 'payslips' && <Grid item xs={6} md={2}>
              <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Add</Button>
            </Grid>}
          </Grid>
        </CardContent>
      </Card>

      <Card>
        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
          <><TableContainer>{renderTable()}</TableContainer>
            <TablePagination component="div" count={pagination.total || 0} page={page}
              onPageChange={(e, p) => setPage(p)} rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]} /></>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit' : 'Add'} {TABS.find(t => t.key === tabKey)?.label?.replace(/s$/, '')}</DialogTitle>
        <DialogContent dividers>{renderFormFields()}</DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editMode ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>

      <Dialog open={processOpen} onClose={() => setProcessOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payroll</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField select fullWidth size="small" label="Pay Period *" value={processPeriodId} onChange={e => setProcessPeriodId(e.target.value)}>
                <MenuItem value="" disabled>Select a pay period</MenuItem>
                {periodList.map(p => <MenuItem key={p.id} value={p.id}>{p.periodName || p.periodCode} ({p.startDate} → {p.endDate})</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setProcessOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleProcessConfirm}>Process</Button></DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent><Typography>Are you sure?</Typography></DialogContent>
        <DialogActions><Button onClick={() => setDeleteOpen(false)}>Cancel</Button><Button color="error" variant="contained" onClick={handleDelete}>Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollPage;
