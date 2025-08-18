import React, { useState, useEffect } from 'react';
import { Button, Table, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import AddGroupModal from './AddGroupModal';
import EditGroupModal from './EditGroupModal';
import GroupSearchBar from './GroupSearchBar';

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
              background: 'linear-gradient(135deg, #81c784, #388e3c)',
              borderColor: '#388e3c', 
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
            }}
          />
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)} 
            danger
            style={{
              background: 'linear-gradient(135deg, #e57373, #c62828)',
              borderColor: '#c62828',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
            }}
          />
          <Button 
            onClick={() => navigate(`/dashboard/summary/${record.id}`)}
            style={{ 
              background: 'linear-gradient(135deg, #64b5f6, #1976d2)', 
              borderColor: '#1976d2', 
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '6px',
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
    <div style={{ padding: '30px 50px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 700, marginBottom: '20px', color: '#1e3a8a' }}>
        Request Group Management
      </h2>

      <GroupSearchBar
        nameFilter={nameFilter}
        statusFilter={statusFilter}
        createdByFilter={createdByFilter}
        dateRange={dateRange}
        setNameFilter={setNameFilter}
        setStatusFilter={setStatusFilter}
        setCreatedByFilter={setCreatedByFilter}
        setDateRange={setDateRange}
        handleSearch={handleSearch}
        handleReset={handleReset}
      />

      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsAddModalVisible(true)}
          style={{
            background: 'linear-gradient(135deg, #4fc3f7, #0288d1)',
            borderColor: '#0288d1',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            borderRadius: '10px',
            padding: '8px 20px',
          }}
        >
          Add New Request Group
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredData} 
        rowKey="id" 
        pagination={{ pageSize: 10 }} 
        bordered
        size="middle"
        style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden' }}
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
