"use client";

import React, { useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface UploadColumnProps {
  file: File | null;
  pdfBuffer: ArrayBuffer | null;
  onFileUpload?: (file: File) => void;
  onRemove?: () => void;
}

const UploadColumn: React.FC<UploadColumnProps> = ({ file, pdfBuffer, onFileUpload, onRemove }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload?.(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: !!file,
  });

  // Memoize the file prop for <Document />
  const memoizedFile = useMemo(() => (pdfBuffer ? { data: pdfBuffer } : undefined), [pdfBuffer]);

  return (
    <div>
      <h2>Upload PDF</h2>
      {file && pdfBuffer ? (
        <>
          <button onClick={onRemove} style={{ marginBottom: 16, background: '#eee', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>
            Remove PDF
          </button>
          <div style={{ marginBottom: 16 }}>
            <strong>Selected file:</strong>
            <div>{file.name} ({(file.size / 1024).toFixed(1)} KB)</div>
          </div>
          <div>
            <Document file={memoizedFile} loading={<div>Loading PDF...</div>}>
              <Page pageNumber={1} width={250} />
            </Document>
          </div>
        </>
      ) : (
        <div
          {...getRootProps()}
          style={{
            border: "2px dashed #888",
            borderRadius: 8,
            padding: 32,
            textAlign: "center",
            background: isDragActive ? "#f0f0f0" : "#fafafa",
            cursor: "pointer",
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the PDF here ...</p>
          ) : (
            <p>Drag 'n' drop a PDF file here, or click to select</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadColumn; 