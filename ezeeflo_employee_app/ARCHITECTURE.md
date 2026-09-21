# EzeeFlo Employee Self-Service — Mobile App Architecture

## 1. Overview

The **EzeeFlo Employee App** is a React Native (Expo) mobile application that integrates directly with the existing EzeeFlo HR & Payroll backend. It does **NOT** have a separate authentication database — all authentication flows through the existing HR backend JWT system.

| Aspect                 | Technology                                      |
| ---------------------- | ----------------------------------------------- |
| **Framework**          | React Native (Expo SDK 50)                      |
| **Language**           | TypeScript 5.x                                  |
| **State Management**   | Redux Toolkit                                   |
| **Navigation**         | React Navigation 6 (Native Stack + Bottom Tabs) |
| **HTTP Client**        | Axios with interceptors                         |
| **UI Library**         | React Native Paper 5.x (Material Design 3)      |
| **Secure Storage**     | expo-secure-store                               |
| **Biometric Auth**     | expo-local-authentication                       |
| **Location**           | expo-location                                   |
| **Push Notifications** | expo-notifications + FCM                        |
| **Offline Storage**    | AsyncStorage                                    |
| **Charts**             | react-native-calendars                          |

## 2. Architecture Principles

| Principle               | Implementation                                                 |
| ----------------------- | -------------------------------------------------------------- |
| **No Separate Auth DB** | Uses existing HR backend `/api/hr/auth/login`                  |
| **Clean Architecture**  | Separation: Screens → API Services → Backend                   |
| **SOLID**               | Single-responsibility services, dependency injection via hooks |
| **Multi-Tenant**        | `X-Company-Id` header injected by API interceptor              |
| **RBAC Respect**        | Roles/permissions validated by backend middleware              |
| **Offline First**       | Local attendance queue with auto-sync                          |
| **Secure**              | Encrypted token storage, biometric auth, session timeout       |

## 3. Project Structure

```
ezeeflo_employee_app/
├── App.tsx                          # Root entry point
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── babel.config.js                  # Babel with path aliases
├── .env.example                     # Environment template
├── src/
│   ├── api/                         # API endpoint services
│   │   ├── authApi.ts               #   POST /api/hr/auth/*
│   │   ├── dashboardApi.ts          #   GET /api/hr/dashboard/*
│   │   ├── attendanceApi.ts         #   /api/hr/attendance/*
│   │   ├── leaveApi.ts              #   /api/hr/leave-*
│   │   ├── payrollApi.ts            #   /api/hr/payslips/*
│   │   ├── employeeApi.ts           #   /api/hr/employees/*
│   │   ├── documentsApi.ts          #   /api/hr/employee-documents/*
│   │   ├── requestsApi.ts           #   /api/hr/ess-submissions/*
│   │   ├── notificationsApi.ts      #   /api/hr/notifications/*
│   │   ├── approvalsApi.ts          #   /api/hr/approvals/*
│   │   └── assetsApi.ts             #   /api/hr/employee-assets/*
│   ├── components/                  # Shared UI components
│   │   ├── ScreenContainer.tsx      #   Base layout wrapper
│   │   └── StatCard.tsx             #   Statistics card
│   ├── config/
│   │   └── index.ts                 # App configuration constants
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts               #   Auth state & actions
│   │   ├── useSessionTimeout.ts     #   Auto-logout on inactivity
│   │   └── useOfflineSync.ts        #   Offline attendance sync
│   ├── navigation/
│   │   ├── RootNavigator.tsx        #   Auth/Main routing
│   │   └── MainTabNavigator.tsx     #   Bottom tabs + stacks
│   ├── screens/
│   │   ├── auth/                    # Login, Company Selection
│   │   ├── dashboard/               # Dashboard home
│   │   ├── attendance/              # Check-in/out, History, Calendar
│   │   ├── leave/                   # Balances, Apply, Calendar
│   │   ├── payroll/                 # Payslips, Salary breakdown
│   │   ├── documents/               # Employee documents
│   │   ├── requests/                # Document requests (ESS)
│   │   ├── profile/                 # Employee profile
│   │   ├── directory/               # Company directory
│   │   ├── assets/                  # My assets
│   │   ├── approvals/               # Manager approvals
│   │   ├── notifications/           # Push notifications list
│   │   ├── help/                    # FAQ, Contact HR, Tickets
│   │   └── settings/               # App settings
│   ├── services/
│   │   ├── apiClient.ts             # Axios instance + interceptors
│   │   ├── SecureStorage.ts         # Encrypted key-value storage
│   │   ├── BiometricService.ts      # Fingerprint/Face ID
│   │   └── LocationService.ts       # GPS location
│   ├── store/
│   │   ├── index.ts                 # Redux store config
│   │   └── authSlice.ts             # Auth state + thunks
│   ├── tests/
│   │   └── testCases.ts             # 40+ test cases
│   ├── theme/
│   │   └── index.ts                 # Light/Dark themes, spacing
│   └── types/
│       └── index.ts                 # All TypeScript interfaces
```

## 4. Authentication Flow

```
Mobile App                        HR Backend                     ERP Backend
    │                                 │                               │
    │  POST /api/hr/auth/login        │                               │
    │  { email, password }            │                               │
    │ ──────────────────────────────> │                               │
    │                                 │  Validate against HR users    │
    │                                 │  (fallback: ERP DB)           │
    │  { accessToken, refreshToken,   │                               │
    │    user, tenants }              │                               │
    │ <────────────────────────────── │                               │
    │                                 │                               │
    │  Store tokens in                │                               │
    │  expo-secure-store              │                               │
    │                                 │                               │
    │  All subsequent API calls:      │                               │
    │  Authorization: Bearer <JWT>    │                               │
    │  X-Company-Id: <selected>       │                               │
    │ ──────────────────────────────> │  Validate JWT against         │
    │                                 │  JWT_SECRET                   │
    │                                 │  Validate company access       │
    │                                 │  Check subscription            │
```

## 5. API Integration

All API calls use a shared Axios instance with:

- **Request Interceptor**: Injects `Authorization: Bearer <token>` and `X-Company-Id`
- **Response Interceptor**: Handles 401 with automatic token refresh queue
- **Error Normalization**: Consistent error shape across all calls

### Endpoints Used

| Module        | Endpoints                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Auth          | `POST /api/hr/auth/login`, `GET /api/hr/auth/me`, `POST /api/hr/auth/refresh`, `POST /api/hr/auth/logout`              |
| Dashboard     | `GET /api/hr/dashboard/summary`, `GET /api/hr/holidays`                                                                |
| Employees     | `GET /api/hr/employees`, `GET /api/hr/employees/me`, `GET /api/hr/employees/directory`                                 |
| Attendance    | `GET/POST /api/hr/attendance/*`, `POST /api/hr/attendance/mark`, `POST /api/hr/attendance/validate-location`           |
| Leave         | `GET /api/hr/leave-types`, `GET/POST /api/hr/leave-applications`, `GET /api/hr/leave-balances`, `GET /api/hr/holidays` |
| Payroll       | `GET /api/hr/payslips`, `GET /api/hr/employee-salaries/me`                                                             |
| Documents     | `GET /api/hr/employee-documents/*`                                                                                     |
| Requests      | `GET/POST /api/hr/ess-submissions`                                                                                     |
| Notifications | `GET/PATCH /api/hr/notifications/*`                                                                                    |
| Approvals     | `GET /api/hr/approvals/pending`                                                                                        |

## 6. Security Implementation

| Control             | Implementation                                    |
| ------------------- | ------------------------------------------------- |
| JWT Authentication  | Stored in expo-secure-store (encrypted)           |
| Refresh Tokens      | Automatic rotation via axios interceptor          |
| Biometric Auth      | expo-local-authentication (Fingerprint/Face ID)   |
| Session Timeout     | 30-minute inactivity auto-logout                  |
| RBAC                | Backend middleware validates user role/permission |
| Device Registration | POST /api/hr/auth/register-device                 |
| SSL/TLS             | All API calls over HTTPS                          |

## 7. Offline Mode

- Attendance records saved locally when network unavailable
- Auto-sync every 5 minutes when online
- Max 30 offline records stored
- Conflict resolution: server timestamp wins

## 8. Future Expansion Support

The architecture is designed to support:

- Expense Claims & Reimbursement
- Travel Requests
- Shift Swapping
- Training Enrollment
- Performance Reviews
- Company Chat
- AI HR Assistant
- Digital Employee ID
- Meeting Room Booking
- Internal Social Feed

Simply create new screen folders under `src/screens/`, add API services in `src/api/`, and register routes in the navigator.

## 9. Getting Started

```bash
cd ezeeflo_employee_app
npm install
cp .env.example .env
# Edit .env with your API URL
npx expo start
```
