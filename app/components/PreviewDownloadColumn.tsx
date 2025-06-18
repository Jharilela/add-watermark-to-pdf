"use client";
import React, { useState } from "react";
import { Document, Page, pdfjs } from 'react-pdf';

// Set workerSrc for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const PreviewDownloadColumn = ({
  processedPdf,
  onDownload,
}: {
  processedPdf?: ArrayBuffer;
  onDownload?: () => void;
}) => {
  const [loadingProcessed, setLoadingProcessed] = useState(false);

  return (
    <div>
      <h2>Preview & Download</h2>
      <div style={{ marginBottom: 24 }}>
        <div><strong>After Watermark:</strong></div>
        {processedPdf ? (
          <Document
            file={{ data: processedPdf }}
            loading={<div>Loading PDF...</div>}
            onLoadStart={() => setLoadingProcessed(true)}
            onLoadSuccess={() => setLoadingProcessed(false)}
            onLoadError={() => setLoadingProcessed(false)}
          >
            <Page pageNumber={1} width={250} />
          </Document>
        ) : (
          <div style={{ border: '1px solid #ccc', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
            PDF Preview (after)
          </div>
        )}
      </div>
      <button onClick={onDownload} style={{ width: "100%" }} disabled={!processedPdf}>
        Download Processed PDF
      </button>
    </div>
  );
};

export default PreviewDownloadColumn; 