import React from 'react'; 
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button } from '@mui/material';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';

export default function ExportExcelButtonComparison({ data }) {
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const allSupplierKeysSet = new Set();
    data.forEach((item) => {
      const suppliers = item.suppliers || [];
      suppliers.forEach((supplier) => allSupplierKeysSet.add(supplier.name));
    });
    const allSupplierKeys = Array.from(allSupplierKeysSet);

    const wsData = [];

    const titleRow = new Array(6 + allSupplierKeys.length + 5).fill('');
    titleRow[6] = 'SUMMARY REQUISITION';
    wsData.push(titleRow);

    wsData.push([
      'No',
      'Description',
      '',
      'Old SAP Code',
      'SAP Code in New SAP',
      'Unit',
      ...allSupplierKeys.map((key) => key), // Dynamically add suppliers as columns
      'Selected Supplier',
      'Price',
      'Amt(VND)',
      'Difference',
      'Remark',
    ]);

    wsData.push([
      '',
      'English Name',
      'Vietnamese Name',
      '',
      '',
      '',
      ...allSupplierKeys,
      '',
      '',
      '',
      '',
      '',
    ]);

    data.forEach((item, index) => {
      const { requisition, suppliers } = item;
      const selectedSupplier = suppliers.find((supplier) => supplier.isSelected); // Assuming there's an `isSelected` flag
      const row = [
        index + 1,
        requisition.englishName,
        requisition.vietnameseName,
        requisition.oldSapCode,
        requisition.newSapCode,
        requisition.unit,
        ...allSupplierKeys.map((key) => {
          const supplier = suppliers.find((sup) => sup.name === key);
          return supplier ? supplier.price : '';
        }), // Add supplier price for each supplier
        selectedSupplier ? selectedSupplier.name : '',
        selectedSupplier ? selectedSupplier.price : '',
        selectedSupplier ? selectedSupplier.amount : '',
        selectedSupplier ? selectedSupplier.difference : '',
        requisition.remark || '',
      ];

      wsData.push(row);
    });

    const totalCols = 6 + allSupplierKeys.length + 5;

    const signatureTitles = new Array(totalCols).fill('');
    signatureTitles[0] = 'Request by';
    signatureTitles[5] = 'Purchasing Teamleader';
    signatureTitles[10] = 'Purchasing Manager';
    signatureTitles[14] = 'Approval by';

    const blankLine = new Array(totalCols).fill('');
    const signBlank1 = [...blankLine];
    const signBlank2 = [...blankLine];

    const signatureNames = new Array(totalCols).fill('');
    signatureNames[0] = 'DANG THI NHU NGOC';
    signatureNames[5] = 'Ms. SELENA TAM';
    signatureNames[10] = 'Mr. EJ KIM';
    signatureNames[14] = 'Mr. YONGUK LEE';

    const signBlank3 = [...blankLine];

    wsData.push(signatureTitles, signBlank1, signBlank2, signatureNames, signBlank3);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

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
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
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
        else if (r >= 3 && r < totalRows - 5) ws[cellRef].s = normalCellStyle;
        else if (r === totalRows - 5) ws[cellRef].s = signatureHeaderStyle;
        else if (r === totalRows - 2) ws[cellRef].s = signatureNameStyle;
        else ws[cellRef].s = signatureNameStyle;
      }
    }

    const merges = [
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }, // No
      { s: { r: 0, c: 6 }, e: { r: 0, c: 6 + allSupplierKeys.length - 1 } }, // Title
      { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } }, // Description
      { s: { r: 1, c: 3 }, e: { r: 2, c: 3 } },
      { s: { r: 1, c: 4 }, e: { r: 2, c: 4 } },
      { s: { r: 1, c: 5 }, e: { r: 2, c: 5 } },
      { s: { r: 1, c: 6 }, e: { r: 1, c: 6 + allSupplierKeys.length - 1 } },
      { s: { r: 1, c: 6 + allSupplierKeys.length }, e: { r: 2, c: 6 + allSupplierKeys.length } },
      { s: { r: 1, c: 7 + allSupplierKeys.length }, e: { r: 2, c: 7 + allSupplierKeys.length } },
      { s: { r: 1, c: 8 + allSupplierKeys.length }, e: { r: 2, c: 8 + allSupplierKeys.length } },
      { s: { r: 1, c: 9 + allSupplierKeys.length }, e: { r: 2, c: 9 + allSupplierKeys.length } },
      { s: { r: 1, c: 10 + allSupplierKeys.length }, e: { r: 2, c: 10 + allSupplierKeys.length } },
    ];

    ws['!merges'] = merges;

    ws['!cols'] = new Array(totalCols).fill({ wch: 20 });
    ws['!cols'][0] = { wch: 5 };

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'summary_requisition.xlsx');
  };

  return (
    <Button
      variant="contained"
      color="success"
      onClick={exportToExcel}
      startIcon={
        <img
          src={ExcelIcon}
          alt="Excel Icon"
          style={{ width: 20, height: 20 }}
        />
      }
      sx={{
        textTransform: 'none',
        borderRadius: 1,
        px: 2,
        py: 0.6,
        fontWeight: 600,
        fontSize: '0.75rem',
      }}
    >
      Export Excel Comparison
    </Button>
  );
}
