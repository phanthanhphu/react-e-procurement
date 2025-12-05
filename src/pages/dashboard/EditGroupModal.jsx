import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Radio } from 'antd';
import { Snackbar, Alert } from '@mui/material';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

// React 19 warning (keep if needed)
const reactVersion = React.version.split('.')[0];
if (reactVersion >= 19) {
  console.warn('React 19 detected. Ant w Design v5.x may have compatibility issues.');
}

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
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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

  // Current logged-in user
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const username = storedUser.username || '';

  // Helpers: date ↔ array
  const formatDate = (dateInput) => {
    if (!dateInput) return null;
    if (Array.isArray(dateInput)) {
      const [y, m, d, h = 0, i = 0, s = 0] = dateInput;
      return dayjs(new Date(y, m - 1, d, h, i, s));
    }
    return dayjs(dateInput).isValid() ? dayjs(dateInput) : null;
  };

  const toDateArray = (isoDate) => {
    if (!isoDate || !dayjs(isoDate).isValid()) return null;
    const d = new Date(isoDate);
    return [
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
    ];
  };

  // Fill form when modal opens
  useEffect(() => {
    if (open && currentItem) {
      form.setFieldsValue({
        name: currentItem.name || '',
        type: currentItem.type || 'Requisition_weekly',
        status: currentItem.status || 'Not Started', // hidden, kept for payload
        stockDate: formatDate(currentItem.stockDate),
        currency: currentItem.currency || 'VND',
      });
    } else {
      form.resetFields();
    }
    setOpenConfirmDialog(false);
  }, [open, currentItem, form]);

  const closeNotification = () => setNotification((p) => ({ ...p, open: false }));

  // Step 1: Validate → open confirm dialog
  const handleSaveClick = async () => {
    try {
      await form.validateFields();
      setOpenConfirmDialog(true);
    } catch {
      setNotification({
        open: true,
        message: 'Please fill in all required fields.',
        severity: 'error',
      });
    }
  };

  // Step 2: Confirmed → send PUT request
  const handleConfirmSave = async () => {
    setOpenConfirmDialog(false);
    setLoading(true);
    try {
      const values = await form.validateFields();

      if (!currentItem?.id) throw new Error('Group ID missing');

      const payload = {
        ...values,
        id: currentItem.id,
        createdBy: username || currentItem.createdBy || 'Unknown',
        createdDate: currentItem.createdDate,
        stockDate: values.stockDate
          ? toDateArray(values.stockDate.toISOString())
          : null,
        currency: values.currency.toUpperCase(),
        // ALWAYS send original status (user cannot change it)
        status: currentItem.status || 'Not Started',
      };

      const { data } = await apiClient.put(`${apiUrl}/${currentItem.id}`, payload);

      setNotification({
        open: true,
        message: data.message || 'Group updated successfully!',
        severity: 'success',
      });
      onOk();
      form.resetFields();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to update group.';
      setNotification({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSave = () => setOpenConfirmDialog(false);
  const handleCancel = () => {
    form.resetFields();
    setOpenConfirmDialog(false);
    onCancel();
  };

  return (
    <>
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={closeNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Edit Modal */}
      <Modal
        title="Edit Request Group"
        open={open}
        onOk={handleSaveClick}
        onCancel={handleCancel}
        okText="Save"
        cancelText="Cancel"
        width={600}
        okButtonProps={{ loading }}
        cancelButtonProps={{ disabled: loading }}
      >
        <Form form={form} layout="vertical">
          {/* Group Name */}
          <Form.Item
            label="Group Name"
            name="name"
            rules={[{ required: true, message: 'Enter group name' }]}
          >
            <Input placeholder="e.g. November Requests" />
          </Form.Item>

          {/* Type */}
          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: 'Select type' }]}
          >
            <Select placeholder="Select type" disabled={currentItem?.used}>
              <Select.Option value="Requisition_weekly">Weekly</Select.Option>
              <Select.Option value="Requisition_monthly">Monthly</Select.Option>
            </Select>
          </Form.Item>

          {/* Hidden status field (kept for payload) */}
          <Form.Item name="status" style={{ display: 'none' }}>
            <Input />
          </Form.Item>

          {/* Stock Date
          <Form.Item
            label="Stock Date"
            name="stockDate"
            rules={[{ required: true, message: 'Select stock date' }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
              placeholder="Pick a date"
            />
          </Form.Item> */}

          {/* Currency */}
          <Form.Item
            label="Currency"
            name="currency"
            rules={[{ required: true, message: 'Select currency' }]}
          >
            <Radio.Group disabled={currentItem?.used}>
              <Radio value="VND">VND</Radio>
              <Radio value="EURO">EURO</Radio>
              <Radio value="USD">USD</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirm Dialog */}
      <Modal
        title="Confirm Changes"
        open={openConfirmDialog}
        onOk={handleConfirmSave}
        onCancel={handleCancelSave}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{ loading }}
      >
        <p>
          Save changes for group "
          <strong>{form.getFieldValue('name') || 'Unnamed'}</strong>"?
        </p>
      </Modal>
    </>
  );
};

export default EditGroupModal;