// AddProductType1Modal.jsx
import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';

const API_BASE_URL = 'http://10.232.100.50:8080/api';

const AddProductType1Modal = ({ visible, onClose, onSuccess }) => {
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const nameTrimmed = inputName.trim();
    if (!nameTrimmed) {
      message.warning('Please enter a name');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/product-type-1?name=${encodeURIComponent(nameTrimmed)}`, {
        method: 'POST',
        headers: { accept: '*/*' },
        body: '',
      });
      if (!res.ok) throw new Error('Failed to add product type 1');
      message.success('Added successfully');
      onSuccess();
    } catch (error) {
      message.error(error.message);
    }
    setLoading(false);
  };

  return (
    <Modal
      title="Add New Product Type 1"
      visible={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="Add"
      destroyOnClose
      confirmLoading={loading}
    >
      <Input
        placeholder="Enter name"
        value={inputName}
        onChange={(e) => setInputName(e.target.value)}
        maxLength={100}
        autoFocus
      />
    </Modal>
  );
};

export default AddProductType1Modal;
