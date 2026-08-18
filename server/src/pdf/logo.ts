import fs from "node:fs";
import path from "node:path";
import SVGtoPDF from "svg-to-pdfkit";

export function drawLogo(doc: PDFKit.PDFDocument, logoPfad: string | null, x: number, y: number, box: number) {
  if (!logoPfad) return;
  try {
    const filePath = path.resolve(process.cwd(), logoPfad.replace(/^\//, ""));
    if (filePath.toLowerCase().endsWith(".svg")) {
      const svg = fs.readFileSync(filePath, "utf-8");
      SVGtoPDF(doc, svg, x, y, { width: box, height: box, preserveAspectRatio: "xMaxYMin meet" });
    } else {
      doc.image(filePath, x, y, { fit: [box, box], align: "right" });
    }
  } catch {
    // Logo nicht lesbar oder ungültig – ohne Logo weiterfahren
  }
}
