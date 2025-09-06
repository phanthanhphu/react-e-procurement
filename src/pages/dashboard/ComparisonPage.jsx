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
import { API_BASE_URL } from '../../config';

const headers = [
  { label: 'No', key: 'no' },
  { label: 'Item Description (EN)', key: 'englishName' },
  { label: 'Item Description (VN)', key: 'vietnameseName' },
  { label: 'Old SAP Code', key: 'oldSapCode' },
  { label: 'SAP Code in New SAP', key: 'newSapCode' },
  { label: 'Suppliers', key: 'suppliers' },
  { label: 'Department Requests', key: 'departmentRequests' },
  { label: 'Selected Price (VND)', key: 'price' },
  { label: 'Total Amount (VND)', key: 'amtVnd' },
  { label: 'Highest Price (VND)', key: 'highestPrice' },
  { label: 'Amount Difference (VND)', key: 'amtDifference' },
  { label: 'Difference (%)', key: 'percentage' },
  { label: 'Remark', key: 'remark' },
];

function DeptRequestTable({ departmentRequests }) {
  const [showAllDepts, setShowAllDepts] = useState(false);
  const displayDepts = showAllDepts ? departmentRequests : departmentRequests?.slice(0, 3);

  if (!departmentRequests || departmentRequests.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#666' }}>No Data</Typography>;
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
                fontSize: '0.75rem',
                py: 0.6,
                px: 1,
                color: '#1976d2',
              }}
            >
              Dept
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                py: 0.6,
                px: 1,
                color: '#1976d2',
              }}
            >
              Qty
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
                fontSize: '0.75rem',
              }}
            >
              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1, color: '#0d47a1' }}>
                {dept.departmentName}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.5, px: 1, fontWeight: 600 }}>
                {dept.quantity}
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
            mt: 1,
            fontSize: '0.7rem',
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
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#666' }}>No Suppliers</Typography>;
  }

  return (
    <div>
      <Table
        size="small"
        sx={{
          minWidth: 200,
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
                fontSize: '0.75rem',
                py: 0.6,
                px: 1,
                color: '#1976d2',
                width: '60%', // Increase the width of Supplier Name column
              }}
            >
              Supplier Name
            </TableCell>
            <TableCell
              align="right"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                py: 0.6,
                px: 1,
                color: '#1976d2',
                width: '20%', // Adjust width for Price column
              }}
            >
              Price (VND)
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                py: 0.6,
                px: 1,
                color: '#1976d2',
                width: '20%', // Adjust width for Selected column
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
                fontSize: '0.75rem',
              }}
            >
              <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1, color: '#0d47a1', width: '60%' }}>
                {supplier.supplierName}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.5, px: 1, width: '20%' }}>
                {supplier.price ? supplier.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.5, px: 1, fontWeight: 600, width: '20%' }}>
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
            mt: 1,
            fontSize: '0.7rem',
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const fetchData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/summary-requisitions/search/comparison?groupId=${groupId}&page=${page}&size=${rowsPerPage}`,
        {
          headers: { Accept: '*/*' },
        }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setData(result.content || []);
      setTotalElements(result.totalElements || 0);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch data from API. Showing previously loaded data.');
    } finally {
      setLoading(false);
    }
  }, [groupId, page, rowsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (oldSapCode) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/summary-requisitions/${oldSapCode}`, {
        method: 'DELETE',
        headers: { Accept: '*/*' },
      });
      if (!response.ok) throw new Error(`Delete failed with status ${response.status}`);
      await fetchData();
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

  return (
    <Box
      sx={{
        p: 3,
        fontSize: '0.85rem',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        backgroundColor: '#f5f8fa',
        minHeight: '100vh',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        mb={3}
        sx={{ userSelect: 'none' }}
      >
        <ExportComparisonExcelButton data={data} />
      </Stack>

      {loading && (
        <Typography align="center" sx={{ color: '#90a4ae', fontSize: '0.9rem', mt: 4 }}>
          Loading data...
        </Typography>
      )}
      {error && (
        <Typography
          align="center"
          sx={{ color: theme.palette.error.main, fontWeight: 700, fontSize: '0.9rem', mt: 4 }}
        >
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <>
          <TableContainer
            component={Paper}
            elevation={4}
            sx={{
              borderRadius: 2,
              overflowX: 'auto',
              maxHeight: 640,
              boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)',
            }}
          >
            <Table stickyHeader size="medium" sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
                  {headers.map(({ label, key }) => (
                    <TableCell
                      key={key}
                      align={
                        ['No', 'Selected Price (VND)', 'Total Amount (VND)', 'Highest Price (VND)', 'Amount Difference (VND)', 'Difference (%)'].includes(label)
                          ? 'center'
                          : 'left'
                      }
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        color: '#ffffff',
                        py: 1,
                        px: 1,
                        whiteSpace: 'nowrap',
                        borderRight: '1px solid rgba(255,255,255,0.15)',
                        '&:last-child': { borderRight: 'none' },
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        backgroundColor: '#027aff', // Fallback color
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
                {data.length > 0 ? (
                  data.map((item, idx) => {
                    const rowBackgroundColor = idx % 2 === 0 ? '#fff' : '#f7f9fc';
                    return (
                      <TableRow
                        key={item.oldSapCode + idx}
                        sx={{
                          backgroundColor: rowBackgroundColor,
                          '&:hover': {
                            backgroundColor: '#e1f0ff',
                            transition: 'background-color 0.3s ease',
                          },
                          fontSize: '0.8rem',
                          cursor: 'default',
                          userSelect: 'none',
                        }}
                      >
                        <TableCell
                          align="center"
                          sx={{
                            px: 2,
                            py: 1.2,
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backgroundColor: rowBackgroundColor, // Match row background
                          }}
                        >
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2, fontWeight: 600 }}>
                          {item.englishName || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2 }}>
                          {item.vietnameseName || 'N/A'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          {item.oldSapCode || 'N/A'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          {item.newSapCode || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ px: 2, py: 1.2 }}>
                          <SupplierTable suppliers={item.suppliers} />
                        </TableCell>
                        <TableCell sx={{ px: 2, py: 1.2 }}>
                          <DeptRequestTable departmentRequests={item.departmentRequests} />
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          {item.price ? item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2, fontWeight: 700, color: theme.palette.primary.dark }}>
                          {item.amtVnd ? item.amtVnd.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          {item.highestPrice ? item.highestPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          {item.amtDifference ? item.amtDifference.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          {item.percentage ? item.percentage.toFixed(2) + '%' : '0%'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'pre-wrap', px: 2, py: 1.2 }}>
                          {item.remark || 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={headers.length} align="center" sx={{ py: 6, color: '#90a4ae' }}>
                      <Stack direction="column" alignItems="center" spacing={2}>
                        <InboxIcon fontSize="large" />
                        <Typography>No data available.</Typography>
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
              mt: 3,
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: '0.85rem',
                color: theme.palette.text.secondary,
              },
              '.MuiTablePagination-select': { fontSize: '0.85rem' },
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
        onSave={fetchData}
      />
    </Box>
  );
}