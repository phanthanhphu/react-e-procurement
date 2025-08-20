import React from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { API_BASE_URL } from '../../config';

// API URL
const apiUrl = `${API_BASE_URL}/api/group-summary-requisitions`;

const AddGroupModal = ({ visible, onCancel, onOk }) => {
  const [form] = Form.useForm();

  // Handle add group
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Add new group via API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        onOk(); // Call onOk to trigger table reload and close modal
        form.resetFields(); // Reset form fields after successful addition
        message.success('Group added successfully');
      } else {
        throw new Error('Failed to add group');
      }
    } catch (error) {
      message.error('Please fill in all the fields');
    }
  };

  return (
    <Modal 
      title="Add New Request Group" 
      visible={visible} 
      onOk={handleOk} 
      onCancel={() => {
        onCancel();
        form.resetFields(); // Reset form fields when modal is closed without saving
      }}
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
          rules={[{ required: true, message: 'Please input the group name!' }]}>
          <Input />
        </Form.Item>

        <Form.Item 
          label="Type"
          name="type" 
          rules={[{ required: true, message: 'Please select a type!' }]}>
          <Select placeholder="Select Type">
            <Select.Option value="Requisition_urgent">Requisition Urgent</Select.Option>
            <Select.Option value="Requisition_monthly">Requisition Monthly</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item 
          label="Status"
          name="status" 
          rules={[{ required: true, message: 'Please select a status!' }]}>
          <Select placeholder="Select Status">
            <Select.Option value="Completed">Completed</Select.Option>
            <Select.Option value="Not Started">Not Started</Select.Option>
            <Select.Option value="In Progress">In Progress</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item 
          label="Created By (Your Name)"
          name="createdBy" 
          rules={[{ required: true, message: 'Please input your name!' }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddGroupModal;
