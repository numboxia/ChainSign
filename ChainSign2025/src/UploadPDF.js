// src/UploadPDF.js
import React, { useState } from 'react';
import { uploadToIPFS } from './uploadToIPFS';

const UploadPDF = () => {
    const [file, setFile] = useState(null);
    const [fileURL, setFileURL] = useState('');
    const [status, setStatus] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            setStatus('Please select a file first.');
            return;
        }

        setStatus('Uploading to IPFS...');
        const ipfsURL = await uploadToIPFS(file);
        if (ipfsURL) {
            setFileURL(ipfsURL);
            setStatus('File uploaded successfully!');
        } else {
            setStatus('File upload failed.');
        }
    };

    return (
        <div>
            <h2>Upload PDF to IPFS</h2>
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload PDF</button>
            {status && <p>{status}</p>}
            {fileURL && (
                <div>
                    <p>File uploaded to IPFS:</p>
                    <a href={fileURL} target="_blank" rel="noopener noreferrer">
                        {fileURL}
                    </a>
                </div>
            )}
        </div>
    );
};

export default UploadPDF;
