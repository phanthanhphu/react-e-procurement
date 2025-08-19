import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';

const API_BASE_URL = 'http://10.232.100.50:8080/api';

const AddProductType2Modal = ({ visible, parentId, onClose, onSuccess }) => {
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const name = inputName.trim();
    if (!name) {
      message.warning('Please enter a name');
      return;
    }
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/product-type-2?name=${encodeURIComponent(name)}&productType1Id=${parentId}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { accept: '*/*' },
        body: '',
      });
      if (!res.ok) throw new Error('Failed to add product type 2');
      message.success('Sub-type added successfully');
      onSuccess();
    } catch (error) {
      message.error(error.message);
    }
    setLoading(false);
  };

  return (
    <Modal
      title="Add New Sub-Type (Product Type 2)"
      visible={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="Add"
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

export default AddProductType2Modal;
