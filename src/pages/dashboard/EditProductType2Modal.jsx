import React, { useState, useEffect } from 'react';
import { Modal, Input, message } from 'antd';

import { API_BASE_URL } from '../../config';

const EditProductType2Modal = ({ visible, record, onClose, onSuccess }) => {
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (record) setInputName(record.name || ''); }, [record]);

  const handleSubmit = async () => {
    const name = inputName.trim();
    if (!name) {
      message.warning('Please enter a name');
      return;
    }
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/product-type-2/${record.id}?name=${encodeURIComponent(name)}`;
      const res = await fetch(url, { method: 'PUT', headers: { accept: '*/*' } });
      if (!res.ok) throw new Error('Failed to update product type 2');
      message.success('Sub-type updated successfully');
      onSuccess();
    } catch (error) {
      message.error(error.message);
    }
    setLoading(false);
  };

  return (
    <Modal
      title="Edit Sub-Type (Product Type 2)"
      visible={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="Save"
      destroyOnClose
      confirmLoading={loading}
    >
      <Input
        placeholder="Enter sub-type name"
        value={inputName}
        onChange={(e) => setInputName(e.target.value)}
        maxLength={100}
        autoFocus
      />
    </Modal>
  );
};

export default EditProductType2Modal;
