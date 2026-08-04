/**
 * Application Type Definitions
 * 
 * Central type definitions for the entire mobile application.
 */

// ── Authentication Types ──
export interface LoginCredentials {
  username?: string;
  email?: string;
  employeeNumber?: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
  employeeNumber?: string;
  mobileNumber?: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
  logo?: string;
  address?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  tokens: AuthTokens | null;
  activeCompany: CompanyInfo | null;
  companies: CompanyInfo[];
  isLoading: boolean;
  isBiometricEnabled: boolean;
  rememberMe: boolean;
  lastActivity: number | null;
  deviceId?: string;
}

// ── Employee Types ──
export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  maritalStatus?: string;
  personalEmail?: string;
  workEmail?: string;
  mobileNumber?: string;
  profilePicture?: string;
  joiningDate?: string;
  contractType?: string;
  employmentType?: string;
  departmentId?: string;
  designationId?: string;
  branchId?: string;
  department?: Department;
  designation?: Designation;
  branch?: Branch;
  passportNumber?: string;
  passportExpiryDate?: string;
  visaNumber?: string;
  visaExpiryDate?: string;
  emiratesId?: string;
  emiratesIdExpiryDate?: string;
  laborCardNumber?: string;
  laborCardExpiryDate?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
}

export interface Designation {
  id: string;
  code: string;
  name: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
}

// ── Attendance Types ──
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  attendanceDate: string;
  shiftId?: string;
  checkIn?: string;
  checkOut?: string;
  breakStart?: string;
  breakEnd?: string;
  checkInLocation?: GeoLocation;
  checkOutLocation?: GeoLocation;
  status: AttendanceStatus;
  isLate: boolean;
  isEarlyDeparture: boolean;
  overtimeHours?: number;
  totalHours?: number;
  shift?: Shift;
  remarks?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'holiday' | 'weekend' | 'on_leave';

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  graceMinutes?: number;
  isFlexible: boolean;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  timestamp?: string;
}

export interface GeofenceArea {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
}

export interface TodayAttendance {
  record: AttendanceRecord | null;
  status: AttendanceStatus;
  shift: Shift | null;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  isOnBreak: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalHalfDay: number;
  totalOvertime: number;
  monthlyRecords: AttendanceRecord[];
}

// ── Leave Types ──
export interface LeaveType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isPaid: boolean;
  requiresAttachment: boolean;
  maxDaysPerRequest?: number;
  color?: string;
  icon?: string;
}

export interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  employeeId: string;
  year: number;
  openingBalance: number;
  accruedDays: number;
  usedDays: number;
  pendingDays: number;
  availableBalance: number;
  carryForwardDays: number;
  leaveType: LeaveType;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  leaveType?: LeaveType;
  employee?: Employee;
  approvals?: LeaveApproval[];
  createdAt: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveApproval {
  id: string;
  leaveApplicationId: string;
  approverId: string;
  status: LeaveStatus;
  comments?: string;
  approvedAt?: string;
  approver?: Employee;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
  isRecurring: boolean;
}

export interface LeaveCalendarEvent {
  date: string;
  type: 'leave' | 'holiday' | 'weekend';
  title: string;
  status?: LeaveStatus;
  employeeId?: string;
}

// ── Payroll Types ──
export interface Payslip {
  id: string;
  employeeId: string;
  payrollRunId: string;
  payslipNumber: string;
  periodStart: string;
  periodEnd: string;
  paymentDate?: string;
  basicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  status: 'draft' | 'final' | 'paid';
  details?: PayslipDetail[];
  payrollRun?: PayrollRun;
}

export interface PayslipDetail {
  id: string;
  payslipId: string;
  componentName: string;
  componentType: 'earning' | 'deduction';
  amount: number;
  isTaxable: boolean;
}

export interface PayrollRun {
  id: string;
  periodName: string;
  periodStart: string;
  periodEnd: string;
  paymentDate?: string;
  status: string;
}

export interface SalaryBreakdown {
  basicSalary: number;
  allowances: SalaryComponent[];
  deductions: SalaryComponent[];
  grossSalary: number;
  netSalary: number;
  effectiveDate: string;
}

export interface SalaryComponent {
  id: string;
  name: string;
  type: 'allowance' | 'deduction';
  amount: number;
  isPercentage: boolean;
  percentage?: number;
  isTaxable: boolean;
}

export interface EmployeeLoan {
  id: string;
  loanType: string;
  loanAmount: number;
  remainingAmount: number;
  monthlyDeduction: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'defaulted';
}

export interface EosbSummary {
  id: string;
  employeeId: string;
  startDate: string;
  endDate?: string;
  yearsOfService: number;
  basicSalary: number;
  totalEosbAmount: number;
  calculatedAt?: string;
}

// ── Document Types ──
export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: DocumentType;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  fileUrl?: string;
  fileName?: string;
  status: 'active' | 'expired' | 'expiring_soon';
  remarks?: string;
}

export type DocumentType =
  | 'passport'
  | 'visa'
  | 'emirates_id'
  | 'national_id'
  | 'driving_license'
  | 'employment_contract'
  | 'certificate'
  | 'medical_insurance'
  | 'labor_card'
  | 'other';

export interface DocumentExpiry {
  document: EmployeeDocument;
  daysUntilExpiry: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

// ── Request Types ──
export interface DocumentRequest {
  id: string;
  employeeId: string;
  requestType: RequestType;
  purpose?: string;
  deliveryMethod?: 'email' | 'pickup' | 'post';
  status: RequestStatus;
  generatedDocumentUrl?: string;
  comments?: string;
  createdAt: string;
  completedAt?: string;
}

export type RequestType =
  | 'salary_certificate'
  | 'employment_certificate'
  | 'experience_letter'
  | 'noc'
  | 'visa_letter'
  | 'bank_letter'
  | 'hr_letter'
  | 'other';

export type RequestStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';

// ── Asset Types ──
export interface EmployeeAsset {
  id: string;
  employeeId: string;
  assetType: AssetType;
  assetName: string;
  assetCode?: string;
  serialNumber?: string;
  assignedDate: string;
  returnDate?: string;
  status: 'assigned' | 'returned' | 'lost' | 'damaged';
  remarks?: string;
}

export type AssetType = 'laptop' | 'mobile_phone' | 'sim_card' | 'access_card' | 'vehicle' | 'equipment' | 'other';

// ── Notification Types ──
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export type NotificationType =
  | 'attendance_reminder'
  | 'leave_approved'
  | 'leave_rejected'
  | 'payroll_released'
  | 'document_expiry'
  | 'birthday'
  | 'work_anniversary'
  | 'announcement'
  | 'training_reminder'
  | 'holiday_reminder'
  | 'request_status';

// ── Directory Types ──
export interface DirectoryEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  department?: Department;
  designation?: Designation;
  workEmail?: string;
  workPhone?: string;
  mobileNumber?: string;
  managerName?: string;
}

// ── Approval Types ──
export interface PendingApproval {
  id: string;
  type: ApprovalType;
  employeeId: string;
  employeeName: string;
  employeePhoto?: string;
  title: string;
  description: string;
  requestDate: string;
  status: 'pending';
  data?: Record<string, any>;
}

export type ApprovalType = 'leave' | 'attendance_correction' | 'document_request' | 'training' | 'overtime' | 'expense';

// ── Dashboard Types ──
export interface DashboardData {
  employee: Employee;
  todayAttendance: TodayAttendance;
  leaveBalances: LeaveBalance[];
  upcomingHolidays: Holiday[];
  pendingRequests: number;
  payrollStatus: {
    lastPayslip?: Payslip;
    nextPayday?: string;
  };
  latestAnnouncements: AppNotification[];
  pendingApprovals?: number;
}

// ── API Response Types ──
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationMeta;
  errors?: string[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// ── Offline Types ──
export interface OfflineAttendanceRecord {
  id: string;
  employeeId: string;
  companyId: string;
  action: 'check_in' | 'check_out' | 'break_start' | 'break_end';
  timestamp: string;
  location?: GeoLocation;
  synced: boolean;
  syncAttempts: number;
  createdAt: string;
}

// ── Navigation Types ──
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Login: undefined;
  CompanySelection: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  CompanySelection: { companies: CompanyInfo[] };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Attendance: undefined;
  Leave: undefined;
  Payroll: undefined;
  More: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  AnnouncementDetail: { notificationId: string };
};

export type AttendanceStackParamList = {
  AttendanceHome: undefined;
  AttendanceHistory: undefined;
  AttendanceCalendar: undefined;
  AttendanceDetail: { recordId: string };
};

export type LeaveStackParamList = {
  LeaveHome: undefined;
  ApplyLeave: { leaveTypeId?: string };
  LeaveDetail: { applicationId: string };
  LeaveCalendar: undefined;
};

export type PayrollStackParamList = {
  PayrollHome: undefined;
  PayslipDetail: { payslipId: string };
  SalaryBreakdown: undefined;
  PayrollHistory: undefined;
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Documents: undefined;
  DocumentDetail: { documentId: string };
  DocumentRequests: undefined;
  RequestDetail: { requestId: string };
  NewRequest: { requestType?: RequestType };
  Profile: undefined;
  EditProfile: { section?: string };
  CompanyDirectory: undefined;
  DirectoryDetail: { employeeId: string };
  MyAssets: undefined;
  AssetDetail: { assetId: string };
  Approvals: undefined;
  ApprovalDetail: { approvalId: string };
  Notifications: undefined;
  Help: undefined;
  FAQ: undefined;
  ContactHR: undefined;
  RaiseTicket: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  LanguageSettings: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
  About: undefined;
};
