import React from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button } from '@mui/material';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';

export default function ExportComparisonExcelButton({ data }) {
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const allDeptKeysSet = new Set();
    data.forEach((item) => {
      const deptQty = item.requisition.departmentRequestQty || {};
      Object.keys(deptQty).forEach((key) => allDeptKeysSet.add(key));
    });
    const allDeptKeys = Array.from(allDeptKeysSet);

    const wsData = [];

    const titleRow = new Array(6 + allDeptKeys.length + 8).fill('');
    titleRow[6] = 'COMPARISON SUMMARY';
    wsData.push(titleRow);

    wsData.push([
      'No',
      'Item Description (EN)',
      'Item Description (VN)',
      'Old SAP Code',
      'SAP Code in New SAP',
      'Order Unit',
      ...Array(allDeptKeys.length).fill("Department Request Q'ty"),
      'Total Request Qty',
      'Supplier',
      'Unit Price (VND)',
      'Total Amount (VND)',
      'Amount Difference (VND)',
      'Difference (%)',
      'Remark',
    ]);

    wsData.push([
      '', '', '', '', '', '',
      ...allDeptKeys,
      '', '', '', '', '', '', ''
    ]);

    data.forEach((item, index) => {
      const { requisition, supplierProduct } = item;
      const deptQty = requisition.departmentRequestQty || {};
      const totalQty = allDeptKeys.reduce((sum, key) => sum + (deptQty[key] || 0), 0);
      const unitPrice = supplierProduct.price;
      const totalAmount = unitPrice * totalQty;
      const amountDiff = 0; // Bạn có thể thay bằng logic thực tế nếu có
      const diffPercent = '0%'; // Tương tự

      const row = [
        index + 1,
        requisition.englishName,
        requisition.vietnameseName,
        requisition.oldSapCode,
        requisition.newSapCode,
        supplierProduct.unit,
        ...allDeptKeys.map((key) => deptQty[key] || ''),
        totalQty,
        supplierProduct.name,
        unitPrice,
        totalAmount,
        amountDiff,
        diffPercent,
        requisition.remark || '',
      ];

      wsData.push(row);
    });

    const totalCols = 6 + allDeptKeys.length + 8;

    // Chữ ký
    const signatureTitles = new Array(totalCols).fill('');
    signatureTitles[0] = 'Request by';
    signatureTitles[5] = 'Purchasing Teamleader';
    signatureTitles[10] = 'Purchasing Manager';
    signatureTitles[14] = 'Approval by';

    const blankLine = new Array(totalCols).fill('');
    const signatureNames = new Array(totalCols).fill('');
    signatureNames[0] = 'DANG THI NHU NGOC';
    signatureNames[5] = 'Ms. SELENA TAM';
    signatureNames[10] = 'Mr. EJ KIM';
    signatureNames[14] = 'Mr. YONGUK LEE';

    wsData.push(signatureTitles, blankLine, blankLine, signatureNames, blankLine);

    // Tạo sheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparison');

    // Style
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
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

        if (r === 0) ws[cellRef].s = titleStyle;
        else if (r === 1 || r === 2) ws[cellRef].s = boldHeaderStyle;
        else if (r >= 3 && r < totalRows - 5) ws[cellRef].s = normalCellStyle;
        else if (r === totalRows - 5) ws[cellRef].s = signatureHeaderStyle;
        else if (r === totalRows - 2) ws[cellRef].s = signatureNameStyle;
        else ws[cellRef].s = signatureNameStyle;
      }
    }

    // Merge ô
    const merges = [
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }, // No
      { s: { r: 0, c: 6 }, e: { r: 0, c: 6 + allDeptKeys.length - 1 } },
      { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } }, // Item Desc
      { s: { r: 1, c: 3 }, e: { r: 2, c: 3 } },
      { s: { r: 1, c: 4 }, e: { r: 2, c: 4 } },
      { s: { r: 1, c: 5 }, e: { r: 2, c: 5 } },
      { s: { r: 1, c: 6 }, e: { r: 1, c: 6 + allDeptKeys.length - 1 } },
      { s: { r: 1, c: 6 + allDeptKeys.length }, e: { r: 2, c: 6 + allDeptKeys.length } },
      { s: { r: 1, c: 7 + allDeptKeys.length }, e: { r: 2, c: 7 + allDeptKeys.length } },
      { s: { r: 1, c: 8 + allDeptKeys.length }, e: { r: 2, c: 8 + allDeptKeys.length } },
      { s: { r: 1, c: 9 + allDeptKeys.length }, e: { r: 2, c: 9 + allDeptKeys.length } },
      { s: { r: 1, c: 10 + allDeptKeys.length }, e: { r: 2, c: 10 + allDeptKeys.length } },
      { s: { r: 1, c: 11 + allDeptKeys.length }, e: { r: 2, c: 11 + allDeptKeys.length } },
      { s: { r: 1, c: 12 + allDeptKeys.length }, e: { r: 2, c: 12 + allDeptKeys.length } },

      // Merge chữ ký
      { s: { r: totalRows - 5, c: 0 }, e: { r: totalRows - 5, c: 2 } },
      { s: { r: totalRows - 5, c: 5 }, e: { r: totalRows - 5, c: 7 } },
      { s: { r: totalRows - 5, c: 10 }, e: { r: totalRows - 5, c: 12 } },
      { s: { r: totalRows - 5, c: 14 }, e: { r: totalRows - 5, c: 16 } },
      { s: { r: totalRows - 2, c: 0 }, e: { r: totalRows - 2, c: 2 } },
      { s: { r: totalRows - 2, c: 5 }, e: { r: totalRows - 2, c: 7 } },
      { s: { r: totalRows - 2, c: 10 }, e: { r: totalRows - 2, c: 12 } },
      { s: { r: totalRows - 2, c: 14 }, e: { r: totalRows - 2, c: 16 } },
    ];

    ws['!merges'] = merges;
    ws['!cols'] = new Array(totalCols).fill({ wch: 20 });
    ws['!rows'] = wsData.map(() => ({ hpt: 24 }));

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });

    // ✅ Đổi tên file tại đây:
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'comparison_summary.xlsx');
  };

  return (
    <Button
      variant="contained"
      color="success"
      onClick={exportToExcel}
      startIcon={<img src={ExcelIcon} alt="Export to Excel" style={{ width: 20, height: 20 }} />}
    >
      Export Comparison Excel
    </Button>
  );
}
