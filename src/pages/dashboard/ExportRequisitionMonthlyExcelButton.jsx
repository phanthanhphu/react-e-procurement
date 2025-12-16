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

  useEffect(() => {
    if (!groupId) return;

    const fetchInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/group-summary-requisitions/${groupId}`);
        const data = await res.json();
        if (data.createdDate && Array.isArray(data.createdDate)) {
          const [y, m, d] = data.createdDate;
          setCreatedDate(`${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`);
        }
      } catch (e) {
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

  const fmtVN = (v) => {
    const n = safeNum(v);
    return n.toLocaleString('vi-VN');
  };

  const exportToExcel = async () => {
    if (!groupId) return alert('Thiếu groupId');

    try {
      const res = await axios.get(`${API_BASE_URL}/comparison-monthly-grouped`, {
        params: { groupId, removeDuplicateSuppliers: false },
      });

      const { groups: rawGroups, grandTotal } = res.data;
      const groups = rawGroups || [];

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
      // A..H = 0..7  (No, Type1, Type2, EN, VN, OldSAP, HanaSAP, Unit)
      const FIXED_COLS = 8;
      const deptStartCol = FIXED_COLS; // 8
      const deptEndCol = deptStartCol + deptLen - 1;

      const totalRequestCol = FIXED_COLS + deptLen; // after depts
      const confirmedCol = totalRequestCol + 1;
      const priceCol = confirmedCol + 1;
      const amountCol = priceCol + 1;
      const suppliersCol = amountCol + 1;

      const totalCols = FIXED_COLS + deptLen + 5; // + TotalRequest + Confirmed + Price + Amount + Suppliers

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
          'Confirmed MED Quantity',
          'Price',
          'Amount',
          'Suppliers',
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
          '',
          '',
          '',
          '',
        ])
      );

      let itemNo = 1;
      let groupIndex = 1;

      // grand totals
      const grandDeptQty = {};
      departments.forEach((d) => (grandDeptQty[d] = 0));
      let grandTotalRequest = 0;
      let grandConfirmedQty = 0;

      // track rows to merge A..H
      const mergeLabelRows = [];

      groups.forEach((group) => {
        const type1Name = (group.type1Name || '').trim();
        let subgroupIndex = 1;

        const groupDeptQty = {};
        departments.forEach((d) => (groupDeptQty[d] = 0));
        let groupTotalRequest = 0;
        let groupConfirmedQty = 0;
        let groupSumPrice = 0;
        let groupSumAmount = 0;

        (group.subgroups || []).forEach((subgroup) => {
          const type2Name = (subgroup.type2Name || '').trim();

          const subDeptQty = {};
          departments.forEach((d) => (subDeptQty[d] = 0));
          let subTotalRequest = 0;
          let subConfirmedQty = 0;
          let subSumPrice = 0;
          let subSumAmount = 0;

          (subgroup.requisitions || []).forEach((req) => {
            const deptMap = {};
            (req.departmentRequests || []).forEach((dr) => {
              const qty = safeNum(dr.buy ?? dr.qty ?? 0);
              const deptName = dr.departmentName;
              if (!deptName) return;

              deptMap[deptName] = qty;

              subDeptQty[deptName] = safeNum(subDeptQty[deptName]) + qty;
              groupDeptQty[deptName] = safeNum(groupDeptQty[deptName]) + qty;
              grandDeptQty[deptName] = safeNum(grandDeptQty[deptName]) + qty;
            });

            const selected = (req.suppliers || []).find((s) => s.isSelected === 1) || req.suppliers?.[0] || {};
            const price = safeNum(selected.price ?? req.price ?? 0);
            const amount = safeNum(req.amount ?? 0);

            subTotalRequest += safeNum(req.totalRequestQty ?? 0);
            subConfirmedQty += safeNum(req.dailyMedInventory ?? 0);

            groupTotalRequest += safeNum(req.totalRequestQty ?? 0);
            groupConfirmedQty += safeNum(req.dailyMedInventory ?? 0);

            grandTotalRequest += safeNum(req.totalRequestQty ?? 0);
            grandConfirmedQty += safeNum(req.dailyMedInventory ?? 0);

            subSumPrice += price;
            subSumAmount += amount;
            groupSumPrice += price;
            groupSumAmount += amount;

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
                safeNum(req.totalRequestQty ?? 0),
                safeNum(req.dailyMedInventory ?? 0),
                fmtVN(price),
                fmtVN(amount),
                selected.supplierName || '',
              ])
            );
          });

          // ===== SUB TOTAL row (label in col A because merge A..H) =====
          const subLabel = `SUB TOTAL ${groupIndex}.${subgroupIndex}`;
          const subRowIndex = wsData.length;

          wsData.push(
            padRow([
              subLabel, // col A
              '', '', '', '', '', '', '',
              ...departments.map((d) => (subDeptQty[d] != null ? subDeptQty[d] : '')),
              subTotalRequest,
              subConfirmedQty,
              fmtVN(subSumPrice),
              fmtVN(subSumAmount),
              '',
            ])
          );

          mergeLabelRows.push(subRowIndex); // merge A..H
          subgroupIndex++;
        });

        // ===== TOTAL group row =====
        const totalLabel = `TOTAL ${groupIndex}`;
        const totalRowIndex = wsData.length;

        wsData.push(
          padRow([
            totalLabel, // col A
            '', '', '', '', '', '', '',
            ...departments.map((d) => (groupDeptQty[d] != null ? groupDeptQty[d] : '')),
            groupTotalRequest,
            groupConfirmedQty,
            fmtVN(groupSumPrice),
            fmtVN(groupSumAmount),
            '',
          ])
        );

        mergeLabelRows.push(totalRowIndex);
        groupIndex++;
      });

      // ===== Grand Total row =====
      const totalGrandPrice = groups.reduce(
        (sum, g) =>
          sum +
          (g.subgroups || []).reduce(
            (s, sg) =>
              s +
              (sg.requisitions || []).reduce((t, req) => {
                const sel = (req.suppliers || []).find((x) => x.isSelected === 1) || req.suppliers?.[0] || {};
                return t + safeNum(sel.price ?? req.price ?? 0);
              }, 0),
            0
          ),
        0
      );

      const grandRowIndex = wsData.length;

      wsData.push(
        padRow([
          'TOTAL', // ✅ uppercase
          '', '', '', '', '', '', '',
          ...departments.map((d) => (grandDeptQty[d] != null ? grandDeptQty[d] : '')),
          grandTotalRequest,
          grandConfirmedQty,
          fmtVN(totalGrandPrice),
          fmtVN(grandTotal?.totalAmount || 0),
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

      // ===== Styles (create missing cells too) =====
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
            // label cell (col A) align left to look nicer
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
            // signature area
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
        }
      }

      // ✅ FORCE CENTER for: Departments + Total Request + Confirmed + Price + Amount + Suppliers (header + values)
      const signatureBlockStart = wsData.length - 7; // 7 rows signature block
      const centerCols = [
        ...Array.from({ length: deptLen }, (_, i) => deptStartCol + i),
        totalRequestCol,
        confirmedCol,
        priceCol,
        amountCol,
        suppliersCol,
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
        // title merge
        { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },

        // header fixed merges
        { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }, // No
        { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } }, // Type1
        { s: { r: 1, c: 2 }, e: { r: 2, c: 2 } }, // Type2
        { s: { r: 1, c: 3 }, e: { r: 1, c: 4 } }, // Description group EN/VN
        { s: { r: 1, c: 5 }, e: { r: 2, c: 5 } }, // Old SAP
        { s: { r: 1, c: 6 }, e: { r: 2, c: 6 } }, // Hana
        { s: { r: 1, c: 7 }, e: { r: 2, c: 7 } }, // Unit
      ];

      // departments group header merge (only if deptLen > 0)
      if (deptLen > 0) {
        merges.push({ s: { r: 1, c: deptStartCol }, e: { r: 1, c: deptEndCol } });
      }

      // totals columns vertical merge row1-row2
      merges.push(
        { s: { r: 1, c: totalRequestCol }, e: { r: 2, c: totalRequestCol } },
        { s: { r: 1, c: confirmedCol }, e: { r: 2, c: confirmedCol } },
        { s: { r: 1, c: priceCol }, e: { r: 2, c: priceCol } },
        { s: { r: 1, c: amountCol }, e: { r: 2, c: amountCol } },
        { s: { r: 1, c: suppliersCol }, e: { r: 2, c: suppliersCol } }
      );

      // ✅ merge SUB TOTAL / TOTAL / GRAND TOTAL rows from A..H (0..7)
      mergeLabelRows.forEach((r) => {
        merges.push({ s: { r, c: 0 }, e: { r, c: 7 } });
      });

      // signature merges
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

      // dept cols
      for (let i = 0; i < deptLen; i++) ws['!cols'][deptStartCol + i] = { wch: 16 };

      ws['!cols'][totalRequestCol] = { wch: 16 };
      ws['!cols'][confirmedCol] = { wch: 22 };
      ws['!cols'][priceCol] = { wch: 14 };
      ws['!cols'][amountCol] = { wch: 16 };
      ws['!cols'][suppliersCol] = { wch: 22 };

      // ===== Export file =====
      const now = new Date();
      const fileName = `request_monthly_${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.xlsx`;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout]), fileName);
    } catch (err) {
      console.error('Export error:', err);
      alert('Lỗi xuất file');
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
      Export Monthly
    </Button>
  );
}
