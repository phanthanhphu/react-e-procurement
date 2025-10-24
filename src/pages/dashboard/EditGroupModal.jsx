import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Radio } from 'antd';
import { Snackbar, Alert } from '@mui/material';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

// Check React version
const reactVersion = React.version.split('.')[0];
if (reactVersion >= 19) {
  console.warn('React 19 detected. Ant Design v5.x may have compatibility issues. See https://u.ant.design/v5-for-19 for details.');
}

// Cấu hình apiClient giống trong GroupRequestPage
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: '*/*',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const apiUrl = `${API_BASE_URL}/api/group-summary-requisitions`;

const EditGroupModal = ({ open, onCancel, onOk, currentItem }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // Get username from localStorage
  const storedUser = JSON.parse(localStorage.getItem('user')) || {};
  const username = storedUser.username || '';

  // Convert date input (array or string) to dayjs object
  const formatDate = (dateInput) => {
    if (!dateInput) {
      console.warn('Invalid date input:', dateInput);
      return null;
    }

    let date;
    if (Array.isArray(dateInput)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
      date = dayjs(new Date(year, month - 1, day, hour, minute, second));
    } else if (typeof dateInput === 'string' && dayjs(dateInput).isValid()) {
      date = dayjs(dateInput);
    } else {
      console.warn('Invalid date format:', dateInput);
      return null;
    }

    return date.isValid() ? date : null;
  };

  // Convert ISO date to array [year, month, day, hour, minute, second]
  const toDateArray = (isoDate) => {
    if (!isoDate || !dayjs(isoDate).isValid()) {
      console.warn('No valid ISO date provided for conversion:', isoDate);
      return null;
    }
    const date = new Date(isoDate);
    return [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
    ];
  };

  // Set form values when the modal opens
  useEffect(() => {
    console.log('EditGroupModal mounted. Props:', { open, currentItem });
    if (open && currentItem) {
      console.log('Setting form values:', currentItem);
      const stockDate = formatDate(currentItem.stockDate);
      form.setFieldsValue({
        name: currentItem.name || '',
        type: currentItem.type || 'Requisition_weekly',
        status: currentItem.status || 'Not Started',
        stockDate: stockDate,
        currency: currentItem.currency || 'VND',
      });
    } else {
      console.log('Resetting form');
      form.resetFields();
    }
    setOpenConfirmDialog(false);
  }, [currentItem, form, open]);

  // Handle close notification
  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Handle save click (triggers confirmation dialog)
  const handleSaveClick = async () => {
    console.log('Save button clicked. Starting handleSaveClick...');
    try {
      console.log('Validating form fields...');
      await form.validateFields();
      console.log('Form validation passed');
      setOpenConfirmDialog(true);
    } catch (error) {
      console.error('Form validation failed:', error);
      setNotification({
        open: true,
        message: 'Please fill in all required fields correctly',
        severity: 'error',
      });
    }
  };

  // Handle confirm save
  const handleConfirmSave = async () => {
    console.log('Confirm save clicked');
    setOpenConfirmDialog(false);
    setLoading(true);
    setNotification({ open: false, message: '', severity: 'info' });
    try {
      console.log('Validating form fields again for safety...');
      const values = await form.validateFields();
      console.log('Form validation passed. Values:', values);

      if (!currentItem?.id) {
        throw new Error('Group ID is missing');
      }

      // Prepare data for API
      const formattedValues = {
        ...values,
        id: currentItem.id,
        createdBy: username || currentItem.createdBy || 'Unknown',
        createdDate: currentItem.createdDate, // Giữ nguyên createdDate từ dữ liệu gốc
        stockDate: values.stockDate && dayjs(values.stockDate).isValid() ? toDateArray(values.stockDate.toISOString()) : null,
        currency: values.currency.toUpperCase(),
      };
      console.log('Formatted API payload:', formattedValues);

      // Update existing group via API using apiClient
      console.log('Sending API request to:', `${apiUrl}/${currentItem.id}`);
      const response = await apiClient.put(`${apiUrl}/${currentItem.id}`, formattedValues);

      console.log('API Response Status:', response.status);
      console.log('API Response Body:', response.data);

      setNotification({
        open: true,
        message: response.data.message || 'Group updated successfully',
        severity: 'success',
      });
      onOk();
      form.resetFields();
    } catch (error) {
      console.error('Error in handleConfirmSave:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update group due to an unexpected error';
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      console.log('handleConfirmSave completed. Resetting loading state.');
      setLoading(false);
    }
  };

  // Handle cancel confirmation
  const handleCancelSave = () => {
    console.log('Cancel confirmation clicked');
    setOpenConfirmDialog(false);
  };

  // Handle cancel with safety check
  const handleCancel = () => {
    console.log('Cancel button or icon X clicked');
    form.resetFields();
    setOpenConfirmDialog(false);
    if (typeof onCancel === 'function') {
      onCancel();
    } else {
      console.warn('onCancel is not a function. Prop value:', onCancel);
    }
  };

  return (
    <>
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%', fontSize: '0.7rem' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      <Modal
        title="Edit Request Group"
        open={open}
        onOk={handleSaveClick}
        onCancel={handleCancel}
        width={600}
        okText="Save"
        cancelText="Cancel"
        okButtonProps={{ loading, disabled: loading }}
        cancelButtonProps={{ disabled: loading }}
        style={{ borderRadius: '8px', zIndex: 1100 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Request Group Name (e.g., Monthly Requests)"
            name="name"
            rules={[{ required: true, message: 'Please input the group name!' }]}
          >
            <Input placeholder="Enter group name" />
          </Form.Item>

          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: 'Please select a type!' }]}
          >
            <Select placeholder="Select Type" disabled={currentItem?.used}>
              <Select.Option value="Requisition_weekly">Weekly Requisition</Select.Option>
              <Select.Option value="Requisition_monthly">Monthly Requisition</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select a status!' }]}
          >
            <Select placeholder="Select Status">
              <Select.Option value="Not Started">Not Started</Select.Option>
              <Select.Option value="In Progress">In Progress</Select.Option>
              <Select.Option value="Completed">Completed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Stock Date"
            name="stockDate"
            rules={[{ required: true, message: 'Please select the stock date!' }]}
          >
            <DatePicker
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              placeholder="Select stock date"
            />
          </Form.Item>

          <Form.Item
            label="Currency"
            name="currency"
            rules={[{ required: true, message: 'Please select a currency!' }]}
            initialValue="VND"
          >
            <Radio.Group disabled={currentItem?.used}>
              <Radio value="VND">VND</Radio>
              <Radio value="EURO">EURO</Radio>
              <Radio value="USD">USD</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Confirm Edit Group"
        open={openConfirmDialog}
        onOk={handleConfirmSave}
        onCancel={handleCancelSave}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{ loading, disabled: loading }}
        cancelButtonProps={{ disabled: loading }}
        style={{ borderRadius: '8px', zIndex: 1200 }}
      >
        <p style={{ fontSize: '14px', color: '#333' }}>
          Are you sure you want to save changes to the group &quot;{form.getFieldValue('name') || 'Unknown'}&quot;?
        </p>
      </Modal>
    </>
  );
};

export default EditGroupModal;