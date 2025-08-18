import React from 'react';
import { Input, Button, DatePicker } from 'antd';

const { RangePicker } = DatePicker;

const GroupSearchBar = ({
  nameFilter,
  statusFilter,
  createdByFilter,
  dateRange,
  setNameFilter,
  setStatusFilter,
  setCreatedByFilter,
  setDateRange,
  handleSearch,
  handleReset
}) => {
  return (
    <div style={{ marginBottom: 16, overflowX: 'auto' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap', // ❌ Không cho xuống dòng
          gap: 10,
          minWidth: 1000, // ✅ Đảm bảo nội dung không bị ép
        }}
      >
        <Input
          placeholder="Request Group Name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          style={{ flex: '1 1 200px', minWidth: 150 }}
        />
        <Input
          placeholder="Request Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ flex: '1 1 200px', minWidth: 150 }}
        />
        <Input
          placeholder="Created By (User)"
          value={createdByFilter}
          onChange={(e) => setCreatedByFilter(e.target.value)}
          style={{ flex: '1 1 200px', minWidth: 150 }}
        />
        <RangePicker
          style={{ flex: '1 1 300px', minWidth: 250 }}
          value={dateRange}
          onChange={(dates) => setDateRange(dates || [])}
        />
        <Button
          type="primary"
          onClick={handleSearch}
          style={{ whiteSpace: 'nowrap' }}
        >
          Search
        </Button>
        <Button
          onClick={handleReset}
          style={{ whiteSpace: 'nowrap' }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default GroupSearchBar;
