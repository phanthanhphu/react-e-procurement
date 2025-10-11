import { lazy } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import { Typography, Box, Button } from '@mui/material';

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
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const TypographyPage = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// Not Found component for 404 errors
function NotFound() {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h4" color="error" gutterBottom>
        404 Not Found
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        The page you're looking for doesn't exist.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/dashboard/product-type-management')}
        sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)', color: '#fff' }}
      >
        Go to Product Type 1
      </Button>
    </Box>
  );
}

// ProtectedRoute component to handle authentication
function ProtectedRoute() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAuthenticated');

  useEffect(() => {
    if (!isAuthenticated || isAuthenticated !== 'true') {
      navigate('/'); // Redirect to login page if not authenticated
    }
  }, [navigate, isAuthenticated]);

  return isAuthenticated === 'true' ? <Outlet /> : null; // Render child routes if authenticated
}

// Route configuration
const MainRoutes = {
  path: '/',
  element: <DashboardLayout />,
  children: [
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/',
          element: <DashboardDefault />
        },
        {
          path: 'product-type-2/:productType1Id',
          element: <ProductType2Page />
        },
        {
          path: 'dashboard',
          children: [
            {
              path: '',
              element: <DashboardDefault />
            },
            {
              path: 'summary/:groupId',
              element: <SummaryPage />
            },
            {
              path: 'supplier-products',
              element: <SupplierProductsTable />
            },
            {
              path: 'group-requests',
              element: <GroupRequestPage />
            },
            {
              path: 'department-management',
              element: <DepartmentPage />
            },
            {
              path: 'product-type-management',
              element: <ProductType1Page />
            },
            {
              path: 'product-type-2/:productType1Id',
              element: <ProductType2Page />
            },
            {
              path: 'user-management',
              element: <UserManagementPage />
            },
            {
              path: 'requisition-monthly/:groupId',
              element: <RequisitionMonthlyPage />
            },
            {
              path: 'comparison/:groupId',
              element: <ComparisonPage />
            },
            {
              path: 'request-monthly-comparison/:groupId',
              element: <RequestMonthlyComparisonPage />
            },
          ]
        },
        {
          path: 'typography',
          element: <TypographyPage />
        },
        {
          path: 'color',
          element: <Color />
        },
        {
          path: 'shadows',
          element: <Shadow />
        },
        {
          path: '*',
          element: <NotFound />
        }
      ]
    }
  ]
};

export default MainRoutes;