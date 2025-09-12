import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button } from '@mui/material';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';
import { API_BASE_URL } from '../../config';

export default function ExportComparisonExcelButton({ disabled, groupId }) { // THÊM: Thêm prop groupId
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/summary-requisitions/search/comparison?groupId=${groupId}&filter=false`, // CẬP NHẬT: Sử dụng groupId từ props
          { headers: { Accept: '*/*' } }
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        setData(result.requisitions || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        alert('Failed to fetch data for export. Please try again.');
      }
    };
    fetchData();
  }, [groupId]); // THÊM: Thêm groupId vào dependency array của useEffect

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

    const totalCols = 7 + allSupplierKeys.length + 6; // 7 fixed + n suppliers + 6 final columns
    const wsData = [];

    // Header Row 1: COMPARISON PRICE (merged A to Z)
    const titleRow = new Array(totalCols).fill('');
    titleRow[0] = 'COMPARISON PRICE';
    wsData.push(titleRow);

    // Header Row 2: Item Description (merge 1-2), other fixed columns, List of Suppliers, Selected Supplier, Difference, Remark
    const headerRow2 = new Array(totalCols).fill('');
    headerRow2[0] = 'No';
    headerRow2[1] = 'Item Description'; // Merge 1-2 for English Name and Vietnamese Name
    headerRow2[3] = 'Old SAP Code';
    headerRow2[4] = 'SAP Code in New SAP';
    headerRow2[5] = 'Unit';
    headerRow2[6] = 'Order Q\'ty';
    headerRow2[7] = 'SUPPLIER'; // Merge 7 to 6+n
    headerRow2[7 + allSupplierKeys.length] = 'Selected Supplier'; // Merge 7+n to 7+n+2
    headerRow2[7 + allSupplierKeys.length + 3] = 'Difference'; // Merge 7+n+3 to 7+n+4
    headerRow2[7 + allSupplierKeys.length + 5] = 'Remark'; // Single column for Remark
    wsData.push(headerRow2);

    // Header Row 3: Detailed columns
    const fixedColumns = ['No', 'English Name', 'Vietnamese Name', 'Old SAP Code', 'SAP Code in New SAP', 'Unit', 'Order Q\'ty'];
    const dynamicColumns = allSupplierKeys; // Supplier names as detailed headers
    const finalColumns = ['Supplier Name', 'Price', 'Amt(VND) (Selected)', 'Amt(VND) (Difference)', '%', ''];
    wsData.push([...fixedColumns, ...dynamicColumns, ...finalColumns]);

    // Data rows
    data.forEach((item, index) => {
      const { englishName, vietnameseName, oldSapCode, newSapCode, suppliers, remark, departmentRequests, unit } = item;
      const selectedSupplier = suppliers?.find((sup) => sup.isSelected === 1) || null;
      const totalQty = departmentRequests?.reduce((sum, dept) => sum + (dept.quantity || 0), 0) || 0;

      const supplierInfo = {};
      (suppliers || []).forEach((sup) => {
        const amtVND = sup.amtVnd || (sup.price || 0) * totalQty;
        supplierInfo[sup.supplierName] = `${sup.price || ''}`;
      });

      let differenceAmt = 0;
      let differencePercent = 0;
      if (selectedSupplier && suppliers?.length > 1) {
        const selectedAmt = selectedSupplier.amtVnd || (selectedSupplier.price || 0) * totalQty;
        const otherAmts = suppliers
          .filter((sup) => sup.supplierName !== selectedSupplier.supplierName)
          .map((sup) => (sup.amtVnd || (sup.price || 0) * totalQty));
        const avgOtherAmt = otherAmts.length > 0 ? otherAmts.reduce((sum, amt) => sum + amt, 0) / otherAmts.length : 0;
        differenceAmt = selectedAmt - avgOtherAmt;
        differencePercent = avgOtherAmt ? (differenceAmt / avgOtherAmt) * 100 : 0;
      }

      const row = [
        index + 1,
        englishName || '',
        vietnameseName || '',
        oldSapCode || '',
        newSapCode || '',
        unit || '',
        totalQty,
        ...allSupplierKeys.map((key) => supplierInfo[key] || ''),
        selectedSupplier ? selectedSupplier.supplierName : '',
        selectedSupplier ? selectedSupplier.price || '' : '',
        selectedSupplier ? (selectedSupplier.amtVnd || (selectedSupplier.price || 0) * totalQty).toLocaleString('vi-VN') : '',
        differenceAmt.toLocaleString('vi-VN'),
        `${differencePercent.toFixed(2)}%`,
        remark || '',
      ];
      wsData.push(row);
    });

    const dataEndRow = 3 + data.length;

    // Total row
    const totalRow = new Array(totalCols).fill('');
    totalRow[0] = 'TOTAL';
    totalRow[7 + allSupplierKeys.length + 2] = data.reduce((sum, item) => {
      const selectedSupplier = item.suppliers?.find((sup) => sup.isSelected === 1) || {};
      return sum + (selectedSupplier.amtVnd || (selectedSupplier.price || 0) * (item.departmentRequests?.reduce((s, dept) => s + (dept.quantity || 0), 0) || 0));
    }, 0).toLocaleString('vi-VN');
    totalRow[7 + allSupplierKeys.length + 3] = data.reduce((sum, item) => {
      const selectedSupplier = item.suppliers?.find((sup) => sup.isSelected === 1) || {};
      const selectedAmt = selectedSupplier.amtVnd || (selectedSupplier.price || 0) * (item.departmentRequests?.reduce((s, dept) => s + (dept.quantity || 0), 0) || 0);
      const otherAmts = item.suppliers?.filter((sup) => sup.supplierName !== selectedSupplier.supplierName)
        .map((sup) => sup.amtVnd || (sup.price || 0) * (item.departmentRequests?.reduce((s, dept) => s + (dept.quantity || 0), 0) || 0)) || [];
      const avgOtherAmt = otherAmts.length > 0 ? otherAmts.reduce((s, amt) => s + amt, 0) / otherAmts.length : 0;
      return sum + (selectedAmt - avgOtherAmt);
    }, 0).toLocaleString('vi-VN');
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

    const sigWidth = 3; // Width of each signature
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

    // Updated merges
    const supplierStartCol = 7;
    const supplierEndCol = 6 + allSupplierKeys.length;
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // COMPARISON PRICE
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }, // No
      { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } }, // Item Description (merge English Name and Vietnamese Name horizontally)
      { s: { r: 1, c: 3 }, e: { r: 2, c: 3 } }, // Old SAP Code
      { s: { r: 1, c: 4 }, e: { r: 2, c: 4 } }, // SAP Code in New SAP
      { s: { r: 1, c: 5 }, e: { r: 2, c: 5 } }, // Unit
      { s: { r: 1, c: 6 }, e: { r: 2, c: 6 } }, // Order Q'ty
      { s: { r: 1, c: supplierStartCol }, e: { r: 1, c: supplierEndCol } }, // List of Suppliers
      { s: { r: 1, c: 7 + allSupplierKeys.length }, e: { r: 1, c: 7 + allSupplierKeys.length + 2 } }, // Selected Supplier
      { s: { r: 1, c: 7 + allSupplierKeys.length + 3 }, e: { r: 1, c: 7 + allSupplierKeys.length + 4 } }, // Difference
      { s: { r: 1, c: 7 + allSupplierKeys.length + 5 }, e: { r: 2, c: 7 + allSupplierKeys.length + 5 } }, // Remark
      { s: { r: dataEndRow, c: 0 }, e: { r: dataEndRow, c: 6 } }, // TOTAL
    ];

    // Signature merges
    startPositions.forEach((startCol, index) => {
      const endCol = Math.min(startCol + sigWidth - 1, totalCols - 1);
      if (startCol < totalCols) {
        merges.push({ s: { r: dataEndRow + 2, c: startCol }, e: { r: dataEndRow + 2, c: endCol } });
        merges.push({ s: { r: dataEndRow + 5, c: startCol }, e: { r: dataEndRow + 5, c: endCol } });
      }
    });

    ws['!merges'] = merges;

    // Set column widths
    ws['!cols'] = new Array(totalCols).fill({ wch: 20 });
    ws['!cols'][0] = { wch: 5 }; // No
    ws['!cols'][1] = { wch: 20 }; // English Name
    ws['!cols'][2] = { wch: 20 }; // Vietnamese Name
    ws['!cols'][3] = { wch: 15 }; // Old SAP Code
    ws['!cols'][4] = { wch: 15 }; // SAP Code in New SAP
    ws['!cols'][5] = { wch: 10 }; // Unit
    ws['!cols'][6] = { wch: 10 }; // Order Q'ty
    allSupplierKeys.forEach((_, idx) => { ws['!cols'][7 + idx] = { wch: 15 }; }); // Supplier columns
    ws['!cols'][7 + allSupplierKeys.length] = { wch: 20 }; // Selected Supplier Name
    ws['!cols'][7 + allSupplierKeys.length + 1] = { wch: 15 }; // Price
    ws['!cols'][7 + allSupplierKeys.length + 2] = { wch: 20 }; // Amt(VND) (Selected)
    ws['!cols'][7 + allSupplierKeys.length + 3] = { wch: 15 }; // Amt(VND) (Difference)
    ws['!cols'][7 + allSupplierKeys.length + 4] = { wch: 10 }; // Difference %
    ws['!cols'][7 + allSupplierKeys.length + 5] = { wch: 30 }; // Remark

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `comparison_price_${groupId}.xlsx`); // CẬP NHẬT: Sử dụng groupId trong tên file
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