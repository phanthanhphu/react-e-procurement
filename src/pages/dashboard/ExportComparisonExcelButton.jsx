import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button } from '@mui/material';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';
import { API_BASE_URL } from '../../config';

export default function ExportComparisonExcelButton({ disabled, groupId }) {
  const [data, setData] = useState([]);
  const [totalAmtVnd, setTotalAmtVnd] = useState(0);
  const [totalAmtDifference, setTotalAmtDifference] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/summary-requisitions/search/comparison?groupId=${groupId}&filter=false`,
          { headers: { Accept: '*/*' } }
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        setData(result.requisitions || []);
        setTotalAmtVnd(result.totalAmtVnd || 0);
        setTotalAmtDifference(result.totalAmtDifference || 0);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        alert('Failed to fetch data for export. Please try again.');
      }
    };
    fetchData();
  }, [groupId]);

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('No requisition data available to export. Please check your filters or try again later.');
      return;
    }

    const allSupplierKeysSet = new Set();
    data.forEach((item) => {
      const suppliers = item.suppliers || [];
      suppliers.forEach((supplier) => allSupplierKeysSet.add(supplier.supplierName));
    });
    const allSupplierKeys = Array.from(allSupplierKeysSet);

    const totalCols = 7 + allSupplierKeys.length + 6;
    const wsData = [];

    // Header Row 1: COMPARISON PRICE (merged A to Z)
    const titleRow = new Array(totalCols).fill('');
    titleRow[0] = 'COMPARISON PRICE';
    wsData.push(titleRow);

    // Header Row 2: Item Description (merge 1-2), other fixed columns, List of Suppliers, Selected Supplier, Difference, Remark
    const headerRow2 = new Array(totalCols).fill('');
    headerRow2[0] = 'No';
    headerRow2[1] = 'Item Description';
    headerRow2[3] = 'Old SAP Code';
    headerRow2[4] = 'SAP Code in New SAP';
    headerRow2[5] = 'Unit';
    headerRow2[6] = 'Order Buy';
    headerRow2[7] = 'SUPPLIER';
    headerRow2[7 + allSupplierKeys.length] = 'Selected Supplier';
    headerRow2[7 + allSupplierKeys.length + 3] = 'Difference';
    headerRow2[7 + allSupplierKeys.length + 5] = 'Remark';
    wsData.push(headerRow2);

    // Header Row 3: Detailed columns
    const fixedColumns = ['No', 'English Name', 'Vietnamese Name', 'Old SAP Code', 'SAP Code in New SAP', 'Unit', 'Order Buy'];
    const dynamicColumns = allSupplierKeys;
    const finalColumns = ['Supplier Name', 'Price', 'Amt(VND) (Selected)', 'Amt(VND) (Difference)', '%', ''];
    wsData.push([...fixedColumns, ...dynamicColumns, ...finalColumns]);

    // Data rows
    data.forEach((item, index) => {
      const { englishName, vietnameseName, oldSapCode, newSapCode, suppliers, remarkComparison, departmentRequests, unit, amtVnd, amtDifference, percentage } = item;
      const selectedSupplier = suppliers?.find((sup) => sup.isSelected === 1) || null;
      const totalBuy = departmentRequests?.reduce((sum, dept) => sum + (dept.buy || 0), 0) || 0;

      const supplierInfo = {};
      (suppliers || []).forEach((sup) => {
        supplierInfo[sup.supplierName] = sup.price ? sup.price.toLocaleString('vi-VN') : '';
      });

      const row = [
        index + 1,
        englishName || '',
        vietnameseName || '',
        oldSapCode || '',
        newSapCode || '',
        unit || '',
        totalBuy,
        ...allSupplierKeys.map((key) => supplierInfo[key] || ''),
        selectedSupplier ? selectedSupplier.supplierName : '',
        selectedSupplier ? selectedSupplier.price?.toLocaleString('vi-VN') || '' : '',
        amtVnd ? amtVnd.toLocaleString('vi-VN') : '',
        amtDifference ? amtDifference.toLocaleString('vi-VN') : '',
        percentage ? `${percentage.toFixed(2)}%` : '0%',
        remarkComparison || '',
      ];
      wsData.push(row);
    });

    const dataEndRow = 3 + data.length;

    // Total row
    const totalRow = new Array(totalCols).fill('');
    totalRow[0] = 'TOTAL';
    totalRow[7 + allSupplierKeys.length + 2] = totalAmtVnd.toLocaleString('vi-VN');
    totalRow[7 + allSupplierKeys.length + 3] = totalAmtDifference.toLocaleString('vi-VN');
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

    const supplierStartCol = 7;
    const supplierEndCol = 6 + allSupplierKeys.length;
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
      { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } },
      { s: { r: 1, c: 3 }, e: { r: 2, c: 3 } },
      { s: { r: 1, c: 4 }, e: { r: 2, c: 4 } },
      { s: { r: 1, c: 5 }, e: { r: 2, c: 5 } },
      { s: { r: 1, c: 6 }, e: { r: 2, c: 6 } },
      { s: { r: 1, c: supplierStartCol }, e: { r: 1, c: supplierEndCol } },
      { s: { r: 1, c: 7 + allSupplierKeys.length }, e: { r: 1, c: 7 + allSupplierKeys.length + 2 } },
      { s: { r: 1, c: 7 + allSupplierKeys.length + 3 }, e: { r: 1, c: 7 + allSupplierKeys.length + 4 } },
      { s: { r: 1, c: 7 + allSupplierKeys.length + 5 }, e: { r: 2, c: 7 + allSupplierKeys.length + 5 } },
      { s: { r: dataEndRow, c: 0 }, e: { r: dataEndRow, c: 6 } },
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
    ws['!cols'][3] = { wch: 15 };
    ws['!cols'][4] = { wch: 15 };
    ws['!cols'][5] = { wch: 10 };
    ws['!cols'][6] = { wch: 10 };
    allSupplierKeys.forEach((_, idx) => { ws['!cols'][7 + idx] = { wch: 15 }; });
    ws['!cols'][7 + allSupplierKeys.length] = { wch: 20 };
    ws['!cols'][7 + allSupplierKeys.length + 1] = { wch: 15 };
    ws['!cols'][7 + allSupplierKeys.length + 2] = { wch: 20 };
    ws['!cols'][7 + allSupplierKeys.length + 3] = { wch: 15 };
    ws['!cols'][7 + allSupplierKeys.length + 4] = { wch: 10 };
    ws['!cols'][7 + allSupplierKeys.length + 5] = { wch: 30 };

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `comparison_price_${groupId}.xlsx`);
  };

  return (
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
      Export Comparison Excel
    </Button>
  );
}