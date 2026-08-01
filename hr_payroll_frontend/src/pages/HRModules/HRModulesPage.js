import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Card, CardContent, Tabs, Tab, Button, TextField, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, CircularProgress, InputAdornment, MenuItem } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, TrendingUp, School, Work, AssignmentTurnedIn, PlayArrow as InitIcon } from '@mui/icons-material';
import { fetchPG, createPG, updatePG, deletePG, fetchPK, createPK, updatePK, deletePK, fetchPA, createPA, updatePA, deletePA, fetchTC, createTC, updateTC, deleteTC, fetchTS, createTS, updateTS, deleteTS, fetchTA, createTA, updateTA, deleteTA, fetchJP, createJP, updateJP, deleteJP, fetchJA, createJA, updateJA, deleteJA, fetchIV, createIV, updateIV, deleteIV, fetchOL, createOL, updateOL, deleteOL, fetchONC, createONC, updateONC, deleteONC, fetchONP, updateONP, deleteONP, fetchOFC, createOFC, updateOFC, deleteOFC, fetchOFP, updateOFP, deleteOFP, fetchEI, createEI, updateEI, deleteEI } from '../../store/slices/hrModulesSlices';
import HRModulesApi from '../../services/hrModulesApi';
import { showSuccess, showError } from '../../utils/toast';
import EmployeeSelect from '../../components/Shared/EmployeeSelect';
import CourseSelect from '../../components/Shared/CourseSelect';
import SessionSelect from '../../components/Shared/SessionSelect';
import DepartmentSelect from '../../components/Shared/DepartmentSelect';
import DesignationSelect from '../../components/Shared/DesignationSelect';
import PositionSelect from '../../components/Shared/PositionSelect';
import ApplicantSelect from '../../components/Shared/ApplicantSelect';

const MODULES = [
  { key: 'performance', label: 'Performance', icon: <TrendingUp />, subTabs: [
    { key: 'goals', label: 'Goals', fields: ['pg'] }, { key: 'kpis', label: 'KPIs', fields: ['pk'] }, { key: 'appraisals', label: 'Appraisals', fields: ['pa'] }
  ]},
  { key: 'training', label: 'Training', icon: <School />, subTabs: [
    { key: 'courses', label: 'Courses', fields: ['tc'] }, { key: 'sessions', label: 'Sessions', fields: ['ts'] }, { key: 'attendees', label: 'Attendees', fields: ['ta'] }
  ]},
  { key: 'recruitment', label: 'Recruitment', icon: <Work />, subTabs: [
    { key: 'positions', label: 'Positions', fields: ['jp'] }, { key: 'applicants', label: 'Applicants', fields: ['ja'] }, { key: 'interviews', label: 'Interviews', fields: ['iv'] }, { key: 'offers', label: 'Offers', fields: ['ol'] }
  ]},
  { key: 'onoffboarding', label: 'On/Offboarding', icon: <AssignmentTurnedIn />, subTabs: [
    { key: 'onbChecklist', label: 'Onboarding Checklist', fields: ['onc'] }, { key: 'onbProgress', label: 'Onboarding Progress', fields: ['onp'] }, { key: 'offbChecklist', label: 'Offboarding Checklist', fields: ['ofc'] }, { key: 'offbProgress', label: 'Offboarding Progress', fields: ['ofp'] }, { key: 'exitInterviews', label: 'Exit Interviews', fields: ['ei'] }
  ]},
];

const FIELD_MAP = { pg: 'perfGoals', pk: 'perfKpis', pa: 'perfAppraisals', tc: 'trainCourses', ts: 'trainSessions', ta: 'trainAttendees', jp: 'jobPositions', ja: 'jobApplicants', iv: 'interviews', ol: 'offerLetters', onc: 'onbChecklists', onp: 'onbProgress', ofc: 'offbChecklists', ofp: 'offbProgress', ei: 'exitInterviews' };
const THUNK_MAP = { pg: { f: fetchPG, c: createPG, u: updatePG, d: deletePG }, pk: { f: fetchPK, c: createPK, u: updatePK, d: deletePK }, pa: { f: fetchPA, c: createPA, u: updatePA, d: deletePA }, tc: { f: fetchTC, c: createTC, u: updateTC, d: deleteTC }, ts: { f: fetchTS, c: createTS, u: updateTS, d: deleteTS }, ta: { f: fetchTA, c: createTA, u: updateTA, d: deleteTA }, jp: { f: fetchJP, c: createJP, u: updateJP, d: deleteJP }, ja: { f: fetchJA, c: createJA, u: updateJA, d: deleteJA }, iv: { f: fetchIV, c: createIV, u: updateIV, d: deleteIV }, ol: { f: fetchOL, c: createOL, u: updateOL, d: deleteOL }, onc: { f: fetchONC, c: createONC, u: updateONC, d: deleteONC }, onp: { f: fetchONP, u: updateONP, d: deleteONP }, ofc: { f: fetchOFC, c: createOFC, u: updateOFC, d: deleteOFC }, ofp: { f: fetchOFP, u: updateOFP, d: deleteOFP }, ei: { f: fetchEI, c: createEI, u: updateEI, d: deleteEI } };

const COLUMNS = {
  pg: ['Title', 'Employee', 'Type', 'Priority', 'Progress', 'Status', 'Actions'],
  pk: ['Code', 'Name', 'Type', 'Unit', 'Target', 'Status', 'Actions'],
  pa: ['Employee', 'Appraiser', 'Date', 'Rating', 'Status', 'Actions'],
  tc: ['Code', 'Name', 'Category', 'Duration(h)', 'Mandatory', 'Status', 'Actions'],
  ts: ['Session', 'Course', 'Trainer', 'Start', 'End', 'Status', 'Actions'],
  ta: ['Employee', 'Session', 'Attendance', 'Score', 'Certified', 'Actions'],
  jp: ['Code', 'Title', 'Dept', 'Vacancies', 'Exp Range', 'Status', 'Actions'],
  ja: ['App #', 'Name', 'Position', 'Email', 'Exp Years', 'Status', 'Actions'],
  iv: ['Applicant', 'Date', 'Time', 'Type', 'Round', 'Status', 'Actions'],
  ol: ['Offer #', 'Applicant', 'Salary', 'Joining', 'Status', 'Actions'],
  onc: ['Task', 'Category', 'Sort', 'Status', 'Actions'],
  onp: ['Employee', 'Task', 'Category', 'Status', 'Actions'],
  ofc: ['Task', 'Category', 'Sort', 'Status', 'Actions'],
  ofp: ['Employee', 'Task', 'Category', 'Status', 'Actions'],
  ei: ['Employee', 'Date', 'Reason', 'Rehire?', 'Status', 'Actions'],
};

const HRModulesPage = () => {
  const dispatch = useDispatch();
  const [moduleKey, setModuleKey] = useState('performance');
  const [subTabKey, setSubTabKey] = useState('goals');
  const [search, setSearch] = useState(''); const [page, setPage] = useState(0); const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false); const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false); const [selectedId, setSelectedId] = useState(null); const [formData, setFormData] = useState({});
  const [initOpen, setInitOpen] = useState(false); const [initEmployeeId, setInitEmployeeId] = useState('');

  const fieldKey = MODULES.find(m => m.key === moduleKey)?.subTabs.find(s => s.key === subTabKey)?.fields[0];
  const stateKey = FIELD_MAP[fieldKey] || 'perfGoals';
  const sliceState = useSelector(s => s[stateKey]) || { list: [], loading: false, saving: false };
  const thunks = THUNK_MAP[fieldKey] || {};

  const loadData = useCallback(() => {
    if (thunks.f) dispatch(thunks.f({ page: page + 1, limit: rowsPerPage, search: search || undefined }));
  }, [dispatch, fieldKey, page, rowsPerPage, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = () => { setFormData({ isActive: true }); setEditMode(false); setDialogOpen(true); };
  const handleEdit = (item) => { setFormData({ ...item }); setEditMode(true); setSelectedId(item.id); setDialogOpen(true); };
  const handleDeleteConfirm = (id) => { setSelectedId(id); setDeleteOpen(true); };
  const handleDelete = async () => { const r = await dispatch(thunks.d(selectedId)); if (r.meta.requestStatus === 'fulfilled') { showSuccess('Deleted'); setDeleteOpen(false); loadData(); } else showError(r.payload || 'Failed'); };
  const handleInitOpen = () => { setInitEmployeeId(''); setInitOpen(true); };
  const handleInitSubmit = async () => {
    if (!initEmployeeId) return showError('Please select an employee');
    try {
      const api = fieldKey === 'onp' ? HRModulesApi.onboardingProgress : HRModulesApi.offboardingProgress;
      await api.initialize(initEmployeeId);
      showSuccess('Progress initialized'); setInitOpen(false); loadData();
    } catch (e) { showError(e.response?.data?.message || 'Initialization failed'); }
  };
  const handleSubmit = async () => {
    if (editMode && thunks.u) { const r = await dispatch(thunks.u({ id: selectedId, data: formData })); if (r.meta.requestStatus === 'fulfilled') { showSuccess('Updated'); setDialogOpen(false); loadData(); } else showError(r.payload || 'Failed'); }
    else if (thunks.c) { const r = await dispatch(thunks.c(formData)); if (r.meta.requestStatus === 'fulfilled') { showSuccess('Created'); setDialogOpen(false); loadData(); } else showError(r.payload || 'Failed'); }
  };

  const { list = [], loading } = sliceState;
  const pagination = sliceState.pagination || { total: 0 };

  const renderRow = (item) => {
    switch (fieldKey) {
      case 'pg': return [item.title, item.employee ? `${item.employee.firstName || ''} ${item.employee.lastName || ''}`.trim() || '—' : '—', <Chip label={item.goalType} size="small" variant="outlined" />, <Chip label={item.priority} size="small" color={item.priority === 'Critical' ? 'error' : item.priority === 'High' ? 'warning' : 'default'} />, `${item.progressPercentage || 0}%`, <Chip label={item.status} size="small" color={item.status === 'Completed' ? 'success' : item.status === 'In Progress' ? 'primary' : item.status === 'Cancelled' ? 'error' : 'default'} />];
      case 'pk': return [item.code, item.name, item.kpiType, item.measurementUnit || '—', item.targetValue || '—', <Chip label={item.isActive ? 'Active' : 'Inactive'} size="small" color={item.isActive ? 'success' : 'default'} />];
      case 'pa': return [item.employee ? `${item.employee.firstName || ''} ${item.employee.lastName || ''}`.trim() || '—' : '—', item.appraiser ? `${item.appraiser.firstName || ''} ${item.appraiser.lastName || ''}`.trim() || '—' : '—', item.appraisalDate, item.overallRating || '—', <Chip label={item.status} size="small" color={item.status === 'Acknowledged' ? 'success' : 'info'} />];
      case 'tc': return [item.code, item.name, <Chip label={item.category} size="small" variant="outlined" />, item.durationHours || '—', item.isMandatory ? 'Yes' : 'No', <Chip label={item.isActive ? 'Active' : 'Inactive'} size="small" />];
      case 'ts': return [item.sessionName, item.course?.name || '—', item.trainerName || '—', item.startDate, item.endDate || '—', <Chip label={item.status} size="small" />];
      case 'ta': return [item.employee ? `${item.employee.firstName || ''} ${item.employee.lastName || ''}`.trim() || '—' : '—', item.session?.sessionName || '—', <Chip label={item.attendanceStatus} size="small" />, item.score || '—', item.certificateIssued ? 'Yes' : 'No'];
      case 'jp': return [item.positionCode, item.title, item.department?.name || '—', item.vacancies, `${item.minExperience} - ${item.maxExperience || '∞'}yr`, <Chip label={item.status} size="small" color={item.status === 'Open' ? 'success' : 'default'} />];
      case 'ja': return [<Chip label={item.applicantNumber} size="small" variant="outlined" />, `${item.firstName} ${item.lastName}`, item.position?.title || '—', item.email, `${item.experienceYears || '—'}yr`, <Chip label={item.status} size="small" color={item.status === 'Hired' ? 'success' : item.status === 'Rejected' ? 'error' : 'warning'} />];
      case 'iv': return [item.applicant?.firstName ? `${item.applicant.firstName} ${item.applicant.lastName}` : '—', item.interviewDate, item.interviewTime || '—', <Chip label={item.interviewType} size="small" variant="outlined" />, item.roundNumber, <Chip label={item.status} size="small" />];
      case 'ol': return [<Chip label={item.offerNumber} size="small" variant="outlined" />, item.applicant?.firstName ? `${item.applicant.firstName} ${item.applicant.lastName}` : '—', Number(item.offeredSalary).toLocaleString(), item.joiningDate || '—', <Chip label={item.status} size="small" color={item.status === 'Accepted' ? 'success' : 'warning'} />];
      case 'onc': return [item.taskName, <Chip label={item.category} size="small" />, item.sortOrder, <Chip label={item.isActive ? 'Active' : 'Inactive'} size="small" />];
      case 'onp': return [item.employee?.name || '—', item.checklist?.taskName || '—', <Chip label={item.checklist?.category} size="small" />, <Chip label={item.status} size="small" color={item.status === 'Completed' ? 'success' : 'warning'} />];
      case 'ofc': return [item.taskName, <Chip label={item.category} size="small" />, item.sortOrder, <Chip label={item.isActive ? 'Active' : 'Inactive'} size="small" />];
      case 'ofp': return [item.employee?.name || '—', item.checklist?.taskName || '—', <Chip label={item.checklist?.category} size="small" />, <Chip label={item.status} size="small" color={item.status === 'Completed' ? 'success' : 'warning'} />];
      case 'ei': return [item.employee ? `${item.employee.firstName || ''} ${item.employee.lastName || ''}`.trim() || '—' : '—', item.interviewDate, (item.reasonForLeaving || '').substring(0, 30), item.rehireRecommendation ? 'Yes' : item.rehireRecommendation === false ? 'No' : '—', <Chip label={item.status} size="small" />];
      default: return [];
    }
  };

  const renderForm = () => {
    const f = (name, label, type = 'text', xs = 6) => <Grid item xs={xs}><TextField fullWidth size="small" label={label} type={type} value={formData[name] || ''} onChange={e => setFormData({ ...formData, [name]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })} InputLabelProps={type === 'date' ? { shrink: true } : undefined} /></Grid>;
    switch (fieldKey) {
      case 'pg': return <Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee" required /></Grid>{f('title', 'Title *')}<Grid item xs={6}><TextField select fullWidth size="small" label="Goal Type" value={formData.goalType || 'Individual'} onChange={e => setFormData({ ...formData, goalType: e.target.value })}><MenuItem value="Individual">Individual</MenuItem><MenuItem value="Team">Team</MenuItem><MenuItem value="Department">Department</MenuItem><MenuItem value="Company">Company</MenuItem></TextField></Grid><Grid item xs={6}><TextField select fullWidth size="small" label="Priority" value={formData.priority || 'Medium'} onChange={e => setFormData({ ...formData, priority: e.target.value })}><MenuItem value="Low">Low</MenuItem><MenuItem value="Medium">Medium</MenuItem><MenuItem value="High">High</MenuItem><MenuItem value="Critical">Critical</MenuItem></TextField></Grid><Grid item xs={6}><TextField select fullWidth size="small" label="Status" value={formData.status || 'Not Started'} onChange={e => setFormData({ ...formData, status: e.target.value })}><MenuItem value="Not Started">Not Started</MenuItem><MenuItem value="In Progress">In Progress</MenuItem><MenuItem value="Completed">Completed</MenuItem><MenuItem value="On Hold">On Hold</MenuItem><MenuItem value="Cancelled">Cancelled</MenuItem></TextField></Grid>{f('progressPercentage', 'Progress %', 'number')}{f('startDate', 'Start Date', 'date')}{f('targetDate', 'Target Date', 'date')}{f('description', 'Description', 'text', 12)}</Grid>;
      case 'pk': return <Grid container spacing={2} sx={{ mt: 0.5 }}>{f('code', 'Code *')}{f('name', 'Name *')}<Grid item xs={6}><TextField select fullWidth size="small" label="KPI Type" value={formData.kpiType || 'Quantitative'} onChange={e => setFormData({ ...formData, kpiType: e.target.value })}><MenuItem value="Quantitative">Quantitative</MenuItem><MenuItem value="Qualitative">Qualitative</MenuItem><MenuItem value="Behavioral">Behavioral</MenuItem></TextField></Grid>{f('measurementUnit', 'Unit')}{f('targetValue', 'Target Value', 'number')}{f('minimumValue', 'Minimum', 'number')}{f('description', 'Description', 'text', 12)}</Grid>;
      case 'pa': return <Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee *" required /></Grid><Grid item xs={6}><EmployeeSelect value={formData.appraiserId} onChange={v => setFormData({ ...formData, appraiserId: v })} label="Appraiser *" required /></Grid>{f('appraisalDate', 'Appraisal Date *', 'date')}{f('periodFrom', 'Period From', 'date')}{f('periodTo', 'Period To', 'date')}{f('overallRating', 'Overall Rating', 'number')}{f('strengths', 'Strengths', 'text', 12)}{f('improvements', 'Areas to Improve', 'text', 12)}{f('employeeComments', 'Employee Comments', 'text', 12)}{f('appraiserComments', 'Appraiser Comments', 'text', 12)}</Grid>;
      case 'tc': return <Grid container spacing={2} sx={{ mt: 0.5 }}>{f('code', 'Code *')}{f('name', 'Name *')}<Grid item xs={6}><TextField select fullWidth size="small" label="Category" value={formData.category || 'Other'} onChange={e => setFormData({ ...formData, category: e.target.value })}><MenuItem value="Technical">Technical</MenuItem><MenuItem value="Soft Skills">Soft Skills</MenuItem><MenuItem value="Compliance">Compliance</MenuItem><MenuItem value="Leadership">Leadership</MenuItem><MenuItem value="Safety">Safety</MenuItem><MenuItem value="Other">Other</MenuItem></TextField></Grid>{f('durationHours', 'Duration (hours)', 'number')}{f('providerName', 'Provider')}{f('cost', 'Cost', 'number')}{f('description', 'Description', 'text', 12)}</Grid>;
      case 'ts': return <Grid container spacing={2} sx={{ mt: 0.5 }}>{f('sessionName', 'Session Name *')}<Grid item xs={6}><CourseSelect value={formData.courseId} onChange={v => setFormData({ ...formData, courseId: v })} label="Course" required /></Grid>{f('trainerName', 'Trainer')}{f('location', 'Location')}{f('startDate', 'Start Date *', 'date')}{f('endDate', 'End Date', 'date')}{f('startTime', 'Start Time', 'text')}{f('endTime', 'End Time', 'text')}{f('maxAttendees', 'Max Attendees', 'number')}{f('notes', 'Notes', 'text', 12)}</Grid>;
      case 'ta': return <Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee *" required /></Grid><Grid item xs={6}><SessionSelect value={formData.sessionId} onChange={v => setFormData({ ...formData, sessionId: v })} label="Session" required /></Grid><Grid item xs={6}><TextField select fullWidth size="small" label="Attendance Status" value={formData.attendanceStatus || 'Enrolled'} onChange={e => setFormData({ ...formData, attendanceStatus: e.target.value })}><MenuItem value="Enrolled">Enrolled</MenuItem><MenuItem value="Attended">Attended</MenuItem><MenuItem value="Absent">Absent</MenuItem><MenuItem value="Completed">Completed</MenuItem></TextField></Grid>{f('score', 'Score', 'number')}{f('feedback', 'Feedback', 'text', 12)}</Grid>;
      case 'jp': return <Grid container spacing={2} sx={{ mt: 0.5 }}>{f('positionCode', 'Code *')}{f('title', 'Title *')}<Grid item xs={6}><DepartmentSelect value={formData.departmentId} onChange={v => setFormData({ ...formData, departmentId: v })} label="Department" /></Grid><Grid item xs={6}><DesignationSelect value={formData.designationId} onChange={v => setFormData({ ...formData, designationId: v })} label="Designation" /></Grid>{f('vacancies', 'Vacancies', 'number')}{f('minExperience', 'Min Experience', 'number')}{f('maxExperience', 'Max Experience', 'number')}{f('minSalary', 'Min Salary', 'number')}{f('maxSalary', 'Max Salary', 'number')}{f('description', 'Description', 'text', 12)}</Grid>;
      case 'ja': return <Grid container spacing={2} sx={{ mt: 0.5 }}>{f('firstName', 'First Name *')}{f('lastName', 'Last Name *')}{f('email', 'Email *')}{f('phone', 'Phone')}<Grid item xs={6}><PositionSelect value={formData.positionId} onChange={v => setFormData({ ...formData, positionId: v })} label="Position" required /></Grid>{f('experienceYears', 'Experience Years', 'number')}<Grid item xs={6}><TextField select fullWidth size="small" label="Source" value={formData.source || 'Website'} onChange={e => setFormData({ ...formData, source: e.target.value })}><MenuItem value="LinkedIn">LinkedIn</MenuItem><MenuItem value="Website">Website</MenuItem><MenuItem value="Referral">Referral</MenuItem><MenuItem value="Agency">Agency</MenuItem><MenuItem value="JobPortal">Job Portal</MenuItem><MenuItem value="Other">Other</MenuItem></TextField></Grid>{f('currentCompany', 'Current Company')}{f('currentSalary', 'Current Salary', 'number')}{f('expectedSalary', 'Expected Salary', 'number')}</Grid>;
      case 'iv': return <Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={6}><ApplicantSelect value={formData.applicantId} onChange={v => setFormData({ ...formData, applicantId: v })} label="Applicant" required /></Grid>{f('interviewDate', 'Date *', 'date')}{f('interviewTime', 'Time')}<Grid item xs={6}><TextField select fullWidth size="small" label="Type" value={formData.interviewType || 'InPerson'} onChange={e => setFormData({ ...formData, interviewType: e.target.value })}><MenuItem value="Phone">Phone</MenuItem><MenuItem value="Video">Video</MenuItem><MenuItem value="InPerson">In Person</MenuItem><MenuItem value="Technical">Technical</MenuItem><MenuItem value="HR">HR</MenuItem></TextField></Grid>{f('roundNumber', 'Round', 'number')}<Grid item xs={6}><EmployeeSelect value={formData.interviewerId} onChange={v => setFormData({ ...formData, interviewerId: v })} label="Interviewer" /></Grid>{f('rating', 'Rating (1-5)', 'number')}{f('feedback', 'Feedback', 'text', 12)}</Grid>;
      case 'ol': return <Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={6}><ApplicantSelect value={formData.applicantId} onChange={v => setFormData({ ...formData, applicantId: v })} label="Applicant" required /></Grid><Grid item xs={6}><PositionSelect value={formData.positionId} onChange={v => setFormData({ ...formData, positionId: v })} label="Position" /></Grid>{f('offerDate', 'Offer Date *', 'date')}{f('joiningDate', 'Joining Date', 'date')}{f('offeredSalary', 'Offered Salary *', 'number')}{f('expiryDate', 'Expiry Date', 'date')}{f('termsAndConditions', 'Terms & Conditions', 'text', 12)}</Grid>;
      case 'onc': return <Grid container spacing={2} sx={{ mt: 0.5 }}>{f('taskName', 'Task Name *')}<Grid item xs={6}><TextField select fullWidth size="small" label="Category" value={formData.category || 'HR'} onChange={e => setFormData({ ...formData, category: e.target.value })}><MenuItem value="IT">IT</MenuItem><MenuItem value="HR">HR</MenuItem><MenuItem value="Admin">Admin</MenuItem><MenuItem value="Training">Training</MenuItem><MenuItem value="Documentation">Documentation</MenuItem><MenuItem value="Other">Other</MenuItem></TextField></Grid>{f('sortOrder', 'Sort Order', 'number')}</Grid>;
      case 'onp': case 'ofp': return <Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={12}><Typography variant="body2" fontWeight={600}>{formData.employee ? `${formData.employee.firstName || ''} ${formData.employee.lastName || ''}`.trim() || 'N/A' : formData.checklist?.taskName || 'Progress Record'}</Typography></Grid><Grid item xs={6}><TextField select fullWidth size="small" label="Status *" value={formData.status || 'Pending'} onChange={e => setFormData({ ...formData, status: e.target.value })}><MenuItem value="Pending">Pending</MenuItem><MenuItem value="In Progress">In Progress</MenuItem><MenuItem value="Completed">Completed</MenuItem><MenuItem value="Skipped">Skipped</MenuItem></TextField></Grid>{f('completedDate', 'Completed Date', 'date')}{f('notes', 'Notes', 'text', 12)}</Grid>;
      case 'ofc': return <Grid container spacing={2} sx={{ mt: 0.5 }}>{f('taskName', 'Task Name *')}<Grid item xs={6}><TextField select fullWidth size="small" label="Category" value={formData.category || 'Other'} onChange={e => setFormData({ ...formData, category: e.target.value })}><MenuItem value="ExitInterview">Exit Interview</MenuItem><MenuItem value="AssetReturn">Asset Return</MenuItem><MenuItem value="ITAccess">IT Access</MenuItem><MenuItem value="FinalSettlement">Final Settlement</MenuItem><MenuItem value="Documentation">Documentation</MenuItem><MenuItem value="Clearance">Clearance</MenuItem><MenuItem value="Other">Other</MenuItem></TextField></Grid>{f('sortOrder', 'Sort Order', 'number')}</Grid>;
      case 'ei': return <Grid container spacing={2} sx={{ mt: 0.5 }}><Grid item xs={6}><EmployeeSelect value={formData.employeeId} onChange={v => setFormData({ ...formData, employeeId: v })} label="Employee *" required /></Grid>{f('interviewDate', 'Interview Date *', 'date')}{f('reasonForLeaving', 'Reason for Leaving', 'text', 12)}{f('newEmployer', 'New Employer')}{f('newPosition', 'New Position')}<Grid item xs={6}><TextField select fullWidth size="small" label="Rehire?" value={formData.rehireRecommendation === true ? 'yes' : formData.rehireRecommendation === false ? 'no' : ''} onChange={e => setFormData({ ...formData, rehireRecommendation: e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null })}><MenuItem value="">—</MenuItem><MenuItem value="yes">Yes</MenuItem><MenuItem value="no">No</MenuItem></TextField></Grid>{f('feedback', 'Feedback', 'text', 12)}</Grid>;
      default: return <Grid container spacing={2} sx={{ mt: 0.5 }}>{Object.keys(formData).filter(k => !['id', 'tenantId', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'isActive'].includes(k)).slice(0, 4).map(k => f(k, k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())))}</Grid>;
    }
  };

  const currentModule = MODULES.find(m => m.key === moduleKey);

  return (<Box>
    <Typography variant="h4" gutterBottom>Performance, Training, Recruitment & On/Offboarding</Typography>
    <Tabs value={moduleKey} onChange={(e, v) => { setModuleKey(v); const st = MODULES.find(m => m.key === v)?.subTabs[0]?.key; setSubTabKey(st); setPage(0); }} sx={{ mb: 1 }}>{MODULES.map(m => <Tab key={m.key} value={m.key} icon={m.icon} label={m.label} />)}</Tabs>
    <Tabs value={subTabKey} onChange={(e, v) => { setSubTabKey(v); setPage(0); }} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} variant="scrollable">{currentModule?.subTabs.map(st => <Tab key={st.key} value={st.key} label={st.label} />)}</Tabs>

    <Card sx={{ mb: 2 }}><CardContent sx={{ pb: '8px !important' }}><Grid container spacing={2} alignItems="center">
      <Grid item xs={12} md={8}><TextField fullWidth size="small" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} InputProps={{ startAdornment: <InputAdornment position="start"><RefreshIcon /></InputAdornment> }} /></Grid>
      <Grid item xs={6} md={2}><Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>Refresh</Button></Grid>
      {thunks.c && <Grid item xs={6} md={2}><Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>Add</Button></Grid>}
      {(fieldKey === 'onp' || fieldKey === 'ofp') && <Grid item xs={6} md={2}><Button fullWidth variant="contained" color="success" startIcon={<InitIcon />} onClick={handleInitOpen}>Initialize</Button></Grid>}
    </Grid></CardContent></Card>

    <Card>{loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (<><TableContainer><Table size="small"><TableHead><TableRow>{(COLUMNS[fieldKey] || []).map((c, i) => <TableCell key={i} sx={{ fontWeight: 600 }}>{c}</TableCell>)}</TableRow></TableHead><TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={(COLUMNS[fieldKey] || []).length} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No records</Typography></TableCell></TableRow> : list.map(item => (<TableRow key={item.id} hover>{renderRow(item).map((v, i) => <TableCell key={i}>{typeof v === 'string' || typeof v === 'number' ? <Typography variant="body2">{v}</Typography> : v}</TableCell>)}<TableCell align="right"><Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => handleEdit(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>{thunks.d && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConfirm(item.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}</TableCell></TableRow>))}</TableBody></Table></TableContainer><TablePagination component="div" count={pagination.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} /></>)}</Card>

    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth><DialogTitle>{editMode ? 'Edit' : 'Add'} Record</DialogTitle><DialogContent dividers>{renderForm()}</DialogContent><DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSubmit}>{editMode ? 'Update' : 'Create'}</Button></DialogActions></Dialog>
    <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}><DialogTitle>Confirm Delete</DialogTitle><DialogContent><Typography>Are you sure?</Typography></DialogContent><DialogActions><Button onClick={() => setDeleteOpen(false)}>Cancel</Button><Button color="error" variant="contained" onClick={handleDelete}>Delete</Button></DialogActions></Dialog>
    <Dialog open={initOpen} onClose={() => setInitOpen(false)} maxWidth="sm" fullWidth><DialogTitle>Initialize {fieldKey === 'onp' ? 'Onboarding' : 'Offboarding'} Progress</DialogTitle><DialogContent dividers><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Select an employee to initialize progress for all active checklist tasks.</Typography><EmployeeSelect value={initEmployeeId} onChange={v => setInitEmployeeId(v)} label="Employee *" required /></DialogContent><DialogActions><Button onClick={() => setInitOpen(false)}>Cancel</Button><Button variant="contained" color="success" onClick={handleInitSubmit} startIcon={<InitIcon />}>Initialize</Button></DialogActions></Dialog>
  </Box>);
};

export default HRModulesPage;
