// EditProductType1Modal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Input, message } from 'antd';

import { API_BASE_URL } from '../../config';

const EditProductType1Modal = ({ visible, record, onClose, onSuccess }) => {
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record) setInputName(record.name || '');
  }, [record]);

  const handleSubmit = async () => {
    const nameTrimmed = inputName.trim();
    if (!nameTrimmed) {
      message.warning('Please enter a name');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-type-1/${record.id}?name=${encodeURIComponent(nameTrimmed)}`, {
        method: 'PUT',
        headers: { accept: '*/*' },
      });
      if (!res.ok) throw new Error('Failed to update product type 1');
      message.success('Updated successfully');
      onSuccess();
    } catch (error) {
      message.error(error.message);
    }
    setLoading(false);
  };

  return (
    <Modal
      title="Edit Product Type 1"
      visible={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="Save"
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

export default EditProductType1Modal;
