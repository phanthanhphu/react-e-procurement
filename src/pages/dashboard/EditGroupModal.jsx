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

const EditGroupModal = ({ open, onCancel, onOk, currentItem }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Set form values when the modal opens
  useEffect(() => {
    console.log('EditGroupModal mounted. Props:', { open, currentItem });
    if (open && currentItem) {
      console.log('Setting form values:', currentItem);
      form.setFieldsValue({
        name: currentItem.name || '',
        type: currentItem.type || 'Requisition_weekly',
        status: currentItem.status || 'Not Started',
        createdBy: currentItem.createdBy || '',
        stockDate: currentItem.stockDate ? dayjs(formatDate(currentItem.stockDate)) : null,
        currency: currentItem.currency || 'VND',
      });
    } else {
      console.log('Resetting form');
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

  // Handle update group
  const handleOk = async () => {
    console.log('Save button clicked. Starting handleOk...');
    setLoading(true);
    setNotification({ open: false, message: '', severity: 'info' });
    try {
      console.log('Validating form fields...');
      const values = await form.validateFields();
      console.log('Form validation passed. Values:', values);

      if (!currentItem?.id) {
        throw new Error('Group ID is missing');
      }

      // Prepare data for API
      const formattedValues = {
        ...values,
        id: currentItem.id,
        createdDate: currentItem.createdDate, // Preserve existing createdDate
        stockDate: values.stockDate ? toDateArray(values.stockDate.toISOString()) : null,
        currency: values.currency.toUpperCase(), // Ensure currency is uppercase
      };
      console.log('Formatted API payload:', formattedValues);

      // Update existing group via API
      console.log('Sending fetch request to:', `${apiUrl}/${currentItem.id}`);
      const response = await fetch(`${apiUrl}/${currentItem.id}`, {
        method: 'PUT',
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
        throw new Error('Failed to update group');
      }

      if (response.ok) {
        console.log('API request successful');
        setNotification({
          open: true,
          message: responseBody.message || 'Group updated successfully',
          severity: 'success',
        });
        onOk();
        form.resetFields();
      } else {
        throw new Error(responseBody.message || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error in handleOk:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to update group',
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
        title="Edit Request Group"
        open={open}
        onOk={handleOk}
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
            <Radio.Group disabled={currentItem?.used}>
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

export default EditGroupModal;