// ExportRequisitionMonthlyExcelButton.jsx
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { Button } from '@mui/material';
import axios from 'axios';
import ExcelIcon from '../../assets/images/Microsoft_Office_Excel.png';
import { API_BASE_URL } from '../../config.js';

export default function ExportRequisitionMonthlyExcelButton({ groupId }) {
  const [createdDate, setCreatedDate] = useState('');
  const [currency, setCurrency] = useState('VND'); // ✅ currency from group summary

  useEffect(() => {
    if (!groupId) return;

    const fetchInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/group-summary-requisitions/${groupId}`);
        const data = await res.json();

        // ✅ currency
        setCurrency(String(data.currency || 'VND').trim().toUpperCase());

        // createdDate: [year, month, day]
        if (data.createdDate && Array.isArray(data.createdDate)) {
          const [y, m, d] = data.createdDate;
          setCreatedDate(`${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`);
        }
      } catch (e) {
        setCurrency('VND');
        setCreatedDate('05/12/2025');
      }
    };

    fetchInfo();
  }, [groupId]);

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

  // ✅ Only 3 currencies: VND, USD, EURO (also accept EUR)
  const getMoneyNumFmt = (curr) => {
    const code = String(curr || 'VND').trim().toUpperCase();
    if (code === 'VND') return '#,##0'; // 12,000
    if (code === 'USD' || code === 'EURO' || code === 'EUR') return '#,##0.00'; // 12,000.00
    return '#,##0.00';
  };

  // ✅ derive previous month display from createdDate (dd/MM/yyyy)
  const getPreviousMonthDisplay = (createdDateStr) => {
    try {
      if (!createdDateStr || typeof createdDateStr !== 'string')
        return { prevMonthNum: null, prevMonthName: null };
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

  const exportToExcel = async () => {
    if (!groupId) return alert('Missing groupId');

    try {
      const moneyNumFmt = getMoneyNumFmt(currency);

      // ✅ dynamic label (example: createdDate month=12 => prev month=11 => "Total Purchase (Nov)")
      const { prevMonthNum, prevMonthName } = getPreviousMonthDisplay(createdDate);
      const totalPurchasePrevMonthLabel =
        prevMonthName && prevMonthNum
          ? `Total Purchase (${prevMonthName})`
          : 'Total Purchase (Previous Month)';

      // 1) Main grouped API
      const res = await axios.get(`${API_BASE_URL}/comparison-monthly-grouped`, {
        params: { groupId, removeDuplicateSuppliers: false },
      });

      const { groups: rawGroups, grandTotal } = res.data;
      const groups = rawGroups || [];

      // 2) Fetch MONTHLY requisitions (remark + last purchase fields)
      const remarkMap = new Map();
      const lastPurchaseMap = new Map(); // key: requisitionId -> { qty, supplier, price, dateArr }

      try {
        const remarkRes = await axios.get(`${API_BASE_URL}/requisition-monthly/filter`, {
          params: {
            groupId,
            hasFilter: false,
            disablePagination: true,
            includeMonthlyLastPurchase: true, // ✅ IMPORTANT
            page: 0,
            size: 2147483647,
            sort: 'string',
          },
          headers: { Accept: '*/*' },
        });

        const list = remarkRes?.data?.requisitions?.content || [];
        list.forEach((item) => {
          if (!item?.id) return;

          remarkMap.set(item.id, item.remark ?? '');

          lastPurchaseMap.set(item.id, {
            qty: item.lastPurchaseOrderQty ?? null,
            supplier: item.lastPurchaseSupplierName ?? '',
            price: item.lastPurchasePrice ?? null,
            dateArr: item.lastPurchaseDate ?? null,
          });
        });
      } catch (e) {
        console.warn('Failed to fetch requisition-monthly/filter (remark/last purchase).', e);
      }

      const pickRemark = (req) => {
        const direct =
          req?.remark ??
          req?.remarkComparison ??
          req?.requisition?.remark ??
          req?.requisitionDetail?.remark ??
          null;

        if (direct != null && direct !== '') return String(direct);

        const keys = [
          req?.id,
          req?.requisitionId,
          req?.reqId,
          req?.requisition?.id,
          req?.requisitionDetail?.id,
        ].filter(Boolean);

        for (const k of keys) {
          const v = remarkMap.get(k);
          if (v != null && v !== '') return String(v);
        }
        return '';
      };

      const pickLastPurchase = (req) => {
        const keys = [
          req?.id,
          req?.requisitionId,
          req?.reqId,
          req?.requisition?.id,
          req?.requisitionDetail?.id,
        ].filter(Boolean);

        for (const k of keys) {
          const v = lastPurchaseMap.get(k);
          if (v) return v;
        }
        return { qty: null, supplier: '', price: null, dateArr: null };
      };

      // ===== Departments list =====
      const deptSet = new Set();
      groups.forEach((g) => {
        (g.subgroups || []).forEach((sg) => {
          (sg.requisitions || []).forEach((req) => {
            (req.departmentRequests || []).forEach((dr) => {
              if (dr?.departmentName) deptSet.add(dr.departmentName);
            });
          });
        });
      });
      const departments = Array.from(deptSet);
      const deptLen = departments.length;

      // ===== Columns index =====
      const FIXED_COLS = 8;
      const deptStartCol = FIXED_COLS;
      const deptEndCol = deptStartCol + deptLen - 1;

      const totalRequestCol = FIXED_COLS + deptLen;

      // Confirmed MED (3 cols)
      const medQtyCol = totalRequestCol + 1;
      const medPriceCol = medQtyCol + 1;
      const medAmountCol = medPriceCol + 1;

      // ✅ LAST PURCHASE (PREVIOUS MONTH) (4 cols)
      const lastTotalPurchaseCol = medAmountCol + 1;
      const lastSupplierCol = lastTotalPurchaseCol + 1;
      const lastPriceCol = lastSupplierCol + 1;
      const lastDateCol = lastPriceCol + 1;

      // Price/Amount OUTSIDE MED (from DB)
      const priceCol = lastDateCol + 1;
      const amountCol = priceCol + 1;

      const suppliersCol = amountCol + 1;
      const remarkCol = suppliersCol + 1;

      // ✅ money columns (apply numFmt)
      const moneyCols = [medPriceCol, medAmountCol, lastPriceCol, priceCol, amountCol];

      // FIXED + dept + (TotalRequest 1) + (MED 3) + (LAST 4) + (Price/Amount 2) + (Suppliers 1) + (Remark 1)
      const totalCols = FIXED_COLS + deptLen + 12;

      const wsData = [];

      const padRow = (row) => {
        const r = Array.from(row);
        while (r.length < totalCols) r.push('');
        return r;
      };

      // ===== Title =====
      wsData.push(padRow([`REQUEST MONTHLY (${createdDate})`]));

      // ===== Header row 1 =====
      wsData.push(
        padRow([
          'No',
          'Product Type 1',
          'Product Type 2',
          'Description',
          '',
          'Old SAP Code',
          'Hana SAP Code',
          'Unit',
          ...departments.map(() => 'Departments'),
          'Total Request',

          'Confirmed MED',
          '',
          '',

          'LAST PURCHASE (PREVIOUS MONTH)',
          '',
          '',
          '',

          'Price',
          'Amount',

          'Suppliers',
          'Remark',
        ])
      );

      // ===== Header row 2 =====
      wsData.push(
        padRow([
          '',
          '',
          '',
          'EN',
          'VN',
          '',
          '',
          '',
          ...departments,

          '',

          "Q'TY",
          'PRICE',
          'AMOUNT',

          totalPurchasePrevMonthLabel,
          'Last Supplier (Latest)',
          'Last Price (Latest)',
          'Last Purchase Date (Latest)',

          '',
          '',
          '',
          '',
        ])
      );

      let itemNo = 1;
      let groupIndex = 1;

      const grandDeptQty = {};
      departments.forEach((d) => (grandDeptQty[d] = 0));
      let grandTotalRequest = 0;
      let grandConfirmedQty = 0;
      let grandLastTotalPurchase = 0;

      const mergeLabelRows = [];

      groups.forEach((group) => {
        const type1Name = (group.type1Name || '').trim();
        let subgroupIndex = 1;

        const groupDeptQty = {};
        departments.forEach((d) => (groupDeptQty[d] = 0));
        let groupTotalRequest = 0;
        let groupConfirmedQty = 0;
        let groupLastTotalPurchase = 0;

        let groupSumPrice = 0;
        let groupSumAmount = 0;

        (group.subgroups || []).forEach((subgroup) => {
          const type2Name = (subgroup.type2Name || '').trim();

          const subDeptQty = {};
          departments.forEach((d) => (subDeptQty[d] = 0));
          let subTotalRequest = 0;
          let subConfirmedQty = 0;
          let subLastTotalPurchase = 0;

          let subSumPrice = 0;
          let subSumAmount = 0;

          (subgroup.requisitions || []).forEach((req) => {
            const deptMap = {};
            (req.departmentRequests || []).forEach((dr) => {
              const qty = safeNum(dr.qty ?? 0);
              const deptName = dr.departmentName;
              if (!deptName) return;

              deptMap[deptName] = qty;

              subDeptQty[deptName] = safeNum(subDeptQty[deptName]) + qty;
              groupDeptQty[deptName] = safeNum(groupDeptQty[deptName]) + qty;
              grandDeptQty[deptName] = safeNum(grandDeptQty[deptName]) + qty;
            });

            const selected =
              (req.suppliers || []).find((s) => s.isSelected === 1) || req.suppliers?.[0] || {};
            const price = safeNum(selected.price ?? req.price ?? 0);
            const amount = safeNum(req.amount ?? 0);

            const totalReq = safeNum(req.totalRequestQty ?? 0);
            const confirmedQty = safeNum(req.dailyMedInventory ?? 0);

            subTotalRequest += totalReq;
            subConfirmedQty += confirmedQty;

            groupTotalRequest += totalReq;
            groupConfirmedQty += confirmedQty;

            grandTotalRequest += totalReq;
            grandConfirmedQty += confirmedQty;

            subSumPrice += price;
            subSumAmount += amount;
            groupSumPrice += price;
            groupSumAmount += amount;

            const lp = pickLastPurchase(req);
            const lpQty = safeNum(lp?.qty ?? 0);
            const lpSupplier = lp?.supplier ?? '';
            const lpPrice = lp?.price != null ? Number(lp.price) : ''; // ✅ keep number if exists
            const lpDate = fmtDateTime(lp?.dateArr);

            subLastTotalPurchase += lpQty;
            groupLastTotalPurchase += lpQty;
            grandLastTotalPurchase += lpQty;

            const currentItemNo = itemNo++;

            wsData.push(
              padRow([
                currentItemNo,
                type1Name,
                type2Name,
                req.englishName || '',
                req.vietnameseName || '',
                req.oldSapCode || '',
                req.hanaSapCode || '',
                req.unit || '',
                ...departments.map((d) => (deptMap[d] != null ? deptMap[d] : '')),
                totalReq,

                confirmedQty,
                '', // MED price (nếu có thì set số)
                '', // MED amount (nếu có thì set số)

                lpQty,
                lpSupplier,
                lpPrice,
                lpDate,

                price,
                amount,

                selected.supplierName || '',
                pickRemark(req),
              ])
            );
          });

          const subLabel = `SUB TOTAL ${groupIndex}.${subgroupIndex}`;
          const subRowIndex = wsData.length;

          wsData.push(
            padRow([
              subLabel,
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              ...departments.map((d) => (subDeptQty[d] != null ? subDeptQty[d] : '')),
              subTotalRequest,

              subConfirmedQty,
              '',
              '',

              subLastTotalPurchase,
              '',
              '',
              '',

              subSumPrice,
              subSumAmount,

              '',
              '',
            ])
          );

          mergeLabelRows.push(subRowIndex);
          subgroupIndex++;
        });

        const totalLabel = `TOTAL ${groupIndex}`;
        const totalRowIndex = wsData.length;

        wsData.push(
          padRow([
            totalLabel,
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            ...departments.map((d) => (groupDeptQty[d] != null ? groupDeptQty[d] : '')),
            groupTotalRequest,

            groupConfirmedQty,
            '',
            '',

            groupLastTotalPurchase,
            '',
            '',
            '',

            groupSumPrice,
            groupSumAmount,

            '',
            '',
          ])
        );

        mergeLabelRows.push(totalRowIndex);
        groupIndex++;
      });

      const totalGrandPrice = groups.reduce(
        (sum, g) =>
          sum +
          (g.subgroups || []).reduce(
            (s, sg) =>
              s +
              (sg.requisitions || []).reduce((t, req) => {
                const sel =
                  (req.suppliers || []).find((x) => x.isSelected === 1) || req.suppliers?.[0] || {};
                return t + safeNum(sel.price ?? req.price ?? 0);
              }, 0),
            0
          ),
        0
      );

      const grandRowIndex = wsData.length;

      wsData.push(
        padRow([
          'TOTAL',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          ...departments.map((d) => (grandDeptQty[d] != null ? grandDeptQty[d] : '')),
          grandTotalRequest,

          grandConfirmedQty,
          '',
          '',

          grandLastTotalPurchase,
          '',
          '',
          '',

          totalGrandPrice,
          safeNum(grandTotal?.totalAmount || 0),

          '',
          '',
        ])
      );

      mergeLabelRows.push(grandRowIndex);

      // ===== Signature =====
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
        if (startCol != null) {
          signatureTitles[startCol] = sig.title;
          signatureNames[startCol] = sig.name;
        }
      });

      wsData.push(blankLine, blankLine, signatureTitles, signBlank1, signBlank2, signatureNames, signBlank3);

      // ===== Build sheet =====
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Request Monthly');

      const border = { style: 'thin', color: { rgb: '000000' } };
      const commonBorder = { top: border, bottom: border, left: border, right: border };
      const centerStyle = { alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
      const range = XLSX.utils.decode_range(ws['!ref']);

      // ===== Styles =====
      for (let R = 0; R <= range.e.r; R++) {
        for (let C = 0; C <= range.e.c; C++) {
          const ref = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[ref]) ws[ref] = { t: 's', v: '' };

          const rowLabel = String(wsData[R]?.[0] ?? '');
          const upperLabel = rowLabel.toUpperCase();

          if (R === 0) {
            ws[ref].s = {
              font: { bold: true, sz: 18, name: 'Times New Roman' },
              alignment: { horizontal: 'center', vertical: 'center' },
            };
          } else if (R === 1 || R === 2) {
            ws[ref].s = {
              font: { bold: true, sz: 11, name: 'Times New Roman' },
              ...centerStyle,
              border: commonBorder,
            };
          } else if (upperLabel.includes('SUB TOTAL')) {
            ws[ref].s = {
              font: { bold: true, name: 'Times New Roman', sz: 11 },
              fill: { fgColor: { rgb: 'CCFFCC' } },
              alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
              border: commonBorder,
            };
            if (C === 0) ws[ref].s.alignment.horizontal = 'left';
          } else if (upperLabel.startsWith('TOTAL')) {
            ws[ref].s = {
              font: { bold: true, name: 'Times New Roman', sz: 11 },
              fill: { fgColor: { rgb: 'FFFF00' } },
              alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
              border: commonBorder,
            };
            if (C === 0) ws[ref].s.alignment.horizontal = 'left';
          } else if (R >= wsData.length - 7) {
            if (R === wsData.length - 5) {
              ws[ref].s = { font: { bold: true, name: 'Times New Roman', sz: 12 }, alignment: { horizontal: 'center' } };
            } else if (R === wsData.length - 2) {
              ws[ref].s = { font: { name: 'Times New Roman', sz: 12 }, alignment: { horizontal: 'center' } };
            } else {
              ws[ref].s = { font: { name: 'Times New Roman', sz: 12 }, alignment: { horizontal: 'center' } };
            }
          } else {
            ws[ref].s = { font: { sz: 11, name: 'Times New Roman' }, ...centerStyle, border: commonBorder };
          }

          // ✅ Apply Excel number format for money columns (ONLY numeric cells, data rows)
          if (R >= 3 && moneyCols.includes(C) && ws[ref]?.t === 'n') {
            ws[ref].s = {
              ...(ws[ref].s || {}),
              numFmt: moneyNumFmt,
            };
          }
        }
      }

      // Force center alignment
      const signatureBlockStart = wsData.length - 7;
      const centerCols = [
        ...Array.from({ length: deptLen }, (_, i) => deptStartCol + i),
        totalRequestCol,
        medQtyCol,
        medPriceCol,
        medAmountCol,
        lastTotalPurchaseCol,
        lastSupplierCol,
        lastPriceCol,
        lastDateCol,
        priceCol,
        amountCol,
        suppliersCol,
        remarkCol,
      ];

      const forceCenter = (r, c) => {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        ws[ref].s = {
          ...(ws[ref].s || {}),
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        };
      };

      centerCols.forEach((c) => {
        forceCenter(1, c);
        forceCenter(2, c);
      });
      for (let r = 3; r < signatureBlockStart; r++) {
        centerCols.forEach((c) => forceCenter(r, c));
      }

      // ===== MERGES =====
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },

        { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
        { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } },
        { s: { r: 1, c: 2 }, e: { r: 2, c: 2 } },
        { s: { r: 1, c: 3 }, e: { r: 1, c: 4 } },
        { s: { r: 1, c: 5 }, e: { r: 2, c: 5 } },
        { s: { r: 1, c: 6 }, e: { r: 2, c: 6 } },
        { s: { r: 1, c: 7 }, e: { r: 2, c: 7 } },
      ];

      if (deptLen > 0) merges.push({ s: { r: 1, c: deptStartCol }, e: { r: 1, c: deptEndCol } });

      merges.push({ s: { r: 1, c: totalRequestCol }, e: { r: 2, c: totalRequestCol } });

      merges.push({ s: { r: 1, c: medQtyCol }, e: { r: 1, c: medAmountCol } });

      merges.push({ s: { r: 1, c: lastTotalPurchaseCol }, e: { r: 1, c: lastDateCol } });

      merges.push(
        { s: { r: 1, c: priceCol }, e: { r: 2, c: priceCol } },
        { s: { r: 1, c: amountCol }, e: { r: 2, c: amountCol } }
      );

      merges.push(
        { s: { r: 1, c: suppliersCol }, e: { r: 2, c: suppliersCol } },
        { s: { r: 1, c: remarkCol }, e: { r: 2, c: remarkCol } }
      );

      mergeLabelRows.forEach((r) => merges.push({ s: { r, c: 0 }, e: { r, c: 7 } }));

      startPositions.forEach((startCol) => {
        const endCol = Math.min(startCol + 2, totalCols - 1);
        merges.push(
          { s: { r: wsData.length - 5, c: startCol }, e: { r: wsData.length - 5, c: endCol } },
          { s: { r: wsData.length - 2, c: startCol }, e: { r: wsData.length - 2, c: endCol } }
        );
      });

      ws['!merges'] = merges;

      // ===== Column widths =====
      ws['!cols'] = Array(totalCols).fill({ wch: 15 });
      ws['!cols'][0] = { wch: 6 };
      ws['!cols'][3] = ws['!cols'][4] = { wch: 28 };
      ws['!cols'][5] = ws['!cols'][6] = { wch: 16 };
      ws['!cols'][7] = { wch: 10 };

      for (let i = 0; i < deptLen; i++) ws['!cols'][deptStartCol + i] = { wch: 16 };

      ws['!cols'][totalRequestCol] = { wch: 16 };

      ws['!cols'][medQtyCol] = { wch: 10 };
      ws['!cols'][medPriceCol] = { wch: 12 };
      ws['!cols'][medAmountCol] = { wch: 12 };

      ws['!cols'][lastTotalPurchaseCol] = { wch: 22 };
      ws['!cols'][lastSupplierCol] = { wch: 24 };
      ws['!cols'][lastPriceCol] = { wch: 18 };
      ws['!cols'][lastDateCol] = { wch: 24 };

      ws['!cols'][priceCol] = { wch: 14 };
      ws['!cols'][amountCol] = { wch: 16 };

      ws['!cols'][suppliersCol] = { wch: 22 };
      ws['!cols'][remarkCol] = { wch: 22 };

      // ===== Export file =====
      const now = new Date();
      const fileName = `request_monthly_${String(now.getDate()).padStart(2, '0')}${String(
        now.getMonth() + 1
      ).padStart(2, '0')}${now.getFullYear()}_${String(now.getHours()).padStart(2, '0')}${String(
        now.getMinutes()
      ).padStart(2, '0')}.xlsx`;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout]), fileName);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export file');
    }
  };

  return (
    
    <Button
      variant="contained"
      color="success"
      onClick={exportToExcel}
      startIcon={<img src={ExcelIcon} alt="Excel" style={{ width: 20, height: 20 }} />}
      sx={{ textTransform: 'none', borderRadius: 1, px: 2, py: 0.6, fontWeight: 600, fontSize: '0.75rem' }}
    >
      Summary
    </Button>
  );
}
