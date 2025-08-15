import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Stack, Button } from '@mui/material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

export default function EditItemPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [item, setItem] = useState(location.state?.item || null);
  const [loading, setLoading] = useState(!item);
  const [error, setError] = useState(null);
  const [editValues, setEditValues] = useState(item || {});

  useEffect(() => {
    if (!item) {
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`http://10.232.106.178:8080/api/summary-requisitions/${id}`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          setItem(data);
          setEditValues(data);
        } catch (err) {
          setError('Failed to load item data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [id, item]);

  const handleEditChange = (field, value) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://10.232.106.178:8080/api/summary-requisitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      if (!response.ok) throw new Error(`Update failed with status ${response.status}`);

      alert('Update successful');
      navigate('/'); // quay về trang danh sách
    } catch (error) {
      console.error(error);
      alert('Update failed. Please try again.');
    }
  };

  if (loading) return <Typography>Loading item data...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      {/* Update the Typography header with the desired colors */}
      <Typography variant="h5" mb={3} sx={{ backgroundColor: '#4680FF', color: 'white', padding: '10px' }}>
        Edit Item No: {editValues.no}
      </Typography>

      <Stack spacing={2} flexWrap="wrap" direction="row">
        <TextField
          label="English Name"
          value={editValues.englishName || ''}
          onChange={e => handleEditChange('englishName', e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Vietnamese Name"
          value={editValues.vietnameseName || ''}
          onChange={e => handleEditChange('vietnameseName', e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Old SAP Code"
          value={editValues.oldSapCode || ''}
          onChange={e => handleEditChange('oldSapCode', e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
        />
        <TextField
          label="New SAP Code"
          value={editValues.newSapCode || ''}
          onChange={e => handleEditChange('newSapCode', e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
        />
        <TextField
          label="Unit"
          value={editValues.unit || ''}
          onChange={e => handleEditChange('unit', e.target.value)}
          size="small"
          sx={{ minWidth: 100 }}
        />
        <TextField
          label="Total Request Qty"
          type="number"
          value={editValues.totalRequestQty || 0}
          onChange={e => handleEditChange('totalRequestQty', Number(e.target.value))}
          size="small"
          sx={{ minWidth: 120 }}
        />
        <TextField
          label="Stock"
          type="number"
          value={editValues.stock || 0}
          onChange={e => handleEditChange('stock', Number(e.target.value))}
          size="small"
          sx={{ minWidth: 100 }}
        />
        <TextField
          label="Purchasing Suggest"
          type="number"
          value={editValues.purchasingSuggest || 0}
          onChange={e => handleEditChange('purchasingSuggest', Number(e.target.value))}
          size="small"
          sx={{ minWidth: 140 }}
        />
        <TextField
          label="Reason"
          value={editValues.reason || ''}
          onChange={e => handleEditChange('reason', e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
          multiline
        />
        <TextField
          label="Remark"
          value={editValues.remark || ''}
          onChange={e => handleEditChange('remark', e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
          multiline
        />
      </Stack>

      <Stack direction="row" spacing={2} mt={3}>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Stack>
    </Box>
  );
}