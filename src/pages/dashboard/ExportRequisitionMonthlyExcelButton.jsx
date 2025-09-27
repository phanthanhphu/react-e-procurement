import React, { useEffect } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button } from '@mui/material';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';

export default function ExportRequisitionMonthlyExcelButton({ groupId, data, searchValues }) {
  useEffect(() => {
    console.log('ExportRequisitionMonthlyExcelButton data:', data);
    console.log('ExportRequisitionMonthlyExcelButton groupId:', groupId);
  }, [data, groupId]);

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Check for invalid data
    const invalidItems = data.filter((item) => item.itemDescriptionEN === 'BNH');
    if (invalidItems.length > 0) {
      console.warn('Unexpected items found:', invalidItems);
      alert('Data contains unexpected items (e.g., BNH). Please refresh the page.');
      return;
    }

    const allDeptKeysSet = new Set();
    data.forEach((item) => {
      (item.departmentRequests || []).forEach((dept) => allDeptKeysSet.add(dept.name));
    });
    const allDeptKeys = Array.from(allDeptKeysSet);

    const wsData = [];

    // Title row
    const titleRow = new Array(9 + allDeptKeys.length + 7).fill('');
    titleRow[0] = 'REQUEST MONTHLY';
    wsData.push(titleRow);

    // Header rows
    wsData.push([
      'No',
      'Product Type 1 Code',
      'Product Type 2 Code',
      'Description',
      '',
      'Old SAP Code',
      'SAP Code in New SAP',
      'Unit',
      ...Array(allDeptKeys.length).fill("Department Buy Q'ty"),
      'Total Buy Qty',
      'Total Not Issued Qty',
      'In Hand',
      'Actual In Hand',
      'Purchasing Suggest',
      'Price',
      'Amount',
      'Suppliers',
    ]);

    wsData.push([
      '',
      '',
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
      '',
      '',
      '',
    ]);

    // Data rows
    data.forEach((item, index) => {
      const deptBuy = {};
      (item.departmentRequests || []).forEach((dept) => {
        deptBuy[dept.name] = dept.buy || 0;
      });

      // Định dạng giá tiền cho Price và Amount
      const formattedPrice = (item.price || 0).toLocaleString('vi-VN', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      const formattedAmount = (item.amount || 0).toLocaleString('vi-VN', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

      const row = [
        index + 1,
        item.groupItem1 || '',
        item.groupItem2 || '',
        item.itemDescriptionEN || '',
        item.itemDescriptionVN || '',
        item.oldSAPCode || '',
        item.sapCodeNewSAP || '',
        item.unit || '',
        ...allDeptKeys.map((key) => deptBuy[key] || ''),
        item.sumBuy || 0,
        item.totalNotIssuedQty || 0,
        item.inHand || 0,
        item.actualInHand || 0,
        item.orderQty || '',
        formattedPrice,
        formattedAmount,
        item.supplierName || '',
      ];

      wsData.push(row);
    });

    // Calculate total values manually
    const totalBuyQty = data.reduce((sum, item) => sum + (item.sumBuy || 0), 0);
    const totalNotIssuedQty = data.reduce((sum, item) => sum + (item.totalNotIssuedQty || 0), 0);
    const totalInHand = data.reduce((sum, item) => sum + (item.inHand || 0), 0);
    const totalActualInHand = data.reduce((sum, item) => sum + (item.actualInHand || 0), 0);
    const totalPurchasingSuggest = data.reduce((sum, item) => sum + (item.orderQty || 0), 0);
    const totalPrice = data.reduce((sum, item) => sum + (item.price || 0), 0);
    const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);

    // Định dạng tổng giá tiền cho Total Price và Total Amount
    const formattedTotalPrice = totalPrice.toLocaleString('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const formattedTotalAmount = totalAmount.toLocaleString('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    // Insert total row
    const totalRow = new Array(9 + allDeptKeys.length + 7).fill('');
    totalRow[0] = 'Total';
    totalRow[8 + allDeptKeys.length] = totalBuyQty;
    totalRow[9 + allDeptKeys.length] = totalNotIssuedQty;
    totalRow[10 + allDeptKeys.length] = totalInHand;
    totalRow[11 + allDeptKeys.length] = totalActualInHand;
    totalRow[12 + allDeptKeys.length] = totalPurchasingSuggest;
    totalRow[13 + allDeptKeys.length] = formattedTotalPrice;
    totalRow[14 + allDeptKeys.length] = formattedTotalAmount;
    wsData.push(totalRow);

    const totalCols = 9 + allDeptKeys.length + 7;
    const dataEndRow = 3 + data.length - 1;
    const totalRowIndex = 3 + data.length;

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
      { title: 'Approval by', name: 'Mr. YONGUK LEE' },
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

    signaturePositions.forEach((sig, index) => {
      const startCol = startPositions[index];
      signatureTitles[startCol] = sig.title;
      signatureNames[startCol] = sig.name;
    });

    wsData.push(blankLine, signatureTitles, signBlank1, signBlank2, signatureNames, signBlank3);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Request Monthly');

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
        else if (r >= 3 && r <= dataEndRow) ws[cellRef].s = normalCellStyle;
        else if (r === totalRowIndex) ws[cellRef].s = totalStyle;
        else if (r === dataEndRow + 3) ws[cellRef].s = signatureHeaderStyle;
        else if (r === dataEndRow + 6) ws[cellRef].s = signatureNameStyle;
        else ws[cellRef].s = signatureNameStyle;
      }
    }

    // Merge cells
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
      { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } },
      { s: { r: 1, c: 2 }, e: { r: 2, c: 2 } },
      { s: { r: 1, c: 3 }, e: { r: 1, c: 4 } },
      { s: { r: 1, c: 5 }, e: { r: 2, c: 5 } },
      { s: { r: 1, c: 6 }, e: { r: 2, c: 6 } },
      { s: { r: 1, c: 7 }, e: { r: 2, c: 7 } },
      { s: { r: 1, c: 8 }, e: { r: 1, c: 8 + allDeptKeys.length - 1 } },
      { s: { r: 1, c: 8 + allDeptKeys.length }, e: { r: 2, c: 8 + allDeptKeys.length } },
      { s: { r: 1, c: 9 + allDeptKeys.length }, e: { r: 2, c: 9 + allDeptKeys.length } },
      { s: { r: 1, c: 10 + allDeptKeys.length }, e: { r: 2, c: 10 + allDeptKeys.length } },
      { s: { r: 1, c: 11 + allDeptKeys.length }, e: { r: 2, c: 11 + allDeptKeys.length } },
      { s: { r: 1, c: 12 + allDeptKeys.length }, e: { r: 2, c: 12 + allDeptKeys.length } },
      { s: { r: 1, c: 13 + allDeptKeys.length }, e: { r: 2, c: 13 + allDeptKeys.length } },
      { s: { r: 1, c: 14 + allDeptKeys.length }, e: { r: 2, c: 14 + allDeptKeys.length } },
      { s: { r: 1, c: 15 + allDeptKeys.length }, e: { r: 2, c: 15 + allDeptKeys.length } },
    ];

    startPositions.forEach((startCol) => {
      const endCol = Math.min(startCol + sigWidth - 1, totalCols - 1);
      merges.push({ s: { r: dataEndRow + 3, c: startCol }, e: { r: dataEndRow + 3, c: endCol } });
      merges.push({ s: { r: dataEndRow + 6, c: startCol }, e: { r: dataEndRow + 6, c: endCol } });
    });

    ws['!merges'] = merges;

    ws['!cols'] = new Array(totalCols).fill({ wch: 20 });
    ws['!cols'][0] = { wch: 5 };
    ws['!cols'][1] = { wch: 12 };
    ws['!cols'][2] = { wch: 12 };
    ws['!cols'][5] = { wch: 12 };
    ws['!cols'][15] = { wch: 12 };
    ws['!cols'][16] = { wch: 12 };

    // Generate dynamic file name
    const now = new Date('2025-09-24T13:33:00+07:00'); // Hardcoded for provided date/time
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const fileName = `request_monthly_${day}${month}${year}_${hours}${minutes}.xlsx`;

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
  };

  return (
    <Button
      variant="contained"
      color="success"
      onClick={exportToExcel}
      disabled={data.length === 0}
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
      Export Request Monthly
    </Button>
  );
}