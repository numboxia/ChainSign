import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import './Receiver.css';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const Receiver = () => {
  const companyName = 'Chain Sign';
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [isSigned, setIsSigned] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState(null);
  const [blobId, setBlobId] = useState(''); // Replace with dynamic blobId
  const [docId, setDocId] = useState('0'); // Replace with dynamic docId

  // Sample people list (replace with contract query)
  const people = [
    { name: 'Arif Kemal', status: 'signed', date: '2025-04-26 14:30' },
    { name: 'Ahmet Numan', status: 'signed', date: '2025-04-25 10:15' },
    { name: 'Tugay', status: 'waiting', date: null },
    { name: 'Niko', status: 'waiting', date: null },
  ];
  const sortedPeople = [...people].sort((a, b) => {
    if (a.status === 'signed' && b.status !== 'signed') return -1;
    if (a.status !== 'signed' && b.status === 'signed') return 1;
    return 0;
  });

  const handleApprove = async () => {
    if (!account) {
      setError('Please connect your wallet.');
      return;
    }
    if (!isSigned) {
      setError('Please sign the document.');
      return;
    }
    if (!docId) {
      setError('No document selected.');
      return;
    }

    setError(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: '0xYOUR_PACKAGE_ID::documentmanagement::approve_document',
        arguments: [
          tx.object('0xYOUR_STORE_ID'),
          tx.object('0xYOUR_REGISTRY_ID'),
          tx.pure(docId, 'u64'),
          tx.pure(null, 'Option<address>'), // No next approver (completes)
        ],
      });

      await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          },
          onError: (error) => {
            setError('Failed to approve document: ' + error.message);
          },
        }
      );
    } catch (error) {
      setError('Error approving document: ' + error.message);
    }
  };

  return (
    <div>
      <header className="header">
        <h1>{companyName}</h1>
      </header>
      <div className="horizontal-layout">
        <aside className="sidebar">
          {sortedPeople.map((person, index) => (
            <div key={index} className={`person-card ${person.status}`}>
              <div className="person-row">
                <span className="person-name">{person.name}</span>
                <div className="person-info">
                  {person.status === 'signed' ? (
                    <>
                      <span className="person-date">{person.date}</span>
                      <span className="person-icon">✓</span>
                    </>
                  ) : (
                    <>
                      <span className="person-date">Waiting</span>
                      <span className="person-icon">⏳</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </aside>

        <section className="content">
          <div className="pdf-container">
            {blobId ? (
              <Document
                file={`https://api.walrus.sui.io/blob/${blobId}`} // Replace with actual Walrus URL
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <Page key={`page_${index + 1}`} pageNumber={index + 1} scale={scale} />
                ))}
              </Document>
            ) : (
              <p>No document selected.</p>
            )}
            <div className="zoom-controls">
              <button onClick={() => setScale((prev) => prev + 0.2)}>Zoom In +</button>
              <button onClick={() => setScale((prev) => Math.max(prev - 0.2, 0.5))}>Zoom Out -</button>
            </div>
          </div>
        </section>

        <aside className="rightspace"></aside>

        {showSuccess && (
          <div className="success-message">📄 FILE SENT SUCCESSFULLY!</div>
        )}

        <div className="bottom-bar">
          <div className="left-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isSigned}
                onChange={(e) => setIsSigned(e.target.checked)}
              />
              SIGN
            </label>
          </div>
          <div className="right-section">
            <button
              className="send-button"
              disabled={!isSigned || isPending}
              onClick={handleApprove}
            >
              {isPending ? 'Gönderiliyor...' : 'GÖNDER'}
            </button>
          </div>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Receiver;