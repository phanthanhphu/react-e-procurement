import React, { useState, useEffect } from 'react';
import { Button, Table, Space, message, Input, DatePicker } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import AddGroupModal from './AddGroupModal';
import EditGroupModal from './EditGroupModal';

const { RangePicker } = DatePicker;

// API URL
const apiUrl = 'http://10.232.100.50:8080/api/group-summary-requisitions';

const fetchGroups = async () => {
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': '*/*' },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching groups:', error);
    message.error('Failed to load groups');
    return [];
  }
};

const deleteGroup = async (id) => {
  try {
    const response = await fetch(`${apiUrl}/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': '*/*' },
    });
    if (response.ok) {
      return true;
    } else {
      throw new Error('Failed to delete group');
    }
  } catch (error) {
    console.error('Error deleting group:', error);
    message.error('Failed to delete group');
    return false;
  }
};

const GroupRequestPage = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // Search fields
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [dateRange, setDateRange] = useState([]);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const groups = await fetchGroups();
      setData(groups);
      setFilteredData(groups);
    };
    loadData();
  }, []);

  const reloadTableData = async () => {
    const groups = await fetchGroups();
    setData(groups);
    setFilteredData(groups);
  };

  const handleAddOk = () => {
    setIsAddModalVisible(false);
    reloadTableData();
  };

  const handleEditOk = () => {
    setIsEditModalVisible(false);
    reloadTableData();
  };

  const handleDelete = async (id) => {
    const success = await deleteGroup(id);
    if (success) {
      const newData = data.filter(item => item.id !== id);
      setData(newData);
      setFilteredData(newData);
      message.success('Group deleted successfully');
    }
  };

  const handleSearch = () => {
    const [fromDate, toDate] = dateRange;
    const filtered = data.filter(item => {
      const matchName = item.name?.toLowerCase().includes(nameFilter.toLowerCase());
      const matchStatus = item.status?.toLowerCase().includes(statusFilter.toLowerCase());
      const matchCreatedBy = item.createdBy?.toLowerCase().includes(createdByFilter.toLowerCase());

      let matchDate = true;
      if (fromDate && toDate && item.createdDate) {
        const itemDate = dayjs(item.createdDate);
        matchDate = itemDate.isAfter(fromDate.startOf('day').subtract(1, 'second')) &&
                    itemDate.isBefore(toDate.endOf('day').add(1, 'second'));
      }

      return matchName && matchStatus && matchCreatedBy && matchDate;
    });

    setFilteredData(filtered);
  };

  const handleReset = () => {
    setNameFilter('');
    setStatusFilter('');
    setCreatedByFilter('');
    setDateRange([]);
    setFilteredData(data);
  };

  const columns = [
    {
      title: 'No.',
      key: 'index',
      render: (text, record, index) => index + 1,
      width: '60px',
      align: 'center',
      className: 'table-column-header',
    },
    {
      title: 'Request Group Name',
      dataIndex: 'name',
      key: 'name',
      className: 'table-column-header',
    },
    {
      title: 'Request Status',
      dataIndex: 'status',
      key: 'status',
      className: 'table-column-header',
    },
    {
      title: 'Created By (User)',
      dataIndex: 'createdBy',
      key: 'createdBy',
      className: 'table-column-header',
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD') : '',
      className: 'table-column-header',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space style={{ justifyContent: 'center', width: '100%' }}>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => { setCurrentItem(record); setIsEditModalVisible(true); }} 
            style={{ 
              backgroundColor: '#4CAF50', 
              borderColor: '#4CAF50', 
              color: 'white', 
              marginRight: 8,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          />
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)} 
            danger
            style={{
              backgroundColor: '#F44336', 
              borderColor: '#F44336', 
              color: 'white', 
              marginRight: 8,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          />
          <Button 
            onClick={() => navigate(`/dashboard/summary/${record.id}`)}
            style={{ 
              backgroundColor: '#2196F3', 
              borderColor: '#2196F3', 
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            View Summary
          </Button>
        </Space>
      ),
      align: 'center',
    },
  ];

  return (
    <div style={{ padding: '20px 40px' }}>
      {/* Advanced Search */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Input
          placeholder="Request Group Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          style={{ width: 200 }}
        />
        <Input
          placeholder="Request Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 200 }}
        />
        <Input
          placeholder="Created By (User)"
          value={createdByFilter}
          onChange={(e) => setCreatedByFilter(e.target.value)}
          style={{ width: 200 }}
        />
        <RangePicker
          style={{ width: 300 }}
          value={dateRange}
          onChange={(dates) => setDateRange(dates || [])}
        />
        <Button type="primary" onClick={handleSearch}>Search</Button>
        <Button onClick={handleReset}>Reset</Button>
      </div>

      {/* Add Button */}
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={() => setIsAddModalVisible(true)}
        style={{
          marginBottom: 20,
          backgroundColor: '#007BFF', 
          borderColor: '#007BFF', 
          color: 'white',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        Add New Request Group
      </Button>

      {/* Table */}
      <Table 
        columns={columns} 
        dataSource={filteredData} 
        rowKey="id" 
        pagination={{ pageSize: 10 }} 
        bordered
        size="middle"
        style={{ marginBottom: 20 }}
      />

      {/* Modals */}
      <AddGroupModal 
        visible={isAddModalVisible} 
        onCancel={() => setIsAddModalVisible(false)} 
        onOk={handleAddOk} 
      />
      <EditGroupModal 
        visible={isEditModalVisible} 
        currentItem={currentItem} 
        onCancel={() => setIsEditModalVisible(false)} 
        onOk={handleEditOk} 
      />
    </div>
  );
};

export default GroupRequestPage;
