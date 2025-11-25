import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button } from '@mui/material';
import axios from 'axios';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';
import { API_BASE_URL } from '../../config.js';

export default function ExportRequisitionMonthlyExcelButton({ groupId, searchValues }) {
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({
    totalSumRequestQty: 0,
    totalSumDailyMedInventory: 0,
    totalSumSafeStock: 0,
    totalSumOrderQty: 0,
    totalSumAmount: 0,
    totalSumPrice: 0,
    // ĐÃ XÓA totalSumUseStockQty
  });

  useEffect(() => {
    if (!groupId) {
      console.warn('No groupId provided for export');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/requisition-monthly/filter`, {
          params: {
            groupId,
            hasFilter: false,
            disablePagination: true,
            page: 0,
            size: 2147483647,
            sort: 'string',
          },
          headers: { Accept: '*/*' },
        });

        const responseData = response.data.requisitions.content;
        const mappedData = responseData.map((item) => ({
          id: item.id || '',
          groupItem1: item.productType1Name || '',
          groupItem2: item.productType2Name || '',
          itemDescriptionEN: item.itemDescriptionEN || '',
          itemDescriptionVN: item.itemDescriptionVN || '',
          oldSAPCode: item.oldSAPCode || '',
          hanaSAPCode: item.hanaSAPCode || '',
          unit: item.unit || '',
          departmentRequests: item.departmentRequisitions.map((dept) => ({
            id: dept.id || '',
            name: dept.name || '',
            qty: dept.qty || 0,
            buy: dept.buy || 0,
          })),
          sumBuy: item.totalRequestQty || 0,
          dailyMedInventory: item.dailyMedInventory || 0,
          safeStock: item.safeStock || 0,           // Safe Stock vẫn giữ nguyên
          // ĐÃ XÓA useStockQty
          orderQty: item.orderQty || 0,
          price: item.price || 0,
          amount: item.amount || 0,
          supplierName: item.supplierName || '',
        }));

        setData(mappedData);
        setTotals({
          totalSumRequestQty: response.data.totalSumRequestQty || 0,
          totalSumDailyMedInventory: response.data.totalSumDailyMedInventory || 0,
          totalSumSafeStock: response.data.totalSumSafeStock || 0,
          totalSumOrderQty: response.data.totalSumOrderQty || 0,
          totalSumAmount: response.data.totalSumAmount || 0,
          totalSumPrice: response.data.totalSumPrice || 0,
          // ĐÃ XÓA totalSumUseStockQty
        });
      } catch (error) {
        console.error('Error fetching data for export:', error);
      }
    };

    fetchData();
  }, [groupId]);

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const invalidItems = data.filter((item) => item.itemDescriptionEN === 'BNH');
    if (invalidItems.length > 0) {
      alert('Data contains unexpected items (e.g., BNH). Please refresh the page.');
      return;
    }

    const allDeptKeysSet = new Set();
    data.forEach((item) => {
      (item.departmentRequests || []).forEach((dept) => allDeptKeysSet.add(dept.name));
    });
    const allDeptKeys = Array.from(allDeptKeysSet);

    const wsData = [];

    // Bỏ 1 cột → +6 thay vì +7
    const totalCols = 9 + allDeptKeys.length + 6;

    // Title
    const titleRow = new Array(totalCols).fill('');
    titleRow[0] = 'REQUEST MONTHLY';
    wsData.push(titleRow);

    // Header 1
    wsData.push([
      'No',
      'Product Type 1',
      'Product Type 2',
      'Description',
      '',
      'Old SAP Code',
      'Hana SAP Code',
      'Unit',
      ...Array(allDeptKeys.length).fill('Departments'),
      'Total Request',
      'Daily Med Inventory',
      'Safe Stock',        // Vẫn giữ
      'Order Q\'ty',
      'Price',
      'Amount',
      'Suppliers',
    ]);

    // Header 2
    wsData.push([
      '',
      '',
      '',
      'EN',
      'VN',
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
    ]);

    // Data rows
    data.forEach((item, index) => {
      const deptBuy = {};
      (item.departmentRequests || []).forEach((dept) => {
        deptBuy[dept.name] = dept.buy || 0;
      });

      const formattedPrice = (item.price || 0).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      const formattedAmount = (item.amount || 0).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

      const row = [
        index + 1,
        item.groupItem1 || '',
        item.groupItem2 || '',
        item.itemDescriptionEN || '',
        item.itemDescriptionVN || '',
        item.oldSAPCode || '',
        item.hanaSAPCode || '',
        item.unit || '',
        ...allDeptKeys.map((key) => deptBuy[key] || ''),
        item.sumBuy || 0,
        item.dailyMedInventory || 0,
        item.safeStock || 0,        // Safe Stock vẫn hiển thị
        item.orderQty || 0,
        formattedPrice,
        formattedAmount,
        item.supplierName || '',
      ];
      wsData.push(row);
    });

    // Total row
    const formattedTotalPrice = (totals.totalSumPrice || 0).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const formattedTotalAmount = (totals.totalSumAmount || 0).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const totalRow = new Array(totalCols).fill('');
    totalRow[0] = 'Total';
    totalRow[8 + allDeptKeys.length] = totals.totalSumRequestQty || 0;
    totalRow[9 + allDeptKeys.length] = totals.totalSumDailyMedInventory || 0;
    totalRow[10 + allDeptKeys.length] = totals.totalSumSafeStock || 0;     // Safe Stock total vẫn có
    totalRow[11 + allDeptKeys.length] = totals.totalSumOrderQty || 0;
    totalRow[12 + allDeptKeys.length] = formattedTotalPrice;
    totalRow[13 + allDeptKeys.length] = formattedTotalAmount;
    wsData.push(totalRow);

    const dataEndRow = 3 + data.length - 1;
    const totalRowIndex = 3 + data.length;

    // Signature (giữ nguyên)
    const blankLine = new Array(totalCols).fill('');
    const signatureTitles = new Array(totalCols).fill('');
    const signatureNames = new Array(totalCols).fill('');
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

    // Worksheet + styles + merges (đã điều chỉnh chỉ số)
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Request Monthly');

    const commonBorder = { top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } } };

    const titleStyle = { font: { bold: true, name: 'Times New Roman', sz: 18 }, alignment: { horizontal: 'center', vertical: 'center' }, border: commonBorder };
    const boldHeaderStyle = { font: { bold: true, name: 'Times New Roman', sz: 12 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: commonBorder };
    const normalCellStyle = { font: { name: 'Times New Roman', sz: 11 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: commonBorder };
    const totalStyle = { font: { bold: true, name: 'Times New Roman', sz: 12 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: commonBorder };
    const signatureHeaderStyle = { font: { bold: true, name: 'Times New Roman', sz: 12 }, alignment: { horizontal: 'center' } };
    const signatureNameStyle = { font: { name: 'Times New Roman', sz: 12 }, alignment: { horizontal: 'center' } };

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
      }
    }

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: totalRowIndex, c: 0 }, e: { r: totalRowIndex, c: 7 } },
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
    ];

    startPositions.forEach((startCol) => {
      const endCol = Math.min(startCol + sigWidth - 1, totalCols - 1);
      ws['!merges'].push({ s: { r: dataEndRow + 3, c: startCol }, e: { r: dataEndRow + 3, c: endCol } });
      ws['!merges'].push({ s: { r: dataEndRow + 6, c: startCol }, e: { r: dataEndRow + 6, c: endCol } });
    });

    ws['!cols'] = new Array(totalCols).fill({ wch: 20 });
    ws['!cols'][0] = { wch: 5 };
    ws['!cols'][1] = { wch: 12 };
    ws['!cols'][2] = { wch: 12 };
    ws['!cols'][5] = { wch: 12 };

    // Tên file theo giờ hiện tại
    const now = new Date();
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
      sx={{ textTransform: 'none', borderRadius: 1, px: 2, py: 0.6, fontWeight: 600, fontSize: '0.75rem' }}
    >
      Summary
    </Button>
  );
}