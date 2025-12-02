import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button } from '@mui/material';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';
import { API_BASE_URL } from '../../config';
import dayjs from 'dayjs';

export default function ExportRequisitionWeeklyExcelButton({ data, groupId }) {
  const [stockDate, setStockDate] = useState('');
  const [groupName, setGroupName] = useState('');
  const [stockDateArray, setStockDateArray] = useState(null);

  useEffect(() => {
    if (!groupId) {
      console.warn('No groupId provided for fetching group data');
      return;
    }
    fetch(`${API_BASE_URL}/group-summary-requisitions/${groupId}`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch group data');
        return response.json();
      })
      .then((result) => {
        console.log('API stockDate:', result.stockDate);
        const dateArray = result.stockDate;
        if (dateArray && dateArray.length >= 3) {
          const [year, month, day] = dateArray;
          const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
          setStockDate(formattedDate);
          setStockDateArray(dateArray);
        } else {
          console.warn('Invalid stockDate array, using fallback date');
          const fallbackDate = dayjs().format('DD/MM/YYYY');
          setStockDate(fallbackDate);
        }
        setGroupName(result.name || '');
      })
      .catch((error) => {
        console.error('Error fetching group data:', error);
        const fallbackDate = dayjs().format('DD/MM/YYYY');
        setStockDate(fallbackDate);
      });
  }, [groupId]);

  const fetchAllGroupData = async () => {
    if (!groupId) {
      console.warn('No groupId provided for fetching group data');
      return [];
    }
    try {
      const queryParams = new URLSearchParams({
        groupId,
        hasFilter: 'false',
        disablePagination: 'true',
      });
      const response = await fetch(`${API_BASE_URL}/api/summary-requisitions/search?${queryParams.toString()}`, {
        method: 'GET',
        headers: { Accept: '*/*' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      console.log('Summary requisitions data:', result.content);
      return result.content || [];
    } catch (error) {
      console.error('Error fetching group data for export:', error);
      return [];
    }
  };

  const exportToExcel = async () => {
    const exportData = await fetchAllGroupData();
    if (!exportData || exportData.length === 0) {
      alert('No data to export');
      return;
    }

    // Generate department keys
    const allDeptKeysSet = new Set();
    exportData.forEach((item) => {
      const deptRequests = item.departmentRequests || [];
      deptRequests.forEach((dept) => allDeptKeysSet.add(dept.departmentName));
    });
    const allDeptKeys = Array.from(allDeptKeysSet);

    const wsData = [];

    // Cột đã bỏ Stock → còn 4 cột cuối
    const totalCols = 8 + allDeptKeys.length + 4;

    // Title row
    const titleRow = new Array(totalCols).fill('');
    titleRow[0] = 'SUMMARY REQUISITION';
    wsData.push(titleRow);

    // Header rows
    wsData.push([
      'No',
      'Product Type 1',
      'Product Type 2',
      'Description',
      '',
      'Old SAP Code',
      'Hana SAP Code',
      'Unit',
      ...Array(allDeptKeys.length).fill("Department"),
      'Request Qty',
      'Order Qty',
      'Reason',
      'Remark',
    ]);

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
    ]);

    // Data rows – dùng qty thay vì buy
    exportData.forEach((item, index) => {
      const { requisition, supplierProduct, departmentRequests, totalRequestQty, productType1Name, productType2Name } = item;
      const deptQty = {};
      (departmentRequests || []).forEach((dept) => {
        deptQty[dept.departmentName] = dept.qty || 0;  // ĐÃ DÙNG qty
      });

      const row = [
        index + 1,
        productType1Name || '',
        productType2Name || '',
        requisition?.englishName || '',
        requisition?.vietnameseName || '',
        requisition?.oldSapCode || '',
        requisition?.hanaSapCode || '',
        supplierProduct?.unit || item.unit || '',
        ...allDeptKeys.map((key) => deptQty[key] || ''),
        totalRequestQty || 0,
        requisition?.orderQty || '',
        requisition?.reason || '',
        requisition?.remark || '',
      ];
      wsData.push(row);
    });

    const dataEndRow = 3 + exportData.length - 1;

    // Signature rows – COPY NGUYÊN BẢN TỪ CODE CŨ CỦA ANH
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
    const availableCols = totalCols;
    const colStep = Math.floor((availableCols - totalSigWidth) / (signaturePositions.length + 1));
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
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    // Styles – COPY NGUYÊN BẢN TỪ CODE CŨ
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
        else if (r >= 3 && r <= dataEndRow) ws[cellRef].s = normalCellStyle;
        else if (r === dataEndRow + 2) ws[cellRef].s = signatureHeaderStyle;
        else if (r === dataEndRow + 5) ws[cellRef].s = signatureNameStyle;
        else ws[cellRef].s = signatureNameStyle;
      }
    }

    // Merges – đã điều chỉnh lại cho đúng khi bỏ cột Stock
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
    ];

    startPositions.forEach((startCol, index) => {
      const endCol = Math.min(startCol + sigWidth - 1, totalCols - 1);
      if (startCol < totalCols) {
        merges.push({ s: { r: dataEndRow + 2, c: startCol }, e: { r: dataEndRow + 2, c: endCol } });
        merges.push({ s: { r: dataEndRow + 5, c: startCol }, e: { r: dataEndRow + 5, c: endCol } });
      }
    });

    ws['!merges'] = merges;

    // Độ rộng cột – giống hệt code cũ
    ws['!cols'] = new Array(totalCols).fill({ wch: 20 });
    ws['!cols'][0] = { wch: 5 };
    ws['!cols'][1] = { wch: 20 };
    ws['!cols'][2] = { wch: 20 };
    ws['!cols'][3] = { wch: 20 };
    ws['!cols'][4] = { wch: 20 };
    ws['!cols'][5] = { wch: 15 };
    ws['!cols'][6] = { wch: 15 };
    ws['!cols'][7] = { wch: 10 };
    allDeptKeys.forEach((_, idx) => { ws['!cols'][8 + idx] = { wch: 12 }; });
    ws['!cols'][8 + allDeptKeys.length] = { wch: 12 };
    ws['!cols'][9 + allDeptKeys.length] = { wch: 12 };
    ws['!cols'][10 + allDeptKeys.length] = { wch: 20 };
    ws['!cols'][11 + allDeptKeys.length] = { wch: 20 };

    // Tên file
    const currentDateTime = dayjs().format('DDMMYYYYHHmm');
    const fileName = `weekly_request_${currentDateTime}.xlsx`;

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    console.log('wbout size:', wbout.length);
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
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
      Summary
    </Button>
  );
}