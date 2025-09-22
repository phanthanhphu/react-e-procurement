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
  Popover,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import InboxIcon from '@mui/icons-material/Inbox';
import ExportExcelButton from './ExportExcelButton';
import EditDialog from './EditDialog';
import AddDialog from './AddDialog';
import RequisitionSearch from './RequisitionSearch';
import { API_BASE_URL } from '../../config';
import ImportExcelButton from './ImportExcelButton';

const headers = [
  { label: 'No', key: 'no' },
  { label: 'Group Type 1', key: 'productType1Name' },
  { label: 'Group Type 2', key: 'productType2Name' },
  { label: 'Item Description (EN)', key: 'englishName' },
  { label: 'Item Description (VN)', key: 'vietnameseName' },
  { label: 'Old SAP Code', key: 'oldSapCode' },
  { label: 'SAP Code in New SAP', key: 'newSapCode' },
  { label: 'Order Unit', key: 'unit' },
  { label: 'Department', key: 'departmentRequests' },
  { label: 'Buying Qty', key: 'sumBuy' },
  { label: 'Supplier', key: 'supplierName' },
  { label: 'Sup. price', key: 'supplierPrice' },
  { label: 'Total price', key: 'totalPrice' },
  { label: 'Stock', key: 'stock' },
  { label: 'Purchasing Suggest', key: 'purchasingSuggest' },
  { label: 'Reason', key: 'reason' },
  { label: 'Remark', key: 'remark' },
  { label: 'Images', key: 'image' },
  { label: 'Actions', key: 'actions' },
];

function DeptRequestTable({ departmentRequests }) {
  if (!departmentRequests || departmentRequests.length === 0) {
    return <Typography sx={{ fontStyle: 'italic', fontSize: '0.55rem', color: '#666' }}>No Data</Typography>;
  }

  return (
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
            }}
          >
            Department
          </TableCell>
          <TableCell
            align="center"
            sx={{
              fontWeight: 700,
              fontSize: '0.55rem',
              py: 0.2,
              px: 0.3,
              color: '#1976d2',
            }}
          >
            Request Qty
          </TableCell>
          <TableCell
            align="center"
            sx={{
              fontWeight: 700,
              fontSize: '0.55rem',
              py: 0.2,
              px: 0.3,
              color: '#1976d2',
            }}
          >
            Buy
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {departmentRequests.map((dept, idx) => (
          <TableRow
            key={idx}
            sx={{
              '&:nth-of-type(even)': { backgroundColor: '#f9fbff' },
              '&:hover': { backgroundColor: '#bbdefb', transition: 'background-color 0.3s' },
              fontSize: '0.55rem',
            }}
          >
            <TableCell sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, color: '#0d47a1' }}>
              {dept.departmentName}
            </TableCell>
            <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, fontWeight: 600 }}>
              {dept.qty}
            </TableCell>
            <TableCell align="center" sx={{ fontSize: '0.55rem', py: 0.15, px: 0.3, fontWeight: 600 }}>
              {dept.buy}
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
  const navigate = useNavigate();

  const [data, setData] = useState([]);
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [popoverImgSrcs, setPopoverImgSrcs] = useState([]);

  const fetchData = useCallback(async () => {
    if (!groupId) {
      console.warn('No groupId, skipping fetchData');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/summary-requisitions/group/${groupId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const filteredData = result.filter(item => {
        return (
          (!searchValues.productType1Name || item.productType1Name?.toLowerCase().includes(searchValues.productType1Name.toLowerCase())) &&
          (!searchValues.productType2Name || item.productType2Name?.toLowerCase().includes(searchValues.productType2Name.toLowerCase())) &&
          (!searchValues.englishName || item.requisition.englishName?.toLowerCase().includes(searchValues.englishName.toLowerCase())) &&
          (!searchValues.vietnameseName || item.requisition.vietnameseName?.toLowerCase().includes(searchValues.vietnameseName.toLowerCase())) &&
          (!searchValues.oldSapCode || item.requisition.oldSapCode?.toLowerCase().includes(searchValues.oldSapCode.toLowerCase())) &&
          (!searchValues.newSapCode || item.requisition.newSapCode?.toLowerCase().includes(searchValues.newSapCode.toLowerCase())) &&
          (!searchValues.unit || item.supplierProduct?.unit?.toLowerCase().includes(searchValues.unit.toLowerCase())) &&
          (!searchValues.departmentName || item.departmentRequests.some(dept => dept.departmentName?.toLowerCase().includes(searchValues.departmentName.toLowerCase())))
        );
      });
      setData(filteredData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch data from API. Showing previously loaded data.');
    } finally {
      setLoading(false);
    }
  }, [groupId, searchValues]);

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

  const handleSearchChange = (newValues) => {
    setSearchValues(newValues);
    setPage(0);
  };

  const handleSearch = () => {
    fetchData();
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
    fetchData();
  };

  const handleNavigateToComparison = () => {
    console.log('Navigating to:', `/dashboard/comparison/${groupId}`);
    navigate(`/dashboard/comparison/${groupId}`);
  };

  const handlePopoverOpen = (event, imageUrls) => {
    setAnchorEl(event.currentTarget);
    const fullSrcs = imageUrls?.map((imgSrc) =>
      imgSrc.startsWith('http') ? imgSrc : `${API_BASE_URL}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`
    ) || [];
    console.log('Image URLs:', fullSrcs);
    setPopoverImgSrcs(fullSrcs);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setPopoverImgSrcs([]);
  };

  const handlePopoverEnter = () => {};
  const handlePopoverLeave = () => {
    handlePopoverClose();
  };

  const open = Boolean(anchorEl);

  const displayData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
        sx={{ userSelect: 'none' }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.dark,
            letterSpacing: '0.05em',
            fontSize: '1rem',
          }}
        >
          Requisition Urgent
        </Typography>

        <Stack direction="row" spacing={0.5}>
          <ExportExcelButton data={data} groupId={groupId} />
          <ImportExcelButton
            onImport={(importedData) => {
              console.log('Imported data:', importedData);
              fetchData();
            }}
            groupId={groupId}
          />
          <Button
            variant="contained"
            onClick={handleNavigateToComparison}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 1,
              py: 0.2,
              fontWeight: 700,
              fontSize: '0.65rem',
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
              px: 1,
              py: 0.2,
              fontWeight: 700,
              fontSize: '0.65rem',
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

      <RequisitionSearch
        searchValues={searchValues}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />

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
          <TableContainer
            component={Paper}
            elevation={4}
            sx={{
              overflowX: 'auto',
              maxHeight: 450,
              boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)',
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 1800 }}>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(to right, #4cb8ff, #027aff)' }}>
                  {headers.map(({ label, key }) => (
                    <TableCell
                      key={key}
                      align={
                        ['No', 'Sup. price', 'Total price', 'Order Unit', 'Total Buy', 'Stock', 'Images', 'Actions'].includes(label)
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
                        position: 'sticky',
                        top: 0,
                        zIndex: 20,
                        backgroundColor: '#027aff',
                        ...(key === 'no' && { left: 0, zIndex: 21 }), // Cố định cột "No" với left: 0 và tăng zIndex
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
                    const { requisition, supplierProduct, productType1Name, productType2Name, departmentRequests, sumBuy, totalPrice } = item;
                    const imageUrls = requisition.imageUrls || supplierProduct?.imageUrls || [];

                    return (
                      <TableRow
                        key={requisition.id}
                        sx={{
                          backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                          '&:hover': {
                            backgroundColor: '#e1f0ff',
                            transition: 'background-color 0.3s ease',
                          },
                          fontSize: '0.55rem',
                          cursor: 'default',
                          userSelect: 'none',
                        }}
                      >
                        <TableCell
                          align="center"
                          sx={{
                            px: 0.4,
                            py: 0.2,
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backgroundColor: idx % 2 === 0 ? '#fff' : '#f7f9fc',
                            fontSize: '0.55rem',
                          }}
                        >
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {productType1Name || ''}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {productType2Name || ''}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontWeight: 600, fontSize: '0.55rem' }}>
                          {requisition.englishName || ''}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {requisition.vietnameseName || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {requisition.oldSapCode || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {requisition.newSapCode || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {supplierProduct?.unit || ''}
                        </TableCell>
                        <TableCell sx={{ px: 0.4, py: 0.2 }}>
                          <DeptRequestTable departmentRequests={departmentRequests} />
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontWeight: 600, fontSize: '0.55rem' }}>
                          {sumBuy || 0}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {supplierProduct?.supplierName || ''}
                        </TableCell>
                        <TableCell align="right" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {supplierProduct?.price ? supplierProduct.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
                        </TableCell>
                        <TableCell align="right" sx={{ px: 0.4, py: 0.2, fontWeight: 700, color: theme.palette.primary.dark, fontSize: '0.55rem' }}>
                          {totalPrice ? totalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '0'}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {requisition.stock || 0}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {requisition.purchasingSuggest || ''}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {requisition.reason || ''}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', px: 0.4, py: 0.2, fontSize: '0.55rem' }}>
                          {requisition.remark || ''}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2 }}>
                          {imageUrls.length > 0 ? (
                            <IconButton
                              size="small"
                              onMouseEnter={(e) => handlePopoverOpen(e, imageUrls)}
                              aria-owns={open ? 'mouse-over-popover' : undefined}
                              aria-haspopup="true"
                            >
                              <ImageIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <Typography sx={{ fontSize: '0.55rem', color: '#888' }}>
                              No Images
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 0.4, py: 0.2 }}>
                          <Stack direction="row" spacing={0.2} justifyContent="center">
                            <IconButton
                              aria-label="edit"
                              color="primary"
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.25)' },
                                borderRadius: 1,
                                p: 0.2,
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
                                p: 0.2,
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

          <Popover
            id="mouse-over-popover"
            sx={{ pointerEvents: 'auto' }}
            open={open}
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            onClose={handlePopoverClose}
            disableRestoreFocus
          >
            <Box
              sx={{
                p: 0.5,
                maxWidth: 250,
                maxHeight: 250,
                overflowY: 'auto',
              }}
              onMouseEnter={handlePopoverEnter}
              onMouseLeave={handlePopoverLeave}
            >
              {popoverImgSrcs.length > 0 ? (
                <Stack direction="column" spacing={0.5}>
                  {popoverImgSrcs.map((imgSrc, index) => (
                    <Box key={index} sx={{ textAlign: 'center' }}>
                      <img
                        src={imgSrc}
                        alt={`Product Image ${index + 1}`}
                        style={{
                          maxWidth: '100%',
                          maxHeight: 180,
                          borderRadius: 4,
                          objectFit: 'contain',
                        }}
                        loading="lazy"
                        onError={(e) => {
                          console.error(`Failed to load image: ${imgSrc}`);
                          e.target.src = '/images/fallback.jpg';
                          e.target.alt = 'Failed to load';
                        }}
                      />
                      <Typography sx={{ mt: 0.2, fontSize: '0.7rem', color: '#555' }}>
                        Image {index + 1}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ p: 0.5, fontSize: '0.7rem' }}>No images available</Typography>
              )}
            </Box>
          </Popover>

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
        onRefresh={fetchData}
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