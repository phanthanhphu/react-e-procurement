import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

import '../assets/css/vendor.min.css';
import '../assets/vendor/icon-set/style.css';
import '../assets/css/custom.css';
import '../assets/css/theme.min.css';

import logoYoungone from '../assets/svg/logos/logo-youngone.png';
import chatIllustration from '../assets/svg/illustrations/chat.svg';
import gitlabLogo from '../assets/svg/brands/gitlab-gray.svg';

import flagUS from '../assets/vendor/flag-icon-css/flags/1x1/us.svg';
import flagGB from '../assets/vendor/flag-icon-css/flags/1x1/gb.svg';
import { API_BASE_URL } from '../config';

const options = [
  {
    value: 'language1',
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={flagUS}
          alt="English (US)"
          width={20}
          height={14}
          style={{ marginRight: 10, borderRadius: '3px', boxShadow: '0 0 2px rgba(0,0,0,0.2)' }}
        />
        English (US)
      </div>
    ),
  },
  {
    value: 'language2',
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={flagGB}
          alt="English (UK)"
          width={20}
          height={14}
          style={{ marginRight: 10, borderRadius: '3px', boxShadow: '0 0 2px rgba(0,0,0,0.2)' }}
        />
        English (UK)
      </div>
    ),
  },
];

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: 38,
    borderRadius: 6,
    borderColor: state.isFocused ? '#2684FF' : '#ced4da',
    boxShadow: state.isFocused ? '0 0 0 1px #2684FF' : 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    paddingLeft: 8,
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? '#2684FF' : '#6c757d',
    padding: 4,
    '&:hover': {
      color: '#2684FF',
    },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  menu: (provided) => ({
    ...provided,
    borderRadius: 6,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? '#e7f1ff' : 'white',
    color: '#212529',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
  }),
  singleValue: (provided) => ({ ...provided, display: 'flex', alignItems: 'center' }),
  placeholder: (provided) => ({ ...provided, color: '#6c757d' }),
};

function LanguageSelect() {
  const [selectedOption, setSelectedOption] = useState(options[1]);

  return (
    <div
      id="languageSelect1"
      className="select2-custom select2-custom-right"
      style={{ minWidth: '12rem', position: 'relative' }}
    >
      <Select
        value={selectedOption}
        onChange={setSelectedOption}
        options={options}
        styles={customStyles}
        isSearchable={false}
        placeholder="Select language"
      />
    </div>
  );
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('role', data.user.role); // Store role for menu
        toast.success('Login successful! Redirecting...');
        navigate('/dashboard', { replace: true });
        setTimeout(() => {
          window.location.reload(); // Auto-reload after navigation
        }, 100); // Small delay to ensure navigation completes
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          toast.error(`Login failed: ${errorData.message || 'Unknown error'}`);
        } else {
          const errorText = await response.text();
          console.error('Server returned HTML error:', errorText);
          toast.error('The email or password you entered is incorrect. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error calling API:', error);
      toast.error('Unable to connect to the server!');
    }
  };

  return (
    <div className="d-flex align-items-center min-h-100">
      <main id="content" role="main" className="main pt-0 w-100">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        <div className="container-fluid px-3">
          <div className="row">
            <div
              className="col-lg-6 d-none d-lg-flex justify-content-center align-items-center min-vh-lg-100 bg-light px-0"
              style={{ position: 'relative' }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  right: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 10,
                }}
              >
                <a href="index.html" style={{ minWidth: '7rem', maxWidth: '18rem' }}>
                  <img className="w-100" src={logoYoungone} alt="Youngone Logo" />
                </a>
                <LanguageSelect />
              </div>
              <div className="container-auth">
                <div className="about-youngone text-center">
                  <div className="mb-5">
                    <img
                      className="img-fluid"
                      src={chatIllustration}
                      alt="Youngone Illustration"
                      style={{ width: '12rem' }}
                    />
                  </div>
                  <div className="mb-4">
                    <h2 className="display-4">About Youngone</h2>
                  </div>
                  <ul className="list-checked list-checked-lg list-checked-primary list-unstyled-py-4 text-left">
                    <li className="list-checked-item">
                      <strong>Since 1974</strong> Inspired by nature, Youngone leads in outdoor apparel
                      manufacturing worldwide.
                    </li>
                    <li className="list-checked-item">
                      <strong>Global Presence</strong> Facilities across Asia and the Americas with 70,000+
                      employees.
                    </li>
                    <li className="list-checked-item">
                      <strong>Vertical Integration</strong> Producing fabrics and insulation in-house for
                      quality and sustainability.
                    </li>
                  </ul>
                  <div className="row justify-content-between mt-5 gx-2 brand-logos">
                    <div className="col">
                      <img className="img-fluid" src={gitlabLogo} alt="Gitlab" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 d-flex justify-content-center align-items-center min-vh-lg-100">
              <div className="form-container w-100 pt-10 pt-lg-7 pb-7">
                <form onSubmit={handleSubmit}>
                  <div className="text-center mb-5">
                    <h1 className="display-4">Sign in</h1>
                    <p>
                      If you don’t have an account, please <strong>contact the admin</strong> to request
                      access.
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="signupSrEmail">Your email</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="signupSrEmail"
                      placeholder="join.st@youngonevn.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor="signupSrPassword"
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span>Password</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control form-control-lg"
                      id="signupSrPassword"
                      placeholder="8+ characters required"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleTogglePassword} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </div>

                  <button type="submit" className="btn btn-lg btn-block btn-primary">
                    Sign in
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;