// assets
import {
  Home3,
  HomeTrendUp,
  Chart,
  ArrangeHorizontalSquare,
  Location,
  Box, // Icon for Product Type Management
  Profile, // Icon for User Management
  Building // Icon for Department Management
} from 'iconsax-reactjs';

// icons
const icons = {
  navigation: Home3,
  dashboard: HomeTrendUp,
  summary: Chart,
  comparison: ArrangeHorizontalSquare,
  supplierproducts: Location,
  groupRequest: ArrangeHorizontalSquare,
  productType: Box,
  userManagement: Profile,
  department: Building // Icon riêng cho department-management
};

// CSS styles for menu items and icons
const menuStyles = {
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#333',
    borderRadius: '8px',
    margin: '4px 8px',
    transition: 'background-color 0.2s, color 0.2s',
    '&:hover': {
      backgroundColor: '#f5f5f5',
      color: '#1976d2'
    }
  },
  icon: {
    marginRight: '12px',
    fontSize: '24px',
    color: '#666',
    transition: 'color 0.2s'
  },
  iconActive: {
    color: '#1976d2'
  },
  groupTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1976d2',
    padding: '16px 8px 8px',
    textTransform: 'uppercase'
  }
};

// Function to get menu items based on role
const getDashboardMenu = () => {
  const role = localStorage.getItem('role');
  console.log('Debug - Role from localStorage:', role); // Log chi tiết hơn

  // Lấy toàn bộ localStorage dưới dạng object
  const localStorageData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    localStorageData[key] = localStorage.getItem(key);
  }
  console.log('Debug - Full localStorage:', localStorageData); // Log toàn bộ localStorage

  const baseChildren = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard',
      icon: icons.dashboard,
      breadcrumbs: false
    },
    {
      id: 'grouprequest',
      title: 'Group Requests',
      type: 'item',
      url: '/group-requests',
      icon: icons.groupRequest,
      breadcrumbs: false
    },
    {
      id: 'supplierproducts',
      title: 'Products',
      type: 'item',
      url: '/supplier-products',
      icon: icons.supplierproducts,
      breadcrumbs: false
    },
    {
      id: 'department-management',
      title: 'Departments',
      type: 'item',
      url: '/department-management',
      icon: icons.department,
      breadcrumbs: false
    },
    {
      id: 'product-type-management',
      title: 'Product Types',
      type: 'item',
      url: '/product-type-management',
      icon: icons.productType,
      breadcrumbs: false
    }
  ];

  const userManagementItem = {
    id: 'user-management',
    title: 'Users',
    type: 'item',
    url: '/user-management',
    icon: icons.userManagement,
    breadcrumbs: false
  };

  return {
    id: 'group-dashboard',
    title: 'Management',
    icon: icons.navigation,
    type: 'group',
    children: role === 'Admin' ? [...baseChildren, userManagementItem] : baseChildren
  };
};

const dashboard = getDashboardMenu();

export default dashboard;