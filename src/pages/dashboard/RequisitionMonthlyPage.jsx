import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import ExportRequisitionMonthlyExcelButton from './ExportRequisitionMonthlyExcelButton';
import EditDialog from './EditDialog';
import AddDialog from './AddDialog';
import { API_BASE_URL } from '../../config';

const headers = [
  { label: 'No', key: 'no' },
  { label: 'Group Item 1', key: 'englishName' },
  { label: 'Group Item 2', key: 'vietnameseName' },
  { label: 'Item Description (EN)', key: 'englishName' },
  { label: 'Item Description (VN)', key: 'vietnameseName' },
  { label: 'Old SAP Code', key: 'oldSapCode' }, 
  { label: 'SAP Code in New SAP', key: 'newSapCode' },
  { label: 'Order Unit', key: 'unit' }, 
  { label: 'Dept qty', key: 'departmentRequestQty' },
  { label: 'Total qty', key: 'totalRequestQty' },
  { label: 'Total not issued qty', key: 'totalNotIssuedQty' },
  { label: 'Inhand', key: 'inHand' },
  { label: 'Actual inhand', key: 'actualInHand' },
  { label: 'Purchasing Suggest', key: 'purchasingSuggest' },
  { label: 'Price', key: 'price' },
  { label: 'Amount', key: 'amount' },
  { label: 'Suppliers', key: 'suppliers' },
  { label: 'Actions', key: 'actions' },
];

function DeptRequestTable({ deptRequestQty }) {
  if (!deptRequestQty || Object.keys(deptRequestQty).length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.55rem', color: '#666' }}>No Data</Typography>;
  }

  return (
    <Table
      size="small"
      sx={{
        minWidth: 120,
        border: '1px solid #ddd',
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}
    >
      <TableHead>
        <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
          <TableCell
            sx={{
              fontWeight: 700,
              fontSize: '0.55rem',
              py: 0.4,
              px: 0.8,
              color: '#1976d2',
            }}
          >
            Dept
          </TableCell>
          <TableCell
            align="center"
            sx={{
              fontWeight: 700,
              fontSize: '0.55rem',
              py: 0.4,
              px: 0.8,
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
              fontSize: '0.55rem',
            }}
          >
            <TableCell sx={{ fontSize: '0.55rem', py: 0.3, px: 0.8, color: '#0d47a1' }}>{dept}</TableCell>
            <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.3, px: 0.8, fontWeight: 600 }}>
              {qty}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function RequisitionMonthlyPage() {
  const theme = useTheme();
  const { groupId } = useParams();
  const navigate = useNavigate();

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

  const handleGoToComparison = () => {
    if (groupId) {
      navigate(`/dashboard/comparison/${groupId}`);
    } else {
      alert('Group ID không hợp lệ');
    }
  };

  const displayData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box
      sx={{
        p: 1.5,
        fontSize: '0.65rem',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        backgroundColor: '#f5f8fa',
        minHeight: '100vh',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
        sx={{ userSelect: 'none' }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.dark,
            letterSpacing: '0.05em',
            fontSize: '0.9rem',
          }}
        >
          Requisition Monthly
        </Typography>

        <Stack direction="row" spacing={1}>
          <ExportRequisitionMonthlyExcelButton data={data} />

          <Button
            variant="contained"
            onClick={handleGoToComparison}
            sx={{
              textTransform: 'none',
              borderRadius: 1,
              px: 1.5,
              py: 0.4,
              fontWeight: 700,
              fontSize: '0.65rem',
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              boxShadow: '0 2px 6px rgba(76, 184, 255, 0.3)',
              '&:hover': {
                background: 'linear-gradient(to right, #3aa4f8, #016ae3)',
                boxShadow: '0 3px 8px rgba(76, 184, 255, 0.4)',
              },
            }}
          >
            Comparison
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={handleOpenAddDialog}
            sx={{
              textTransform: 'none',
              borderRadius: 1,
              px: 1.5,
              py: 0.4,
              fontWeight: 700,
              fontSize: '0.65rem',
              background: 'linear-gradient(to right, #4cb8ff, #027aff)',
              color: '#fff',
              boxShadow: '0 2px 6px rgba(76, 184, 255, 0.3)',
              '&:hover': {
                background: 'linear-gradient(to right, #3aa4f8, #016ae3)',
                boxShadow: '0 3px 8px rgba(76, 184, 255, 0.4)',
              },
            }}
          >
            Add New
          </Button>
        </Stack>
      </Stack>

      {loading && (
        <Typography align="center" sx={{ color: '#90a4ae', fontSize: '0.65rem', mt: 2 }}>
          Loading data...
        </Typography>
      )}
      {error && (
        <Typography
          align="center"
          sx={{ color: theme.palette.error.main, fontWeight: 700, fontSize: '0.65rem', mt: 2 }}
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
              overflowX: 'auto',
              maxHeight: 480,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
                  {headers.map(({ label, key }) => (
                    <TableCell
                      key={key}
                      align={
                        ['No', 'Price', 'Unit', 'Actions'].includes(label)
                          ? 'center'
                          : 'left'
                      }
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.55rem',
                        color: '#ffffff',
                        py: 0.5,
                        px: 0.8,
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
                {displayData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} align="center" sx={{ py: 3, fontStyle: 'italic', color: '#999', fontSize: '0.65rem' }}>
                      <Stack direction="column" alignItems="center" spacing={0.5}>
                        <InboxIcon fontSize="small" />
                        <Typography sx={{ fontSize: '0.7rem' }}>No data available.</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayData.map((row, index) => {
                    const globalIndex = page * rowsPerPage + index + 1;
                    const rowBackgroundColor = '#fff'; // Màu nền mặc định cho hàng

                    return (
                      <TableRow
                        key={row.id}
                        sx={{
                          backgroundColor: rowBackgroundColor,
                          '&:hover': {
                            backgroundColor: '#e3f2fd',
                            transition: 'background-color 0.3s ease',
                            '& .sticky-no-column': {
                              backgroundColor: '#e3f2fd',
                            },
                          },
                          borderBottom: '1px solid #e0e0e0',
                        }}
                      >
                        <TableCell
                          align="center"
                          className="sticky-no-column"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.55rem',
                            py: 0.5,
                            px: 0.8,
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backgroundColor: rowBackgroundColor,
                            borderRight: '1px solid rgba(224, 224, 224, 1)',
                          }}
                        >
                          {globalIndex}
                        </TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.groupItem1}</TableCell>
                        <TableCell sx={{ minWidth: 100, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.groupItem2}</TableCell>
                        <TableCell sx={{ minWidth: 180, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.englishName}</TableCell>
                        <TableCell sx={{ minWidth: 180, fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.vietnameseName}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.oldSapCode}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.newSapCode}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.unit}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', py: 0.5, px: 0.8 }}>
                          <DeptRequestTable deptRequestQty={row.deptRequestQty} />
                        </TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.totalRequestQty}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.totalNotIssuedQty}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.inHand}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.actualInHand}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.purchasingSuggest}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.price}</TableCell>
                        <TableCell sx={{ minWidth: 80, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.amount}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center', fontSize: '0.55rem', py: 0.5, px: 0.8 }}>{row.suppliers}</TableCell>
                        <TableCell align="center" sx={{ minWidth: 80, py: 0.5, px: 0.8 }}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleOpenEditDialog(row)}
                              aria-label="Edit"
                            >
                              <EditIcon sx={{ fontSize: '10px' }} />
                            </IconButton>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDelete(row.id)}
                              aria-label="Delete"
                            >
                              <DeleteIcon sx={{ fontSize: '10px' }} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={data.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Rows per page"
            sx={{
              mt: 1,
              '& .MuiTablePagination-toolbar': {
                paddingLeft: 1,
                paddingRight: 1,
                backgroundColor: '#f0f4f8',
                borderRadius: 1,
                fontSize: '0.55rem',
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.55rem',
              },
            }}
          />
        </>
      )}

      <EditDialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        item={selectedItem}
        onUpdated={fetchData}
      />

      <AddDialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        groupId={groupId}
        onAdded={fetchData}
      />
    </Box>
  );
}