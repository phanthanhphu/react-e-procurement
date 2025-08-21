import React from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button } from '@mui/material';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';

export default function ExportRequisitionMonthlyExcelButton({ data }) {
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Giả sử data là array các requisition tháng, mỗi item có các trường sau:
    // { month: '2025-08', requisitionDetails: [...] }
    // requisitionDetails là array các item từng phiếu yêu cầu với fields tương tự:
    // { englishName, vietnameseName, sapCode, quantity, unit, price, totalAmount, remark }

    const wsData = [];

    // Tiêu đề file
    wsData.push(['MONTHLY REQUISITION SUMMARY']);
    wsData.push([]); // dòng trống

    // Header cột
    wsData.push([
      'No',
      'Month',
      'Item Description (EN)',
      'Item Description (VN)',
      'SAP Code',
      'Quantity',
      'Unit',
      'Unit Price (VND)',
      'Total Amount (VND)',
      'Remark',
    ]);

    let rowIndex = 1;

    data.forEach((monthlyReq) => {
      const month = monthlyReq.month;
      const details = monthlyReq.requisitionDetails || [];

      details.forEach((item) => {
        wsData.push([
          rowIndex++,
          month,
          item.englishName || '',
          item.vietnameseName || '',
          item.sapCode || '',
          item.quantity || 0,
          item.unit || '',
          item.price || 0,
          item.totalAmount || 0,
          item.remark || '',
        ]);
      });
    });

    // Tạo sheet và workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Requisition');

    // Style border chung
    const commonBorder = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    };

    // Styles
    const titleStyle = {
      font: { bold: true, sz: 18, name: 'Times New Roman' },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    const headerStyle = {
      font: { bold: true, sz: 12, name: 'Times New Roman' },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: commonBorder,
    };

    const normalStyle = {
      font: { sz: 11, name: 'Times New Roman' },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: commonBorder,
    };

    // Gán style
    const totalRows = wsData.length;
    const totalCols = wsData[2].length; // row 3 là header

    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

        if (r === 0) ws[cellRef].s = titleStyle;
        else if (r === 2) ws[cellRef].s = headerStyle;
        else if (r > 2) ws[cellRef].s = normalStyle;
      }
    }

    // Merge tiêu đề
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }
    ];

    // Đặt độ rộng cột
    ws['!cols'] = [
      { wch: 5 },   // No
      { wch: 10 },  // Month
      { wch: 25 },  // Item Description (EN)
      { wch: 25 },  // Item Description (VN)
      { wch: 15 },  // SAP Code
      { wch: 10 },  // Quantity
      { wch: 10 },  // Unit
      { wch: 15 },  // Unit Price
      { wch: 20 },  // Total Amount
      { wch: 25 },  // Remark
    ];

    // Set row height
    ws['!rows'] = wsData.map(() => ({ hpt: 22 }));

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });

    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'monthly_requisition_summary.xlsx');
  };

  return (
    <Button
      variant="contained"
      color="success"
      onClick={exportToExcel}
      startIcon={<img src={ExcelIcon} alt="Export to Excel" style={{ width: 20, height: 20 }} />}
    >
      Export Monthly Requisition
    </Button>
  );
}
