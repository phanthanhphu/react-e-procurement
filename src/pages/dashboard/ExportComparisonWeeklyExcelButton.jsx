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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch group summary to get currency
        const groupResponse = await axios.get(
          `${API_BASE_URL}/api/group-summary-requisitions/${groupId}`,
          { headers: { Accept: '*/*' } }
        );
        if (!groupResponse.data?.currency) {
          console.warn('Warning: Currency not found, using default VND');
        }
        setCurrency(groupResponse.data.currency || 'VND');

        // Fetch comparison data
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
        console.log('API Response:', response.data);
        if (!response.data?.page?.content) {
          throw new Error('Invalid API response: Missing page.content');
        }
        setData(response.data.page.content || []);
        setTotalAmt(response.data.totalAmt || 0);
        setTotalAmtDifference(response.data.totalAmtDifference || 0);
        setTotalDifferencePercentage(response.data.totalDifferencePercentage || 0);
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

  const formatCurrency = (value, currency) => {
    const locale = currency === 'USD' ? 'en-US' : currency === 'EUR' ? 'de-DE' : 'vi-VN';
    return value != null ? value.toLocaleString(locale, { style: 'currency', currency }) : '0';
  };

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      setSnackbarMessage('No requisition data available to export. Please check your filters or try again later.');
      setSnackbarOpen(true);
      return;
    }

    const allSupplierKeysSet = new Set();
    data.forEach((item) => {
      const suppliers = item.suppliers || [];
      suppliers.forEach((supplier) => allSupplierKeysSet.add(supplier.supplierName));
    });
    const allSupplierKeys = Array.from(allSupplierKeysSet);

    const totalCols = 9 + allSupplierKeys.length + 6;
    const wsData = [];

    // Header Row 1: COMPARISON PRICE (merged A to Z)
    const titleRow = new Array(totalCols).fill('');
    titleRow[0] = 'COMPARISON PRICE';
    wsData.push(titleRow);

    // Header Row 2: Product Type 1, Product Type 2, Item Description (merge 3-4), other fixed columns, List of Suppliers, Selected Supplier, Difference, Remark
    const headerRow2 = new Array(totalCols).fill('');
    headerRow2[0] = 'No';
    headerRow2[1] = 'Product Type 1';
    headerRow2[2] = 'Product Type 2';
    headerRow2[3] = 'Item Description';
    headerRow2[5] = 'Old SAP Code';
    headerRow2[6] = 'Hana SAP Code';
    headerRow2[7] = 'Unit';
    headerRow2[8] = 'Order Qty';
    headerRow2[9] = 'SUPPLIER';
    headerRow2[9 + allSupplierKeys.length] = 'Selected Supplier';
    headerRow2[9 + allSupplierKeys.length] = 'Selected Supplier';
    headerRow2[9 + allSupplierKeys.length + 3] = 'Difference';
    headerRow2[9 + allSupplierKeys.length + 5] = 'Remark';
    wsData.push(headerRow2);

    // Header Row 3: Detailed columns
    const fixedColumns = [
      'No',
      'Product Type 1',
      'Product Type 2',
      'EN',
      'VN',
      'Old SAP Code',
      'SAP Code in New SAP',
      'Unit',
      'Order Qty',
    ];
    const dynamicColumns = allSupplierKeys;
    const finalColumns = [
      'Supplier Description',
      `Price (${currency})`,
      `Amount (${currency})`,
      `Amount (${currency})`,
      `% (${currency})`,
      '',
    ];
    wsData.push([...fixedColumns, ...dynamicColumns, ...finalColumns]);

    // Data rows
    data.forEach((item, index) => {
      const {
        type1Name,
        type2Name,
        englishName,
        vietnameseName,
        oldSapCode,
        hanaSapCode,
        suppliers,
        remarkComparison,
        unit,
        orderQty,
        amtVnd,
        amtDifference,
        percentage,
      } = item;
      const selectedSupplier = suppliers?.find((sup) => sup.isSelected === 1) || null;

      const supplierInfo = {};
      (suppliers || []).forEach((sup) => {
        supplierInfo[sup.supplierName] = sup.price ? formatCurrency(sup.price, currency) : '';
      });

      const row = [
        index + 1,
        type1Name || '',
        type2Name || '',
        englishName || '',
        vietnameseName || '',
        oldSapCode || '',
        hanaSapCode || '',
        unit || '',
        orderQty != null ? orderQty : 0,
        ...allSupplierKeys.map((key) => supplierInfo[key] || ''),
        selectedSupplier ? selectedSupplier.supplierName : '',
        selectedSupplier ? formatCurrency(selectedSupplier.price, currency) : '',
        formatCurrency(amtVnd, currency),
        formatCurrency(amtDifference, currency),
        percentage != null ? `${parseFloat(percentage).toFixed(2)}%` : '0%',
        remarkComparison || '',
      ];
      wsData.push(row);
    });

    const dataEndRow = 3 + data.length;

    // Total row
    const totalRow = new Array(totalCols).fill('');
    totalRow[0] = 'TOTAL';
    totalRow[9 + allSupplierKeys.length + 2] = formatCurrency(totalAmt, currency);
    totalRow[9 + allSupplierKeys.length + 3] = formatCurrency(totalAmtDifference, currency);
    totalRow[9 + allSupplierKeys.length + 4] = totalDifferencePercentage != null ? `${parseFloat(totalDifferencePercentage).toFixed(2)}%` : '0%';
    wsData.push(totalRow);

    // Signature rows
    const signatureTitles = new Array(totalCols).fill('');
    const signatureNames = new Array(totalCols).fill('');
    const blankLine = new Array(totalCols).fill('');
    const signBlank1 = [...blankLine];
    const signBlank2 = [...blankLine];
    const signBlank3 = [...blankLine];

    const signaturePositions = [
      { title: 'Request by', name: 'DANG THI NHU NGOC' },
      { title: 'Purchasing Teamleader', name: 'Ms. SELENA TAM' },
      { title: 'Purchasing Manager', name: 'Mr. EJ KIM' },
    ];

    const sigWidth = 3;
    const totalSigWidth = signaturePositions.length * sigWidth;
    const colStep = Math.floor((totalCols - totalSigWidth) / (signaturePositions.length + 1));
    const startPositions = [];

    let currentCol = colStep;
    signaturePositions.forEach((_, index) => {
      if (currentCol + sigWidth - 1 < totalCols) {
        startPositions.push(currentCol);
        currentCol += sigWidth + colStep;
      }
    });

    signaturePositions.forEach((sig, index) => {
      if (index < startPositions.length) {
        const startCol = startPositions[index];
        signatureTitles[startCol] = sig.title;
        signatureNames[startCol] = sig.name;
      }
    });

    wsData.push(blankLine, signatureTitles, signBlank1, signBlank2, signatureNames, signBlank3);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparison');

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

    const signatureHeaderStyle = {
      font: { bold: true, name: 'Times New Roman', sz: 12 },
      alignment: { horizontal: 'center' },
    };

    const signatureNameStyle = {
      font: { name: 'Times New Roman', sz: 12 },
      alignment: { horizontal: 'center' },
    };

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

    const supplierStartCol = 9;
    const supplierEndCol = 8 + allSupplierKeys.length;
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
      { s: { r: 1, c: supplierStartCol }, e: { r: 1, c: supplierEndCol } },
      { s: { r: 1, c: 9 + allSupplierKeys.length }, e: { r: 1, c: 9 + allSupplierKeys.length + 2 } },
      { s: { r: 1, c: 9 + allSupplierKeys.length + 3 }, e: { r: 1, c: 9 + allSupplierKeys.length + 4 } },
      { s: { r: 1, c: 9 + allSupplierKeys.length + 5 }, e: { r: 2, c: 9 + allSupplierKeys.length + 5 } },
      { s: { r: dataEndRow, c: 0 }, e: { r: dataEndRow, c: 8 } },
    ];

    startPositions.forEach((startCol, index) => {
      const endCol = Math.min(startCol + sigWidth - 1, totalCols - 1);
      if (startCol < totalCols) {
        merges.push({ s: { r: dataEndRow + 2, c: startCol }, e: { r: dataEndRow + 2, c: endCol } });
        merges.push({ s: { r: dataEndRow + 5, c: startCol }, e: { r: dataEndRow + 5, c: endCol } });
      }
    });

    ws['!merges'] = merges;

    ws['!cols'] = new Array(totalCols).fill({ wch: 20 });
    ws['!cols'][0] = { wch: 5 };
    ws['!cols'][1] = { wch: 20 };
    ws['!cols'][2] = { wch: 20 };
    ws['!cols'][3] = { wch: 20 };
    ws['!cols'][4] = { wch: 20 };
    ws['!cols'][5] = { wch: 15 };
    ws['!cols'][6] = { wch: 15 };
    ws['!cols'][7] = { wch: 10 };
    ws['!cols'][8] = { wch: 10 };
    allSupplierKeys.forEach((_, idx) => { ws['!cols'][9 + idx] = { wch: 15 }; });
    ws['!cols'][9 + allSupplierKeys.length] = { wch: 20 };
    ws['!cols'][9 + allSupplierKeys.length + 1] = { wch: 15 };
    ws['!cols'][9 + allSupplierKeys.length + 2] = { wch: 20 };
    ws['!cols'][9 + allSupplierKeys.length + 3] = { wch: 15 };
    ws['!cols'][9 + allSupplierKeys.length + 4] = { wch: 10 };
    ws['!cols'][9 + allSupplierKeys.length + 5] = { wch: 30 };

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
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}