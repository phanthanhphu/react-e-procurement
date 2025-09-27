import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { API_BASE_URL } from '../../config';

const AddProductType1Modal = ({ open, onClose, onSuccess }) => {
  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const nameTrimmed = inputName.trim();
    if (!nameTrimmed) {
      message.warning('Vui lòng nhập tên');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-type-1?name=${encodeURIComponent(nameTrimmed)}`, {
        method: 'POST',
        headers: { accept: '*/*' },
        body: '',
      });
      if (!res.ok) throw new Error('Không thể thêm Product Type 1');
      message.success('Thêm thành công');
      setInputName('');
      onSuccess();
    } catch (error) {
      message.error(error.message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setInputName('');
    onClose();
  };

  return (
    <Modal
      title="Thêm Product Type 1"
      open={open}
      onOk={handleSubmit}
      onCancel={handleClose}
      okText="Thêm"
      destroyOnHidden
      confirmLoading={loading}
    >
      <Input
        placeholder="Nhập tên"
        value={inputName}
        onChange={(e) => setInputName(e.target.value)}
        maxLength={100}
        autoFocus
      />
    </Modal>
  );
};

export default AddProductType1Modal;