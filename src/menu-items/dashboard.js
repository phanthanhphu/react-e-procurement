// assets
import {
  Home3,
  HomeTrendUp,
  Chart,
  ArrangeHorizontalSquare,
  Location,
  Box, // Icon for Product Type Management
  Profile  // Icon for User Management
} from 'iconsax-reactjs';

// icons
const icons = {
  navigation: Home3,
  dashboard: HomeTrendUp,
  summary: Chart,
  comparison: ArrangeHorizontalSquare,
  supplierproducts: Location, // Changed from 'locations' to 'supplierproducts'
  groupRequest: ArrangeHorizontalSquare, // Add icon for group request
  productType: Box, // Icon for Product Type Management
  userManagement: Profile  // Icon for User Management
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = {
  id: 'group-dashboard',
  title: 'Management', // Set title for group as "Management"
  icon: icons.navigation,
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard', // Changed to "Dashboard Management"
      type: 'item',
      url: '/dashboard',
      icon: icons.dashboard,
      breadcrumbs: false
    },
    {
      id: 'grouprequest', // New id for Group Request
      title: 'Group Requests', // Changed to "Group Request Management"
      type: 'item',
      url: '/dashboard/group-requests', // New URL for Group Request
      icon: icons.groupRequest, // Icon for Group Request
      breadcrumbs: false
    },
    {
      id: 'supplierproducts', // Changed id from 'locations' to 'supplierproducts'
      title: 'Products', // Changed to "Supplier Products Management"
      type: 'item',
      url: '/dashboard/supplier-products', // Changed url from '/locations' to '/supplier-products'
      icon: icons.supplierproducts,
      breadcrumbs: false
    },
    {
      id: 'department-management',
      title: 'Departments', // Changed from "Department Management" to "Department Management"
      type: 'item',
      url: '/dashboard/department-management',
      icon: icons.summary,
      breadcrumbs: false
    },
      {
        id: 'product-type-management',
        title: 'Product Types',
        type: 'item',
        url: '/dashboard/product-type-management',
        icon: icons.summary, // hoặc chọn icon khác tùy thích
        breadcrumbs: false
      },
      {
        id: 'user-management',
        title: 'Users',
        type: 'item',
        url: '/dashboard/user-management',
        icon: icons.summary, // hoặc chọn icon khác tùy thích
        breadcrumbs: false
      }

  ]
};

export default dashboard;
