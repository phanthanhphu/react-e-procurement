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

const fetchGroups = async (
  page = 0,
  limit = 10,
  name = '',
  status = '',
  createdBy = '',
  type = '',
  startDate = null,
  endDate = null
) => {
  try {
    const params = new URLSearchParams({
      page,
      size: limit,
      name: name || '',
      status: status || '',
      createdBy: createdBy || '',
      type: type || '',
    });
    if (startDate && startDate.isValid()) params.append('startDate', startDate.format('YYYY-MM-DDTHH:mm:ss'));
    if (endDate && endDate.isValid()) params.append('endDate', endDate.format('YYYY-MM-DDTHH:mm:ss'));

    const response = await fetch(`${apiUrl}/filter?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: '*/*' },
    });
    if (!response.ok) throw new Error('Failed to fetch groups');
    const data = await response.json();
    return {
      content: data.content || [],
      totalPages: data.totalPages || 1,
    };
  } catch (error) {
    console.error('Error fetching groups:', error);
    message.error('Failed to load groups');
    return { content: [], totalPages: 1 };
  }
};

const deleteGroup = async (id) => {
  try {
    const response = await fetch(`${apiUrl}/${id}`, {
      method: 'DELETE',
      headers: { Accept: '*/*' },
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
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const [startDate, endDate] = dateRange || [];
      const { content, totalPages } = await fetchGroups(
        page,
        limit,
        nameFilter,
        statusFilter,
        createdByFilter,
        typeFilter,
        startDate,
        endDate
      );
      setData(content);
      setTotalPages(totalPages);
    };
    loadData();
  }, [page, limit, nameFilter, statusFilter, createdByFilter, typeFilter, dateRange]);

  const reloadTableData = async () => {
    const [startDate, endDate] = dateRange || [];
    const { content, totalPages } = await fetchGroups(
      page,
      limit,
      nameFilter,
      statusFilter,
      createdByFilter,
      typeFilter,
      startDate,
      endDate
    );
    setData(content);
    setTotalPages(totalPages);
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
      setData(data.filter((item) => item.id !== id));
      message.success('Group deleted successfully');
    }
  };

  const handleSearch = () => {
    setPage(0);
    reloadTableData();
  };

  const handleReset = () => {
    setPage(0);
    setNameFilter('');
    setStatusFilter('');
    setCreatedByFilter('');
    setTypeFilter('');
    setDateRange([]);
    reloadTableData();
  };

  // Hàm chuyển đổi mảng ngày thành chuỗi ISO
  const formatCreatedDate = (dateArray) => {
    if (!Array.isArray(dateArray) || dateArray.length < 6) return null;
    const [year, month, day, hour, minute, second] = dateArray;
    return dayjs(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toISOString();
  };

  return (
    <div style={{ padding: '30px 50px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <h2
        style={{
          textAlign: 'left',
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '12px',
          color: '#1976d2',
          lineHeight: 1.5,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Supplier Group Management
      </h2>
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

      <GroupSearchBar
        nameFilter={nameFilter}
        statusFilter={statusFilter}
        createdByFilter={createdByFilter}
        typeFilter={typeFilter}
        setNameFilter={setNameFilter}
        setStatusFilter={setStatusFilter}
        setCreatedByFilter={setCreatedByFilter}
        setTypeFilter={setTypeFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        setPage={setPage}
        handleSearch={handleSearch}
        handleReset={handleReset}
      />

      <Row gutter={[12, 12]} wrap>
        {Array.isArray(data) && data.length > 0 ? (
          data.map((group) => {
            const createdDateIso = formatCreatedDate(group.createdDate);
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
                ? '#e57373'
                : group.type === 'Requisition_monthly'
                ? '#64b5f6'
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
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{group.name}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setCurrentItem(group);
                          setIsEditModalVisible(true);
                        }}
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
                  <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center' }}>
                    <p
                      style={{
                        fontSize: '12px',
                        margin: 0,
                        fontWeight: 600,
                        marginRight: '8px',
                      }}
                    >
                      <strong>Type:</strong>
                    </p>
                    <span style={{ ...typeStyle, backgroundColor: bgColor }}>
                      {group.type === 'Requisition_urgent'
                        ? 'Requisition Urgent'
                        : group.type === 'Requisition_monthly'
                        ? 'Requisition Monthly'
                        : 'Unknown'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', textAlign: 'left', marginTop: '8px', flexGrow: 1 }}>
                    <p style={{ margin: '2px 0' }}>
                      <strong>Status:</strong> {group.status}
                    </p>
                    <p style={{ margin: '2px 0' }}>
                      <strong>Created By:</strong> {group.createdBy}
                    </p>
                    <p style={{ margin: '2px 0' }}>
                      <strong>Date:</strong>{' '}
                      {createdDateIso ? dayjs(createdDateIso).format('YYYY-MM-DD') : 'N/A'}
                    </p>
                  </div>
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
          })
        ) : (
          <div>No data available</div>
        )}
      </Row>

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

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Space>
          <Button onClick={() => setPage(page > 0 ? page - 1 : 0)} disabled={page === 0}>
            Previous
          </Button>
          <Button onClick={() => setPage(page < totalPages - 1 ? page + 1 : page)} disabled={page >= totalPages - 1}>
            Next
          </Button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
        </Space>
      </div>
    </div>
  );
};

export default GroupRequestPage;
