import React from 'react';
import {
  Box, Typography, Grid, Chip, Avatar, Divider, List, ListItem,
  ListItemText, Paper, Stack,
} from '@mui/material';
import {
  Email, Phone, Person, Badge, CalendarToday, LocationOn,
  Flag, CreditCard, Business, Work, AccountBalance, Description,
} from '@mui/icons-material';

const STATUS_COLORS = {
  'Active': 'success', 'Inactive': 'default', 'On Leave': 'warning',
  'Suspended': 'error', 'Terminated': 'error', 'Resigned': 'info', 'Retired': 'info',
};

const fieldRow = (label, value, icon) => {
  if (!value && value !== 0) return null;
  return (
    <Grid item xs={12} sm={6} md={4}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {icon && React.cloneElement(icon, { sx: { color: 'text.secondary', fontSize: 18 } })}
        <Box>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="body2">{value}</Typography>
        </Box>
      </Box>
    </Grid>
  );
};

const EmployeeDetail = ({ employee }) => {
  if (!employee) {
    return <Typography color="text.secondary">No employee data</Typography>;
  }

  return (
    <Box sx={{ mt: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.light', color: 'primary.main', fontSize: 28 }}>
          {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>{employee.fullName}</Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <Chip label={employee.employeeCode} size="small" variant="outlined" />
            <Chip label={employee.status || 'Active'} size="small" color={STATUS_COLORS[employee.status] || 'default'} />
          </Stack>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Personal Information */}
      <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>Personal Information</Typography>
      <Grid container spacing={0.5}>
        {fieldRow('Gender', employee.gender, <Person />)}
        {fieldRow('Date of Birth', employee.dateOfBirth, <CalendarToday />)}
        {fieldRow('Nationality', employee.nationality, <Flag />)}
        {fieldRow('Marital Status', employee.maritalStatus)}
        {fieldRow('Religion', employee.religion)}
        {fieldRow('Blood Group', employee.bloodGroup)}
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Contact */}
      <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>Contact Information</Typography>
      <Grid container spacing={0.5}>
        {fieldRow('Personal Email', employee.personalEmail, <Email />)}
        {fieldRow('Work Email', employee.workEmail, <Email />)}
        {fieldRow('Mobile', employee.mobileNumber, <Phone />)}
        {fieldRow('Work Phone', employee.workPhone, <Phone />)}
        {fieldRow('Address', employee.addressLine1, <LocationOn />)}
        {fieldRow('City', employee.city)}
        {fieldRow('Country', employee.country)}
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Emergency Contact */}
      <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>Emergency Contact</Typography>
      <Grid container spacing={0.5}>
        {fieldRow('Name', employee.emergencyContactName)}
        {fieldRow('Number', employee.emergencyContactNumber)}
        {fieldRow('Relation', employee.emergencyContactRelation)}
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Passport & Visa */}
      <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>Passport & Visa</Typography>
      <Grid container spacing={0.5}>
        {fieldRow('Passport Number', employee.passportNumber, <Badge />)}
        {fieldRow('Passport Issue', employee.passportIssueDate)}
        {fieldRow('Passport Expiry', employee.passportExpiryDate)}
        {fieldRow('Passport Country', employee.passportIssueCountry)}
        {fieldRow('Visa Number', employee.visaNumber)}
        {fieldRow('Visa Type', employee.visaType)}
        {fieldRow('Visa Expiry', employee.visaExpiryDate)}
        {fieldRow('Emirates ID', employee.emiratesId)}
        {fieldRow('EID Expiry', employee.emiratesIdExpiryDate)}
        {fieldRow('Labor Card', employee.laborCardNumber)}
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Employment */}
      <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>Employment Information</Typography>
      <Grid container spacing={0.5}>
        {fieldRow('Joining Date', employee.joiningDate, <CalendarToday />)}
        {fieldRow('Confirmation Date', employee.confirmationDate)}
        {fieldRow('Contract Type', employee.contractType)}
        {fieldRow('Contract Start', employee.contractStartDate)}
        {fieldRow('Contract End', employee.contractEndDate)}
        {fieldRow('Employment Type', employee.employmentType)}
        {fieldRow('Probation End', employee.probationEndDate)}
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Organization */}
      <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>Organization</Typography>
      <Grid container spacing={0.5}>
        {fieldRow('Department', employee.department?.name || '—', <Business />)}
        {fieldRow('Designation', employee.designation?.name || '—', <Work />)}
        {fieldRow('Branch', employee.branch?.name || '—')}
        {fieldRow('Cost Center', employee.costCenter?.name || '—')}
        {fieldRow('Manager', employee.reportingManager?.fullName || '—')}
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Salary */}
      <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>Salary & Banking</Typography>
      <Grid container spacing={0.5}>
        {fieldRow('Basic Salary', employee.basicSalary ? `${employee.salaryCurrency} ${Number(employee.basicSalary).toLocaleString()}` : null, <CreditCard />)}
        {fieldRow('Housing', employee.housingAllowance ? `${employee.salaryCurrency} ${Number(employee.housingAllowance).toLocaleString()}` : null)}
        {fieldRow('Transport', employee.transportAllowance ? `${employee.salaryCurrency} ${Number(employee.transportAllowance).toLocaleString()}` : null)}
        {fieldRow('Other Allowances', employee.otherAllowances ? `${employee.salaryCurrency} ${Number(employee.otherAllowances).toLocaleString()}` : null)}
        {fieldRow('Total Salary', employee.totalSalary ? `${employee.salaryCurrency} ${Number(employee.totalSalary).toLocaleString()}` : null, <CreditCard />)}
        {fieldRow('Bank', employee.bankName, <AccountBalance />)}
        {fieldRow('Account Number', employee.bankAccountNumber)}
        {fieldRow('IBAN', employee.iban)}
        {fieldRow('SWIFT', employee.swiftCode)}
      </Grid>

      {/* Documents */}
      {employee.documents?.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>Documents ({employee.documents.length})</Typography>
          <List dense>
            {employee.documents.map(doc => (
              <ListItem key={doc.id}>
                <ListItemText
                  primary={doc.title}
                  secondary={`${doc.documentType} | Expires: ${doc.expiryDate || 'N/A'}`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Notes */}
      {employee.notes && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>Notes</Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2">{employee.notes}</Typography>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default EmployeeDetail;
