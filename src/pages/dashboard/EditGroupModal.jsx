import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { API_BASE_URL } from '../../config';

// API URL
const apiUrl = `${API_BASE_URL}/api/group-summary-requisitions`;

const EditGroupModal = ({ visible, onCancel, onOk, currentItem }) => {
  const [form] = Form.useForm();

  // Set form values when the modal opens
  useEffect(() => {
    if (currentItem) {
      form.setFieldsValue(currentItem);
    }
  }, [currentItem, form]);

  // Handle update group
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Update existing group via API
      const response = await fetch(`${apiUrl}/${currentItem.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        onOk();
        message.success('Group updated successfully');
      } else {
        throw new Error('Failed to update group');
      }
    } catch (error) {
      message.error('Please fill in all the fields');
    }
  };

  return (
    <Modal 
      title="Edit Request Group" 
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
      </Form>
    </Modal>
  );
};

export default EditGroupModal;
