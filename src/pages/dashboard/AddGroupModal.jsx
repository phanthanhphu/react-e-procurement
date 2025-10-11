import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Radio } from 'antd';
import { Snackbar, Alert } from '@mui/material';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../config';

// Check React version
const reactVersion = React.version.split('.')[0];
if (reactVersion >= 19) {
  console.warn('React 19 detected. Ant Design v5.x may have compatibility issues. See https://u.ant.design/v5-for-19 for details.');
}

const apiUrl = `${API_BASE_URL}/api/group-summary-requisitions`;

const AddGroupModal = ({ open, onCancel, onOk, currentItem }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Log component mount and props
  useEffect(() => {
    console.log('AddGroupModal mounted. Props:', { open, currentItem });
    if (open) {
      if (currentItem) {
        console.log('Setting form values for editing:', currentItem);
        form.setFieldsValue({
          name: currentItem.name || '',
          type: currentItem.type || 'Requisition_weekly',
          status: currentItem.status || 'Not Started',
          createdBy: currentItem.createdBy || '',
          stockDate: currentItem.stockDate ? dayjs(formatDate(currentItem.stockDate)) : null,
          currency: currentItem.currency || 'VND', // Set default currency for editing
        });
      } else {
        console.log('Resetting form for new group');
        form.setFieldsValue({ currency: 'VND' }); // Set default currency for new group
        form.resetFields(['name', 'type', 'status', 'createdBy', 'stockDate']);
      }
    } else {
      console.log('Modal closed, resetting form');
      form.resetFields();
    }
  }, [currentItem, form, open]);

  // Convert date array to ISO string for dayjs
  const formatDate = (dateArray) => {
    if (!Array.isArray(dateArray) || dateArray.length < 3) {
      console.warn('Invalid date array:', dateArray);
      return null;
    }
    const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  };

  // Convert ISO date to array [year, month, day, hour, minute, second]
  const toDateArray = (isoDate) => {
    if (!isoDate) {
      console.warn('No ISO date provided for conversion');
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

  // Handle close notification
  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // Handle save (add or update)
  const handleOk = async () => {
    console.log('Save button clicked. Starting handleOk...');
    setLoading(true);
    setNotification({ open: false, message: '', severity: 'info' });
    try {
      // Validate form fields
      console.log('Validating form fields...');
      const values = await form.validateFields();
      console.log('Form validation passed. Values:', values);

      // Prepare data for API
      const formattedValues = {
        ...values,
        createdDate: currentItem ? currentItem.createdDate : toDateArray(new Date().toISOString()),
        stockDate: values.stockDate ? toDateArray(values.stockDate.toISOString()) : null,
        currency: values.currency.toUpperCase(), // Ensure currency is uppercase
      };
      console.log('Formatted API payload:', formattedValues);

      // Determine if adding or updating
      const isEditing = !!currentItem && !!currentItem.id;
      const url = isEditing ? `${apiUrl}/${currentItem.id}` : apiUrl;
      const method = isEditing ? 'PUT' : 'POST';
      console.log('API Request Details:', { url, method, payload: formattedValues });

      // Send API request
      console.log('Sending fetch request to:', url);
      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });

      console.log('API Response Status:', response.status);
      let responseBody;
      try {
        responseBody = await response.json();
        console.log('API Response Body:', responseBody);
      } catch (jsonError) {
        console.error('Failed to parse JSON:', jsonError);
        responseBody = { message: null };
      }

      if (response.ok) {
        console.log('API request successful');
        setNotification({
          open: true,
          message: responseBody.message || (isEditing ? 'Group updated successfully' : 'Group added successfully'),
          severity: 'success',
        });
        onOk();
        form.resetFields();
      } else {
        let errorMessage = 'An error occurred';
        if (responseBody && responseBody.message) {
          errorMessage = responseBody.message;
        } else {
          switch (response.status) {
            case 400:
              errorMessage = 'Invalid data provided. Please check your inputs.';
              break;
            case 401:
              errorMessage = 'Unauthorized. Please log in again.';
              break;
            case 403:
              errorMessage = 'You do not have permission to perform this action.';
              break;
            case 404:
              errorMessage = isEditing
                ? 'Group not found. It may have been deleted.'
                : 'API endpoint not found.';
              break;
            case 409:
              errorMessage = 'A group with this name and creation date already exists.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = `Failed to ${isEditing ? 'update' : 'add'} group`;
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error in handleOk:', error);
      setNotification({
        open: true,
        message: error.message || 'Please fill in all fields correctly',
        severity: 'error',
      });
    } finally {
      console.log('handleOk completed. Resetting loading state.');
      setLoading(false);
    }
  };

  // Handle cancel with safety check
  const handleCancel = () => {
    console.log('Cancel button or icon X clicked');
    form.resetFields();
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
        title={currentItem ? 'Edit Request Group' : 'Add Request Group'}
        open={open}
        onOk={() => {
          console.log('Modal onOk triggered');
          handleOk();
        }}
        onCancel={handleCancel}
        width={600}
        okText="Save"
        cancelText="Cancel"
        okButtonProps={{ loading, disabled: loading }}
        cancelButtonProps={{ disabled: loading }}
        style={{ borderRadius: '8px' }}
        zIndex={1000} // Ensure modal is not hidden behind other elements
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
            <Select placeholder="Select Type">
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
            </Select>
          </Form.Item>

          <Form.Item
            label="Created By (Your Name)"
            name="createdBy"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input placeholder="Enter your name" />
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
            <Radio.Group>
              <Radio value="VND">VND</Radio>
              <Radio value="EURO">EURO</Radio>
              <Radio value="USD">USD</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddGroupModal;