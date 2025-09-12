import React from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button } from '@mui/material';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';

export default function ExportExcelButton({ data }) {
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Generate department keys from departmentRequests array
    const allDeptKeysSet = new Set();
    data.forEach((item) => {
      const deptRequests = item.departmentRequests || [];
      deptRequests.forEach((dept) => allDeptKeysSet.add(dept.departmentName));
    });
    const allDeptKeys = Array.from(allDeptKeysSet);

    const wsData = [];

    // Title row
    const titleRow = new Array(6 + allDeptKeys.length + 5).fill('');
    titleRow[0] = 'SUMMARY REQUISITION';
    wsData.push(titleRow);

    // Header rows
    wsData.push([
      'No',
      'Description',
      '',
      'Old SAP Code',
      'SAP Code in New SAP',
      'Unit',
      ...Array(allDeptKeys.length).fill("Department Request Q'ty"),
      'Total Request Qty',
      'Stock (01/08/2025)',
      'Purchasing Suggest',
      'Reason',
      'Remark',
    ]);

    wsData.push([
      '',
      'English Name',
      'Vietnamese Name',
      '',
      '',
      '',
      ...allDeptKeys,
      '',
      '',
      '',
      '',
      '',
    ]);

    // Data rows
    data.forEach((item, index) => {
      const { requisition, supplierProduct, departmentRequests } = item;
      const deptQty = {};
      (departmentRequests || []).forEach((dept) => {
        deptQty[dept.departmentName] = dept.quantity;
      });
      const totalQty = (departmentRequests || []).reduce((sum, dept) => sum + (dept.quantity || 0), 0);

      const row = [
        index + 1,
        requisition.englishName || '',
        requisition.vietnameseName || '',
        requisition.oldSapCode || '',
        requisition.newSapCode || '',
        supplierProduct?.unit || '',
        ...allDeptKeys.map((key) => deptQty[key] || ''),
        totalQty,
        requisition.stock || 0,
        requisition.purchasingSuggest || '',
        requisition.reason || '',
        requisition.remark || '',
      ];

      wsData.push(row);
    });

    const totalCols = 6 + allDeptKeys.length + 5;
    const dataEndRow = 3 + data.length - 1; // 0-based index of last data row

    // Signature rows (below the table, distributed within table width)
    const signatureTitles = new Array(totalCols).fill('');
    const signatureNames = new Array(totalCols).fill('');
    const blankLine = new Array(totalCols).fill('');
    const signBlank1 = [...blankLine];
    const signBlank2 = [...blankLine];
    const signBlank3 = [...blankLine];

    // Define signatures
    const signaturePositions = [
      { title: 'Request by', name: 'DANG THI NHU NGOC' },
      { title: 'Purchasing Teamleader', name: 'Ms. SELENA TAM' },
      { title: 'Purchasing Manager', name: 'Mr. EJ KIM' },
      { title: 'Approval by', name: 'Mr. YONGUK LEE' },
    ];

    // Calculate dynamic signature positions
    const sigWidth = 3; // Number of columns to merge for each signature
    const totalSigWidth = signaturePositions.length * sigWidth;
    const availableCols = totalCols;
    const colStep = Math.floor((availableCols - totalSigWidth) / (signaturePositions.length + 1)); // Space between signatures
    const startPositions = [];

    // Calculate start positions for each signature
    let currentCol = colStep; // Start after some padding
    signaturePositions.forEach((_, index) => {
      if (currentCol + sigWidth - 1 < totalCols) {
        startPositions.push(currentCol);
        currentCol += sigWidth + colStep; // Move to next position
      }
    });

    // Assign signatures to calculated positions
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
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

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
        if (!ws[cellRef]) {
          ws[cellRef] = { t: 's', v: '' };
        }

        if (r === 0) ws[cellRef].s = titleStyle;
        else if (r === 1 || r === 2) ws[cellRef].s = boldHeaderStyle;
        else if (r >= 3 && r <= dataEndRow) ws[cellRef].s = normalCellStyle;
        else if (r === dataEndRow + 2) ws[cellRef].s = signatureHeaderStyle;
        else if (r === dataEndRow + 5) ws[cellRef].s = signatureNameStyle;
        else ws[cellRef].s = signatureNameStyle;
      }
    }

    // Merges
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // Title from No to Remark
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }, // No
      { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } }, // Description
      { s: { r: 1, c: 3 }, e: { r: 2, c: 3 } },
      { s: { r: 1, c: 4 }, e: { r: 2, c: 4 } },
      { s: { r: 1, c: 5 }, e: { r: 2, c: 5 } },
      { s: { r: 1, c: 6 }, e: { r: 1, c: 6 + allDeptKeys.length - 1 } },
      { s: { r: 1, c: 6 + allDeptKeys.length }, e: { r: 2, c: 6 + allDeptKeys.length } },
      { s: { r: 1, c: 7 + allDeptKeys.length }, e: { r: 2, c: 7 + allDeptKeys.length } },
      { s: { r: 1, c: 8 + allDeptKeys.length }, e: { r: 2, c: 8 + allDeptKeys.length } },
      { s: { r: 1, c: 9 + allDeptKeys.length }, e: { r: 2, c: 9 + allDeptKeys.length } },
      { s: { r: 1, c: 10 + allDeptKeys.length }, e: { r: 2, c: 10 + allDeptKeys.length } },
    ];

    // Add signature merges dynamically
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
    allDeptKeys.forEach((_, idx) => {
      ws['!cols'][6 + idx] = { wch: 12 };
    });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    console.log('wbout size:', wbout.length); // Debug output
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'summary_requisition.xlsx');
  };

  return (
    <Button
      variant="contained"
      color="success"
      onClick={exportToExcel}
      startIcon={<img src={ExcelIcon} alt="Excel Icon" style={{ width: 20, height: 20 }} />}
      sx={{
        textTransform: 'none',
        borderRadius: 1,
        px: 2,
        py: 0.6,
        fontWeight: 600,
        fontSize: '0.75rem',
      }}
    >
      Export Urgent Excel
    </Button>
  );
}