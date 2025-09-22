import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, message } from 'antd';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../config';

// API URL
const apiUrl = `${API_BASE_URL}/api/group-summary-requisitions`;

const EditGroupModal = ({ visible, onCancel, onOk, currentItem }) => {
  const [form] = Form.useForm();

  // Set form values when the modal opens
  useEffect(() => {
    if (currentItem) {
      form.setFieldsValue({
        name: currentItem.name,
        type: currentItem.type,
        status: currentItem.status,
        createdBy: currentItem.createdBy,
        stockDate: currentItem.stockDate ? dayjs(formatDate(currentItem.stockDate)) : null,
        // Do not set createdDate in the form, preserve it from currentItem
      });
    }
  }, [currentItem, form]);

  // Convert date array to ISO string for dayjs
  const formatDate = (dateArray) => {
    if (!Array.isArray(dateArray) || dateArray.length < 3) return null;
    const [year, month, day] = dateArray;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  // Handle update group
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Include createdDate from currentItem and stockDate as ISO string
      const formattedValues = {
        ...values,
        createdDate: currentItem?.createdDate || null, // Preserve existing createdDate
        stockDate: values.stockDate ? values.stockDate.toISOString() : null, // Convert stockDate to ISO string
      };

      // Update existing group via API
      const response = await fetch(`${apiUrl}/${currentItem.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      });

      if (response.ok) {
        onOk();
        message.success('Group updated successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update group');
      }
    } catch (error) {
      message.error(error.message || 'Please fill in all the fields correctly');
    }
  };

  return (
    <Modal 
      title="Add Request Group" 
      visible={visible} 
      onOk={handleOk} 
      onCancel={onCancel}
      width={600}
      okText="Save"
      style={{
        borderRadius: '8px',
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          label="Request Group Name (e.g., Monthly Requests)"
          name="name" 
          rules={[{ required: true, message: 'Please input the group name!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item 
          label="Type"
          name="type" 
          rules={[{ required: true, message: 'Please select a type!' }]}
        >
          <Select placeholder="Select Type">
            <Select.Option value="Requisition_urgent">Requisition Urgent</Select.Option>
            <Select.Option value="Requisition_monthly">Requisition Monthly</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item 
          label="Status"
          name="status" 
          rules={[{ required: true, message: 'Please select a status!' }]}
        >
          <Select placeholder="Select Status">
            <Select.Option value="Completed">Completed</Select.Option>
            <Select.Option value="Not Started">Not Started</Select.Option>
            <Select.Option value="In Progress">In Progress</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item 
          label="Created By (Your Name)"
          name="createdBy" 
          rules={[{ required: true, message: 'Please input your name!' }]}
        >
          <Input />
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
      </Form>
    </Modal>
  );
};

export default EditGroupModal;