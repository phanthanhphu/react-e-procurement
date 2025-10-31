// src/pages/dashboard/WeeklyMonthlyRequisitionsPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Typography, TablePagination, useTheme, Tooltip, Popover,
  Snackbar, Alert, IconButton, CircularProgress
} from '@mui/material';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ImageIcon from '@mui/icons-material/Image';
import InboxIcon from '@mui/icons-material/Inbox';
import { useMediaQuery } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import WeeklyMonthlyGroupSearch from './WeeklyMonthlyGroupSearch';

// === Axios Interceptors ===
axios.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
}, err => Promise.reject(err));

axios.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

// === SUB-COMPONENT: Dept Table (FONT NHỎ, RỘNG HƠN) ===
function DeptRequestTable({ departmentRequests }) {
  if (!departmentRequests || departmentRequests.length === 0) {
    return <Typography sx={{ fontSize: '0.55rem', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No Data</Typography>;
  }

  return (
    <Box sx={{ fontSize: '0.55rem', border: '1px solid #ddd', borderRadius: 1 }}>
      <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" bgcolor="#e3f2fd">
        <Box p="3px 6px" fontWeight={700} color="#1976d2" textAlign="center" fontFamily='"Inter var", sans-serif'>Dept</Box>
        <Box p="3px 6px" fontWeight={700} color="#1976d2" textAlign="center" fontFamily='"Inter var", sans-serif'>Req</Box>
        <Box p="3px 6px" fontWeight={700} color="#1976d2" textAlign="center" fontFamily='"Inter var", sans-serif'>Buy</Box>
      </Box>
      {departmentRequests.map((dept, idx) => (
        <Box key={idx} display="grid" gridTemplateColumns="1fr 1fr 1fr" bgcolor={idx % 2 === 0 ? '#f9fbff' : '#fff'} sx={{ borderBottom: '1px solid #fafbfb' }}>
          <Box p="3px 6px" color="#1D2630" fontWeight={400} fontFamily='"Inter var", sans-serif' lineHeight={1.4}>{dept.name || '—'}</Box>
          <Box p="3px 6px" textAlign="center" color="#1D2630" fontWeight={400} fontFamily='"Inter var", sans-serif' lineHeight={1.4}>{dept.qty || 0}</Box>
          <Box p="3px 6px" textAlign="center" color="#1D2630" fontWeight={400} fontFamily='"Inter var", sans-serif' lineHeight={1.4}>{dept.buy || 0}</Box>
        </Box>
      ))}
    </Box>
  );
}

// === HELPER FUNCTIONS ===
const formatDate = (arr) => {
  if (!Array.isArray(arr) || arr.length < 3) return '-';
  const [year, month, day] = arr;
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
};

const formatCurrency = (v, c) => !v ? '0' : c === 'VND' ? `${Number(v).toLocaleString('vi-VN')}` : c === 'USD' ? `$${Number(v).toFixed(0)}` : Number(v).toFixed(0);
const getTypeColor = t => t === 'WEEKLY' ? '#1976d2' : '#388e3c';

// === HEADERS (TYPE: 80px, DEPTS: 220px) ===
const headers = [
  { label: 'No', key: 'no', align: 'center', width: 40, sticky: true },
  { label: 'Product Type 1', key: 'productType1Name', sortable: true, width: 100, sticky: true, wrap: true },
  { label: 'Product Type 2', key: 'productType2Name', sortable: true, width: 100, sticky: true, wrap: true },
  { label: 'Type', key: 'type', sortable: true, align: 'center', width: 80, sticky: true }, // Tăng lên 80px
  { label: 'VN Desc', key: 'itemDescriptionVN', sortable: true, width: 140, sticky: true, wrap: true },
  { label: 'EN Desc', key: 'itemDescriptionEN', sortable: true, width: 140, sticky: true, wrap: true },
  { label: 'Old SAP', key: 'oldSAPCode', sortable: true, align: 'center', width: 70 },
  { label: 'Hana SAP', key: 'hanaSAPCode', sortable: true, align: 'center', width: 80 },
  { label: 'Supplier', key: 'supplierName', sortable: true, width: 130, wrap: true },
  { label: 'Depts', key: 'departmentRequisitions', width: 220 }, // Tăng lên 220px
  { label: 'Unit', key: 'unit', sortable: true, align: 'center', width: 50 },
  { label: 'Req Qty', key: 'totalRequestQty', sortable: true, align: 'center', width: 60 },
  { label: 'Order Qty', key: 'orderQty', sortable: true, align: 'center', width: 60 },
  { label: 'Price', key: 'price', sortable: true, align: 'center', width: 70 },
  { label: 'Curr', key: 'currency', sortable: true, align: 'center', width: 50 },
  { label: 'Amount', key: 'amount', sortable: true, align: 'center', width: 80 },
  { label: 'Created', key: 'createdDate', sortable: true, align: 'center', width: 80 },
  { label: 'Updated', key: 'updatedDate', sortable: true, align: 'center', width: 80 },
  { label: 'Img', key: 'imageUrls', align: 'center', width: 50 },
];

// Tính left cho sticky
let leftOffset = 0;
headers.forEach(h => {
  if (h.sticky) {
    h.left = leftOffset;
    leftOffset += h.width;
  }
});

const gridTemplate = headers.map(h => `${h.width}px`).join(' ');

// === MAIN COMPONENT ===
export default function WeeklyMonthlyRequisitionsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const cacheBust = useMemo(() => Date.now(), []);
  const imageCache = useRef(new Map());

  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchValues, setSearchValues] = useState({
    groupName: '', groupId: '', typeId: '', startDate: '', endDate: '',
    productType1Id: null, productType1Name: '',
    productType2Id: null, productType2Name: '',
    englishName: '', vietnameseName: '', oldSapCode: '', hanaSapCode: ''
  });
  const [sort, setSort] = useState({ key: 'updatedDate', dir: 'desc' });
  const [popover, setPopover] = useState({ anchor: null, images: [] });
  const [imgErr, setImgErr] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const API_URL = useMemo(() => API_BASE_URL.replace(/\/$/, ''), []);
  const DEFAULT_IMG = useMemo(() => `${API_BASE_URL}/uploads/default-item.png?v=${cacheBust}`, [cacheBust]);

  const normalizeImg = useCallback((url) => {
    if (!url) return null;
    const key = `url_${url}`;
    if (imageCache.current.has(key)) return imageCache.current.get(key);
    let final = url.startsWith('http') ? `${url}?t=${cacheBust}` :
               url.startsWith('/uploads/') ? `${API_BASE_URL}${url}?t=${cacheBust}` :
               `${API_URL}/uploads/${url.replace(/^\/?[Uu]ploads\//i, '')}?t=${cacheBust}`;
    imageCache.current.set(key, final);
    return final;
  }, [cacheBust, API_URL]);

  const processed = useMemo(() => data.map(r => ({
    ...r,
    displayImageUrls: (r.imageUrls || []).map(normalizeImg).filter(Boolean),
    departmentRequisitions: (r.departmentRequisitions || []).map(d => ({
      name: d.name || '—',
      qty: d.qty || 0,
      buy: d.buy || 0
    })),
    createdDateDisplay: formatDate(r.createdDate),
    updatedDateDisplay: formatDate(r.updatedDate),
  })), [data, normalizeImg]);

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    const add = (k, v) => v && p.append(k, String(v).trim());
    add('groupId', searchValues.groupId);
    add('typeId', searchValues.typeId);
    searchValues.startDate && p.append('startDate', new Date(searchValues.startDate).toISOString().slice(0,19));
    searchValues.endDate && p.append('endDate', new Date(searchValues.endDate).toISOString().slice(0,19));
    add('productType1Id', searchValues.productType1Id);
    add('productType2Id', searchValues.productType2Id);
    add('englishName', searchValues.englishName);
    add('vietnameseName', searchValues.vietnameseName);
    add('oldSapCode', searchValues.oldSapCode);
    add('hanaSapCode', searchValues.hanaSapCode);
    p.append('page', page);
    p.append('size', rowsPerPage);
    p.append('sort', `${sort.key},${sort.dir}`);
    return p;
  }, [page, rowsPerPage, sort, searchValues]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/requisitions/search_2?${buildParams()}`);
      setData(res.data.content || []);
      setTotal(res.data.totalElements || 0);
    } catch (err) {
      setSnack({ open: true, msg: 'Load failed: ' + (err.response?.data?.message || err.message), sev: 'error' });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSearch = useCallback(() => { setPage(0); fetchData(); }, [fetchData]);
  const onReset = useCallback(() => {
    setSearchValues({
      groupName: '', groupId: '', typeId: '', startDate: '', endDate: '',
      productType1Id: null, productType1Name: '',
      productType2Id: null, productType2Name: '',
      englishName: '', vietnameseName: '', oldSapCode: '', hanaSapCode: ''
    });
    setPage(0);
    setSort({ key: 'updatedDate', dir: 'desc' });
    fetchData();
  }, [fetchData]);

  const onSort = useCallback(k => {
    setSort(s => ({ key: k, dir: s.key === k && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(0);
  }, []);

  const onPage = useCallback((_, p) => setPage(p), []);
  const onRows = useCallback(e => { setRowsPerPage(+e.target.value); setPage(0); }, []);

  useEffect(() => { fetchData(); }, [page, rowsPerPage, sort]);

  return (
    <Box sx={{ bgcolor: '#f5f8fa', minHeight: '100vh', py: 1, fontFamily: '"Inter var", sans-serif' }}>
      <Box sx={{ px: { xs: 1, sm: 2, md: 3, lg: 4 } }}>
        <Typography variant="h4" sx={{ fontSize: '1rem', fontWeight: 600, color: '#1976d2', mb: 1 }}>
          Weekly & Monthly Requisitions
        </Typography>

        <WeeklyMonthlyGroupSearch
          searchValues={searchValues}
          onSearchChange={setSearchValues}
          onSearch={onSearch}
          onReset={onReset}
        />

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" mt={3}>
            <CircularProgress size={20} />
            <Typography ml={1} fontSize="0.55rem" color="#666">Loading...</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ maxHeight: 650, overflow: 'auto', border: '1px solid #ddd', borderRadius: 2 }}>
              {/* HEADER – NHỎ, GỌN */}
              <Box
                display="grid"
                gridTemplateColumns={gridTemplate}
                bgcolor="#027aff"
                position="sticky"
                top={0}
                zIndex={22}
              >
                {headers.map(h => (
                  <Box
                    key={h.key}
                    sx={{
                      p: '4px 6px',
                      fontWeight: 700,
                      fontSize: '0.55rem',
                      color: '#fff',
                      fontFamily: '"Inter var", sans-serif',
                      textAlign: h.align || 'left',
                      whiteSpace: h.wrap ? 'normal' : 'nowrap',
                      wordBreak: h.wrap ? 'break-word' : 'normal',
                      position: h.sticky ? 'sticky' : 'relative',
                      left: h.sticky ? h.left : 'auto',
                      backgroundColor: '#027aff',
                      zIndex: h.sticky ? 21 : 20,
                      cursor: h.sortable ? 'pointer' : 'default',
                      '&:hover': h.sortable ? { bgcolor: '#016ae3' } : {},
                      lineHeight: 1.4,
                      borderRight: '1px solid rgba(255,255,255,0.15)',
                      '&:last-child': { borderRight: 'none' },
                    }}
                    onClick={() => h.sortable && onSort(h.key)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: h.align === 'center' ? 'center' : 'flex-start' }}>
                      <Tooltip title={h.label} arrow><span>{h.label}</span></Tooltip>
                      {h.sortable && (
                        <Box sx={{ ml: 0.3 }}>
                          {sort.key === h.key ? (
                            sort.dir === 'asc' ? 
                              <ArrowUpward sx={{ fontSize: '0.7rem', color: '#fff' }} /> : 
                              <ArrowDownward sx={{ fontSize: '0.7rem', color: '#fff' }} />
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <ArrowUpward sx={{ fontSize: '0.55rem', color: '#ccc' }} />
                              <ArrowDownward sx={{ fontSize: '0.55rem', color: '#ccc' }} />
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* BODY – NHỎ, RÕ */}
              <Box>
                {processed.length ? processed.map((r, i) => {
                  const globalIndex = page * rowsPerPage + i + 1;
                  const rowBg = i % 2 === 0 ? '#fff' : '#f7f9fc';

                  return (
                    <Box
                      key={r.id}
                      display="grid"
                      gridTemplateColumns={gridTemplate}
                      bgcolor={rowBg}
                      sx={{
                        '&:hover': {
                          bgcolor: '#e3f2fd',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s ease'
                        },
                        borderBottom: '1px solid #fafbfb',
                      }}
                    >
                      {headers.map(h => {
                        const isSticky = !isMobile && h.sticky;
                        return (
                          <Box
                            key={h.key}
                            sx={{
                              p: '3px 6px',
                              fontSize: '0.55rem',
                              fontWeight: 400,
                              fontFamily: '"Inter var", sans-serif',
                              lineHeight: 1.4,
                              textAlign: h.align || 'left',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              position: isSticky ? 'sticky' : 'relative',
                              left: isSticky ? h.left : 'auto',
                              backgroundColor: rowBg,
                              zIndex: isSticky ? 1 : 'auto',
                              color: '#1D2630',
                            }}
                          >
                            {h.key === 'no' && <Box textAlign="center" fontWeight={700}>{globalIndex}</Box>}
                            {h.key === 'type' && <Box sx={{ ...tagSx, bgcolor: getTypeColor(r.type) }}>{r.type || '—'}</Box>}
                            {h.key === 'productType1Name' && (r.productType1Name || '-')}
                            {h.key === 'productType2Name' && (r.productType2Name || '-')}
                            {h.key === 'itemDescriptionVN' && (r.itemDescriptionVN || '-')}
                            {h.key === 'itemDescriptionEN' && (r.itemDescriptionEN || '-')}
                            {h.key === 'oldSAPCode' && (r.oldSAPCode || '-')}
                            {h.key === 'hanaSAPCode' && (r.hanaSAPCode || '-')}
                            {h.key === 'supplierName' && (r.supplierName || '-')}
                            {h.key === 'departmentRequisitions' && <DeptRequestTable departmentRequests={r.departmentRequisitions} />}
                            {h.key === 'unit' && (r.unit || '-')}
                            {h.key === 'totalRequestQty' && <Box textAlign="center">{r.totalRequestQty || 0}</Box>}
                            {h.key === 'orderQty' && <Box textAlign="center">{r.orderQty || 0}</Box>}
                            {h.key === 'price' && <Box textAlign="center">{formatCurrency(r.price, r.currency)}</Box>}
                            {h.key === 'currency' && <Box textAlign="center">{r.currency || 'VND'}</Box>}
                            {h.key === 'amount' && <Box textAlign="center">{formatCurrency(r.amount, r.currency)}</Box>}
                            {h.key === 'createdDate' && <Box textAlign="center">{r.createdDateDisplay}</Box>}
                            {h.key === 'updatedDate' && <Box textAlign="center">{r.updatedDateDisplay}</Box>}
                            {h.key === 'imageUrls' && (
                              r.displayImageUrls.length ? 
                                <IconButton size="small" onMouseEnter={(e) => setPopover({ anchor: e.currentTarget, images: r.displayImageUrls })} onMouseLeave={() => setPopover({ anchor: null, images: [] })} sx={{ p: 0.1 }}>
                                  <ImageIcon sx={{ fontSize: '0.75rem' }} />
                                </IconButton>
                              : 
                                <Typography fontSize="0.55rem" color="#999" textAlign="center">—</Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  );
                }) : (
                  <Box p={3} textAlign="center">
                    <InboxIcon sx={{ fontSize: 40, color: '#ddd' }} />
                    <Typography fontSize="0.6rem" color="#999">No data available.</Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <TablePagination
              rowsPerPageOptions={[10, 20, 25, 50]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={onPage}
              onRowsPerPageChange={onRows}
              labelRowsPerPage="Rows"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} of ${count}`}
              sx={{
                mt: 1,
                fontSize: '0.55rem',
                bgcolor: '#fff',
                border: '1px solid #ddd',
                borderTop: 'none',
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.55rem' },
                '.MuiTablePagination-select': { fontSize: '0.55rem', py: 0.3 },
              }}
            />
          </>
        )}

        <Popover
          open={!!popover.anchor}
          anchorEl={popover.anchor}
          onClose={() => setPopover({ anchor: null, images: [] })}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          sx={{ pointerEvents: 'none' }}
        >
          <Box p={1} maxWidth={220} maxHeight={220} sx={{ overflow: 'auto' }}>
            {popover.images.map((src, i) => (
              <Box key={i} textAlign="center" mb={1}>
                <img
                  src={imgErr[src] ? DEFAULT_IMG : src}
                  alt=""
                  style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 4, objectFit: 'contain' }}
                  onError={() => setImgErr(p => ({ ...p, [src]: true }))}
                />
                <Typography fontSize="0.55rem" color="#555">Img {i+1}</Typography>
              </Box>
            ))}
          </Box>
        </Popover>

        <Snackbar open={snack.open} autoHideDuration={6000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.sev} sx={{ fontSize: '0.7rem' }}>{snack.msg}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

const tagSx = { 
  padding: '1px 4px', 
  borderRadius: '3px', 
  fontSize: '0.5rem', 
  fontWeight: 600, 
  color: '#fff', 
  display: 'inline-flex', 
  justifyContent: 'center', 
  minWidth: 44, 
  mx: 'auto' 
};