// PdfChatPage.js
import React, { useState } from "react";
import { Document, Page } from "react-pdf";
import { Button, TextField, Box, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { pdfjs } from 'react-pdf';

// Update worker configuration
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

export default function PdfChatPage() {
  const [recentPdfs, setRecentPdfs] = useState([
    "/pdfs/doc1.pdf",
    "/pdfs/doc2.pdf",
    "/pdfs/doc3.pdf",
    "/pdfs/doc4.pdf",
    "/pdfs/doc5.pdf",
  ]);
  const [currentPdf, setCurrentPdf] = useState(recentPdfs[0]);
  const [numPages, setNumPages] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [pdfError, setPdfError] = useState(null);

  const handlePdfSelect = (event) => {
    setCurrentPdf(event.target.value);
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPdfError(null);
  }

  function onDocumentLoadError(error) {
    console.error('Error loading PDF:', error);
    setPdfError(error);
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: 'calc(100vh - 64px)', // Adjust for header
      border: '1px solid rgba(0, 0, 0, 0.12)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Left panel */}
      <Box sx={{ 
        width: '40%', 
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Document selector */}
        <FormControl sx={{ m: 2 }}>
          <InputLabel>Select Document</InputLabel>
          <Select
            value={currentPdf}
            onChange={handlePdfSelect}
            label="Select Document"
          >
            {recentPdfs.map((pdf, index) => (
              <MenuItem key={index} value={pdf}>
                Document {index + 1}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* PDF viewer */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          p: 2
        }}>
          {currentPdf ? (
            <Document
              file={currentPdf}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div>Loading PDF...</div>}
            >
              {Array.from(new Array(numPages), (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={400}
                />
              ))}
            </Document>
          ) : (
            <Paper sx={{ p: 2 }}>
              <p>Could not load PDF preview.</p>
              <Button 
                variant="contained" 
                onClick={() => window.open(currentPdf, "_blank")}
              >
                Open in Browser
              </Button>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Right panel */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        {/* Chat messages area */}
        <Box sx={{ 
          flexGrow: 1, 
          p: 2, 
          overflow: 'auto',
          backgroundColor: '#f5f5f5'
        }}>
          {/* TODO: Chat messages will go here */}
        </Box>

        {/* Input area */}
        <Paper sx={{ 
          p: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: '#fff'
        }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Type your prompt here..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: '#fff'
              }
            }}
          />
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            mt: 1 
          }}>
            <Button 
              variant="contained"
              onClick={() => {
                console.log("Send:", prompt);
                setPrompt("");
              }}
            >
              Send
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}