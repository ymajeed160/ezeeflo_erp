import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Grid, TextField, MenuItem, Box, Typography, Divider, Button,
  CircularProgress,
} from '@mui/material';
import MasterDataApi from '../../services/masterDataApi';
import DepartmentSelect from '../../components/Shared/DepartmentSelect';
import DesignationSelect from '../../components/Shared/DesignationSelect';
import BranchSelect from '../../components/Shared/BranchSelect';
import EmployeeSelect from '../../components/Shared/EmployeeSelect';

/**
 * Employee Form Component
 * 
 * Used for both Create and Edit operations.
 * Complete employee profile with all fields.
 */
const EmployeeForm = ({ onSubmit, saving = false, initialData = null, isEdit = false }) => {
  const [countries, setCountries] = useState([]);
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '', middleName: '', lastName: '', employeeCode: '',
      gender: '', dateOfBirth: '', nationality: '', maritalStatus: '',
      religion: '', bloodGroup: '',
      personalEmail: '', workEmail: '', mobileNumber: '', workPhone: '',
      emergencyContactName: '', emergencyContactNumber: '', emergencyContactRelation: '',
      addressLine1: '', city: '', state: '', country: '', postalCode: '',
      passportNumber: '', passportIssueDate: '', passportExpiryDate: '', passportIssueCountry: '',
      visaNumber: '', visaType: '', visaIssueDate: '', visaExpiryDate: '', visaIssuePlace: '',
      emiratesId: '', emiratesIdExpiryDate: '',
      laborCardNumber: '', laborCardExpiryDate: '',
      joiningDate: '', confirmationDate: '', contractStartDate: '', contractEndDate: '',
      contractType: '', employmentType: '', probationEndDate: '',
      status: 'Active',
      departmentId: '', designationId: '', branchId: '', costCenterId: '', reportingManagerId: '',
      basicSalary: '', housingAllowance: '', transportAllowance: '', otherAllowances: '',
      totalSalary: '', salaryCurrency: 'AED',
      bankName: '', bankAccountNumber: '', iban: '', swiftCode: '', wpsAgentCode: '',
      notes: '',
    },
  });

  // Fetch countries for nationality/country dropdowns
  useEffect(() => {
    MasterDataApi.getCountries({ limit: 200 }).then(r => setCountries(r.data.data || [])).catch(() => {});
  }, []);

  // Pre-populate form when editing
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        ...initialData,
        dateOfBirth: initialData.dateOfBirth || '',
        passportIssueDate: initialData.passportIssueDate || '',
        passportExpiryDate: initialData.passportExpiryDate || '',
        visaIssueDate: initialData.visaIssueDate || '',
        visaExpiryDate: initialData.visaExpiryDate || '',
        emiratesIdExpiryDate: initialData.emiratesIdExpiryDate || '',
        laborCardExpiryDate: initialData.laborCardExpiryDate || '',
        joiningDate: initialData.joiningDate || '',
        confirmationDate: initialData.confirmationDate || '',
        contractStartDate: initialData.contractStartDate || '',
        contractEndDate: initialData.contractEndDate || '',
        probationEndDate: initialData.probationEndDate || '',
        basicSalary: initialData.basicSalary || '',
        housingAllowance: initialData.housingAllowance || '',
        transportAllowance: initialData.transportAllowance || '',
        otherAllowances: initialData.otherAllowances || '',
        totalSalary: initialData.totalSalary || '',
      });
    }
  }, [isEdit, initialData, reset]);

  const onFormSubmit = async (data) => {
    // Convert empty strings to null/undefined
    const cleaned = {};
    Object.keys(data).forEach(key => {
      if (data[key] === '') {
        cleaned[key] = null;
      } else {
        cleaned[key] = data[key];
      }
    });
    return onSubmit(cleaned);
  };

  const sectionTitle = (title) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} color="primary">
        {title}
      </Typography>
      <Divider />
    </Box>
  );

  return (
    <Box component="form" id="employee-form" onSubmit={handleSubmit(onFormSubmit)} sx={{ mt: 2 }}>
      {/* Personal Information */}
      {sectionTitle('Personal Information')}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Controller name="firstName" control={control} rules={{ required: 'First name is required' }}
            render={({ field }) => (
              <TextField {...field} label="First Name *" fullWidth size="small" error={!!errors.firstName} helperText={errors.firstName?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="middleName" control={control}
            render={({ field }) => <TextField {...field} label="Middle Name" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="lastName" control={control} rules={{ required: 'Last name is required' }}
            render={({ field }) => (
              <TextField {...field} label="Last Name *" fullWidth size="small" error={!!errors.lastName} helperText={errors.lastName?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="employeeCode" control={control}
            render={({ field }) => (
              <TextField {...field} label="Employee Code" fullWidth size="small" helperText="Auto-generated if empty" disabled={isEdit} />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="gender" control={control}
            render={({ field }) => (
              <TextField {...field} label="Gender" select fullWidth size="small">
                <MenuItem value="">—</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="dateOfBirth" control={control}
            render={({ field }) => <TextField {...field} label="Date of Birth" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="nationality" control={control}
            render={({ field }) => (
              <TextField {...field} label="Nationality" select fullWidth size="small">
                <MenuItem value="">—</MenuItem>
                {countries.filter(c => c.nationality).map(c => (
                  <MenuItem key={c.id} value={c.nationality}>{c.flagEmoji} {c.nationality}</MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="maritalStatus" control={control}
            render={({ field }) => (
              <TextField {...field} label="Marital Status" select fullWidth size="small">
                <MenuItem value="">—</MenuItem>
                <MenuItem value="Single">Single</MenuItem>
                <MenuItem value="Married">Married</MenuItem>
                <MenuItem value="Divorced">Divorced</MenuItem>
                <MenuItem value="Widowed">Widowed</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Controller name="religion" control={control}
            render={({ field }) => <TextField {...field} label="Religion" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Controller name="bloodGroup" control={control}
            render={({ field }) => <TextField {...field} label="Blood Group" fullWidth size="small" />}
          />
        </Grid>
      </Grid>

      {/* Contact Information */}
      {sectionTitle('Contact Information')}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Controller name="personalEmail" control={control}
            render={({ field }) => <TextField {...field} label="Personal Email" type="email" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="workEmail" control={control}
            render={({ field }) => <TextField {...field} label="Work Email" type="email" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="mobileNumber" control={control}
            render={({ field }) => <TextField {...field} label="Mobile Number" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="workPhone" control={control}
            render={({ field }) => <TextField {...field} label="Work Phone" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="emergencyContactName" control={control}
            render={({ field }) => <TextField {...field} label="Emergency Contact Name" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="emergencyContactNumber" control={control}
            render={({ field }) => <TextField {...field} label="Emergency Contact Number" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="emergencyContactRelation" control={control}
            render={({ field }) => <TextField {...field} label="Relationship" fullWidth size="small" />}
          />
        </Grid>
      </Grid>

      {/* Address */}
      {sectionTitle('Address')}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller name="addressLine1" control={control}
            render={({ field }) => <TextField {...field} label="Address" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="city" control={control}
            render={({ field }) => <TextField {...field} label="City" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="state" control={control}
            render={({ field }) => <TextField {...field} label="State" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="country" control={control}
            render={({ field }) => (
              <TextField {...field} label="Country" select fullWidth size="small">
                <MenuItem value="">—</MenuItem>
                {countries.map(c => (
                  <MenuItem key={c.id} value={c.name}>{c.flagEmoji} {c.name}</MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="postalCode" control={control}
            render={({ field }) => <TextField {...field} label="Postal Code" fullWidth size="small" />}
          />
        </Grid>
      </Grid>

      {/* Passport & Visa */}
      {sectionTitle('Passport & Visa Information')}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Controller name="passportNumber" control={control}
            render={({ field }) => <TextField {...field} label="Passport Number" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="passportIssueDate" control={control}
            render={({ field }) => <TextField {...field} label="Issue Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="passportExpiryDate" control={control}
            render={({ field }) => <TextField {...field} label="Expiry Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="passportIssueCountry" control={control}
            render={({ field }) => (
              <TextField {...field} label="Issue Country" select fullWidth size="small">
                <MenuItem value="">—</MenuItem>
                {countries.map(c => (
                  <MenuItem key={c.id} value={c.name}>{c.flagEmoji} {c.name}</MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="visaNumber" control={control}
            render={({ field }) => <TextField {...field} label="Visa Number" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="visaType" control={control}
            render={({ field }) => <TextField {...field} label="Visa Type" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="visaIssueDate" control={control}
            render={({ field }) => <TextField {...field} label="Visa Issue Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="visaExpiryDate" control={control}
            render={({ field }) => <TextField {...field} label="Visa Expiry Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="visaIssuePlace" control={control}
            render={({ field }) => <TextField {...field} label="Visa Issue Place" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="emiratesId" control={control}
            render={({ field }) => <TextField {...field} label="Emirates ID" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="emiratesIdExpiryDate" control={control}
            render={({ field }) => <TextField {...field} label="EID Expiry Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="laborCardNumber" control={control}
            render={({ field }) => <TextField {...field} label="Labor Card Number" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="laborCardExpiryDate" control={control}
            render={({ field }) => <TextField {...field} label="Labor Card Expiry" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
      </Grid>

      {/* Employment Information */}
      {sectionTitle('Employment Information')}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Controller name="joiningDate" control={control}
            render={({ field }) => <TextField {...field} label="Joining Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="confirmationDate" control={control}
            render={({ field }) => <TextField {...field} label="Confirmation Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="contractStartDate" control={control}
            render={({ field }) => <TextField {...field} label="Contract Start" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="contractEndDate" control={control}
            render={({ field }) => <TextField {...field} label="Contract End" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="contractType" control={control}
            render={({ field }) => (
              <TextField {...field} label="Contract Type" select fullWidth size="small">
                <MenuItem value="">—</MenuItem>
                <MenuItem value="Limited">Limited</MenuItem>
                <MenuItem value="Unlimited">Unlimited</MenuItem>
                <MenuItem value="Part-Time">Part-Time</MenuItem>
                <MenuItem value="Contractor">Contractor</MenuItem>
                <MenuItem value="Intern">Intern</MenuItem>
                <MenuItem value="Probation">Probation</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="employmentType" control={control}
            render={({ field }) => (
              <TextField {...field} label="Employment Type" select fullWidth size="small">
                <MenuItem value="">—</MenuItem>
                <MenuItem value="Full-Time">Full-Time</MenuItem>
                <MenuItem value="Part-Time">Part-Time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Temporary">Temporary</MenuItem>
                <MenuItem value="Intern">Intern</MenuItem>
                <MenuItem value="Consultant">Consultant</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="probationEndDate" control={control}
            render={({ field }) => <TextField {...field} label="Probation End Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller name="status" control={control}
            render={({ field }) => (
              <TextField {...field} label="Status" select fullWidth size="small">
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="On Leave">On Leave</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
                <MenuItem value="Terminated">Terminated</MenuItem>
                <MenuItem value="Resigned">Resigned</MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
              </TextField>
            )}
          />
        </Grid>
      </Grid>

      {/* Organization */}
      {sectionTitle('Organization')}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller name="departmentId" control={control}
            render={({ field }) => <DepartmentSelect value={field.value} onChange={field.onChange} required size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="designationId" control={control}
            render={({ field }) => <DesignationSelect value={field.value} onChange={field.onChange} required size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="branchId" control={control}
            render={({ field }) => <BranchSelect value={field.value} onChange={field.onChange} size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="reportingManagerId" control={control}
            render={({ field }) => <EmployeeSelect value={field.value} onChange={field.onChange} label="Reporting Manager" size="small" />}
          />
        </Grid>
      </Grid>

      {/* Salary & Banking */}
      {sectionTitle('Salary & Banking')}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <Controller name="basicSalary" control={control}
            render={({ field }) => <TextField {...field} label="Basic Salary" type="number" fullWidth size="small" InputProps={{ inputProps: { min: 0, step: 0.01 } }} />}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Controller name="housingAllowance" control={control}
            render={({ field }) => <TextField {...field} label="Housing Allowance" type="number" fullWidth size="small" InputProps={{ inputProps: { min: 0, step: 0.01 } }} />}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Controller name="transportAllowance" control={control}
            render={({ field }) => <TextField {...field} label="Transport Allowance" type="number" fullWidth size="small" InputProps={{ inputProps: { min: 0, step: 0.01 } }} />}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Controller name="otherAllowances" control={control}
            render={({ field }) => <TextField {...field} label="Other Allowances" type="number" fullWidth size="small" InputProps={{ inputProps: { min: 0, step: 0.01 } }} />}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Controller name="totalSalary" control={control}
            render={({ field }) => <TextField {...field} label="Total Salary" type="number" fullWidth size="small" InputProps={{ inputProps: { min: 0, step: 0.01 } }} />}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Controller name="salaryCurrency" control={control}
            render={({ field }) => (
              <TextField {...field} label="Currency" select fullWidth size="small">
                <MenuItem value="AED">AED</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="SAR">SAR</MenuItem>
                <MenuItem value="QAR">QAR</MenuItem>
                <MenuItem value="OMR">OMR</MenuItem>
                <MenuItem value="BHD">BHD</MenuItem>
                <MenuItem value="KWD">KWD</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="bankName" control={control}
            render={({ field }) => <TextField {...field} label="Bank Name" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Controller name="bankAccountNumber" control={control}
            render={({ field }) => <TextField {...field} label="Account Number" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Controller name="iban" control={control}
            render={({ field }) => <TextField {...field} label="IBAN" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Controller name="swiftCode" control={control}
            render={({ field }) => <TextField {...field} label="SWIFT Code" fullWidth size="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Controller name="wpsAgentCode" control={control}
            render={({ field }) => <TextField {...field} label="WPS Agent Code" fullWidth size="small" />}
          />
        </Grid>
      </Grid>

      {/* Notes */}
      {sectionTitle('Notes')}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller name="notes" control={control}
            render={({ field }) => <TextField {...field} label="Notes" multiline rows={3} fullWidth size="small" />}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeForm;
