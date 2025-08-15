import { createBrowserRouter } from 'react-router-dom';

// project-imports
import MainRoutes from './MainRoutes';
import LoginPage from './LoginPage';

// ==============================|| ROUTES RENDER ||============================== //

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <LoginPage />
    },
    MainRoutes           
  ],
  {
    basename: import.meta.env.VITE_APP_BASE_NAME
  }
);

export default router;
