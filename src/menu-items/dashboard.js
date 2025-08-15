// assets
import {
  Home3,
  HomeTrendUp,
  Chart,
  ArrangeHorizontalSquare,
  Location
} from 'iconsax-reactjs';

// icons
const icons = {
  navigation: Home3,
  dashboard: HomeTrendUp,
  summary: Chart,
  comparison: ArrangeHorizontalSquare,
  supplierproducts: Location, // Changed from 'locations' to 'supplierproducts'
  groupRequest: ArrangeHorizontalSquare // Add icon for group request
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
      title: 'Group Request Management', // Changed to "Group Request Management"
      type: 'item',
      url: '/dashboard/group-requests', // New URL for Group Request
      icon: icons.groupRequest, // Icon for Group Request
      breadcrumbs: false
    },
    {
      id: 'supplierproducts', // Changed id from 'locations' to 'supplierproducts'
      title: 'Supplier Management', // Changed to "Supplier Products Management"
      type: 'item',
      url: '/dashboard/supplier-products', // Changed url from '/locations' to '/supplier-products'
      icon: icons.supplierproducts,
      breadcrumbs: false
    },
    {
      id: 'department-management',
      title: 'Department Management', // Changed from "Department Management" to "Department Management"
      type: 'item',
      url: '/dashboard/department-management',
      icon: icons.summary,
      breadcrumbs: false
    }
  ]
};

export default dashboard;
