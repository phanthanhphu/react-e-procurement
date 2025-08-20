import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Card, Typography, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import AddProductType1Modal from './AddProductType1Modal';
import EditProductType1Modal from './EditProductType1Modal';
import AddProductType2Modal from './AddProductType2Modal';
import EditProductType2Modal from './EditProductType2Modal';

import { API_BASE_URL } from '../../config';
const PAGE_SIZE = 10;

const ProductType1Page = () => {
  const [type1Data, setType1Data] = useState([]);
  const [type1Page, setType1Page] = useState(0);
  const [type1Total, setType1Total] = useState(0);
  const [loadingType1, setLoadingType1] = useState(false);

  const [expandedType1Id, setExpandedType1Id] = useState(null);
  const [type2Data, setType2Data] = useState([]);
  const [type2Page, setType2Page] = useState(0);
  const [type2Total, setType2Total] = useState(0);
  const [loadingType2, setLoadingType2] = useState(false);

  const [showAddType1, setShowAddType1] = useState(false);
  const [showEditType1, setShowEditType1] = useState(false);
  const [type1Record, setType1Record] = useState(null);

  const [showAddType2, setShowAddType2] = useState(false);
  const [showEditType2, setShowEditType2] = useState(false);
  const [type2Record, setType2Record] = useState(null);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ kind: '', record: null });

  const loadType1 = async (page = 0) => {
    setLoadingType1(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-type-1?page=${page}&size=${PAGE_SIZE}`);
      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.message || 'Failed to load Type 1 data';
        throw new Error(errorMessage);
      }
      const json = await res.json();
      setType1Data(json.content || []);
      setType1Total(json.totalElements || 0);
      setType1Page(json.number || 0);
    } catch (error) {
      message.error(error.message || 'An unexpected error occurred');
    }
    setLoadingType1(false);
  };

  const loadType2 = async (parentId, page = 0) => {
    setLoadingType2(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/product-type-2?productType1Id=${parentId}&page=${page}&size=${PAGE_SIZE}`);
      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.message || 'Failed to load Type 2 data';
        throw new Error(errorMessage);
      }
      const json = await res.json();
      setType2Data(json.content || []);
      setType2Total(json.totalElements || 0);
      setType2Page(json.number || 0);
    } catch (error) {
      message.error(error.message || 'An unexpected error occurred');
    }
    setLoadingType2(false);
  };

  useEffect(() => {
    loadType1();
  }, []);

  const handleExpand = (id) => {
    if (expandedType1Id === id) {
      setExpandedType1Id(null);
      setType2Data([]);
    } else {
      setExpandedType1Id(id);
      loadType2(id, 0);
    }
  };

  const headerStyle = {
    backgroundColor: '#4cb8ff',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '0.75rem',
    padding: 8,
    borderRadius: 4,
  };

  const type1Columns = [
    {
      title: <div style={headerStyle}>No.</div>,
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1 + type1Page * PAGE_SIZE,
    },
    {
      title: <div style={headerStyle}>Name</div>,
      dataIndex: 'name',
      key: 'name',
      render: text => <Typography.Text style={{ fontSize: '0.875rem', fontWeight: 500 }}>{text}</Typography.Text>,
    },
    {
      title: <div style={headerStyle}>Created Date</div>,
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: date => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
      width: 180,
      align: 'center',
    },
    {
      title: <div style={headerStyle}>Actions</div>,
      key: 'actions',
      align: 'center',
      width: 150,
      render: (_, rec) => (
        <Space size="middle">
          <Button
            type="text"
            icon={expandedType1Id === rec.id ? <UpOutlined /> : <DownOutlined />}
            onClick={() => handleExpand(rec.id)}
            style={{ fontWeight: 'bold' }}
          >
            {expandedType1Id === rec.id ? 'Collapse' : 'Expand'}
          </Button>
          <Button
            shape="circle"
            style={{
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
            icon={<EditOutlined />}
            onClick={() => { setType1Record(rec); setShowEditType1(true); }}
          />
          <Button
            shape="circle"
            style={{
              background: '#f26f6f',
              color: '#fff',
              border: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
            icon={<DeleteOutlined />}
            onClick={() => { setDeleteTarget({ kind: 'type1', record: rec }); setDeleteConfirmVisible(true); }}
          />
        </Space>
      ),
    },
  ];

  const type2Columns = [
    {
      title: <div style={headerStyle}>No.</div>,
      key: 'index',
      width: 40,
      render: (_, __, index) => index + 1 + type2Page * PAGE_SIZE,
    },
    {
      title: <div style={headerStyle}>Name</div>,
      dataIndex: 'name',
      key: 'name',
      render: text => <Typography.Text style={{ fontSize: '0.875rem' }}>{text}</Typography.Text>,
    },
    {
      title: <div style={headerStyle}>Created Date</div>,
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: date => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
      width: 160,
      align: 'center',
    },
    {
      title: <div style={headerStyle}>Actions</div>,
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, rec) => (
        <Space>
          <Button
            shape="circle"
            style={{
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
            icon={<EditOutlined />}
            onClick={() => { setType2Record(rec); setShowEditType2(true); }}
          />
          <Button
            shape="circle"
            style={{
              background: '#f26f6f',
              color: '#fff',
              border: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
            icon={<DeleteOutlined />}
            onClick={() => { setDeleteTarget({ kind: 'type2', record: rec }); setDeleteConfirmVisible(true); }}
          />
        </Space>
      ),
    },
  ];

const handleDelete = async () => {
  if (!deleteTarget.record) return;
  setLoadingType1(true);
  try {
    const { kind, record } = deleteTarget;
    const url = kind === 'type1'
      ? `${API_BASE_URL}/api/product-type-1/${record.id}`
      : `${API_BASE_URL}/api/product-type-2/${record.id}`;
    
    const res = await fetch(url, { method: 'DELETE' });

    // Kiểm tra nếu API trả về lỗi liên quan đến các mục ProductType2
    if (!res.ok) {
      const errorData = await res.json();
      const errorMessage = errorData.message || 'Delete failed';
      
      if (errorMessage.includes("associated ProductType2 items")) {
        message.error("Cannot delete this ProductType1 because there are associated ProductType2 items.");
      } else {
        message.error(errorMessage);
      }
      throw new Error(errorMessage);
    }

    message.success('Deleted successfully');
    setDeleteConfirmVisible(false);
    if (kind === 'type1') loadType1(type1Page);
    else if (kind === 'type2' && expandedType1Id) loadType2(expandedType1Id, type2Page);
  } catch (error) {
    message.error(error.message || 'An unexpected error occurred');
  }
  setLoadingType1(false);
};


  return (
    <div style={{ padding: 32, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={(
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Typography.Title level={3} style={{ margin: 0, color: '#001529' }}>
              Parent Type
            </Typography.Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowAddType1(true)}
              style={{
                borderRadius: 20,
                fontWeight: 500,
                padding: '0 16px',
                background: 'linear-gradient(to right, #4cb8ff, #027aff)',
                color: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              Add New Parent Type
            </Button>
          </Space>
        )}
        bordered={false}
        style={{
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
          borderRadius: 8,
          backgroundColor: '#fff'
        }}
      >
        <Table
          columns={type1Columns}
          dataSource={type1Data}
          rowKey="id"
          loading={loadingType1}
          pagination={{
            current: type1Page + 1,
            pageSize: PAGE_SIZE,
            total: type1Total,
            onChange: page => loadType1(page - 1),
            showSizeChanger: false,
          }}
          expandable={{
            expandedRowRender: rec => (
              <Card size="small" style={{ margin: 0, backgroundColor: '#fafafa' }}>
                <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    Sub-Type
                  </Typography.Title>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => { setType2Record({ parentId: rec.id }); setShowAddType2(true); }}
                    style={{ borderRadius: 6 }}
                  >
                    Add Sub-Type
                  </Button>
                </Space>
                <Table
                  columns={type2Columns}
                  dataSource={expandedType1Id === rec.id ? type2Data : []}
                  rowKey="id"
                  loading={loadingType2}
                  pagination={{
                    current: type2Page + 1,
                    pageSize: PAGE_SIZE,
                    total: type2Total,
                    onChange: page => expandedType1Id && loadType2(expandedType1Id, page - 1),
                    size: 'small',
                    showSizeChanger: false,
                  }}
                  size="small"
                />
              </Card>
            ),
            rowExpandable: () => true,
            expandedRowKeys: expandedType1Id ? [expandedType1Id] : [],
            onExpand: (exp, rec) => exp ? handleExpand(rec.id) : (setExpandedType1Id(null), setType2Data([])),
          }}
        />
      </Card>

      {/* Modals */}
      <AddProductType1Modal
        visible={showAddType1}
        onClose={() => setShowAddType1(false)}
        onSuccess={() => { setShowAddType1(false); loadType1(type1Page); }}
      />
      <EditProductType1Modal
        visible={showEditType1}
        record={type1Record}
        onClose={() => setShowEditType1(false)}
        onSuccess={() => { setShowEditType1(false); loadType1(type1Page); }}
      />
      <AddProductType2Modal
        visible={showAddType2}
        parentId={type2Record?.parentId}
        onClose={() => setShowAddType2(false)}
        onSuccess={() => { setShowAddType2(false); loadType2(type2Record.parentId, type2Page); }}
      />
      <EditProductType2Modal
        visible={showEditType2}
        record={type2Record}
        onClose={() => setShowEditType2(false)}
        onSuccess={() => { setShowEditType2(false); loadType2(expandedType1Id, type2Page); }}
      />
      <Modal
        title="Confirm Delete"
        visible={deleteConfirmVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
        destroyOnClose
      >
        <Typography.Text>
          Are you sure you want to delete &quot;{deleteTarget.record?.name}&quot;?
        </Typography.Text>
      </Modal>
    </div>
  );
};

export default ProductType1Page;
