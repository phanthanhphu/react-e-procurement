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
  IconButton,
  Button,
  TablePagination,
  useTheme,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import InboxIcon from '@mui/icons-material/Inbox';
import ExportExcelButton from './ExportExcelButton';
import EditDialog from './EditDialog';
import AddDialog from './AddDialog';
import { API_BASE_URL } from '../../config';

const headers = [
  { label: 'No', key: 'no' },
  { label: 'Item Description (EN)', key: 'englishName' },
  { label: 'Item Description (VN)', key: 'vietnameseName' },
  { label: 'Old SAP Code', key: 'oldSapCode' }, 
  { label: 'SAP Code in New SAP', key: 'newSapCode' },
  { label: 'Order Unit', key: 'unit' }, 
  { label: 'Dept qty', key: 'departmentRequestQty' },
  { label: 'Total qty', key: 'totalRequestQty' },
  { label: 'Supplier', key: 'supplierName' },
  { label: 'Sup. price', key: 'supplierPrice' },
  { label: 'Total price', key: 'totalPrice' },
  { label: 'Stock', key: 'stock' },
  { label: 'Purchasing Suggest', key: 'purchasingSuggest' },
  { label: 'Reason', key: 'reason' },
  { label: 'Remark', key: 'remark' },
  { label: 'Actions', key: 'actions' },
];

function DeptRequestTable({ deptRequestQty }) {
  if (!deptRequestQty || Object.keys(deptRequestQty).length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#666' }}>No Data</Typography>;
  }

  return (
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
        {Object.entries(deptRequestQty).map(([dept, qty], idx) => (
          <TableRow
            key={idx}
            sx={{
              '&:nth-of-type(even)': { backgroundColor: '#f9fbff' },
              '&:hover': { backgroundColor: '#bbdefb', transition: 'background-color 0.3s' },
              fontSize: '0.75rem',
            }}
          >
            <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1, color: '#0d47a1' }}>{dept}</TableCell>
            <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.5, px: 1, fontWeight: 600 }}>
              {qty}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function SummaryPage() {
  const theme = useTheme();
  const { groupId } = useParams();

  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);

  const fetchData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/summary-requisitions/group/${groupId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch data from API. Showing previously loaded data.');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/summary-requisitions/${id}`, {
        method: 'DELETE',
        headers: { Accept: '*/*' },
      });
      if (!response.ok) throw new Error(`Delete failed with status ${response.status}`);
      await fetchData();
      const maxPage = Math.max(0, Math.ceil((data.length - 1) / rowsPerPage) - 1);
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

  const handleOpenAddDialog = () => setOpenAddDialog(true);
  const handleCloseAddDialog = () => setOpenAddDialog(false);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const displayData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
        justifyContent="space-between"
        mb={3}
        sx={{ userSelect: 'none' }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.dark,
            letterSpacing: '0.05em',
          }}
        >
          Summary List
        </Typography>

        <Stack direction="row" spacing={2}>
          <ExportExcelButton data={data} />
          <Button
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={handleOpenAddDialog}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              py: 0.75,
              fontWeight: 700,
              fontSize: '0.85rem',
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(76, 184, 255, 0.3)',
              '&:hover': {
                background: 'linear-gradient(to right, #3aa4f8, #016ae3)',
                boxShadow: '0 6px 16px rgba(76, 184, 255, 0.4)',
              },
            }}
          >
            Add New
          </Button>
        </Stack>
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
            <Table stickyHeader size="medium" sx={{ minWidth: 1400 }}>
              <TableHead>
                <TableRow>
                  {headers.map(({ label, key }) => (
                    <TableCell
                      key={key}
                      align={
                        ['No', 'Price', 'Unit', 'Action'].includes(label)
                          ? 'center'
                          : label === 'Action'
                          ? 'center'
                          : 'left'
                      }
                      sx={{
                        background: 'linear-gradient(to right, #39a2f7, #0091ff)', // gradient xanh sáng đến đậm
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: '0.85rem',
                        borderBottom: '2px solid rgba(255, 255, 255, 0.7)', // viền dưới trắng mờ
                        px: 2,
                        py: 1.2,
                        whiteSpace: 'nowrap',
                        textTransform: 'capitalize',
                        letterSpacing: '0.05em',
                        userSelect: 'none',
                        position: 'sticky',
                        top: 0,
                        zIndex: 20,
                        boxShadow: 'inset 0 -2px 0 rgba(255,255,255,0.25)', // bóng viền trắng dưới
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
                {displayData.length > 0 ? (
                  displayData.map((item, idx) => {
                    const { requisition, supplierProduct } = item;
                    const totalRequestQty = Object.values(requisition.departmentRequestQty || {}).reduce(
                      (sum, qty) => sum + qty,
                      0
                    );
                    const totalPrice = supplierProduct.price * totalRequestQty;

                    return (
                      <TableRow
                        key={requisition.id}
                        sx={{
                          backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                          '&:hover': {
                            backgroundColor: '#e1f0ff',
                            transition: 'background-color 0.3s ease',
                          },
                          fontSize: '0.8rem',
                          cursor: 'default',
                          userSelect: 'none',
                        }}
                      >
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2, fontWeight: 600 }}>
                          {requisition.englishName}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2 }}>
                          {requisition.vietnameseName}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          {requisition.oldSapCode}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          {requisition.newSapCode}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          {requisition.unit}
                        </TableCell>
                        <TableCell sx={{ px: 2, py: 1.2 }}>
                          <DeptRequestTable deptRequestQty={requisition.departmentRequestQty} />
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2, fontWeight: 600 }}>
                          {totalRequestQty}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2 }}>
                          {supplierProduct.name}
                        </TableCell>
                        <TableCell align="right" sx={{ px: 2, py: 1.2 }}>
                          {supplierProduct.price.toLocaleString('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          })}
                        </TableCell>
                        <TableCell align="right" sx={{ px: 2, py: 1.2, fontWeight: 700, color: theme.palette.primary.dark }}>
                          {totalPrice.toLocaleString('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          })}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          {requisition.stock}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2 }}>
                          {requisition.purchasingSuggest}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2 }}>
                          {requisition.reason}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 2, py: 1.2 }}>
                          {requisition.remark}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 2, py: 1.2 }}>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <IconButton
                              aria-label="edit"
                              color="primary"
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.25)' },
                                borderRadius: 1,
                              }}
                              onClick={() => handleOpenEditDialog(item)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label="delete"
                              color="error"
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.25)' },
                                borderRadius: 1,
                              }}
                              onClick={() => handleDelete(requisition.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
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
            count={data.length}
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

      <AddDialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        onRefresh={fetchData}
        groupId={groupId}
      />
    </Box>
  );
}
