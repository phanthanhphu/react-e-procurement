// material-ui
import { useTheme } from '@mui/material/styles';

// import ảnh logo bạn muốn dùng
import logoYoungone from '../../assets/svg/logos/logo-youngone.png';

export default function LogoMain() {
  const theme = useTheme();

  return (
    <img
      src={logoYoungone}
      alt="icon logo"
      width="260"
    
      style={{ height: 'auto', marginLeft: '-15px' }}
    />
  );
}
