'use client';
import React, { useState, useRef } from 'react';
import './Sender.css';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

const Sender = () => {
  const companyName = 'Chain Sign';
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [isSigned, setIsSigned] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [blobId, setBlobId] = useState(null);
  const [docId, setDocId] = useState(null);

  // Replace with actual IDs from contract deployment
  const PACKAGE_ID = '0xYOUR_PACKAGE_ID'; // From sui client publish
  const EMPLOYEE_REGISTRY_ID = '0xYOUR_REGISTRY_ID'; // EmployeeRegistry object ID
  const DOCUMENT_STORE_ID = '0xYOUR_STORE_ID'; // DocumentStore object ID

  // Map people to employee addresses (replace with actual addresses)
  const people = [
    { id: 1, name: 'Ahmet Numan', address: '0xJOHN_DOE_ADDRESS' },
    { id: 2, name: 'Arif Kemal', address: '0xJANE_SMITH_ADDRESS' },
    { id: 3, name: 'Tugay', address: '0xALICE_JOHNSON_ADDRESS' },
    { id: 4, name: 'Mehmet', address: '0xBOB_BROWN_ADDRESS' },
  ];

  const handleCheckboxChange = (id) => {
    setSelectedPeople((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((personId) => personId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const fileInputRef = useRef();

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleSend = async () => {
    if (!account) {
      setError('Please connect your wallet.');
      return;
    }
    if (!isSigned) {
      setError('Please sign the document.');
      return;
    }
    if (!file) {
      setError('Please select a file.');
      return;
    }
    if (selectedPeople.length === 0) {
      setError('Please select at least one approver.');
      return;
    }

    setError(null);
    try {
      // Step 1: Upload file to Walrus
      const formData = new FormData();
      formData.append('file', file);
      const walrusResponse = await fetch('https://api.walrus-testnet.sui.io/v1/store', {
        method: 'POST',
        body: formData,
      });

      if (!walrusResponse.ok) {
        throw new Error('Failed to upload file to Walrus.');
      }

      const { blob_id: blobId } = await walrusResponse.json(); // Walrus returns blob_id
      setBlobId(blobId);

      // Step 2: Create document on Sui
      const firstApprover = people.find((p) => selectedPeople.includes(p.id))?.address;
      if (!firstApprover) {
        throw new Error('No valid approver selected.');
      }

      const contentHash = new TextEncoder().encode(blobId); // Convert blobId to bytes
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::documentmanagement::create_document`,
        arguments: [
          tx.object(DOCUMENT_STORE_ID), // DocumentStore
          tx.object(EMPLOYEE_REGISTRY_ID), // EmployeeRegistry
          tx.pure(contentHash, 'vector<u8>'), // Blob ID as content_hash
          tx.pure(firstApprover, 'address'), // First approver
        ],
      });

      await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            const event = result.events?.find(
              (e) => e.type === `${PACKAGE_ID}::documentmanagement::DocumentCreatedEvent`
            );
            const docId = event?.parsedJson?.doc_id || 'unknown';
            setDocId(docId);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          },
          onError: (error) => {
            setError('Failed to create document: ' + error.message);
          },
        }
      );
    } catch (error) {
      setError('Error transferring file: ' + error.message);
    }
  };

  return (
    <div className="sender-container">
      <header className="header">
        <h1>{companyName}</h1>
      </header>

      <div className="horizontal-layout">
        <aside className="search-bar-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ul className="people-list">
            {people
              .filter((person) => person.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((person) => (
                <li key={person.id} className="people-item">
                  <input
                    type="checkbox"
                    checked={selectedPeople.includes(person.id)}
                    onChange={() => handleCheckboxChange(person.id)}
                    className="people-checkbox"
                  />
                  {person.name}
                </li>
              ))}
          </ul>
        </aside>

        <section className="upload-container">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept="application/pdf"
            />
            <button className="upload-button" onClick={handleButtonClick}>
              {file ? `Yükle: ${file.name}` : 'Dosya Seç ve Yükle'}
            </button>
            {file && <p>CHOSEN FILE: {file.name}</p>}
          </div>
        </section>

        <aside className="rightspace"></aside>

        {showSuccess && (
          <div className="success-message">
            📄 FILE SENT SUCCESSFULLY! Document ID: {docId}
          </div>
        )}

        <div className="bottom-bar">
          <div className="left-section">
            {account ? (
              <>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isSigned}
                    onChange={(e) => setIsSigned(e.target.checked)}
                  />
                  SIGN
                  <h1>{account.address.slice(0, 8) + '....'}</h1>
                </label>
              </>
            ) : (
              <ConnectButton />
            )}
          </div>
          <div className="right-section">
            <button
              className="send-button"
              disabled={!isSigned || selectedPeople.length === 0 || !file || isPending}
              onClick={handleSend}
            >
              {isPending ? 'Gönderiliyor...' : 'GÖNDER'}
            </button>
          </div>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {blobId && <div className="success-message">File stored in Walrus! Blob ID: {blobId}</div>}
    </div>
  );
};

export default Sender;