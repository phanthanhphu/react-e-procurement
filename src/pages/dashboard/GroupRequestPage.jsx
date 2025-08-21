import React, { useState, useEffect } from 'react';
import { Button, Space, message, Card, Row, Col } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import AddGroupModal from './AddGroupModal';
import EditGroupModal from './EditGroupModal';
import GroupSearchBar from './GroupSearchBar';
import { API_BASE_URL } from '../../config';

const apiUrl = `${API_BASE_URL}/api/group-summary-requisitions`;

const fetchGroups = async (page = 0, limit = 10) => {
  try {
    const response = await fetch(`${apiUrl}/page?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: { 'Accept': '*/*' },
    });
    const data = await response.json();
    return data.content || []; // Trả về dữ liệu nhóm từ trang hiện tại (content)
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
  const [page, setPage] = useState(0); // Track current page for pagination
  const [limit, setLimit] = useState(10); // Number of items per page
  const navigate = useNavigate();

  // Fetch groups with pagination
  useEffect(() => {
    const loadData = async () => {
      const groups = await fetchGroups(page, limit);
      setData(groups);
      setFilteredData(groups);
    };
    loadData();
  }, [page, limit]);

  const reloadTableData = async () => {
    const groups = await fetchGroups(page, limit);
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

  return (
    <div style={{ padding: '30px 50px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Title section */}
      <h2 style={{
        textAlign: 'left',
        fontSize: '1rem',
        fontWeight: 600,
        marginBottom: '12px',
        color: '#1976d2',
        lineHeight: 1.5,
        fontFamily: 'Inter, sans-serif',
      }}>
        Supplier Group Management
      </h2>

      {/* Add Button */}
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsAddModalVisible(true)}
          style={{
            background: 'linear-gradient(to right, #4cb8ff, #027aff)',
            borderColor: '#0288d1',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            borderRadius: '10px',
            padding: '8px 20px',
            boxShadow: '0 4px 12px rgba(76, 184, 255, 0.3)',
          }}
        >
          Add New Request Group
        </Button>
      </div>

      {/* Search bar */}
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

      {/* Display Groups as Cards */}
<Row gutter={[12, 12]} wrap>
  {filteredData.slice(0, limit).map((group) => {
    // Style cho type
    const typeStyle = {
      padding: '3px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 600,
      color: '#fff',
      display: 'inline-block',
      marginRight: '8px',
      marginBottom: '6px',
    };

    const bgColor =
      group.type === 'Requisition_urgent'
        ? '#e57373' // đỏ nhạt
        : group.type === 'Requisition_monthly'
        ? '#64b5f6' // xanh nhạt
        : '#9e9e9e';

    return (
      <Col span={4} key={group.id}>
        <Card
          bordered={false}
          size="small"
          style={{
            borderRadius: '10px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{group.name}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => { setCurrentItem(group); setIsEditModalVisible(true); }}
                style={{
                  backgroundColor: '#81c784',
                  borderColor: '#388e3c',
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
              <Button
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(group.id)}
                style={{
                  backgroundColor: '#e57373',
                  borderColor: '#c62828',
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
            </div>
          </div>

          <br />

          {/* Type */}
          <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center' }}>
            <p style={{ fontSize: '12px', margin: 0, fontWeight: 600, marginRight: '8px' }}>
              <strong>Type:</strong>
            </p>
            <span style={{ ...typeStyle, backgroundColor: bgColor }}>
              {group.type === 'Requisition_urgent' ? 'Requisition Urgent' : 'Requisition Monthly'}
            </span>
          </div>

          {/* Body */}
          <div style={{ fontSize: '12px', textAlign: 'left', marginTop: '8px', flexGrow: 1 }}>
            <p style={{ margin: '2px 0' }}><strong>Status:</strong> {group.status}</p>
            <p style={{ margin: '2px 0' }}><strong>Created By:</strong> {group.createdBy}</p>
            <p style={{ margin: '2px 0' }}><strong>Date:</strong> {dayjs(group.createdDate).format('YYYY-MM-DD')}</p>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '8px' }}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              if (group.type === 'Requisition_monthly') {
                navigate(`/dashboard/requisition-monthly/${group.id}`);
              } else if (group.type === 'Requisition_urgent') {
                navigate(`/dashboard/summary/${group.id}`);
              } else {
                navigate(`/dashboard/summary/${group.id}`);
              }
            }}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              borderColor: '#0288d1',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.75rem',
              borderRadius: '8px',
              padding: '6px 0',
              boxShadow: '0 4px 12px rgba(76, 184, 255, 0.3)',
            }}
          >
            {group.type === 'Requisition_monthly'
              ? 'View Monthly'
              : group.type === 'Requisition_urgent'
              ? 'View Urgent'
              : 'View Summary'}
          </Button>

          </div>
        </Card>
      </Col>
    );
  })}
</Row>


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

      {/* Pagination Controls */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Space>
          <Button 
            onClick={() => setPage(page > 0 ? page - 1 : 0)} 
            disabled={page === 0}
          >
            Previous
          </Button>
          <Button 
            onClick={() => setPage(page + 1)} 
            disabled={filteredData.length < limit}
          >
            Next
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default GroupRequestPage;
