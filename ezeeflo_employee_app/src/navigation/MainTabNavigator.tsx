/**
 * Main Tab Navigator
 * 
 * Bottom tab navigation for the main app:
 * - Dashboard
 * - Attendance
 * - Leave
 * - Payroll
 * - More
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Dashboard
import DashboardScreen from '../screens/dashboard/DashboardScreen';

// Attendance
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import AttendanceHistoryScreen from '../screens/attendance/AttendanceHistoryScreen';
import AttendanceCalendarScreen from '../screens/attendance/AttendanceCalendarScreen';

// Leave
import LeaveScreen from '../screens/leave/LeaveScreen';
import ApplyLeaveScreen from '../screens/leave/ApplyLeaveScreen';
import LeaveCalendarScreen from '../screens/leave/LeaveCalendarScreen';

// Payroll
import PayrollScreen from '../screens/payroll/PayrollScreen';
import PayslipDetailScreen from '../screens/payroll/PayslipDetailScreen';

// More
import MoreScreen from '../screens/MoreScreen';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import DocumentRequestsScreen from '../screens/requests/DocumentRequestsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CompanyDirectoryScreen from '../screens/directory/CompanyDirectoryScreen';
import MyAssetsScreen from '../screens/assets/MyAssetsScreen';
import ApprovalsScreen from '../screens/approvals/ApprovalsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import HelpScreen from '../screens/help/HelpScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

import type {
  MainTabParamList,
  DashboardStackParamList,
  AttendanceStackParamList,
  LeaveStackParamList,
  PayrollStackParamList,
  MoreStackParamList,
} from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const AttendanceStack = createNativeStackNavigator<AttendanceStackParamList>();
const LeaveStack = createNativeStackNavigator<LeaveStackParamList>();
const PayrollStack = createNativeStackNavigator<PayrollStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

// ── Stack Navigators ──

const DashboardStackNavigator = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
  </DashboardStack.Navigator>
);

const AttendanceStackNavigator = () => (
  <AttendanceStack.Navigator screenOptions={{ headerShown: false }}>
    <AttendanceStack.Screen name="AttendanceHome" component={AttendanceScreen} />
    <AttendanceStack.Screen
      name="AttendanceHistory"
      component={AttendanceHistoryScreen}
      options={{ headerShown: true, title: 'Attendance History' }}
    />
    <AttendanceStack.Screen
      name="AttendanceCalendar"
      component={AttendanceCalendarScreen}
      options={{ headerShown: true, title: 'Attendance Calendar' }}
    />
  </AttendanceStack.Navigator>
);

const LeaveStackNavigator = () => (
  <LeaveStack.Navigator screenOptions={{ headerShown: false }}>
    <LeaveStack.Screen name="LeaveHome" component={LeaveScreen} />
    <LeaveStack.Screen
      name="ApplyLeave"
      component={ApplyLeaveScreen}
      options={{ headerShown: true, title: 'Apply for Leave' }}
    />
    <LeaveStack.Screen
      name="LeaveCalendar"
      component={LeaveCalendarScreen}
      options={{ headerShown: true, title: 'Leave Calendar' }}
    />
  </LeaveStack.Navigator>
);

const PayrollStackNavigator = () => (
  <PayrollStack.Navigator screenOptions={{ headerShown: false }}>
    <PayrollStack.Screen name="PayrollHome" component={PayrollScreen} />
    <PayrollStack.Screen
      name="PayslipDetail"
      component={PayslipDetailScreen}
      options={{ headerShown: true, title: 'Payslip Detail' }}
    />
  </PayrollStack.Navigator>
);

const MoreStackNavigator = () => (
  <MoreStack.Navigator screenOptions={{ headerShown: false }}>
    <MoreStack.Screen name="MoreHome" component={MoreScreen} />
    <MoreStack.Screen
      name="Documents"
      component={DocumentsScreen}
      options={{ headerShown: true, title: 'Documents' }}
    />
    <MoreStack.Screen
      name="DocumentRequests"
      component={DocumentRequestsScreen}
      options={{ headerShown: true, title: 'Document Requests' }}
    />
    <MoreStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ headerShown: true, title: 'My Profile' }}
    />
    <MoreStack.Screen
      name="CompanyDirectory"
      component={CompanyDirectoryScreen}
      options={{ headerShown: true, title: 'Company Directory' }}
    />
    <MoreStack.Screen
      name="MyAssets"
      component={MyAssetsScreen}
      options={{ headerShown: true, title: 'My Assets' }}
    />
    <MoreStack.Screen
      name="Approvals"
      component={ApprovalsScreen}
      options={{ headerShown: true, title: 'Approvals' }}
    />
    <MoreStack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ headerShown: true, title: 'Notifications' }}
    />
    <MoreStack.Screen
      name="Help"
      component={HelpScreen}
      options={{ headerShown: true, title: 'Help & Support' }}
    />
    <MoreStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ headerShown: true, title: 'Settings' }}
    />
  </MoreStack.Navigator>
);

// ── Tab Navigator ──

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Dashboard:    { active: 'view-dashboard',           inactive: 'view-dashboard-outline' },
  Attendance:   { active: 'clock-check',              inactive: 'clock-check-outline' },
  Leave:        { active: 'calendar-account',         inactive: 'calendar-account-outline' },
  Payroll:      { active: 'cash-multiple',            inactive: 'cash-multiple' },
  More:         { active: 'dots-horizontal',          inactive: 'dots-horizontal-circle-outline' },
};

const MainTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: 'transparent',
          height: 64,
          paddingBottom: 6,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = TAB_ICONS[route.name] || TAB_ICONS.Dashboard;
          const iconName = focused ? icons.active : icons.inactive;
          return (
            <Icon
              name={iconName}
              size={focused ? size + 2 : size}
              color={color}
            />
          );
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} />
      <Tab.Screen name="Attendance" component={AttendanceStackNavigator} />
      <Tab.Screen name="Leave" component={LeaveStackNavigator} />
      <Tab.Screen name="Payroll" component={PayrollStackNavigator} />
      <Tab.Screen name="More" component={MoreStackNavigator} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
