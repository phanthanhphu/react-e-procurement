import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button } from '@mui/material';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';
import { API_BASE_URL } from '../../config';

export default function ExportComparisonMonthlyExcelButton({ disabled, groupId }) {
  const [data, setData] = useState([]);
  const [totalAmt, setTotalAmt] = useState(0);
  const [totalAmtDifference, setTotalAmtDifference] = useState(0);
  const [totalDifferencePercentage, setTotalDifferencePercentage] = useState(0);
  const [currency, setCurrency] = useState('VND');
  const [createdDate, setCreatedDate] = useState('');

  // ✅ map: requisitionId -> { qty, supplier, price, dateArr }
  const [lastPurchaseMap, setLastPurchaseMap] = useState(() => new Map());

  const safeNum = (v) => {
    if (v == null || v === '') return 0;
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };

  // lastPurchaseDate is array [y,m,d,h,mi,s,nano]
  const fmtDateTime = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length < 3) return '';
    const [y, m, d, hh = 0, mm = 0] = arr;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} ${String(hh).padStart(
      2,
      '0'
    )}:${String(mm).padStart(2, '0')}`;
  };

  // ✅ derive previous month display from createdDate (dd/MM/yyyy)
  const getPreviousMonthDisplay = (createdDateStr) => {
    try {
      if (!createdDateStr || typeof createdDateStr !== 'string') return { prevMonthNum: null, prevMonthName: null };
      const parts = createdDateStr.split('/');
      if (parts.length !== 3) return { prevMonthNum: null, prevMonthName: null };

      const m = Number(parts[1]); // 1..12
      if (!Number.isFinite(m) || m < 1 || m > 12) return { prevMonthNum: null, prevMonthName: null };

      const prevMonth = m === 1 ? 12 : m - 1;
      const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const prevMonthName = monthNamesShort[prevMonth - 1] || null;

      return { prevMonthNum: prevMonth, prevMonthName };
    } catch {
      return { prevMonthNum: null, prevMonthName: null };
    }
  };

  // ===== helper: format money with comma thousands (no currency symbol) =====
  const formatMoneyNumber = (value, curr) => {
    if (value == null || value === '') return '0';
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);

    const code = (curr || 'VND').trim().toUpperCase();
    const decimals = code === 'VND' ? 0 : 2;

    try {
      return new Intl.NumberFormat('en-US', {
        useGrouping: true,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    } catch {
      const fixed = decimals > 0 ? num.toFixed(decimals) : String(Math.round(num));
      const [intPart, decPart] = fixed.split('.');
      const withComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return decPart ? `${withComma}.${decPart}` : withComma;
    }
  };

  // ✅ pick last purchase (ưu tiên field từ API comparison nếu có, fallback sang map từ filter)
  const pickLastPurchase = (item) => {
    // 1) nếu /search/comparison-monthly trả thẳng các field này (sau khi backend update)
    const direct = {
      qty: item?.lastPurchaseOrderQty ?? null,
      supplier: item?.lastPurchaseSupplierName ?? '',
      price: item?.lastPurchasePrice ?? null,
      dateArr: item?.lastPurchaseDate ?? null,
    };
    const hasDirect =
      direct.qty != null || (direct.supplier && direct.supplier !== '') || direct.price != null || direct.dateArr != null;
    if (hasDirect) return direct;

    // 2) fallback: lấy từ requisition-monthly/filter
    const key = item?.id;
    if (!key) return { qty: null, supplier: '', price: null, dateArr: null };
    const v = lastPurchaseMap.get(key);
    return v || { qty: null, supplier: '', price: null, dateArr: null };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!groupId) return;

        // 1) fetch group summary (currency + createdDate)
        const groupResponse = await fetch(`${API_BASE_URL}/api/group-summary-requisitions/${groupId}`, {
          headers: { Accept: '*/*' },
        });
        if (!groupResponse.ok) throw new Error('Failed to fetch group summary');
        const groupResult = await groupResponse.json();
        setCurrency(groupResult.currency || 'VND');

        if (groupResult.createdDate && Array.isArray(groupResult.createdDate)) {
          const [y, m, d] = groupResult.createdDate;
          const formatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
          setCreatedDate(formatted);
        } else {
          setCreatedDate('');
        }

        // 2) fetch comparison data
        // ✅ truyền includeMonthlyLastPurchase=true luôn (backend update xong là dùng trực tiếp)
        const response = await fetch(
          `${API_BASE_URL}/search/comparison-monthly?groupId=${groupId}&filter=false&removeDuplicateSuppliers=false&includeMonthlyLastPurchase=true`,
          { headers: { Accept: '*/*' } }
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();

        setData(result.requisitions || []);
        setTotalAmt(result.totalAmt || 0);
        setTotalAmtDifference(result.totalAmtDifference || 0);
        setTotalDifferencePercentage(result.totalDifferencePercentage || 0);

        // 3) ✅ fetch monthly requisitions for LAST PURCHASE fields (giống ExportRequisitionMonthlyExcelButton)
        try {
          const remarkRes = await fetch(
            `${API_BASE_URL}/requisition-monthly/filter?groupId=${groupId}&hasFilter=false&disablePagination=true&includeMonthlyLastPurchase=true&page=0&size=2147483647&sort=string`,
            { headers: { Accept: '*/*' } }
          );

          if (remarkRes.ok) {
            const payload = await remarkRes.json();
            const list = payload?.requisitions?.content || [];
            const map = new Map();

            list.forEach((it) => {
              if (!it?.id) return;
              map.set(it.id, {
                qty: it.lastPurchaseOrderQty ?? null,
                supplier: it.lastPurchaseSupplierName ?? '',
                price: it.lastPurchasePrice ?? null,
                dateArr: it.lastPurchaseDate ?? null,
              });
            });

            setLastPurchaseMap(map);
          } else {
            console.warn('Failed to fetch requisition-monthly/filter includeMonthlyLastPurchase');
            setLastPurchaseMap(new Map());
          }
        } catch (e) {
          console.warn('Failed to fetch requisition-monthly/filter includeMonthlyLastPurchase.', e);
          setLastPurchaseMap(new Map());
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [groupId]);

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('No requisition data available to export. Please check your filters or try again later.');
      return;
    }

    // ✅ dynamic label: createdDate month=12 => prev month=11 => "Total Purchase (Nov)"
    const { prevMonthNum, prevMonthName } = getPreviousMonthDisplay(createdDate);
    const totalPurchasePrevMonthLabel =
      prevMonthName && prevMonthNum ? `Total Purchase (${prevMonthName})` : 'Total Purchase (Previous Month)';

    // Bước 1: Xác định các cột supplier duy nhất theo logic mới
    const supplierColumnMap = new Map(); // key: "name|price", value: supplier object (ưu tiên isSelected=1)

    data.forEach((item) => {
      const suppliers = item.suppliers || [];
      suppliers.forEach((sup) => {
        const priceKey = sup.price ?? 'null';
        const key = `${sup.supplierName}|${priceKey}`;

        if (!supplierColumnMap.has(key)) {
          supplierColumnMap.set(key, sup);
        } else {
          const existing = supplierColumnMap.get(key);
          if (existing.isSelected !== 1 && sup.isSelected === 1) {
            supplierColumnMap.set(key, sup);
          }
        }
      });
    });

    const uniqueSupplierColumns = Array.from(supplierColumnMap.values()).sort((a, b) => {
      if (a.isSelected === 1 && b.isSelected !== 1) return -1;
      if (a.isSelected !== 1 && b.isSelected === 1) return 1;
      return 0;
    });

    const allSupplierKeys = uniqueSupplierColumns.map((s) => ({
      name: s.supplierName,
      price: s.price,
      isSelected: s.isSelected,
      key: `${s.supplierName}|${s.price ?? 'null'}`,
    }));

    // ✅ LAST PURCHASE (4 cols): qty, supplier, price, date  (giống file mẫu)
    const LAST_PURCHASE_COLS = 4;

    // 9 fixed + suppliers + (lastPurchase 4 + selected 3 + diff 2 + remark 1 = 10)
    const totalCols = 9 + allSupplierKeys.length + (LAST_PURCHASE_COLS + 3 + 2 + 1);
    const wsData = [];

    // indices
    const supplierStartCol = 9;
    const supplierEndCol = 8 + allSupplierKeys.length;

    const lastPurchaseStartCol = 9 + allSupplierKeys.length; // 4 cols
    const selectedStartCol = lastPurchaseStartCol + LAST_PURCHASE_COLS; // 3 cols
    const differenceStartCol = selectedStartCol + 3; // 2 cols
    const remarkCol = differenceStartCol + 2; // 1 col

    // Header Row 1
    const titleRow = new Array(totalCols).fill('');
    titleRow[0] = `COMPARISON PRICE (${createdDate || ''})`;
    wsData.push(titleRow);

    // Header Row 2
    const headerRow2 = new Array(totalCols).fill('');
    headerRow2[0] = 'No';
    headerRow2[1] = 'Product Type 1';
    headerRow2[2] = 'Product Type 2';
    headerRow2[3] = 'Item Description';
    headerRow2[5] = 'Old SAP Code';
    headerRow2[6] = 'Hana SAP Code';
    headerRow2[7] = 'Unit';
    headerRow2[8] = 'Order Qty';

    if (allSupplierKeys.length > 0) headerRow2[supplierStartCol] = 'SUPPLIER';
    headerRow2[lastPurchaseStartCol] = 'LAST PURCHASE (PREVIOUS MONTH)';
    headerRow2[selectedStartCol] = 'Selected Supplier';
    headerRow2[differenceStartCol] = 'Difference';
    headerRow2[remarkCol] = 'Remark';
    wsData.push(headerRow2);

    // Header Row 3
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

    const supplierNames = allSupplierKeys.map((s) => s.name);

    // ✅ đổi tên + thứ tự giống ExportRequisitionMonthlyExcelButton
    const lastPurchaseColumns = [
      totalPurchasePrevMonthLabel,        // qty (sum)
      'Last Supplier (Latest)',           // latest supplier
      `Last Price (Latest) (${currency})`,
      'Last Purchase Date (Latest)',
    ];

    const selectedColumns = ['Supplier Description', `Price (${currency})`, `Amount (${currency})`];

    const differenceColumns = [`Difference (${currency})`, '%'];

    wsData.push([
      ...fixedColumns,
      ...supplierNames,
      ...lastPurchaseColumns,
      ...selectedColumns,
      ...differenceColumns,
      'Remark',
    ]);

    // Data rows
    data.forEach((item, index) => {
      const suppliers = item.suppliers || [];
      const selectedSupplier = suppliers.find((s) => s.isSelected === 1) || null;

      // key = "name|price" → formatted price
      const supplierPriceMap = new Map();
      suppliers.forEach((sup) => {
        const key = `${sup.supplierName}|${sup.price ?? 'null'}`;
        supplierPriceMap.set(key, sup.price != null ? formatMoneyNumber(sup.price, currency) : '');
      });

      const lp = pickLastPurchase(item);
      const lpQty = lp?.qty != null ? lp.qty : '';
      const lpSupplier = lp?.supplier ?? '';
      const lpPrice = lp?.price != null ? formatMoneyNumber(lp.price, currency) : '';
      const lpDate = fmtDateTime(lp?.dateArr);

      const row = [
        index + 1,
        item.type1Name || '',
        item.type2Name || '',
        item.englishName || '',
        item.vietnameseName || '',
        item.oldSapCode || '',
        item.hanaSapCode || '',
        item.unit || '',
        item.orderQty ?? 0,

        // supplier matrix
        ...allSupplierKeys.map((col) => supplierPriceMap.get(col.key) || ''),

        // ✅ last purchase 4 cols (qty, supplier, price, date)
        lpQty,
        lpSupplier,
        lpPrice,
        lpDate,

        // selected supplier 3 cols
        selectedSupplier ? selectedSupplier.supplierName : '',
        selectedSupplier?.price != null ? formatMoneyNumber(selectedSupplier.price, currency) : '',
        item.amount != null ? formatMoneyNumber(item.amount, currency) : '0',

        // difference 2 cols
        item.amtDifference != null ? formatMoneyNumber(item.amtDifference, currency) : '0',
        item.percentage != null ? `${parseFloat(item.percentage).toFixed(2)}%` : '0%',

        // remark
        item.remarkComparison || '',
      ];

      wsData.push(row);
    });

    const dataEndRow = 3 + data.length;

    // Total row
    const totalRow = new Array(totalCols).fill('');
    totalRow[0] = 'TOTAL';
    totalRow[selectedStartCol + 2] = formatMoneyNumber(totalAmt || 0, currency);
    totalRow[differenceStartCol] = formatMoneyNumber(totalAmtDifference || 0, currency);
    totalRow[differenceStartCol + 1] =
      totalDifferencePercentage != null ? `${parseFloat(totalDifferencePercentage).toFixed(2)}%` : '0%';
    wsData.push(totalRow);

    // Signature rows (giữ nguyên)
    const blankLine = new Array(totalCols).fill('');
    const signatureTitles = new Array(totalCols).fill('');
    const signatureNames = new Array(totalCols).fill('');
    const signBlank1 = [...blankLine];
    const signBlank2 = [...blankLine];
    const signBlank3 = [...blankLine];

    const signaturePositions = [
      { title: 'Request by', name: 'DANG THI NHU NGOC' },
      { title: 'Purchasing Teamleader', name: 'Ms. SELENA TAM' },
      { title: 'Director', name: 'Mr. EJ KIM' },
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

    signaturePositions.forEach((sig, idx) => {
      if (idx < startPositions.length) {
        const startCol = startPositions[idx];
        signatureTitles[startCol] = sig.title;
        signatureNames[startCol] = sig.name;
      }
    });

    wsData.push(blankLine, signatureTitles, signBlank1, signBlank2, signatureNames, signBlank3);

    // Tạo worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparison');

    // Style & merge
    const commonBorder = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
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

    const totalRows = wsData.length;
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
        if (r === 0) ws[cellRef].s = titleStyle;
        else if (r === 1 || r === 2) ws[cellRef].s = boldHeaderStyle;
        else if (r >= 3 && r < dataEndRow) ws[cellRef].s = normalCellStyle;
        else if (r === dataEndRow) ws[cellRef].s = totalStyle;
        else if (r === dataEndRow + 2 || r === dataEndRow + 5) {
          ws[cellRef].s = {
            font: { bold: r === dataEndRow + 2, name: 'Times New Roman', sz: 12 },
            alignment: { horizontal: 'center' },
          };
        }
      }
    }

    // Merges
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

      ...(allSupplierKeys.length > 0
        ? [{ s: { r: 1, c: supplierStartCol }, e: { r: 1, c: supplierEndCol } }]
        : []),

      // ✅ LAST PURCHASE group (4 cols)
      { s: { r: 1, c: lastPurchaseStartCol }, e: { r: 1, c: lastPurchaseStartCol + 3 } },

      // Selected Supplier group
      { s: { r: 1, c: selectedStartCol }, e: { r: 1, c: selectedStartCol + 2 } },

      // Difference group
      { s: { r: 1, c: differenceStartCol }, e: { r: 1, c: differenceStartCol + 1 } },

      // Remark (row2 spans)
      { s: { r: 1, c: remarkCol }, e: { r: 2, c: remarkCol } },

      { s: { r: dataEndRow, c: 0 }, e: { r: dataEndRow, c: 8 } },
    ];

    startPositions.forEach((startCol) => {
      const endCol = Math.min(startCol + sigWidth - 1, totalCols - 1);
      merges.push(
        { s: { r: dataEndRow + 2, c: startCol }, e: { r: dataEndRow + 2, c: endCol } },
        { s: { r: dataEndRow + 5, c: startCol }, e: { r: dataEndRow + 5, c: endCol } }
      );
    });

    ws['!merges'] = merges;

    // Column width
    ws['!cols'] = new Array(totalCols).fill({ wch: 20 });
    ws['!cols'][0] = { wch: 5 };
    ws['!cols'][1] = ws['!cols'][2] = ws['!cols'][3] = ws['!cols'][4] = { wch: 20 };
    ws['!cols'][5] = ws['!cols'][6] = { wch: 15 };
    ws['!cols'][7] = ws['!cols'][8] = { wch: 10 };

    allSupplierKeys.forEach((_, i) => {
      ws['!cols'][9 + i] = { wch: 18 };
    });

    // ✅ LAST PURCHASE widths (qty, supplier, price, date)
    ws['!cols'][lastPurchaseStartCol] = { wch: 22 }; // Total Purchase (Prev Month)
    ws['!cols'][lastPurchaseStartCol + 1] = { wch: 24 }; // Last Supplier
    ws['!cols'][lastPurchaseStartCol + 2] = { wch: 18 }; // Last Price
    ws['!cols'][lastPurchaseStartCol + 3] = { wch: 24 }; // Last Purchase Date

    // Selected Supplier widths
    ws['!cols'][selectedStartCol] = { wch: 22 };
    ws['!cols'][selectedStartCol + 1] = { wch: 16 };
    ws['!cols'][selectedStartCol + 2] = { wch: 18 };

    // Difference widths
    ws['!cols'][differenceStartCol] = { wch: 16 };
    ws['!cols'][differenceStartCol + 1] = { wch: 10 };

    // Remark width
    ws['!cols'][remarkCol] = { wch: 30 };

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `comparison_price_${groupId}.xlsx`);
  };

  return (
    <Button
      variant="contained"
      color="success"
      onClick={exportToExcel}
      disabled={disabled}
      startIcon={<img src={ExcelIcon} alt="Excel" style={{ width: 20, height: 20 }} />}
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
  );
}
