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
  { label: 'English name', key: 'englishName' },
  { label: 'Vietnamese name', key: 'vietnameseName' },
  { label: 'Old sap', key: 'oldSapCode' },
  { label: 'New sap', key: 'newSapCode' },
  { label: 'Unit', key: 'unit' },
  { label: 'Dept qty', key: 'departmentRequestQty' },
  { label: 'Total qty', key: 'totalRequestQty' },
  { label: 'Supplier', key: 'supplierName' },
  { label: 'Sup. price', key: 'supplierPrice' },
  { label: 'Total price', key: 'totalPrice' },
  { label: 'Stock', key: 'stock' },
  { label: 'Purch. suggest', key: 'purchasingSuggest' },
  { label: 'Reason', key: 'reason' },
  { label: 'Remark', key: 'remark' },
  { label: 'Actions', key: 'actions' },
];

function DeptRequestTable({ deptRequestQty }) {
  if (!deptRequestQty || Object.keys(deptRequestQty).length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>No Data</Typography>;
  }

  return (
    <Table
      size="small"
      sx={{ minWidth: 180, border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}
    >
      <TableHead>
        <TableRow>
          <TableCell
            sx={{
              fontWeight: 'bold',
              fontSize: '0.7rem',
              backgroundColor: '#f0f0f0',
              py: 0.5,
              px: 1,
            }}
          >
            Dept
          </TableCell>
          <TableCell
            align="center"
            sx={{
              fontWeight: 'bold',
              fontSize: '0.7rem',
              backgroundColor: '#f0f0f0',
              py: 0.5,
              px: 1,
            }}
          >
            Qty
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(deptRequestQty).map(([dept, qty], idx) => (
          <TableRow key={idx}>
            <TableCell sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>{dept}</TableCell>
            <TableCell align="center" sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}>
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
    <Box sx={{ p: 2, fontSize: '0.75rem', fontFamily: 'Arial, sans-serif' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
            letterSpacing: '0.03em',
            userSelect: 'none',
            fontSize: '0.9rem',
          }}
        >
          Summary List
        </Typography>

        <Stack direction="row" spacing={1}>
          <ExportExcelButton data={data} />
          <Button
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={handleOpenAddDialog}
            sx={{
              textTransform: 'none',
              borderRadius: 1,
              px: 2,
              py: 0.6,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          >
            Add New
          </Button>
        </Stack>
      </Stack>

      {loading && (
        <Typography align="center" sx={{ color: '#888', fontSize: '0.8rem', mt: 4 }}>
          Loading data...
        </Typography>
      )}
      {error && (
        <Typography
          align="center"
          sx={{ color: theme.palette.error.main, fontWeight: 600, fontSize: '0.8rem', mt: 4 }}
        >
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <>
          <TableContainer
            component={Paper}
            elevation={3}
            sx={{
              borderRadius: 1.5,
              overflowX: 'auto',
              maxHeight: 600,
              width: '100%',
            }}
          >
            <Table stickyHeader size="medium" sx={{ minWidth: 1400 }}>
              <TableHead>
                <TableRow>
                  {headers.map(({ label, key }) => (
                    <TableCell
                      key={key}
                      align={
                        ['No', 'Total qty', 'Sup. price', 'Total price', 'Stock', 'Purch. suggest'].includes(label)
                          ? 'center'
                          : label === 'Actions'
                          ? 'center'
                          : 'left'
                      }
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: '0.7rem',
                        borderBottom: 'none',
                        px: 1.5,
                        py: 1,
                        whiteSpace: 'nowrap',
                        textTransform: 'none',
                        letterSpacing: '0.05em',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
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
                          backgroundColor: idx % 2 === 0 ? '#fafafa' : '#f4f7fb',
                          '&:hover': {
                            backgroundColor: '#e3f2fd',
                            transition: 'background-color 0.3s ease',
                          },
                          fontSize: '0.75rem',
                          cursor: 'default',
                        }}
                      >
                        <TableCell align="center" sx={{ px: 1.5, py: 1 }}>
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5, py: 1 }}>
                          {requisition.englishName}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5, py: 1 }}>
                          {requisition.vietnameseName}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 1.5, py: 1 }}>
                          {requisition.oldSapCode}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 1.5, py: 1 }}>
                          {requisition.newSapCode}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 1.5, py: 1 }}>
                          {requisition.unit}
                        </TableCell>
                        <TableCell sx={{ px: 1.5, py: 1 }}>
                          <DeptRequestTable deptRequestQty={requisition.departmentRequestQty} />
                        </TableCell>
                        <TableCell align="center" sx={{ px: 1.5, py: 1 }}>
                          {totalRequestQty}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5, py: 1 }}>
                          {supplierProduct.name}
                        </TableCell>
                        <TableCell align="right" sx={{ px: 1.5, py: 1 }}>
                          {supplierProduct.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="right" sx={{ px: 1.5, py: 1 }}>
                          {totalPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 1.5, py: 1 }}>
                          {requisition.stock}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5, py: 1 }}>
                          {requisition.purchasingSuggest}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5, py: 1 }}>
                          {requisition.reason}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 1.5, py: 1 }}>
                          {requisition.remark}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 1.5, py: 1 }}>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <IconButton
                              aria-label="edit"
                              color="primary"
                              size="small"
                              onClick={() => handleOpenEditDialog(item)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label="delete"
                              color="error"
                              size="small"
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
                    <TableCell colSpan={headers.length} align="center" sx={{ py: 4 }}>
                      <Stack direction="column" alignItems="center" spacing={1} color="text.secondary">
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
            sx={{ mt: 1 }}
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
