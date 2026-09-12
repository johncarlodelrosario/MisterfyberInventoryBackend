import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Installation from "../models/Installation";
import Budget from "../models/Budget";
/**
 * Fetch installations matching the filter and flatten each `items[]` entry
 * into one report row per item.
 */
const buildReportRows = async (filter) => {
    const installations = await Installation.find(filter)
        .populate("items.inventoryId", "name price unit")
        .populate("siteId", "name location")
        .sort({ date: -1 });
    const rows = [];
    let totalAmount = 0;
    let siteName = "N/A";
    for (const inst of installations) {
        const site = inst.siteId;
        if (site?.name) {
            siteName = site.name;
        }
        const dateStr = inst.date
            ? new Date(inst.date).toLocaleDateString()
            : "N/A";
        if (!inst.items || inst.items.length === 0) {
            // Defensive: legacy records without items array
            rows.push({
                date: dateStr,
                site: site?.name || "N/A",
                item: "N/A",
                quantity: 0,
                price: 0,
                total: 0,
                status: inst.status || "N/A",
            });
            continue;
        }
        for (const item of inst.items) {
            const inventory = item.inventoryId;
            const price = inventory?.price || 0;
            const qty = item.quantity || 0;
            const total = qty * price;
            totalAmount += total;
            rows.push({
                date: dateStr,
                site: site?.name || "N/A",
                item: inventory?.name || "N/A",
                quantity: qty,
                price,
                total,
                status: inst.status || "N/A",
            });
        }
    }
    return { rows, totalAmount, siteName };
};
// ---- Excel Report ------------------------------------------------------
export const generateExcelReport = async (req, res) => {
    try {
        const { siteId, startDate, endDate } = req.query;
        const filter = {};
        if (siteId)
            filter.siteId = siteId;
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const { rows, totalAmount } = await buildReportRows(filter);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Inventory Report");
        worksheet.columns = [
            { header: "Date", key: "date", width: 15 },
            { header: "Site", key: "site", width: 20 },
            { header: "Item", key: "item", width: 25 },
            { header: "Quantity", key: "quantity", width: 15 },
            { header: "Price", key: "price", width: 15 },
            { header: "Total", key: "total", width: 15 },
            { header: "Status", key: "status", width: 15 },
        ];
        // Style header row
        worksheet.getRow(1).font = { bold: true };
        rows.forEach((row) => {
            worksheet.addRow(row);
        });
        // Summary row
        const summaryRow = worksheet.addRow({
            date: "TOTAL",
            site: "",
            item: "",
            quantity: "",
            price: "",
            total: totalAmount,
            status: "",
        });
        summaryRow.font = { bold: true };
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=inventory-report.xlsx");
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error("Excel Generation Error:", error);
        res.status(500).json({ error: "Error generating Excel report" });
    }
};
// ---- PDF Report --------------------------------------------------------
export const generatePDFReport = async (req, res) => {
    try {
        const { siteId, startDate, endDate } = req.query;
        const filter = {};
        if (siteId)
            filter.siteId = siteId;
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const { rows, totalAmount, siteName } = await buildReportRows(filter);
        // Get budget info (only meaningful when a specific site is requested)
        let budgetInfo = null;
        if (siteId) {
            budgetInfo = await Budget.findOne({ siteId });
        }
        const doc = new PDFDocument({
            size: "A4",
            margin: 50,
        });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=inventory-report.pdf");
        doc.pipe(res);
        // ---- Header ----
        doc.fontSize(20).text("Inventory Report", { align: "center" }).moveDown();
        doc.fontSize(12).text(`Site: ${siteName}`, { align: "center" }).moveDown();
        if (startDate || endDate) {
            const range = `${startDate ? new Date(startDate).toLocaleDateString() : "…"} - ${endDate ? new Date(endDate).toLocaleDateString() : "…"}`;
            doc.fontSize(10).text(`Period: ${range}`, { align: "center" }).moveDown();
        }
        if (budgetInfo) {
            doc
                .fontSize(11)
                .text(`Total Budget: $${budgetInfo.totalBudget || 0}`)
                .text(`Spent: $${budgetInfo.spent || 0}`)
                .text(`Remaining: $${budgetInfo.remaining || 0}`)
                .moveDown();
        }
        // ---- Table ----
        const tableTop = doc.y + 10;
        doc.fontSize(10);
        const headers = ["Date", "Item", "Quantity", "Price", "Total"];
        const colWidths = [100, 150, 70, 70, 70];
        let x = 50;
        headers.forEach((header, i) => {
            doc.text(header, x, tableTop, { width: colWidths[i], align: "center" });
            x += colWidths[i];
        });
        doc
            .moveTo(50, tableTop + 15)
            .lineTo(50 + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
            .stroke();
        let y = tableTop + 25;
        if (rows.length === 0) {
            doc.text("No installations found for this report.", 50, y + 20, {
                align: "center",
            });
        }
        else {
            rows.forEach((row) => {
                x = 50;
                const rowData = [
                    row.date,
                    row.item,
                    row.quantity.toString(),
                    `$${row.price}`,
                    `$${row.total}`,
                ];
                rowData.forEach((data, i) => {
                    doc.text(data, x, y, { width: colWidths[i], align: "center" });
                    x += colWidths[i];
                });
                y += 20;
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }
            });
        }
        // ---- Total Row ----
        y += 10;
        doc
            .moveTo(50, y - 5)
            .lineTo(50 + colWidths.reduce((a, b) => a + b, 0), y - 5)
            .stroke();
        doc.text(`Total: $${totalAmount}`, 50, y, {
            width: colWidths.reduce((a, b) => a + b, 0),
            align: "right",
        });
        doc.end();
    }
    catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).json({ error: "Error generating PDF report" });
    }
};
//# sourceMappingURL=reportController.js.map