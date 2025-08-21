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
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
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
  { label: 'Total not isued qty ', key: 'supplierName' },
  { label: 'Inhand', key: 'supplierPrice' },
  { label: 'Actual inhand', key: 'totalPrice' },
  { label: 'Purchasing Suggest', key: 'purchasingSuggest' },
  { label: 'Price', key: 'reason' },
  { label: 'Amount', key: 'remark' },
  { label: 'Suppliers', key: 'remark' },
  { label: 'Actions', key: 'actions' },
];

const handleGoToComparison = () => {
  if (groupId) {
    navigate(`/dashboard/comparison/${groupId}`);
  } else {
    alert('Group ID không hợp lệ');
  }
};

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

  // Mới thêm: hàm chuyển trang comparison
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
          Requisiton Monthly
        </Typography>

        <Stack direction="row" spacing={2}>
          <ExportRequisitionMonthlyExcelButton data={data} />

          <Button
            variant="contained"
            onClick={handleGoToComparison}
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
            Comparison
          </Button>


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
                {displayData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} align="center" sx={{ py: 5, fontStyle: 'italic', color: '#999' }}>
                      No data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayData.map((row, index) => {
                    const globalIndex = page * rowsPerPage + index + 1;

                    return (
                      <TableRow
                        key={row.id}
                        sx={{
                          '&:hover': { backgroundColor: '#e3f2fd' },
                          borderBottom: '1px solid #e0e0e0',
                        }}
                      >
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          {globalIndex}
                        </TableCell>
                        <TableCell sx={{ minWidth: 140 }}>{row.groupItem1}</TableCell>
                        <TableCell sx={{ minWidth: 140 }}>{row.groupItem2}</TableCell>
                        <TableCell sx={{ minWidth: 250 }}>{row.englishName}</TableCell>
                        <TableCell sx={{ minWidth: 250 }}>{row.vietnameseName}</TableCell>
                        <TableCell sx={{ minWidth: 120, textAlign: 'center' }}>{row.oldSapCode}</TableCell>
                        <TableCell sx={{ minWidth: 140, textAlign: 'center' }}>{row.newSapCode}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center' }}>{row.unit}</TableCell>
                        <TableCell sx={{ minWidth: 120, textAlign: 'center' }}>
                          <DeptRequestTable deptRequestQty={row.deptRequestQty} />
                        </TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center' }}>{row.totalRequestQty}</TableCell>
                        <TableCell sx={{ minWidth: 140, textAlign: 'center' }}>{row.totalNotIssuedQty}</TableCell>
                        <TableCell sx={{ minWidth: 100, textAlign: 'center' }}>{row.inHand}</TableCell>
                        <TableCell sx={{ minWidth: 140, textAlign: 'center' }}>{row.actualInHand}</TableCell>
                        <TableCell sx={{ minWidth: 140, textAlign: 'center' }}>{row.purchasingSuggest}</TableCell>
                        <TableCell sx={{ minWidth: 120, textAlign: 'center' }}>{row.price}</TableCell>
                        <TableCell sx={{ minWidth: 120, textAlign: 'center' }}>{row.amount}</TableCell>
                        <TableCell sx={{ minWidth: 140, textAlign: 'center' }}>{row.suppliers}</TableCell>
                        <TableCell align="center" sx={{ minWidth: 120 }}>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleOpenEditDialog(row)}
                              aria-label="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDelete(row.id)}
                              aria-label="Delete"
                            >
                              <DeleteIcon fontSize="small" />
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
              mt: 2,
              '& .MuiTablePagination-toolbar': {
                paddingLeft: 2,
                paddingRight: 2,
                backgroundColor: '#f0f4f8',
                borderRadius: 2,
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
