import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid, Card, CardContent, Typography, Box, CircularProgress, Chip,
  List, ListItem, ListItemAvatar, ListItemText, Avatar, Paper, Alert,
} from '@mui/material';
import {
  People, PersonAdd, EventAvailable, Cake, AssignmentLate,
  Description, TrendingUp, WorkOutline,
} from '@mui/icons-material';
import { fetchDashboardSummary } from '../../store/slices/dashboardSlice';
import { apiError } from '../../utils/toast';

const statCardStyle = (color) => ({
  borderTop: `4px solid ${color}`,
  height: '100%',
});

const Dashboard = () => {
  const dispatch = useDispatch();
  const { summary, loading, error } = useSelector((state) => state.dashboard);

  const fetchData = useCallback(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (error) apiError({ message: error });
  }, [error]);

  if (loading && !summary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const stats = summary ? [
    { label: 'Total Employees', value: summary.totalEmployees || 0, icon: <People />, color: '#1976d2', bg: '#e3f2fd' },
    { label: 'Active', value: summary.activeEmployees || 0, icon: <PersonAdd />, color: '#2e7d32', bg: '#e8f5e9' },
    { label: 'On Leave', value: summary.onLeaveEmployees || 0, icon: <EventAvailable />, color: '#ed6c02', bg: '#fff3e0' },
    { label: 'Terminated', value: summary.terminatedEmployees || 0, icon: <AssignmentLate />, color: '#d32f2f', bg: '#fce4ec' },
  ] : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>HR Dashboard</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Overview of your workforce and HR operations
      </Typography>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card sx={statCardStyle(stat.color)}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                      {stat.value.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: stat.bg, color: stat.color, width: 48, height: 48 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Second Row */}
      <Grid container spacing={3}>
        {/* Upcoming Birthdays */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Cake color="secondary" /> Upcoming Birthdays
              </Typography>
              {summary?.upcomingBirthdays?.length > 0 ? (
                <List dense>
                  {summary.upcomingBirthdays.map((emp) => (
                    <ListItem key={emp.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}>
                          {emp.name?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={emp.name}
                        secondary={emp.dateOfBirth}
                      />
                      <Chip label={emp.employeeCode} size="small" variant="outlined" />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">No upcoming birthdays</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Contract Expiry */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description color="warning" /> Contract Expiry (Next 30 Days)
              </Typography>
              {summary?.upcomingContractExpiry?.length > 0 ? (
                <List dense>
                  {summary.upcomingContractExpiry.map((emp) => (
                    <ListItem key={emp.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                          {emp.name?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={emp.name}
                        secondary={`Expires: ${emp.contractEndDate}`}
                      />
                      <Chip label={emp.employeeCode} size="small" color="warning" variant="outlined" />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">No contracts expiring soon</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Department Distribution */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" /> Employee Distribution by Department
              </Typography>
              {summary?.departmentDistribution?.length > 0 ? (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {summary.departmentDistribution.map((dept) => (
                    <Grid item xs={6} sm={4} md={3} key={dept.department}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight={700} color="primary">
                          {dept.count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dept.department || 'Unassigned'}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">No department data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
