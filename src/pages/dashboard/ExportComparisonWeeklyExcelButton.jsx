import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button, Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';
import { API_BASE_URL } from '../../config';

export default function ExportComparisonWeeklyExcelButton({ disabled, groupId }) {
  const [data, setData] = useState([]);
  const [totalAmt, setTotalAmt] = useState(0);
  const [totalAmtDifference, setTotalAmtDifference] = useState(0);
  const [totalDifferencePercentage, setTotalDifferencePercentage] = useState(0);
  const [currency, setCurrency] = useState('VND');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [stockDate, setStockDate] = useState('');
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // API 1: Group info
        const groupResponse = await axios.get(
          `${API_BASE_URL}/api/group-summary-requisitions/${groupId}`,
          { headers: { Accept: '*/*' } }
        );
        setCurrency(groupResponse.data.currency || 'VND');

        // API 2: Comparison data
        const response = await axios.get(
          `${API_BASE_URL}/api/summary-requisitions/search/comparison`,
          {
            params: {
              groupId,
              hasFilter: false,
              disablePagination: true,
              page: 0,
              size: 1000,
              sort: 'updatedDate,desc',
            },
            headers: { Accept: '*/*' },
          }
        );

        if (!response.data?.page?.content) {
          throw new Error('Invalid API response: Missing page.content');
        }

        setData(response.data.page.content || []);
        setTotalAmt(response.data.totalAmt || 0);
        setTotalAmtDifference(response.data.totalAmtDifference || 0);
        setTotalDifferencePercentage(response.data.totalDifferencePercentage || 0);

        // API 3: weekly info
        await axios
          .get(`${API_BASE_URL}/api/group-summary-requisitions/weekly-info/${groupId}`)
          .then((res) => {
            setStockDate(res.data.createdDate || '');
            setGroupName(res.data.weekly || '');
          })
          .catch((err) => {
            console.error('Error fetching weekly info', err);
          });
      } catch (error) {
        const errorMessage = error.response
          ? `Failed to fetch data for export: ${error.response.status} - ${error.response.data?.message || error.message}`
          : `Failed to fetch data for export: ${error.message}`;

        console.error(errorMessage, error);
        setSnackbarMessage(errorMessage);
        setSnackbarOpen(true);
      }
    };

    fetchData();
  }, [groupId]);

  // ===== helper: format date array [yyyy,MM,dd,HH,mm,ss,nano] =====
  const formatLastPurchaseDate = (d) => {
    if (!d) return '';
    if (Array.isArray(d) && d.length >= 6) {
      const [y, m, day, hh, mm, ss] = d;
      const pad = (x) => String(x).padStart(2, '0');
      return `${pad(day)}/${pad(m)}/${y} ${pad(hh)}:${pad(mm)}:${pad(ss)}`;
    }
    try {
      const dt = new Date(d);
      if (!Number.isNaN(dt.getTime())) return dt.toLocaleString();
      return String(d);
    } catch {
      return String(d);
    }
  };

  // ✅ format number with comma thousands ONLY (no currency symbols)
  // - VND: 0 decimals
  // - USD/EUR: 2 decimals (bạn muốn 0 decimals cho tất cả thì đổi 2 -> 0)
  const formatMoneyNumber = (value, curr) => {
    if (value == null || value === '') return '0';

    const num = Number(value);
    if (Number.isNaN(num)) return String(value);

    const code = (curr || 'VND').trim().toUpperCase();
    const decimals = code === 'VND' ? 0 : 2;

    try {
      return new Intl.NumberFormat('en-US', {
        useGrouping: true,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    } catch {
      // fallback
      const fixed = decimals > 0 ? num.toFixed(decimals) : String(Math.round(num));
      const [intPart, decPart] = fixed.split('.');
      const withComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return decPart ? `${withComma}.${decPart}` : withComma;
    }
  };

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      setSnackbarMessage('No requisition data available to export. Please check your filters or try again later.');
      setSnackbarOpen(true);
      return;
    }

    // build supplier columns
    const allSupplierKeysSet = new Set();
    data.forEach((item) => {
      const suppliers = item.suppliers || [];
      suppliers.forEach((supplier) => {
        if (supplier?.supplierName) allSupplierKeysSet.add(supplier.supplierName);
      });
    });
    const allSupplierKeys = Array.from(allSupplierKeysSet);

    // ✅ add 4 cols for LAST PURCHASE before SELECTED SUPPLIER
    const LAST_PURCHASE_COLS = 4;

    // fixed 9 + suppliers + (lastPurchase 4 + selected 3 + diff 2 + remark 1 = 10)
    const totalCols = 9 + allSupplierKeys.length + (LAST_PURCHASE_COLS + 3 + 2 + 1);
    const wsData = [];

    // indices
    const supplierStartCol = 9;
    const supplierEndCol = 8 + allSupplierKeys.length;

    const lastPurchaseStartCol = 9 + allSupplierKeys.length;                // 4 cols
    const selectedStartCol = lastPurchaseStartCol + LAST_PURCHASE_COLS;     // 3 cols
    const differenceStartCol = selectedStartCol + 3;                        // 2 cols
    const remarkCol = differenceStartCol + 2;                               // 1 col

    // Header Row 1
    const titleRow = new Array(totalCols).fill('');
    titleRow[0] = `COMPARISON PRICE (${groupName || ''} – ${stockDate || ''})`;
    wsData.push(titleRow);

    // Header Row 2
    const headerRow2 = new Array(totalCols).fill('');
    headerRow2[0] = 'No';
    headerRow2[1] = 'Product Type 1';
    headerRow2[2] = 'Product Type 2';
    headerRow2[3] = 'Item Description';
    headerRow2[5] = 'Old SAP Code';
    headerRow2[6] = 'Hana SAP Code';
    headerRow2[7] = 'Unit';
    headerRow2[8] = 'Order Qty';

    // group titles
    if (allSupplierKeys.length > 0) headerRow2[supplierStartCol] = 'SUPPLIER';
    headerRow2[lastPurchaseStartCol] = 'LAST PURCHASE';
    headerRow2[selectedStartCol] = 'Selected Supplier';
    headerRow2[differenceStartCol] = 'Difference';
    headerRow2[remarkCol] = 'Remark';
    wsData.push(headerRow2);

    // Header Row 3
    const fixedColumns = [
      'No', 'Product Type 1', 'Product Type 2', 'EN', 'VN',
      'Old SAP Code', 'SAP Code in New SAP', 'Unit', 'Order Qty',
    ];

    const lastPurchaseColumns = [
      'Last Supplier',
      'Last Purchase Date',
      `Last Price (${currency})`,
      'Last Order Qty',
    ];

    const selectedColumns = [
      'Supplier Description',
      `Price (${currency})`,
      `Amount (${currency})`,
    ];

    const differenceColumns = [
      `Difference (${currency})`,
      `%`,
    ];

    const remarkColumns = ['Remark'];

    wsData.push([
      ...fixedColumns,
      ...allSupplierKeys,
      ...lastPurchaseColumns,
      ...selectedColumns,
      ...differenceColumns,
      ...remarkColumns,
    ]);

    // Data rows
    data.forEach((item, index) => {
      const selectedSupplier = (item.suppliers || []).find((s) => s.isSelected === 1);

      const supplierInfo = {};
      (item.suppliers || []).forEach((sup) => {
        if (!sup?.supplierName) return;
        supplierInfo[sup.supplierName] =
          sup.price != null ? formatMoneyNumber(sup.price, currency) : '';
      });

      const row = [
        index + 1,
        item.type1Name || '',
        item.type2Name || '',
        item.englishName || '',
        item.vietnameseName || '',
        item.oldSapCode || '',
        item.hanaSapCode || '',
        item.unit || '',
        item.orderQty ?? 0,

        // supplier matrix
        ...allSupplierKeys.map((key) => supplierInfo[key] || ''),

        // last purchase
        item.lastPurchaseSupplierName || '',
        formatLastPurchaseDate(item.lastPurchaseDate),
        item.lastPurchasePrice != null ? formatMoneyNumber(item.lastPurchasePrice, currency) : '',
        item.lastPurchaseOrderQty ?? '',

        // selected supplier
        selectedSupplier?.supplierName || '',
        selectedSupplier?.price != null ? formatMoneyNumber(selectedSupplier.price, currency) : '',
        formatMoneyNumber(item.amtVnd || 0, currency),

        // difference
        formatMoneyNumber(item.amtDifference || 0, currency),
        item.percentage != null ? `${parseFloat(item.percentage).toFixed(2)}%` : '0%',

        // remark
        item.remarkComparison || '',
      ];

      wsData.push(row);
    });

    const dataEndRow = 3 + data.length;

    // Total row
    const totalRow = new Array(totalCols).fill('');
    totalRow[0] = 'TOTAL';
    totalRow[selectedStartCol + 2] = formatMoneyNumber(totalAmt, currency);
    totalRow[differenceStartCol] = formatMoneyNumber(totalAmtDifference, currency);
    totalRow[differenceStartCol + 1] =
      totalDifferencePercentage != null ? `${parseFloat(totalDifferencePercentage).toFixed(2)}%` : '0%';
    wsData.push(totalRow);

    // Signature
    const signatureTitles = new Array(totalCols).fill('');
    const signatureNames = new Array(totalCols).fill('');
    const blankLine = new Array(totalCols).fill('');
    const signBlank1 = [...blankLine];
    const signBlank2 = [...blankLine];
    const signBlank3 = [...blankLine];

    const signaturePositions = [
      { title: 'Request by', name: 'DANG THI NHU NGOC' },
      { title: 'Purchasing Teamleader', name: 'Ms. SELENA TAM' },
      { title: 'Director', name: 'Mr. EJ KIM' },
    ];

    const sigWidth = 3;
    const totalSigWidth = signaturePositions.length * sigWidth;
    const colStep = Math.floor((totalCols - totalSigWidth) / (signaturePositions.length + 1));
    const startPositions = [];

    let currentCol = colStep;
    signaturePositions.forEach(() => {
      if (currentCol + sigWidth - 1 < totalCols) {
        startPositions.push(currentCol);
        currentCol += sigWidth + colStep;
      }
    });

    signaturePositions.forEach((sig, idx) => {
      if (idx < startPositions.length) {
        const startCol = startPositions[idx];
        signatureTitles[startCol] = sig.title;
        signatureNames[startCol] = sig.name;
      }
    });

    wsData.push(blankLine, signatureTitles, signBlank1, signBlank2, signatureNames, signBlank3);

    // Sheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparison');

    // Styles
    const commonBorder = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    };

    const titleStyle = {
      font: { bold: true, name: 'Times New Roman', sz: 18 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: commonBorder,
    };
    const boldHeaderStyle = {
      font: { bold: true, name: 'Times New Roman', sz: 12 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: commonBorder,
    };
    const normalCellStyle = {
      font: { name: 'Times New Roman', sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: commonBorder,
    };
    const totalStyle = {
      font: { bold: true, name: 'Times New Roman', sz: 12 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: commonBorder,
    };
    const signatureHeaderStyle = { font: { bold: true, name: 'Times New Roman', sz: 12 }, alignment: { horizontal: 'center' } };
    const signatureNameStyle = { font: { name: 'Times New Roman', sz: 12 }, alignment: { horizontal: 'center' } };

    const totalRows = wsData.length;
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
        if (r === 0) ws[cellRef].s = titleStyle;
        else if (r === 1 || r === 2) ws[cellRef].s = boldHeaderStyle;
        else if (r >= 3 && r < dataEndRow) ws[cellRef].s = normalCellStyle;
        else if (r === dataEndRow) ws[cellRef].s = totalStyle;
        else if (r === dataEndRow + 2) ws[cellRef].s = signatureHeaderStyle;
        else if (r === dataEndRow + 5) ws[cellRef].s = signatureNameStyle;
        else ws[cellRef].s = signatureNameStyle;
      }
    }

    // Merges
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
      { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } },
      { s: { r: 1, c: 2 }, e: { r: 2, c: 2 } },
      { s: { r: 1, c: 3 }, e: { r: 1, c: 4 } },
      { s: { r: 1, c: 5 }, e: { r: 2, c: 5 } },
      { s: { r: 1, c: 6 }, e: { r: 2, c: 6 } },
      { s: { r: 1, c: 7 }, e: { r: 2, c: 7 } },
      { s: { r: 1, c: 8 }, e: { r: 2, c: 8 } },

      ...(allSupplierKeys.length > 0
        ? [{ s: { r: 1, c: supplierStartCol }, e: { r: 1, c: supplierEndCol } }]
        : []),

      { s: { r: 1, c: lastPurchaseStartCol }, e: { r: 1, c: lastPurchaseStartCol + 3 } },
      { s: { r: 1, c: selectedStartCol }, e: { r: 1, c: selectedStartCol + 2 } },
      { s: { r: 1, c: differenceStartCol }, e: { r: 1, c: differenceStartCol + 1 } },
      { s: { r: 1, c: remarkCol }, e: { r: 2, c: remarkCol } },
      { s: { r: dataEndRow, c: 0 }, e: { r: dataEndRow, c: 8 } },
    ];

    startPositions.forEach((startCol) => {
      const endCol = Math.min(startCol + sigWidth - 1, totalCols - 1);
      if (startCol < totalCols) {
        merges.push(
          { s: { r: dataEndRow + 2, c: startCol }, e: { r: dataEndRow + 2, c: endCol } },
          { s: { r: dataEndRow + 5, c: startCol }, e: { r: dataEndRow + 5, c: endCol } }
        );
      }
    });

    ws['!merges'] = merges;

    // Column widths
    ws['!cols'] = new Array(totalCols).fill({ wch: 20 });
    ws['!cols'][0] = { wch: 5 };
    ws['!cols'][1] = ws['!cols'][2] = ws['!cols'][3] = ws['!cols'][4] = { wch: 20 };
    ws['!cols'][5] = ws['!cols'][6] = { wch: 15 };
    ws['!cols'][7] = ws['!cols'][8] = { wch: 10 };

    allSupplierKeys.forEach((_, idx) => {
      ws['!cols'][9 + idx] = { wch: 15 };
    });

    ws['!cols'][lastPurchaseStartCol] = { wch: 22 };
    ws['!cols'][lastPurchaseStartCol + 1] = { wch: 22 };
    ws['!cols'][lastPurchaseStartCol + 2] = { wch: 16 };
    ws['!cols'][lastPurchaseStartCol + 3] = { wch: 12 };

    ws['!cols'][selectedStartCol] = { wch: 22 };
    ws['!cols'][selectedStartCol + 1] = { wch: 16 };
    ws['!cols'][selectedStartCol + 2] = { wch: 18 };

    ws['!cols'][differenceStartCol] = { wch: 16 };
    ws['!cols'][differenceStartCol + 1] = { wch: 10 };

    ws['!cols'][remarkCol] = { wch: 30 };

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `comparison_${groupId}.xlsx`);
  };

  return (
    <>
      <Button
        variant="contained"
        color="success"
        onClick={exportToExcel}
        disabled={disabled}
        startIcon={<img src={ExcelIcon} alt="Microsoft Excel Icon" style={{ width: 20, height: 20 }} />}
        sx={{
          textTransform: 'none',
          borderRadius: 1,
          px: 2,
          py: 0.6,
          fontWeight: 600,
          fontSize: '0.75rem',
        }}
      >
        Comparison
      </Button>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
