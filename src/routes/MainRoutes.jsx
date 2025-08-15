import { lazy } from 'react';

// project-imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

// render - Dashboard pages
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));
const SummaryPage = Loadable(lazy(() => import('pages/dashboard/SummaryPage')));
const SupplierProductsTable = Loadable(lazy(() => import('pages/dashboard/SupplierProductsTable')));  // Route for SupplierProductsTable
const GroupRequestPage = Loadable(lazy(() => import('pages/dashboard/GroupRequestPage')));  // Import GroupRequestPage

// render - utils components
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// ==============================|| MAIN ROUTES ||============================== //

const MainRoutes = {
  path: '/', // Main route path
  element: <DashboardLayout />, // Main layout wrapper
  children: [
    {
      path: '/',
      element: <DashboardDefault /> // Default dashboard view
    },
    {
      path: 'dashboard',
      children: [
        {
          path: '',
          element: <DashboardDefault /> // Default dashboard page
        },
        {
          path: 'summary/:groupId',
          element: <SummaryPage /> // Summary page
        },
        {
          path: 'supplier-products',
          element: <SupplierProductsTable /> // Supplier products page
        },
        {
          path: 'group-requests', // Path for the GroupRequestPage
          element: <GroupRequestPage /> // This is the component to be displayed for group requests
        }
      ]
    },
    {
      path: 'typography',
      element: <Typography /> // Typography page
    },
    {
      path: 'color',
      element: <Color /> // Color page
    },
    {
      path: 'shadows',
      element: <Shadow /> // Shadows page
    }
  ]
};

export default MainRoutes;
