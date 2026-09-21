import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, CircularProgress, Alert, IconButton, Stack, Autocomplete,
  FormControlLabel, Checkbox, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  Search as SearchIcon, Refresh as RefreshIcon, Print as PrintIcon,
  FileDownload as ExcelIcon, PictureAsPdf as PdfIcon, ArrowBack as BackIcon,
} from '@mui/icons-material';
import reportApi from '../../services/reportApi';
import { fetchWarehouses } from '../../store/slices/warehouseSlice';
import { fetchItems } from '../../store/slices/itemSlice';
import { fetchItemCategories } from '../../store/slices/itemCategorySlice';
import { apiError } from '../../utils/toast';

const AGING_BUCKETS = [
  { value: '', label: 'All Buckets' },
  { value: '0-30', label: '0–30 Days' },
  { value: '31-60', label: '31–60 Days' },
  { value: '61-90', label: '61–90 Days' },
  { value: '91-180', label: '91–180 Days' },
  { value: '181-365', label: '181–365 Days' },
  { value: '365+', label: 'More than 365 Days' },
];

const ITEM_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
];

const SUMMARY_COLUMNS = [
  { key: 'item_code', label: 'Item Code' },
  { key: 'item_name', label: 'Item Name' },
  { key: 'category_name', label: 'Category' },
  { key: 'warehouse_name', label: 'Warehouse' },
  { key: 'item_type', label: 'Type' },
  { key: 'current_qty', label: 'Current Quantity', numeric: true },
  { key: 'unit_cost', label: 'Unit Cost', numeric: true },
  { key: 'inventory_value', label: 'Inventory Value', numeric: true },
  { key: 'receipt_date', label: 'Receipt Date' },
  { key: 'avg_days_held', label: 'Avg Days Held', numeric: true },
  { key: 'max_days_held', label: 'Max Days Held', numeric: true },
  { key: 'aging_bucket', label: 'Aging Bucket' },
];

const LAYER_COLUMNS = [
  { key: 'item_code', label: 'Item Code' },
  { key: 'item_name', label: 'Item Name' },
  { key: 'category_name', label: 'Category' },
  { key: 'warehouse_name', label: 'Warehouse' },
  { key: 'layer_date', label: 'Receipt Date' },
  { key: 'remaining_qty', label: 'Remaining Qty', numeric: true },
  { key: 'unit_cost', label: 'Unit Cost', numeric: true },
  { key: 'layer_value', label: 'Layer Value', numeric: true },
  { key: 'days_held', label: 'Days Held', numeric: true },
  { key: 'aging_bucket', label: 'Aging Bucket' },
];

const fmt = (v) => {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
  if (typeof v === 'number') return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v;
};

const InventoryAgingReport = ({ reportName: propReportName }) => {
  const { reportName: paramReportName } = useParams();
  const reportName = propReportName || paramReportName;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isValuation = reportName === 'inventory-valuation';
  const title = isValuation ? 'Inventory Valuation' : 'Inventory Aging';

  const warehouses = useSelector((s) => s.warehouses?.warehouses || []);
  const items = useSelector((s) => s.items?.items || []);
  const categories = useSelector((s) => s.itemCategories?.items || []);

  const [view, setView] = useState('summary');
  const [filters, setFilters] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    warehouseId: '',
    itemId: '',
    categoryId: '',
    itemType: '',
    includeZeroStock: false,
    agingBucket: '',
  });
  const [data, setData] = useState([]);
  const [layers, setLayers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, totalRecords: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => {
    dispatch(fetchWarehouses({ limit: 1000 }));
    dispatch(fetchItems({ limit: 2000 }));
    dispatch(fetchItemCategories());
  }, [dispatch]);

  const buildParams = useCallback(() => ({
    reportDate: filters.reportDate || undefined,
    warehouseId: filters.warehouseId || undefined,
    itemId: filters.itemId || undefined,
    categoryId: filters.categoryId || undefined,
    itemType: filters.itemType || undefined,
    includeZeroStock: filters.includeZeroStock ? 1 : 0,
    agingBucket: filters.agingBucket || undefined,
    page: page + 1,
    pageSize: rowsPerPage,
  }), [filters, page, rowsPerPage]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await reportApi.execute(reportName, buildParams());
      setData(res.data || []);
      setLayers(res.layers || []);
      setSummary(res.summary);
      setPagination(res.pagination || { page: 1, pageSize: 50, totalRecords: 0, totalPages: 0 });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load report');
      setData([]);
      setLayers([]);
    } finally {
      setLoading(false);
    }
  }, [reportName, buildParams]);

  const handleRun = () => {
    setHasRun(true);
    setPage(0);
    loadReport();
  };

  const handleReset = () => {
    setFilters({
      reportDate: new Date().toISOString().split('T')[0],
      warehouseId: '', itemId: '', categoryId: '', itemType: '',
      includeZeroStock: false, agingBucket: '',
    });
    setHasRun(false);
    setPage(0);
    setData([]);
    setLayers([]);
    setSummary(null);
    setError(null);
  };

  const updateFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));

  const handlePrint = () => window.print();
  const handleExportExcel = () => {
    try {
      const rows = view === 'summary' ? data : layers;
      const XLSX = require('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title);
      XLSX.writeFile(wb, `${reportName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) { apiError('Excel export failed'); }
  };

  const handleExportPdf = async () => {
    try {
      const rows = view === 'summary' ? data : layers;
      const columns = view === 'summary' ? SUMMARY_COLUMNS : LAYER_COLUMNS;
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.text(title, 14, 15);
      doc.setFontSize(9);
      doc.text(`Report Date: ${filters.reportDate || 'Today'}   Generated: ${new Date().toLocaleDateString()}`, 14, 22);
      const head = [columns.map((c) => c.label)];
      const body = rows.map((r) => columns.map((c) => {
        const v = r[c.key];
        if (typeof v === 'number') return v.toFixed(2);
        if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
        return v ?? '';
      }));
      autoTable(doc, { startY: 28, head, body, styles: { fontSize: 7 }, headStyles: { fillColor: [25, 118, 210] } });
      doc.save(`${reportName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) { apiError('PDF export failed'); }
  };

  const rows = view === 'summary' ? data : layers;
  const columns = view === 'summary' ? SUMMARY_COLUMNS : LAYER_COLUMNS;
  const effectiveTotal = view === 'summary' ? (pagination?.totalRecords || 0) : rows.length;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/app/reports')}><BackIcon /></IconButton>
        <Typography variant="h4" fontWeight={700}>{title}</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} md={2}>
              <TextField fullWidth size="small" type="date" label="Report Date"
                value={filters.reportDate}
                onChange={(e) => updateFilter('reportDate', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete size="small" options={warehouses}
                getOptionLabel={(o) => o.name || o.warehouseName || ''}
                value={warehouses.find((w) => w.id === filters.warehouseId) || null}
                onChange={(e, v) => updateFilter('warehouseId', v?.id || '')}
                renderInput={(p) => <TextField {...p} label="Warehouse" />} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete size="small" options={items}
                getOptionLabel={(o) => `${o.itemCode || ''} - ${o.name || ''}`}
                value={items.find((i) => i.id === filters.itemId) || null}
                onChange={(e, v) => updateFilter('itemId', v?.id || '')}
                renderInput={(p) => <TextField {...p} label="Item" />} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete size="small" options={categories}
                getOptionLabel={(o) => o.name || ''}
                value={categories.find((c) => c.id === filters.categoryId) || null}
                onChange={(e, v) => updateFilter('categoryId', v?.id || '')}
                renderInput={(p) => <TextField {...p} label="Category" />} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField select fullWidth size="small" label="Item Type"
                value={filters.itemType} onChange={(e) => updateFilter('itemType', e.target.value)}>
                {ITEM_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField select fullWidth size="small" label="Aging Bucket"
                value={filters.agingBucket} onChange={(e) => updateFilter('agingBucket', e.target.value)}>
                {AGING_BUCKETS.map((b) => <MenuItem key={b.value} value={b.value}>{b.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControlLabel
                control={<Checkbox checked={filters.includeZeroStock}
                  onChange={(e) => updateFilter('includeZeroStock', e.target.checked)} />}
                label="Include Zero Stock" />
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handleRun} startIcon={<SearchIcon />}>Run Report</Button>
                <Button size="small" variant="outlined" onClick={handleReset} startIcon={<RefreshIcon />}>Reset</Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={7}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ToggleButtonGroup value={view} exclusive size="small"
                  onChange={(e, v) => v && setView(v)}>
                  <ToggleButton value="summary">Summary</ToggleButton>
                  <ToggleButton value="layers">Layers</ToggleButton>
                </ToggleButtonGroup>
                <Button size="small" color="info" onClick={handlePrint} startIcon={<PrintIcon />}>Print</Button>
                <Button size="small" color="success" onClick={handleExportExcel} startIcon={<ExcelIcon />}>Excel</Button>
                <Button size="small" color="error" onClick={handleExportPdf} startIcon={<PdfIcon />}>PDF</Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[['total_items', 'Items'], ['total_quantity', 'Total Quantity'], ['total_value', 'Total Value']].map(([key, label]) => (
            <Grid item xs={6} sm={3} key={key}>
              <Card>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="h6" fontWeight={700}>{fmt(summary[key])}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!hasRun && !loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            Select filters and click <strong>Run Report</strong> to view inventory {isValuation ? 'valuation' : 'aging'}.
          </Typography>
        </Box>
      )}

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

      {hasRun && !loading && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.numeric ? 'right' : 'left'}>
                    <strong>{col.label}</strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={columns.length} align="center">No data found</TableCell></TableRow>
              ) : rows.map((r, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.numeric ? 'right' : 'left'}>{fmt(r[col.key])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {view === 'summary' && (
            <TablePagination
              component="div"
              count={effectiveTotal}
              page={page}
              onPageChange={(e, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          )}
        </TableContainer>
      )}
    </Box>
  );
};

export default InventoryAgingReport;
