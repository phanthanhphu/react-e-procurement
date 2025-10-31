// material-ui
import Button from '@mui/material/Button';
import CardMedia from '@mui/material/CardMedia';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// project-imports
import MainCard from 'components/MainCard';

// assets
import WelcomeImage from 'assets/images/analytics/welcome-banner.png';
import cardBack from 'assets/images/widget/img-dropbox-bg.svg';

// ==============================|| ANALYTICS - WELCOME ||============================== //

export default function WelcomeBanner() {
  const location = useLocation();

  useEffect(() => {
    // Kiểm tra xem có phải đang ở trang /react/login/dashboard
    if (location.pathname === '/react/login/dashboard') {
      // Kiểm tra xem trang đã được reload lần đầu tiên hay chưa
      const hasReloaded = localStorage.getItem('hasReloadedDashboard');
      if (!hasReloaded) {
        // Đặt cờ để tránh reload lại lần nữa
        localStorage.setItem('hasReloadedDashboard', 'true');
        // Thực hiện reload một lần
        window.location.reload();
      }
    }
  }, [location.pathname]);

  return (
    <MainCard
      border={false}
      sx={{
        color: 'background.paper',
        bgcolor: 'primary.darker',
        position: 'relative',
        overflow: 'hidden',
        '&:after': {
          content: '""',
          background: `url("${cardBack}") 100% 100% / cover no-repeat`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          opacity: 0.5
        }
      }}
    >
      <Grid container>
        <Grid item md={6} sm={6} xs={12}>
          <Stack sx={{ gap: 2, padding: 3, position: 'relative', zIndex: 2 }}>
            <Typography
              variant="h2"
              sx={{
                color: '#fff',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 2,
                textShadow: '3px 3px 8px rgba(0,0,0,0.7)',
                mb: 2
              }}
            >
              Youngone
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              About Youngone
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Since 1974 Inspired by nature, Youngone leads in outdoor apparel manufacturing worldwide.
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Global Presence: Facilities across Asia and the Americas with 70,000+ employees.
            </Typography>
            <Typography variant="body1">
              Vertical Integration: Producing fabrics and insulation in-house for quality and sustainability.
            </Typography>
            <Box sx={{ pt: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                href="https://youngonecorporation.com/what-we-do"
                sx={{
                  color: 'background.paper',
                  borderColor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    borderColor: 'background.paper',
                    color: 'background.paper'
                  }
                }}
                target="_blank"
              >
                Learn More
              </Button>
            </Box>
          </Stack>
        </Grid>
        <Grid item sm={6} xs={12} sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Stack
            sx={{
              justifyContent: 'center',
              alignItems: 'flex-end',
              position: 'relative',
              pr: { sm: 6, md: 12 }, 
              zIndex: 2
            }}
          >
            <CardMedia
              component="img"
              sx={{ width: 200, mr: '-40px' }}
              src={WelcomeImage}
              alt="Youngone Illustration"
            />
          </Stack>
        </Grid>
      </Grid>
    </MainCard>
  );
}