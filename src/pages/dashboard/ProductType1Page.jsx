import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Card, Typography, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ProductTypeSearch from './ProductTypeSearch';
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
  const [type1NameSearch, setType1NameSearch] = useState('');
  const [type2NameSearch, setType2NameSearch] = useState('');

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

  const formatDate = (dateArray) => {
    if (!dateArray || dateArray.length < 6) return '-';
    const [year, month, day, hour, minute, second] = dateArray;
    return dayjs(`${year}-${month}-${day} ${hour}:${minute}:${second}`).format('YYYY-MM-DD HH:mm');
  };

  const loadData = async (page = 0, type1Name = type1NameSearch, type2Name = type2NameSearch) => {
    setLoadingType1(true);
    try {
      const url = `${API_BASE_URL}/api/search?page=${page}&size=${PAGE_SIZE}${
        type1Name ? `&type1Name=${encodeURIComponent(type1Name)}` : ''
      }${type2Name ? `&type2Name=${encodeURIComponent(type2Name)}` : ''}`;
      const res = await fetch(url, { headers: { accept: '*/*' } });
      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.message || 'Failed to load data';
        throw new Error(errorMessage);
      }
      const json = await res.json();
      setType1Data(json.data || []);
      setType1Total(json.pagination?.totalElements || 0);
      setType1Page(json.pagination?.page || 0);

      // Update Type 2 data if a row is expanded
      if (expandedType1Id) {
        const expandedRecord = json.data.find(item => item.id === expandedType1Id);
        const type2Items = expandedRecord ? expandedRecord.code || [] : [];
        const start = type2Page * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        setType2Data(type2Items.slice(start, end));
        setType2Total(type2Items.length);
      } else {
        setType2Data([]);
        setType2Total(0);
      }
    } catch (error) {
      message.error(error.message || 'An unexpected error occurred');
    }
    setLoadingType1(false);
  };

  useEffect(() => {
    loadData(0, type1NameSearch, type2NameSearch);
  }, []);

  const handleSearch = ({ type1Name, type2Name }) => {
    setType1NameSearch(type1Name);
    setType2NameSearch(type2Name);
    setType2Page(0);
    loadData(0, type1Name, type2Name);
  };

  const handleReset = () => {
    setType1NameSearch('');
    setType2NameSearch('');
    setExpandedType1Id(null);
    setType2Data([]);
    setType2Page(0);
    loadData(0, '', '');
  };

  const handleExpand = (id) => {
    if (expandedType1Id === id) {
      setExpandedType1Id(null);
      setType2Data([]);
      setType2Page(0);
      setType2Total(0);
    } else {
      setExpandedType1Id(id);
      setType2Page(0);
      const expandedRecord = type1Data.find(item => item.id === id);
      if (expandedRecord) {
        const type2Items = expandedRecord.code || [];
        setType2Data(type2Items.slice(0, PAGE_SIZE));
        setType2Total(type2Items.length);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget.record) return;
    setLoadingType1(true);
    try {
      const { kind, record } = deleteTarget;
      const url = kind === 'type1'
        ? `${API_BASE_URL}/api/product-type-1/${record.id}`
        : `${API_BASE_URL}/api/product-type-2/${record.id}`;
      
      const res = await fetch(url, { method: 'DELETE' });

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
      loadData(type1Page, type1NameSearch, type2NameSearch);
    } catch (error) {
      message.error(error.message || 'An unexpected error occurred');
    }
    setLoadingType1(false);
  };

  const headerStyle = {
    backgroundColor: '#4cb8ff',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '0.55rem',
    padding: '4px 8px',
    borderRadius: 2,
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
      render: text => <Typography.Text style={{ fontSize: '0.55rem', fontWeight: 500 }}>{text}</Typography.Text>,
    },
    {
      title: <div style={headerStyle}>Created Date</div>,
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: date => <Typography.Text style={{ fontSize: '0.55rem' }}>{formatDate(date)}</Typography.Text>,
      width: 120,
      align: 'center',
    },
    {
      title: <div style={headerStyle}>Actions</div>,
      key: 'actions',
      align: 'center',
      width: 120,
      render: (_, rec) => (
        <Space size={4}>
          <Button
            type="text"
            icon={expandedType1Id === rec.id ? <UpOutlined style={{ fontSize: '12px' }} /> : <DownOutlined style={{ fontSize: '12px' }} />}
            onClick={() => handleExpand(rec.id)}
            style={{ fontWeight: 'bold', fontSize: '0.65rem' }}
          >
            {expandedType1Id === rec.id ? 'Collapse' : 'Expand'}
          </Button>
          <Button
            shape="circle"
            style={{
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              fontSize: '0.65rem',
              width: 24,
              height: 24,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            icon={<EditOutlined style={{ fontSize: '10px' }} />}
            onClick={() => { setType1Record(rec); setShowEditType1(true); }}
          />
          <Button
            shape="circle"
            style={{
              background: '#f26f6f',
              color: '#fff',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              fontSize: '0.65rem',
              width: 24,
              height: 24,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            icon={<DeleteOutlined style={{ fontSize: '10px' }} />}
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
      render: text => <Typography.Text style={{ fontSize: '0.55rem' }}>{text}</Typography.Text>,
    },
    {
      title: <div style={headerStyle}>Created Date</div>,
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: date => <Typography.Text style={{ fontSize: '0.55rem' }}>{formatDate(date)}</Typography.Text>,
      width: 100,
      align: 'center',
    },
    {
      title: <div style={headerStyle}>Actions</div>,
      key: 'actions',
      align: 'center',
      width: 100,
      render: (_, rec) => (
        <Space size={2}>
          <Button
            shape="circle"
            style={{
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              fontSize: '0.65rem',
              width: 24,
              height: 24,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            icon={<EditOutlined style={{ fontSize: '10px' }} />}
            onClick={() => { setType2Record({ ...rec, parentId: expandedType1Id }); setShowEditType2(true); }}
          />
          <Button
            shape="circle"
            style={{
              background: '#f26f6f',
              color: '#fff',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              fontSize: '0.65rem',
              width: 24,
              height: 24,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            icon={<DeleteOutlined style={{ fontSize: '10px' }} />}
            onClick={() => { setDeleteTarget({ kind: 'type2', record: rec }); setDeleteConfirmVisible(true); }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Space style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, maxWidth: 600 }}>
          <ProductTypeSearch
            type1NameValue={type1NameSearch}
            type2NameValue={type2NameSearch}
            onType1NameChange={setType1NameSearch}
            onType2NameChange={setType2NameSearch}
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined style={{ fontSize: '12px' }} />}
          onClick={() => setShowAddType1(true)}
          style={{
            borderRadius: 8,
            fontWeight: 500,
            padding: '0 12px',
            background: 'linear-gradient(to right, #4cb8ff, #027aff)',
            color: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            height: 28,
            lineHeight: '28px',
            fontSize: '0.65rem',
          }}
        >
          Add New Parent Type
        </Button>
      </Space>
      <Card
        title={(
          <Typography.Title level={4} style={{ margin: 0, color: '#001529', fontSize: '0.8rem' }}>
            Parent Type
          </Typography.Title>
        )}
        bordered={false}
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 4,
          backgroundColor: '#fff',
          padding: '8px',
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
            onChange: page => loadData(page - 1, type1NameSearch, type2NameSearch),
            showSizeChanger: false,
            size: 'small',
          }}
          expandable={{
            expandedRowRender: rec => (
              <Card size="small" style={{ margin: 0, backgroundColor: '#fafafa', padding: '8px' }}>
                <Space style={{ marginBottom: 8, justifyContent: 'space-between', width: '100%' }}>
                  <Typography.Title level={5} style={{ margin: 0, fontSize: '0.7rem' }}>
                    Sub-Type
                  </Typography.Title>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined style={{ fontSize: '12px' }} />}
                    onClick={() => { setType2Record({ parentId: rec.id }); setShowAddType2(true); }}
                    style={{ 
                      borderRadius: 4, 
                      fontSize: '0.65rem', 
                      padding: '2px 8px',
                      height: 24,
                    }}
                  >
                    Add Sub-Type
                  </Button>
                </Space>
                <Table
                  columns={type2Columns}
                  dataSource={type2Data}
                  rowKey="id"
                  loading={loadingType2}
                  pagination={{
                    current: type2Page + 1,
                    pageSize: PAGE_SIZE,
                    total: type2Total,
                    onChange: page => {
                      setType2Page(page - 1);
                      const expandedRecord = type1Data.find(item => item.id === expandedType1Id);
                      if (expandedRecord) {
                        const type2Items = expandedRecord.code || [];
                        const start = (page - 1) * PAGE_SIZE;
                        const end = start + PAGE_SIZE;
                        setType2Data(type2Items.slice(start, end));
                        setType2Total(type2Items.length);
                      }
                    },
                    size: 'small',
                    showSizeChanger: false,
                  }}
                  size="small"
                />
              </Card>
            ),
            rowExpandable: () => true, // Allow all rows to be expandable
            expandedRowKeys: expandedType1Id ? [expandedType1Id] : [],
            onExpand: (exp, rec) => exp ? handleExpand(rec.id) : (setExpandedType1Id(null), setType2Data([]), setType2Page(0), setType2Total(0)),
          }}
          size="small"
        />
      </Card>

      {/* Modals */}
      <AddProductType1Modal
        visible={showAddType1}
        onClose={() => setShowAddType1(false)}
        onSuccess={() => { setShowAddType1(false); loadData(type1Page, type1NameSearch, type2NameSearch); }}
      />
      <EditProductType1Modal
        visible={showEditType1}
        record={type1Record}
        onClose={() => setShowEditType1(false)}
        onSuccess={() => { setShowEditType1(false); loadData(type1Page, type1NameSearch, type2NameSearch); }}
      />
      <AddProductType2Modal
        visible={showAddType2}
        parentId={type2Record?.parentId}
        onClose={() => setShowAddType2(false)}
        onSuccess={() => { setShowAddType2(false); loadData(type1Page, type1NameSearch, type2NameSearch); }}
      />
      <EditProductType2Modal
        visible={showEditType2}
        record={type2Record}
        onClose={() => setShowEditType2(false)}
        onSuccess={() => { setShowEditType2(false); loadData(type1Page, type1NameSearch, type2NameSearch); }}
      />
      <Modal
        title={<Typography.Text style={{ fontSize: '0.7rem' }}>Confirm Delete</Typography.Text>}
        visible={deleteConfirmVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
        destroyOnClose
        width={300}
      >
        <Typography.Text style={{ fontSize: '0.65rem' }}>
          Are you sure you want to delete &quot;{deleteTarget.record?.name}&quot;?
        </Typography.Text>
      </Modal>
    </div>
  );
};

export default ProductType1Page;