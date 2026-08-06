import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, IconButton, Switch,
  FormControlLabel, Select, MenuItem, FormControl, InputLabel, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Search, PlayArrow } from '@mui/icons-material';
import { loyaltyRuleApi } from '../services/phase1Api';
import { showSuccess, showError } from '../utils/toast';

const ruleTypes = [
  { value: 'earn', label: 'Earn Points' },
  { value: 'redeem', label: 'Redeem Points' },
  { value: 'bonus', label: 'Bonus Points' },
  { value: 'tier_upgrade', label: 'Tier Upgrade' },
  { value: 'tier_downgrade', label: 'Tier Downgrade' },
  { value: 'expiry', label: 'Points Expiry' },
];

const conditionFields = [
  { value: 'invoiceAmount', label: 'Invoice Amount' },
  { value: 'invoiceQuantity', label: 'Invoice Quantity' },
  { value: 'productCategory', label: 'Product Category' },
  { value: 'brand', label: 'Brand' },
  { value: 'paymentMethod', label: 'Payment Method' },
  { value: 'dayOfWeek', label: 'Day of Week' },
  { value: 'isWeekend', label: 'Is Weekend' },
  { value: 'isHoliday', label: 'Is Holiday' },
  { value: 'isBirthday', label: 'Is Birthday' },
  { value: 'isFirstPurchase', label: 'Is First Purchase' },
  { value: 'purchaseCount', label: 'Purchase Count' },
  { value: 'customerAge', label: 'Customer Age' },
  { value: 'customerTier', label: 'Customer Tier' },
  { value: 'customerSegment', label: 'Customer Segment' },
  { value: 'referralCode', label: 'Has Referral' },
  { value: 'couponUsed', label: 'Coupon Used' },
  { value: 'giftCardUsed', label: 'Gift Card Used' },
];

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_or_equal', label: '>= (Greater or Equal)' },
  { value: 'less_or_equal', label: '<= (Less or Equal)' },
  { value: 'in', label: 'In (List)' },
  { value: 'not_in', label: 'Not In (List)' },
  { value: 'contains', label: 'Contains' },
  { value: 'between', label: 'Between' },
  { value: 'is_true', label: 'Is True' },
  { value: 'is_false', label: 'Is False' },
];

const pointTypes = [
  { value: 'fixed', label: 'Fixed Points' },
  { value: 'percentage', label: '% of Invoice' },
  { value: 'per_item', label: 'Per Item' },
  { value: 'per_amount_spent', label: 'Per Amount Spent' },
  { value: 'tier_based', label: 'Tier-Based' },
  { value: 'membership_multiplier', label: 'Multiplier × Base' },
];

const LoyaltyRuleEngine = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState({ open: false, mode: 'create', rule: null });
  const [form, setForm] = useState({
    name: '', code: '', description: '', ruleType: 'earn', priority: 0,
    isActive: true, startDate: '', endDate: '',
    conditions: [{ logic: 'AND', conditions: [{ field: 'invoiceAmount', operator: 'greater_than', value: '0' }] }],
    actions: [{ actionType: 'award_points', config: { pointType: 'fixed', value: '10', label: 'Base Points' } }],
  });
  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await loyaltyRuleApi.getAll({ limit: 200, search });
      setRules(data.data || []);
    } catch {} finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const openCreate = () => {
    setForm({
      name: '', code: '', description: '', ruleType: 'earn', priority: 0,
      isActive: true, startDate: '', endDate: '',
      conditions: [{ logic: 'AND', conditions: [{ field: 'invoiceAmount', operator: 'greater_than', value: '0' }] }],
      actions: [{ actionType: 'award_points', config: { pointType: 'fixed', value: '10', label: 'Base Points' } }],
    });
    setDialog({ open: true, mode: 'create', rule: null });
  };

  const openEdit = (rule) => {
    setForm({
      name: rule.name, code: rule.code, description: rule.description || '',
      ruleType: rule.ruleType, priority: rule.priority || 0,
      isActive: rule.isActive, startDate: rule.startDate ? rule.startDate.slice(0, 10) : '',
      endDate: rule.endDate ? rule.endDate.slice(0, 10) : '',
      conditions: rule.conditions || [{ logic: 'AND', conditions: [] }],
      actions: rule.actions || [{ actionType: 'award_points', config: { pointType: 'fixed', value: '10' } }],
    });
    setDialog({ open: true, mode: 'edit', rule });
  };

  const addConditionGroup = () => {
    setForm({ ...form, conditions: [...form.conditions, { logic: 'AND', conditions: [{ field: 'invoiceAmount', operator: 'greater_than', value: '0' }] }] });
  };

  const addCondition = (groupIdx) => {
    const conds = [...form.conditions];
    conds[groupIdx].conditions.push({ field: 'invoiceAmount', operator: 'greater_than', value: '0' });
    setForm({ ...form, conditions: conds });
  };

  const removeCondition = (groupIdx, condIdx) => {
    const conds = [...form.conditions];
    conds[groupIdx].conditions.splice(condIdx, 1);
    if (conds[groupIdx].conditions.length === 0) conds.splice(groupIdx, 1);
    setForm({ ...form, conditions: conds.length > 0 ? conds : [{ logic: 'AND', conditions: [] }] });
  };

  const addAction = () => {
    setForm({ ...form, actions: [...form.actions, { actionType: 'award_points', config: { pointType: 'fixed', value: '10', label: 'Bonus' } }] });
  };

  const removeAction = (idx) => {
    const acts = [...form.actions];
    acts.splice(idx, 1);
    setForm({ ...form, actions: acts });
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { showError('Name and code are required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        conditions: form.conditions.filter(g => g.conditions.length > 0),
      };
      if (dialog.mode === 'create') {
        await loyaltyRuleApi.create(payload);
        showSuccess('Rule created');
      } else {
        await loyaltyRuleApi.update(dialog.rule.id, payload);
        showSuccess('Rule updated');
      }
      setDialog({ open: false, mode: 'create', rule: null });
      fetchRules();
    } catch (err) { showError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (rule) => {
    try {
      await loyaltyRuleApi.toggleStatus(rule.id);
      showSuccess(`Rule ${rule.isActive ? 'deactivated' : 'activated'}`);
      fetchRules();
    } catch (err) { showError(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) return;
    try {
      await loyaltyRuleApi.delete(rule.id);
      showSuccess('Rule deleted');
      fetchRules();
    } catch (err) { showError(err.response?.data?.message || 'Delete failed'); }
  };

  if (loading && rules.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Loyalty Rule Engine</Typography>
          <Typography variant="body2" color="text.secondary">Configure earning and redemption rules without code changes</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchRules}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Rule</Button>
        </Box>
      </Box>

      <TextField placeholder="Search rules..." size="small" value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} sx={{ mb: 2, width: 300 }} />

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rule Name</TableCell><TableCell>Type</TableCell><TableCell>Priority</TableCell>
              <TableCell>Conditions</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map(r => (
              <TableRow key={r.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{r.code}</Typography>
                </TableCell>
                <TableCell><Chip label={ruleTypes.find(t => t.value === r.ruleType)?.label || r.ruleType} size="small" color={r.ruleType === 'earn' ? 'success' : r.ruleType === 'redeem' ? 'error' : 'default'} /></TableCell>
                <TableCell>{r.priority}</TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {(r.conditions || []).reduce((s, g) => s + (g.conditions || []).length, 0)} conditions
                    {' · '}{(r.actions || []).length} actions
                  </Typography>
                </TableCell>
                <TableCell>
                  <Switch checked={r.isActive} size="small" onChange={() => handleToggle(r)} />
                  <Typography variant="caption">{r.isActive ? 'Active' : 'Inactive'}</Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(r)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {rules.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No rules defined yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Rule Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', rule: null })} maxWidth="md" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Add Rule' : 'Edit Rule'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Rule Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Code *" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} helperText="e.g., earn_standard" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Priority" type="number" value={form.priority} onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small"><InputLabel>Rule Type</InputLabel>
                <Select value={form.ruleType} label="Rule Type" onChange={e => setForm({ ...form, ruleType: e.target.value })}>
                  {ruleTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" type="date" label="Start Date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" type="date" label="End Date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Description" multiline rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Grid>
          </Grid>

          {/* Conditions */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Conditions (OR between groups, AND within groups)</Typography>
          {form.conditions.map((group, gi) => (
            <Paper key={gi} variant="outlined" sx={{ p: 1.5, mb: 1.5, bgcolor: '#f9fafb' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FormControl size="small" sx={{ width: 100 }}><Select value={group.logic} onChange={e => { const c = [...form.conditions]; c[gi].logic = e.target.value; setForm({ ...form, conditions: c }); }}>
                  <MenuItem value="AND">AND</MenuItem><MenuItem value="OR">OR</MenuItem>
                </Select></FormControl>
                <Typography variant="caption">— all conditions in this group use {group.logic} logic</Typography>
              </Box>
              {group.conditions.map((cond, ci) => (
                <Grid container spacing={1} key={ci} sx={{ mb: 0.5 }}>
                  <Grid item xs={4}><FormControl fullWidth size="small"><Select value={cond.field} onChange={e => { const c = [...form.conditions]; c[gi].conditions[ci].field = e.target.value; setForm({ ...form, conditions: c }); }}>
                    {conditionFields.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                  </Select></FormControl></Grid>
                  <Grid item xs={3}><FormControl fullWidth size="small"><Select value={cond.operator} onChange={e => { const c = [...form.conditions]; c[gi].conditions[ci].operator = e.target.value; setForm({ ...form, conditions: c }); }}>
                    {operators.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </Select></FormControl></Grid>
                  <Grid item xs={3}>
                    <TextField fullWidth size="small" value={cond.value || ''} onChange={e => { const c = [...form.conditions]; c[gi].conditions[ci].value = e.target.value; setForm({ ...form, conditions: c }); }} placeholder="Value" />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton size="small" color="error" onClick={() => removeCondition(gi, ci)}><Delete fontSize="small" /></IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button size="small" onClick={() => addCondition(gi)}>+ Add Condition</Button>
            </Paper>
          ))}
          <Button size="small" onClick={addConditionGroup} variant="outlined">+ Add Condition Group (OR)</Button>

          {/* Actions */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Actions</Typography>
          {form.actions.map((action, ai) => (
            <Paper key={ai} variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: '#f9fafb' }}>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <FormControl fullWidth size="small"><Select value={action.actionType} onChange={e => { const a = [...form.actions]; a[ai].actionType = e.target.value; a[ai].config = a[ai].config || {}; setForm({ ...form, actions: a }); }}>
                    <MenuItem value="award_points">Award Points</MenuItem>
                    <MenuItem value="multiply_points">Multiply Points</MenuItem>
                    <MenuItem value="bonus_points">Bonus Points</MenuItem>
                    <MenuItem value="issue_coupon">Issue Coupon</MenuItem>
                    <MenuItem value="send_notification">Send Notification</MenuItem>
                  </Select></FormControl>
                </Grid>
                {['award_points', 'bonus_points'].includes(action.actionType) && (
                  <>
                    <Grid item xs={3}>
                      <FormControl fullWidth size="small"><Select value={action.config?.pointType || 'fixed'} onChange={e => { const a = [...form.actions]; a[ai].config = { ...a[ai].config, pointType: e.target.value }; setForm({ ...form, actions: a }); }}>
                        {pointTypes.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                      </Select></FormControl>
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" value={action.config?.value || '0'} onChange={e => { const a = [...form.actions]; a[ai].config = { ...a[ai].config, value: e.target.value }; setForm({ ...form, actions: a }); }} label="Value" />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" value={action.config?.label || ''} onChange={e => { const a = [...form.actions]; a[ai].config = { ...a[ai].config, label: e.target.value }; setForm({ ...form, actions: a }); }} label="Label" />
                    </Grid>
                  </>
                )}
                {action.actionType === 'multiply_points' && (
                  <Grid item xs={4}>
                    <TextField fullWidth size="small" type="number" value={action.config?.multiplier || '1'} onChange={e => { const a = [...form.actions]; a[ai].config = { ...a[ai].config, multiplier: e.target.value }; setForm({ ...form, actions: a }); }} label="Multiplier (e.g., 2 for double)" />
                  </Grid>
                )}
                <Grid item xs={1}>
                  <IconButton size="small" color="error" onClick={() => removeAction(ai)}><Delete fontSize="small" /></IconButton>
                </Grid>
              </Grid>
            </Paper>
          ))}
          <Button size="small" onClick={addAction} variant="outlined">+ Add Action</Button>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />} label="Active" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, mode: 'create', rule: null })}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? <CircularProgress size={20} /> : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoyaltyRuleEngine;
