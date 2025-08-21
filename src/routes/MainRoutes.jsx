import { lazy } from 'react';
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';

const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));
const SummaryPage = Loadable(lazy(() => import('pages/dashboard/SummaryPage')));
const SupplierProductsTable = Loadable(lazy(() => import('pages/dashboard/SupplierProductsTable')));
const GroupRequestPage = Loadable(lazy(() => import('pages/dashboard/GroupRequestPage')));
const DepartmentPage = Loadable(lazy(() => import('pages/dashboard/DepartmentPage')));
const ProductType1Page = Loadable(lazy(() => import('pages/dashboard/ProductType1Page')));
const UserManagementPage = Loadable(lazy(() => import('pages/dashboard/UserManagementPage')));
const RequisitionMonthlyPage = Loadable(lazy(() => import('pages/dashboard/RequisitionMonthlyPage')));  // <-- Thêm import

const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));
const ComparisonPage = Loadable(lazy(() => import('pages/dashboard/ComparisonPage')));


const MainRoutes = {
  path: '/',
  element: <DashboardLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
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
        }

      ]
    },
    {
      path: 'typography',
      element: <Typography />
    },
    {
      path: 'color',
      element: <Color />
    },
    {
      path: 'shadows',
      element: <Shadow />
    }
  ]
};

export default MainRoutes;
