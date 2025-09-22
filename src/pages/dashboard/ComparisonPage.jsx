import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  TablePagination,
  useTheme,
  Tooltip,
  Button,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import ExportComparisonExcelButton from './ExportComparisonExcelButton.jsx';
import EditDialog from './EditDialog.jsx';
import AddDialog from './AddDialog.jsx';
import ComparisonSearch from './ComparisonSearch.jsx';
import { API_BASE_URL } from '../../config.js';

const headers = [
  { label: 'No', key: 'no' },
  { label: 'Group Type 1', key: 'type1Name' },
  { label: 'Group Type 2', key: 'type2Name' },
  { label: 'Item Description (VN)', key: 'vietnameseName' },
  { label: 'Item Description (EN)', key: 'englishName' },
  { label: 'Old SAP Code', key: 'oldSapCode' },
  { label: 'SAP Code in New SAP', key: 'newSapCode' },
  { label: 'Order Unit', key: 'unit' },
  { label: 'Suppliers', key: 'suppliers' },
  { label: 'Department Requests', key: 'departmentRequests' },
  { label: 'Selected Price (VND)', key: 'price' },
  { label: 'Total Amount (VND)', key: 'amtVnd' },
  { label: 'Highest Price (VND)', key: 'highestPrice' },
  { label: 'Amount Difference (VND)', key: 'amtDifference' },
  { label: 'Difference (%)', key: 'percentage' },
  { label: 'Remark', key: 'remarkComparison' },
];

function DeptRequestTable({ departmentRequests }) {
  const [showAllDepts, setShowAllDepts] = useState(false);
  const displayDepts = showAllDepts ? departmentRequests : departmentRequests?.slice(0, 3);

  if (!departmentRequests || departmentRequests.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.55rem', color: '#666' }}>No Data</Typography>;
  }

  return (
    <div>
      <Table
        size="small"
        sx={{
          minWidth: 160,
          border: '1px solid #ddd',
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
            <TableCell
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '40%',
              }}
            >
              Dept
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '30%',
              }}
            >
              Request
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '30%',
              }}
            >
              Buy
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayDepts.map((dept, idx) => (
            <TableRow
              key={dept.departmentId + idx}
              sx={{
                '&:nth-of-type(even)': { backgroundColor: '#f9fbff' },
                '&:hover': { backgroundColor: '#bbdefb', transition: 'background-color 0.3s' },
                fontSize: '0.55rem',
              }}
            >
              <TableCell sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, color: '#0d47a1', width: '40%' }}>
                {dept.departmentName}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, fontWeight: 600, width: '30%' }}>
                {dept.qty || 0}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, fontWeight: 600, width: '30%' }}>
                {dept.buy || 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {departmentRequests.length > 3 && (
        <Button
          size="small"
          onClick={() => setShowAllDepts(!showAllDepts)}
          sx={{
            mt: 0.5,
            fontSize: '0.65rem',
            color: '#1976d2',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#e3f2fd' },
          }}
        >
          {showAllDepts ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </div>
  );
}

function SupplierTable({ suppliers }) {
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const displaySuppliers = showAllSuppliers ? suppliers : suppliers?.slice(0, 3);

  if (!suppliers || suppliers.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.55rem', color: '#666' }}>No Suppliers</Typography>;
  }

  return (
    <div>
      <Table
        size="small"
        sx={{
          minWidth: 180,
          border: '1px solid #ddd',
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
            <TableCell
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '50%',
              }}
            >
              Supplier Name
            </TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '20%',
              }}
            >
              Price (VND)
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '15%',
              }}
            >
              Unit
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '0.55rem',
                py: 0.2,
                px: 0.3,
                color: '#1976d2',
                width: '15%',
              }}
            >
              Selected
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displaySuppliers.map((supplier, idx) => (
            <TableRow
              key={idx}
              sx={{
                backgroundColor: supplier.isSelected === 1 ? '#d0f0c0' : idx % 2 === 0 ? '#fff' : '#f9fbff',
                '&:hover': { backgroundColor: supplier.isSelected === 1 ? '#b8e6a3' : '#bbdefb', transition: 'background-color 0.3s' },
                fontSize: '0.55rem',
              }}
            >
              <TableCell sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, color: '#0d47a1', width: '50%' }}>
                {supplier.supplierName}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, width: '20%' }}>
                {supplier.price ? supplier.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, width: '15%' }}>
                {supplier.unit || ''}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, fontWeight: 600, width: '15%' }}>
                {supplier.isSelected === 1 ? 'Yes' : 'No'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {suppliers.length > 3 && (
        <Button
          size="small"
          onClick={() => setShowAllSuppliers(!showAllSuppliers)}
          sx={{
            mt: 0.5,
            fontSize: '0.65rem',
            color: '#1976d2',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#e3f2fd' },
          }}
        >
          {showAllSuppliers ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </div>
  );
}

export default function ComparisonPage() {
  const theme = useTheme();
  const { groupId } = useParams();

  const [data, setData] = useState([]);
  const [unfilteredTotals, setUnfilteredTotals] = useState({
    totalAmtVnd: 0,
    totalAmtDifference: 0,
    totalDifferencePercentage: 0,
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [searchValues, setSearchValues] = useState({
    productType1Name: '',
    productType2Name: '',
    englishName: '',
    vietnameseName: '',
    oldSapCode: '',
    newSapCode: '',
    unit: '',
    departmentName: '',
  });

  const fetchUnfilteredTotals = useCallback(async () => {
    if (!groupId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/summary-requisitions/search/comparison?groupId=${groupId}`,
        {
          headers: { Accept: '*/*' },
        }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setUnfilteredTotals({
        totalAmtVnd: result.totalAmtVnd || 0,
        totalAmtDifference: result.totalAmtDifference || 0,
        totalDifferencePercentage: result.totalDifferencePercentage || 0,
      });
    } catch (err) {
      console.error('Fetch unfiltered totals error:', err);
      setError('Failed to fetch unfiltered totals. Please try again.');
    }
  }, [groupId]);

  const fetchData = useCallback(async (filters = {}) => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        groupId,
        ...(filters.productType1Name && { productType1Name: filters.productType1Name }),
        ...(filters.productType2Name && { productType2Name: filters.productType2Name }),
        ...(filters.englishName && { englishName: filters.englishName }),
        ...(filters.vietnameseName && { vietnameseName: filters.vietnameseName }),
        ...(filters.oldSapCode && { oldSapCode: filters.oldSapCode }),
        ...(filters.newSapCode && { newSapCode: filters.newSapCode }),
        ...(filters.unit && { unit: filters.unit }),
        ...(filters.departmentName && { departmentName: filters.departmentName }),
        filter: true,
      }).toString();

      const response = await fetch(
        `${API_BASE_URL}/api/summary-requisitions/search/comparison?${queryParams}`,
        {
          headers: { Accept: '*/*' },
        }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setData(result.requisitions || []);
      setTotalElements(result.requisitions ? result.requisitions.length : 0);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch data from API. Showing previously loaded data.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchUnfilteredTotals();
    fetchData();
  }, [fetchUnfilteredTotals, fetchData]);

  const handleSearchChange = (newSearchValues) => {
    setSearchValues(newSearchValues);
  };

  const handleSearch = (filters) => {
    setPage(0);
    fetchData(filters);
  };

  const handleReset = () => {
    setSearchValues({
      productType1Name: '',
      productType2Name: '',
      englishName: '',
      vietnameseName: '',
      oldSapCode: '',
      newSapCode: '',
      unit: '',
      departmentName: '',
    });
    setPage(0);
    fetchData();
  };

  const handleDelete = async (oldSapCode) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/summary-requisitions/${oldSapCode}`, {
        method: 'DELETE',
        headers: { Accept: '*/*' },
      });
      if (!response.ok) throw new Error(`Delete failed with status ${response.status}`);
      await fetchUnfilteredTotals();
      await fetchData(searchValues);
      const maxPage = Math.max(0, Math.ceil((totalElements - 1) / rowsPerPage) - 1);
      if (page > maxPage) setPage(maxPage);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed. Please try again.');
    }
  };

  const handleOpenEditDialog = (item) => {
    setSelectedItem(item);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedItem(null);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = data.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const mappedDataForExport = paginatedData.map(item => ({
    englishName: item.englishName || '',
    vietnameseName: item.vietnameseName || '',
    oldSapCode: item.oldSapCode || '',
    newSapCode: item.newSapCode || '',
    suppliers: item.suppliers || [],
    remarkComparison: item.remarkComparison || '',
    unit: item.unit || '',
  }));

  return (
    <Box
      sx={{
        p: 1,
        fontSize: '0.65rem',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        backgroundColor: '#f5f8fa',
        minHeight: '100vh',
      }}
    >
      <ComparisonSearch
        searchValues={searchValues}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        mb={1}
        sx={{ userSelect: 'none' }}
      >
        <ExportComparisonExcelButton
          data={mappedDataForExport}
          disabled={loading}
          groupId={groupId}
        />
      </Stack>

      {loading && (
        <Typography align="center" sx={{ color: '#90a4ae', fontSize: '0.7rem', mt: 1.5 }}>
          Loading data...
        </Typography>
      )}
      {error && (
        <Typography
          align="center"
          sx={{ color: theme.palette.error.main, fontWeight: 700, fontSize: '0.7rem', mt: 1.5 }}
        >
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <>
          <Box
            sx={{
              mb: 1,
              p: 0.5,
              backgroundColor: '#e3f2fd',
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#1976d2',
              }}
            >
              Total Amount (VND): {unfilteredTotals.totalAmtVnd ? unfilteredTotals.totalAmtVnd.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: unfilteredTotals.totalAmtDifference < 0 ? theme.palette.error.main : '#1976d2',
              }}
            >
              Total Difference (VND): {unfilteredTotals.totalAmtDifference ? unfilteredTotals.totalAmtDifference.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: unfilteredTotals.totalDifferencePercentage < 0 ? theme.palette.error.main : '#1976d2',
              }}
            >
              Total Difference (%): {unfilteredTotals.totalDifferencePercentage ? unfilteredTotals.totalDifferencePercentage.toFixed(2) + '%' : '0%'}
            </Typography>
          </Box>

          <TableContainer
            component={Paper}
            elevation={4}
            sx={{
              overflowX: 'auto',
              maxHeight: 450,
              boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)',
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 1400 }}>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
                  {headers.map(({ label, key }) => (
                    <TableCell
                      key={key}
                      align={
                        ['No', 'Old SAP Code', 'SAP Code in New SAP', 'Order Unit', 'Selected Price (VND)', 'Total Amount (VND)', 'Highest Price (VND)', 'Amount Difference (VND)', 'Difference (%)'].includes(label)
                          ? 'center'
                          : 'left'
                      }
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.55rem',
                        color: '#ffffff',
                        py: 0.2,
                        px: 0.4,
                        whiteSpace: 'nowrap',
                        borderRight: '1px solid rgba(255,255,255,0.15)',
                        '&:last-child': { borderRight: 'none' },
                        position: label === 'No' ? 'sticky' : 'static',
                        left: label === 'No' ? 0 : undefined,
                        zIndex: label === 'No' ? 2 : 1,
                        backgroundColor: '#027aff',
                      }}
                    >
                      <Tooltip title={label} arrow>
                        <span>{label}</span>
                      </Tooltip>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, idx) => {
                    const rowBackgroundColor = idx % 2 === 0 ? '#fff' : '#f7f9fc';
                    return (
                      <TableRow
                        key={item.oldSapCode + idx}
                        sx={{
                          backgroundColor: rowBackgroundColor,
                          '&:hover': {
                            backgroundColor: '#e1f0ff',
                            transition: 'background-color 0.3s ease',
                            '& .sticky-no-column': {
                              backgroundColor: '#e1f0ff',
                            },
                          },
                          fontSize: '0.55rem',
                          cursor: 'default',
                          userSelect: 'none',
                        }}
                      >
                        <TableCell
                          align="center"
                          className="sticky-no-column"
                          sx={{
                            px: 0.4,
                            py: 0.2,
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backgroundColor: rowBackgroundColor,
                            fontSize: '0.55rem',
                            borderRight: '1px solid rgba(224, 224, 224, 1)',
                          }}
                        >
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.type1Name || ''}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.type2Name || ''}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontWeight: 600, fontSize: '0.55rem' }}>
                          {item.vietnameseName || ''}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.englishName || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.oldSapCode || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.newSapCode || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.unit || ''}
                        </TableCell>
                        <TableCell sx={{ px: 0.4, py: 0.2 }}>
                          <SupplierTable suppliers={item.suppliers} />
                        </TableCell>
                        <TableCell sx={{ px: 0.4, py: 0.2 }}>
                          <DeptRequestTable departmentRequests={item.departmentRequests} />
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.price ? item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontWeight: 700, color: theme.palette.primary.dark, fontSize: '0.55rem' }}>
                          {item.amtVnd ? item.amtVnd.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.highestPrice ? item.highestPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.amtDifference ? item.amtDifference.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.percentage ? item.percentage.toFixed(2) + '%' : '0%'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {item.remarkComparison || ''}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={headers.length} align="center" sx={{ py: 2, color: '#90a4ae' }}>
                      <Stack direction="column" alignItems="center" spacing={0.5}>
                        <InboxIcon fontSize="small" />
                        <Typography sx={{ fontSize: '0.7rem' }}>No data available.</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={totalElements}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page:"
            sx={{
              mt: 1,
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: '0.65rem',
                color: theme.palette.text.secondary,
              },
              '.MuiTablePagination-select': { fontSize: '0.65rem' },
              '.MuiTablePagination-actions > button': {
                color: theme.palette.primary.main,
              },
            }}
          />
        </>
      )}

      <EditDialog
        open={openEditDialog}
        item={selectedItem}
        onClose={handleCloseEditDialog}
        onSave={() => {
          fetchUnfilteredTotals();
          fetchData(searchValues);
        }}
      />
    </Box>
  );
}