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

  return (
    <div style={{ padding: '30px 50px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Title section */}
      <h2 style={{
        textAlign: 'left',  // Canh trái tiêu đề
        fontSize: '1rem',  // Adjusted to 1rem (16px)
        fontWeight: 600,
        marginBottom: '12px',  // Margin-bottom as per the CSS
        color: '#1976d2',  // The color #1976d2
        lineHeight: 1.5,  // Line height as specified
        fontFamily: 'Inter, sans-serif',  // Assuming 'Inter' is available or added as a web font
      }}>
        Supplier Group Management
      </h2>

      {/* Add Button: Now placed above the search bar */}
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
            '&:hover': {
              background: 'linear-gradient(to right, #3aa4f8, #016ae3)',
              boxShadow: '0 6px 16px rgba(76, 184, 255, 0.4)',
            }
          }}
        >
          Add New Request Group
        </Button>
      </div>


      {/* Search bar section */}
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
        {filteredData.map((group) => (
          <Col flex="10%" key={group.id}>
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
                justifyContent: 'space-between'
              }}
            >
              {/* Header: Title + Edit/Delete */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{group.name}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
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

              {/* Content */}
              <div style={{ fontSize: '12px', textAlign: 'left', marginTop: '8px', flexGrow: 1 }}>
                <p style={{ margin: '2px 0' }}><strong>Status:</strong> {group.status}</p>
                <p style={{ margin: '2px 0' }}><strong>Created By:</strong> {group.createdBy}</p>
                <p style={{ margin: '2px 0' }}><strong>Date:</strong> {dayjs(group.createdDate).format('YYYY-MM-DD')}</p>
              </div>

              {/* Footer: View Summary */}
              <div style={{ marginTop: '8px' }}>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/dashboard/summary/${group.id}`)}
                  style={{
                    width: '100%',
                    backgroundColor: '#64b5f6',
                    borderColor: '#1976d2',
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                  }}
                >
                  View Summary
                </Button>
              </div>
            </Card>
          </Col>
        ))}
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
    </div>
  );
};

export default GroupRequestPage;
