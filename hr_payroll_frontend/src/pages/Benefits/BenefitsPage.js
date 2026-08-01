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
  CardGiftcard, MilitaryTech, AccountBalance, RequestQuote,
  CheckCircle as ApproveIcon, Cancel as RejectIcon, Calculate,
} from '@mui/icons-material';
import {
  fetchBT, createBT, updateBT, deleteBT,
  fetchEB, createEB, updateEB, deleteEB,
  fetchEC, updateEC, deleteEC, calcEosb, fetchES, deleteES, settleEosb,
  fetchWps, createWps, updateWps, deleteWps, genWpsExport,
  fetchEss, createEss,
} from '../../store/slices/benefitsSlices';
import BenefitsApi from '../../services/benefitsApi';
import { showSuccess, showError } from '../../utils/toast';
import EmployeeSelect from '../../components/Shared/EmployeeSelect';
import PayrollRunSelect from '../../components/Shared/PayrollRunSelect';
import BenefitTypeSelect from '../../components/Shared/BenefitTypeSelect';

const TABS = [
  { key: 'benefits', label: 'Benefits', icon: <CardGiftcard /> },
  { key: 'benefitTypes', label: 'Benefit Types', icon: <CardGiftcard /> },
  { key: 'eosb', label: 'EOSB', icon: <MilitaryTech /> },
  { key: 'wps', label: 'WPS', icon: <AccountBalance /> },
  { key: 'ess', label: 'ESS', icon: <RequestQuote /> },
];

const BenefitsPage = () => {
  const dispatch = useDispatch();
  const [tabKey, setTabKey] = useState('benefits');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0); const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({});
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickAction, setQuickAction] = useState(null);
  const [quickData, setQuickData] = useState({});

  const sliceMap = { benefits: (s) => s.empBenefits, benefitTypes: (s) => s.benefitTypes, eosb: (s) => s.eosbSettlements, wps: (s) => s.wps, ess: (s) => s.ess };
  const sliceState = useSelector(sliceMap[tabKey]) || { list: [], loading: false, saving: false };

  const thunkMap = {
    benefits: { fetch: fetchEB, create: createEB, remove: deleteEB },
    benefitTypes: { fetch: fetchBT, create: createBT, update: updateBT, remove: deleteBT },
    wps: { fetch: fetchWps, create: createWps, update: updateWps, remove: deleteWps },
    ess: { fetch: fetchEss, create: createEss },
    eosb: { fetch: fetchES, update: updateEC },
  };

  const loadData = useCallback(() => {
    const t = thunkMap[tabKey]; if (t?.fetch) dispatch(t.fetch({ page: page + 1, limit: rowsPerPage, search: search || undefined }));
    if (tabKey === 'eosb') dispatch(fetchEC({ page: 1, limit: 100 }));
  }, [dispatch, tabKey, page, rowsPerPage, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = () => { setFormData({ isActive: true }); setEditMode(false); setDialogOpen(true); };
  const handleEdit = (item) => { setFormData({ ...item }); setEditMode(true); setSelectedId(item.id); setDialogOpen(true); };
  const handleDeleteConfirm = (id) => { setSelectedId(id); setDeleteOpen(true); };
  const handleDelete = async () => {
    const t = thunkMap[tabKey]; if (!t?.remove) return;
    const r = await dispatch(t.remove(selectedId));
    if (r.meta.requestStatus === 'fulfilled') { showSuccess('Deleted'); setDeleteOpen(false); loadData(); }
    else showError(r.payload || 'Failed');
  };
  const handleSubmit = async () => {
    const t = thunkMap[tabKey]; if (!t?.create) return;
    if (editMode && t.update) {
      const r = await dispatch(t.update({ id: selectedId, data: formData }));
      if (r.meta.requestStatus === 'fulfilled') { showSuccess('Updated'); setDialogOpen(false); loadData(); }
      else showError(r.payload || 'Failed');
    } else {
      const r = await dispatch(t.create(formData));
      if (r.meta.requestStatus === 'fulfilled') { showSuccess('Created'); setDialogOpen(false); loadData(); }
      else showError(r.payload || 'Failed');
    }
  };

  const handleCalcEosb = () => { setQuickAction('calcEosb'); setQuickData({ terminationType: 'Resignation', lastWorkingDate: new Date().toISOString().split('T')[0] }); setQuickOpen(true); };
  const handleSettleEosb = () => { setQuickAction('settleEosb'); setQuickData({ leaveEncashment: 0 }); setQuickOpen(true); };
  const handleWpsExport = () => { setQuickAction('wpsExport'); setQuickData({}); setQuickOpen(true); };

  const handleQuickSubmit = async () => {
    if (quickAction === 'calcEosb') {
      if (!quickData.employeeId) return showError('Please select an employee');
      const r = await dispatch(calcEosb({ employeeId: quickData.employeeId, terminationType: quickData.terminationType || 'Resignation', lastWorkingDate: quickData.lastWorkingDate || new Date().toISOString().split('T')[0] }));
      if (r.meta.requestStatus === 'fulfilled') { showSuccess('EOSB calculated'); setQuickOpen(false); loadData(); } else showError(r.payload || 'Failed');
    } else if (quickAction === 'settleEosb') {
      if (!quickData.employeeId) return showError('Please select an employee');
      const r = await dispatch(settleEosb({ employeeId: quickData.employeeId, calculationId: quickData.calculationId || undefined, leaveEncashment: parseFloat(quickData.leaveEncashment) || 0 }));
      if (r.meta.requestStatus === 'fulfilled') { showSuccess('Settlement created'); setQuickOpen(false); loadData(); } else showError(r.payload || 'Failed');
    } else if (quickAction === 'wpsExport') {
      if (!quickData.payrollRunId) return showError('Please select a payroll run');
      const r = await dispatch(genWpsExport({ payrollRunId: quickData.payrollRunId }));
      if (r.meta.requestStatus === 'fulfilled') { showSuccess('WPS export generated'); setQuickOpen(false); loadData(); } else showError(r.payload || 'Failed');
    }
  };

  const handleEssReject = (id) => { setQuickAction('essReject'); setQuickData({}); setSelectedId(id); setQuickOpen(true); };
  const handleEssRejectSubmit = async () => {
    try { await BenefitsApi.ess.reject(selectedId, quickData.remarks || ''); showSuccess('Rejected'); setQuickOpen(false); loadData(); } catch (e) { showError('Failed'); }
  };

  const handleApproveSettle = async (id) => { try { await BenefitsApi.eosbSettle.approve(id); showSuccess('Approved'); loadData(); } catch (e) { showError('Failed'); } };

  const handleDeleteEosb = async (id) => {
    const r = await dispatch(deleteEC(id));
    if (r.meta.requestStatus === 'fulfilled') { showSuccess('EOSB calculation deleted'); loadData(); }
    else showError(r.payload || 'Failed to delete');
  };

  const handleEditEosb = (calc) => {
    setQuickAction('calcEosb');
    setQuickData({
      employeeId: calc.employeeId,
      terminationType: calc.terminationType || 'Resignation',
      lastWorkingDate: calc.lastWorkingDate || new Date().toISOString().split('T')[0],
    });
    setQuickOpen(true);
  };

  const handleDeleteSettlement = async (id) => {
    const r = await dispatch(deleteES(id));
    if (r.meta.requestStatus === 'fulfilled') { showSuccess('Settlement deleted'); loadData(); }
    else showError(r.payload || 'Failed to delete');
  };
  const handleWpsDefault = async (id) => { try { await BenefitsApi.wps.setDefault(id); showSuccess('Set as default'); loadData(); } catch (e) { showError('Failed'); } };
  const handleEssApprove = async (id) => { try { await BenefitsApi.ess.approve(id); showSuccess('Approved'); loadData(); } catch (e) { showError('Failed'); } };

  const eosbCalcs = useSelector(s => s.eosbCalcs?.list || []);
  const { list = [], loading } = sliceState;
  const pagination = sliceState.pagination || { total: 0 };

  const renderBtTable = () => (
    <Table size="small"><TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Category</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No benefit types</Typography></TableCell></TableRow> :
        list.map(b => (<TableRow key={b.id} hover><TableCell><Chip label={b.code} size="small" variant="outlined" /></TableCell><TableCell><Typography fontWeight={600}>{b.name}</Typography></TableCell><TableCell><Chip label={b.benefitCategory} size="small" color="primary" /></TableCell><TableCell><Chip label={b.isActive ? 'Active' : 'Inactive'} size="small" color={b.isActive ? 'success' : 'default'} /></TableCell><TableCell align="right"><Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(b)}><EditIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(b.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></TableCell></TableRow>))}</TableBody></Table>
  );

const renderBenefitsTable = () => (
    <Table size="small"><TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Benefit Type</TableCell><TableCell>Category</TableCell><TableCell>Amount</TableCell><TableCell>Employer</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No benefits</Typography></TableCell></TableRow> :
        list.map(b => (<TableRow key={b.id} hover><TableCell><Typography fontWeight={600}>{[b.employee?.firstName, b.employee?.lastName].filter(Boolean).join(' ') || '—'}</Typography></TableCell><TableCell>{b.benefitType?.name || '—'}</TableCell><TableCell><Chip label={b.benefitType?.benefitCategory} size="small" variant="outlined" /></TableCell><TableCell>{Number(b.coverageAmount).toLocaleString()}</TableCell><TableCell>{Number(b.employerContribution).toLocaleString()}</TableCell><TableCell><Chip label={b.status} size="small" color={b.status === 'Active' ? 'success' : 'default'} /></TableCell><TableCell align="right"><Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(b)}><EditIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(b.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></TableCell></TableRow>))}</TableBody></Table>
  );

  const renderEosbTable = () => (
    <Table size="small"><TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Years</TableCell><TableCell>Basic</TableCell><TableCell>First 5Y</TableCell><TableCell>After 5Y</TableCell><TableCell>Total EOSB</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{eosbCalcs.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No calculations</Typography></TableCell></TableRow> :
        eosbCalcs.map(c => (<TableRow key={c.id} hover><TableCell><Typography fontWeight={600}>{[c.employee?.firstName, c.employee?.lastName].filter(Boolean).join(' ') || '—'}</Typography></TableCell><TableCell>{c.yearsOfService}</TableCell><TableCell>{Number(c.basicSalary).toLocaleString()}</TableCell><TableCell>{Number(c.first5YearsAmount).toLocaleString()}</TableCell><TableCell>{Number(c.after5YearsAmount).toLocaleString()}</TableCell><TableCell fontWeight={700} color="primary.main">{Number(c.totalEosbAmount).toLocaleString()}</TableCell><TableCell align="right"><Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEditEosb(c)}><EditIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteEosb(c.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></TableCell></TableRow>))}</TableBody></Table>
  );

  const renderWpsTable = () => (
    <Table size="small"><TableHead><TableRow><TableCell>Config Name</TableCell><TableCell>Format</TableCell><TableCell>Bank Code</TableCell><TableCell>Agent Code</TableCell><TableCell>Default</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No configs</Typography></TableCell></TableRow> :
        list.map(w => (<TableRow key={w.id} hover><TableCell><Typography fontWeight={600}>{w.configName}</Typography></TableCell><TableCell><Chip label={w.fileFormat} size="small" variant="outlined" /></TableCell><TableCell>{w.bankCode || '—'}</TableCell><TableCell>{w.agentCode || '—'}</TableCell><TableCell>{w.isDefault ? <Chip label="Default" size="small" color="primary" /> : <Button size="small" onClick={() => handleWpsDefault(w.id)}>Set Default</Button>}</TableCell><TableCell align="right"><Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(w)}><EditIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(w.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></TableCell></TableRow>))}</TableBody></Table>
  );

  const renderEssTable = () => (
    <Table size="small"><TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Type</TableCell><TableCell>Title</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
      <TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No submissions</Typography></TableCell></TableRow> :
        list.map(s => (<TableRow key={s.id} hover><TableCell><Typography fontWeight={600}>{[s.employee?.firstName, s.employee?.lastName].filter(Boolean).join(' ') || '—'}</Typography></TableCell><TableCell><Chip label={s.requestType} size="small" variant="outlined" /></TableCell><TableCell>{s.title}</TableCell><TableCell><Chip label={s.status} size="small" color={s.status === 'Approved' ? 'success' : s.status === 'Rejected' ? 'error' : 'warning'} /></TableCell><TableCell align="right">{s.status === 'Pending' && <><Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleEssApprove(s.id)}><ApproveIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleEssReject(s.id)}><RejectIcon fontSize="small" /></IconButton></Tooltip></>}<Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(s)}><EditIcon fontSize="small" /></IconButton></Tooltip></TableCell></TableRow>))}</TableBody></Table>
  );

  const renderTable = () => { switch (tabKey) { case 'benefits': return renderBenefitsTable(); case 'eosb': return renderEosbTable(); case 'wps': return renderWpsTable(); case 'ess': return renderEssTable(); case 'benefitTypes': return renderBtTable(); default: return null; } };

  const renderForm = () => {
    switch (tabKey) {
      case 'benefits': return (<Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid><Grid item xs={6}><BenefitTypeSelect value={formData.benefitTypeId} onChange={v => setFormData({ ...formData, benefitTypeId: v })} label="Benefit Type" required /></Grid><Grid item xs={4}><TextField fullWidth size="small" label="Coverage Amount" type="number" value={formData.coverageAmount || ''} onChange={e => setFormData({ ...formData, coverageAmount: parseFloat(e.target.value) })} /></Grid><Grid item xs={4}><TextField fullWidth size="small" label="Employer Contribution" type="number" value={formData.employerContribution || ''} onChange={e => setFormData({ ...formData, employerContribution: parseFloat(e.target.value) })} /></Grid><Grid item xs={4}><TextField fullWidth size="small" label="Employee Contribution" type="number" value={formData.employeeContribution || ''} onChange={e => setFormData({ ...formData, employeeContribution: parseFloat(e.target.value) })} /></Grid><Grid item xs={6}><TextField fullWidth size="small" label="Enrolled Date" type="date" value={formData.enrolledDate || ''} onChange={e => setFormData({ ...formData, enrolledDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid><Grid item xs={6}><TextField fullWidth size="small" label="Expiry Date" type="date" value={formData.expiryDate || ''} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid></Grid>);
      case 'wps': return (<Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={6}><TextField fullWidth size="small" label="Config Name *" value={formData.configName || ''} onChange={e => setFormData({ ...formData, configName: e.target.value })} required /></Grid><Grid item xs={6}><TextField select fullWidth size="small" label="File Format" value={formData.fileFormat || 'SIF'} onChange={e => setFormData({ ...formData, fileFormat: e.target.value })}><MenuItem value="SIF">SIF</MenuItem><MenuItem value="CSV">CSV</MenuItem><MenuItem value="EXCEL">Excel</MenuItem></TextField></Grid><Grid item xs={6}><TextField fullWidth size="small" label="Bank Code" value={formData.bankCode || ''} onChange={e => setFormData({ ...formData, bankCode: e.target.value })} /></Grid><Grid item xs={6}><TextField fullWidth size="small" label="Agent Code" value={formData.agentCode || ''} onChange={e => setFormData({ ...formData, agentCode: e.target.value })} /></Grid><Grid item xs={12}><TextField fullWidth size="small" label="Employer Reference" value={formData.employerReference || ''} onChange={e => setFormData({ ...formData, employerReference: e.target.value })} /></Grid></Grid>);
      case 'ess': return (<Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid><Grid item xs={6}><TextField select fullWidth size="small" label="Request Type" value={formData.requestType || 'Other'} onChange={e => setFormData({ ...formData, requestType: e.target.value })}><MenuItem value="Leave">Leave</MenuItem><MenuItem value="Loan">Loan</MenuItem><MenuItem value="Document">Document</MenuItem><MenuItem value="ProfileUpdate">Profile Update</MenuItem><MenuItem value="Payslip">Payslip</MenuItem><MenuItem value="Attendance">Attendance</MenuItem><MenuItem value="Other">Other</MenuItem></TextField></Grid><Grid item xs={12}><TextField fullWidth size="small" label="Title *" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></Grid><Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></Grid></Grid>);
      case 'benefitTypes': return (<Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={6}><TextField fullWidth size="small" label="Code *" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} required /></Grid><Grid item xs={6}><TextField fullWidth size="small" label="Name *" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></Grid><Grid item xs={6}><TextField select fullWidth size="small" label="Category *" value={formData.benefitCategory || ''} onChange={e => setFormData({ ...formData, benefitCategory: e.target.value })} required><MenuItem value="Medical">Medical</MenuItem><MenuItem value="Housing">Housing</MenuItem><MenuItem value="Transportation">Transportation</MenuItem><MenuItem value="Education">Education</MenuItem><MenuItem value="Insurance">Insurance</MenuItem><MenuItem value="Other">Other</MenuItem></TextField></Grid><Grid item xs={12}><TextField fullWidth size="small" label="Description" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></Grid></Grid>);
      default: return null;
    }
  };

  return (<Box>
    <Typography variant="h4" gutterBottom>Benefits, EOSB, WPS & ESS</Typography>
    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <Chip label="EOSB: End of Service Benefits" size="small" color="primary" variant="outlined" />
      <Chip label="WPS: Wages Protection System" size="small" color="secondary" variant="outlined" />
      <Chip label="ESS: Employee Self-Service" size="small" color="info" variant="outlined" />
    </Box>

    <Tabs value={tabKey} onChange={(e, v) => { setTabKey(v); setPage(0); setSearch(''); }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
      {TABS.map(t => <Tab key={t.key} value={t.key} icon={t.icon} label={t.label} iconPosition="start" />)}
    </Tabs>

    <Card sx={{ mb: 2 }}><CardContent sx={{ pb: '8px !important' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={tabKey === 'eosb' ? 4 : 6}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><RefreshIcon /></InputAdornment> }} /></Grid>
        {tabKey === 'eosb' && <><Grid item xs={6} md={3}><Button fullWidth variant="contained" color="primary" startIcon={<Calculate />} onClick={handleCalcEosb}>Calculate EOSB</Button></Grid><Grid item xs={6} md={3}><Button fullWidth variant="contained" color="secondary" startIcon={<MilitaryTech />} onClick={handleSettleEosb}>Create Settlement</Button></Grid></>}
        {tabKey === 'wps' && <Grid item xs={6} md={3}><Button fullWidth variant="contained" color="primary" startIcon={<AccountBalance />} onClick={handleWpsExport}>Generate WPS Export</Button></Grid>}
        <Grid item xs={6} md={2}><Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>Refresh</Button></Grid>
        {(tabKey === 'benefits' || tabKey === 'benefitTypes' || tabKey === 'wps' || tabKey === 'ess') && <Grid item xs={6} md={2}><Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Add</Button></Grid>}
      </Grid>
    </CardContent></Card>

    <Card>{loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (<><TableContainer>{renderTable()}</TableContainer><TablePagination component="div" count={pagination.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} /></>)}</Card>

    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth><DialogTitle>{editMode ? 'Edit' : 'Add'} Record</DialogTitle><DialogContent dividers>{renderForm()}</DialogContent><DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSubmit}>{editMode ? 'Update' : 'Create'}</Button></DialogActions></Dialog>
    <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}><DialogTitle>Confirm Delete</DialogTitle><DialogContent><Typography>Are you sure?</Typography></DialogContent><DialogActions><Button onClick={() => setDeleteOpen(false)}>Cancel</Button><Button color="error" variant="contained" onClick={handleDelete}>Delete</Button></DialogActions></Dialog>
    <Dialog open={quickOpen} onClose={() => setQuickOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {quickAction === 'calcEosb' ? 'Calculate EOSB' : quickAction === 'settleEosb' ? 'Create Settlement' : quickAction === 'wpsExport' ? 'Generate WPS Export' : 'Reject ESS Request'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {(quickAction === 'calcEosb' || quickAction === 'settleEosb') && (
            <Grid item xs={12}><EmployeeSelect value={quickData.employeeId} onChange={v => setQuickData({ ...quickData, employeeId: v })} label="Employee" required /></Grid>
          )}
          {quickAction === 'calcEosb' && <>
            <Grid item xs={6}><TextField select fullWidth size="small" label="Termination Type" value={quickData.terminationType || 'Resignation'} onChange={e => setQuickData({ ...quickData, terminationType: e.target.value })}><MenuItem value="Resignation">Resignation</MenuItem><MenuItem value="Termination">Termination</MenuItem><MenuItem value="Retirement">Retirement</MenuItem><MenuItem value="Death">Death</MenuItem><MenuItem value="ContractEnd">Contract End</MenuItem></TextField></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Last Working Date" type="date" value={quickData.lastWorkingDate || ''} onChange={e => setQuickData({ ...quickData, lastWorkingDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          </>}
          {quickAction === 'settleEosb' && <>
            <Grid item xs={6}><TextField fullWidth size="small" label="Calculation ID (optional)" value={quickData.calculationId || ''} onChange={e => setQuickData({ ...quickData, calculationId: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Leave Encashment" type="number" value={quickData.leaveEncashment || 0} onChange={e => setQuickData({ ...quickData, leaveEncashment: parseFloat(e.target.value) || 0 })} /></Grid>
          </>}
          {quickAction === 'wpsExport' && (
            <Grid item xs={12}><PayrollRunSelect value={quickData.payrollRunId} onChange={v => setQuickData({ ...quickData, payrollRunId: v })} label="Payroll Run" required /></Grid>
          )}
          {quickAction === 'essReject' && (
            <Grid item xs={12}><TextField fullWidth size="small" label="Remarks" multiline rows={3} value={quickData.remarks || ''} onChange={e => setQuickData({ ...quickData, remarks: e.target.value })} /></Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setQuickOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={quickAction === 'essReject' ? handleEssRejectSubmit : handleQuickSubmit}>
          {quickAction === 'calcEosb' ? 'Calculate' : quickAction === 'essReject' ? 'Reject' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  </Box>);
};

export default BenefitsPage;
