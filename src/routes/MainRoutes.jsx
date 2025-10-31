import { lazy, useEffect } from 'react';
import { useNavigate, Outlet, Navigate } from 'react-router-dom';
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import { Typography, Box, Button } from '@mui/material';
import LoginPage from './LoginPage';
import { toast } from 'react-toastify';

// Lazy-loaded components
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));
const SummaryPage = Loadable(lazy(() => import('pages/dashboard/SummaryPage')));
const SupplierProductsTable = Loadable(lazy(() => import('pages/dashboard/SupplierProductsTable')));
const GroupRequestPage = Loadable(lazy(() => import('pages/dashboard/GroupRequestPage')));
const DepartmentPage = Loadable(lazy(() => import('pages/dashboard/DepartmentPage')));
const ProductType1Page = Loadable(lazy(() => import('pages/dashboard/ProductType1Page')));
const ProductType2Page = Loadable(lazy(() => import('pages/dashboard/ProductType2Page')));
const UserManagementPage = Loadable(lazy(() => import('pages/dashboard/UserManagementPage')));
const RequisitionMonthlyPage = Loadable(lazy(() => import('pages/dashboard/RequisitionMonthlyPage')));
const ComparisonPage = Loadable(lazy(() => import('pages/dashboard/ComparisonPage')));
const RequestMonthlyComparisonPage = Loadable(lazy(() => import('pages/dashboard/RequestMonthlyComparisonPage')));

// THÊM MỚI
const WeeklyMonthlyRequisitionsPage = Loadable(lazy(() => import('pages/dashboard/WeeklyMonthlyRequisitionsPage')));

const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const TypographyPage = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// Not Found component
function NotFound() {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h4" color="error">404 Not Found</Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
        Go to Dashboard
      </Button>
    </Box>
  );
}

// ProtectedRoute: Kiểm tra token
function ProtectedRoute() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/react/login', { replace: true });
    }
  }, [navigate, token]);

  return token ? <Outlet /> : null;
}

// AdminRoute: Kiểm tra token + role = Admin
function AdminRoute({ children }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;

  useEffect(() => {
    if (!token) {
      navigate('/react/login', { replace: true });
    } else if (role !== 'Admin') {
      toast.error('Access denied. Admin only.');
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, token, role]);

  if (!token || role !== 'Admin') {
    return null;
  }

  return children;
}

// Route configuration
const MainRoutes = {
  path: '/',
  children: [
    { path: '/react/login', element: <LoginPage /> },
    {
      path: '/',
      element: <ProtectedRoute />,
      children: [
        {
          path: '/',
          element: <DashboardLayout />,
          children: [
            { path: 'dashboard', element: <DashboardDefault /> },
            { path: 'summary/:groupId', element: <SummaryPage /> },
            { path: 'supplier-products', element: <SupplierProductsTable /> },
            { path: 'group-requests', element: <GroupRequestPage /> },
            { path: 'department-management', element: <DepartmentPage /> },
            { path: 'product-type-management', element: <ProductType1Page /> },
            { path: 'product-type-2/:productType1Id', element: <ProductType2Page /> },

            // CHỈ ADMIN MỚI VÀO ĐƯỢC
            {
              path: 'user-management',
              element: (
                <AdminRoute>
                  <UserManagementPage />
                </AdminRoute>
              )
            },

            { path: 'requisition-monthly/:groupId', element: <RequisitionMonthlyPage /> },
            { path: 'comparison/:groupId', element: <ComparisonPage /> },
            { path: 'request-monthly-comparison/:groupId', element: <RequestMonthlyComparisonPage /> },

            // THÊM TRANG MỚI – CHỈ CẦN ĐĂNG NHẬP
            {
              path: 'weekly-monthly-requisitions',
              element: <WeeklyMonthlyRequisitionsPage />
            },

            { path: 'typography', element: <TypographyPage /> },
            { path: 'color', element: <Color /> },
            { path: 'shadows', element: <Shadow /> },
            { path: '*', element: <NotFound /> }
          ]
        }
      ]
    }
  ]
};

export default MainRoutes;