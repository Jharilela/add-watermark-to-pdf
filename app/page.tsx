"use client";
import React, { useState } from "react";
import UploadColumn from "./components/UploadColumn";
import WatermarkSettingsColumn from "./components/WatermarkSettingsColumn";
import PreviewDownloadColumn from "./components/PreviewDownloadColumn";
import { PDFDocument, rgb, degrees } from "pdf-lib";

function getPositionCoords(
  position: string,
  pageWidth: number,
  pageHeight: number,
  wmWidth: number,
  wmHeight: number
): [number, number] {
  // Returns [x, y] for watermark placement
  const margin = 20;
  switch (position) {
    case "top-left": return [margin, pageHeight - wmHeight - margin];
    case "top-center": return [(pageWidth - wmWidth) / 2, pageHeight - wmHeight - margin];
    case "top-right": return [pageWidth - wmWidth - margin, pageHeight - wmHeight - margin];
    case "center-left": return [margin, (pageHeight - wmHeight) / 2];
    case "center": return [(pageWidth - wmWidth) / 2, (pageHeight - wmHeight) / 2];
    case "center-right": return [pageWidth - wmWidth - margin, (pageHeight - wmHeight) / 2];
    case "bottom-left": return [margin, margin];
    case "bottom-center": return [(pageWidth - wmWidth) / 2, margin];
    case "bottom-right": return [pageWidth - wmWidth - margin, margin];
    default: return [margin, margin];
  }
}

export default function Page() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPdfBuffer, setUploadedPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [watermarkSettings, setWatermarkSettings] = useState<any>(null);
  const [processedPdfBuffer, setProcessedPdfBuffer] = useState<ArrayBuffer | null>(null);

  // Handle file upload and read as ArrayBuffer
  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setProcessedPdfBuffer(null); // Reset processed PDF on new upload
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedPdfBuffer(e.target.result as ArrayBuffer);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Helper: parse page selection string (e.g. "1,3,5")
  function parsePages(pages: string, total: number) {
    if (pages === "all") return Array.from({ length: total }, (_, i) => i);
    return pages
      .split(",")
      .map((p) => parseInt(p.trim(), 10) - 1)
      .filter((p) => !isNaN(p) && p >= 0 && p < total);
  }

  // Handle watermark settings apply
  const handleApplyWatermark = async (settings: any) => {
    setWatermarkSettings(settings);
    if (!uploadedPdfBuffer) return;
    const pdfDoc = await PDFDocument.load(uploadedPdfBuffer);
    const pages = pdfDoc.getPages();
    const pageIndexes = parsePages(settings.pages, pages.length);

    // Prepare watermark image or text
    let wmImgBytes: Uint8Array | undefined;
    let wmDims = { width: 200, height: 50 };
    let wmText = settings.text;
    let wmImgUrl: string | undefined;
    if (settings.type === "image" && settings.image) {
      // Use dynamic import for fabric
      const fabric = (await import("fabric")).default;
      const imgFile = settings.image;
      const imgUrl = URL.createObjectURL(imgFile);
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const i = new window.Image();
        i.onload = () => resolve(i);
        i.src = imgUrl;
      });
      const canvas = new fabric.Canvas(undefined, { width: img.width, height: img.height });
      const fabricImg = new fabric.Image(img, {
        angle: settings.rotation,
        opacity: settings.transparency / 100,
      });
      canvas.add(fabricImg);
      canvas.setWidth(fabricImg.getScaledWidth());
      canvas.setHeight(fabricImg.getScaledHeight());
      canvas.renderAll();
      wmDims = { width: canvas.getWidth(), height: canvas.getHeight() };
      wmImgUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
      if (wmImgUrl) {
        const res = await fetch(wmImgUrl);
        wmImgBytes = new Uint8Array(await res.arrayBuffer());
      }
      URL.revokeObjectURL(imgUrl);
    }

    // For each selected page, add watermark
    for (const idx of pageIndexes) {
      const page = pages[idx];
      const { width, height } = page.getSize();
      if (settings.type === "text") {
        // Text watermark
        const fontSize = 36;
        const textWidth = fontSize * wmText.length * 0.6;
        const textHeight = fontSize;
        const [x, y] = getPositionCoords(settings.position, width, height, textWidth, textHeight);
        const color = rgb(0, 0, 0);
        const opacity = settings.transparency / 100;
        if (settings.mosaic) {
          // Tile text watermark
          const xStep = textWidth + 40;
          const yStep = textHeight + 40;
          for (let px = 0; px < width; px += xStep) {
            for (let py = 0; py < height; py += yStep) {
              page.drawText(wmText, {
                x: px,
                y: py,
                size: fontSize,
                color,
                rotate: degrees(settings.rotation),
                opacity,
              });
            }
          }
        } else {
          page.drawText(wmText, {
            x,
            y,
            size: fontSize,
            color,
            rotate: degrees(settings.rotation),
            opacity,
          });
        }
      } else if (settings.type === "image" && wmImgBytes && wmImgUrl) {
        // Image watermark
        const imgEmbed = await pdfDoc.embedPng(wmImgBytes);
        const imgDims = imgEmbed.scale(1);
        const [wmWidth, wmHeight] = [imgDims.width, imgDims.height];
        const [x, y] = getPositionCoords(settings.position, width, height, wmWidth, wmHeight);
        if (settings.mosaic) {
          // Tile image watermark
          const xStep = wmWidth + 40;
          const yStep = wmHeight + 40;
          for (let px = 0; px < width; px += xStep) {
            for (let py = 0; py < height; py += yStep) {
              page.drawImage(imgEmbed, {
                x: px,
                y: py,
                width: wmWidth,
                height: wmHeight,
                rotate: degrees(settings.rotation),
                opacity: settings.transparency / 100,
              });
            }
          }
        } else {
          page.drawImage(imgEmbed, {
            x,
            y,
            width: wmWidth,
            height: wmHeight,
            rotate: degrees(settings.rotation),
            opacity: settings.transparency / 100,
          });
        }
      }
    }
    const pdfBytes = await pdfDoc.save();
    setProcessedPdfBuffer(pdfBytes);
  };

  // Handle download
  const handleDownload = () => {
    if (!processedPdfBuffer) return;
    const blob = new Blob([processedPdfBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "watermarked.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle remove PDF
  const handleRemove = () => {
    setUploadedFile(null);
    setUploadedPdfBuffer(null);
    setWatermarkSettings(null);
    setProcessedPdfBuffer(null);
  };

  return (
    <main style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ flex: 1, borderRight: "1px solid #eee", padding: 24 }}>
        <UploadColumn
          file={uploadedFile}
          pdfBuffer={uploadedPdfBuffer}
          onFileUpload={handleFileUpload}
          onRemove={handleRemove}
        />
      </div>
      <div style={{ flex: 1, borderRight: "1px solid #eee", padding: 24 }}>
        <WatermarkSettingsColumn onApply={handleApplyWatermark} />
      </div>
      <div style={{ flex: 1, padding: 24 }}>
        <PreviewDownloadColumn
          originalPdf={uploadedPdfBuffer || undefined}
          processedPdf={processedPdfBuffer || undefined}
          onDownload={handleDownload}
        />
      </div>
    </main>
  );
}
