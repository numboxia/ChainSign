import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignInPage.css';
// import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useCurrentAccount, useSignAndExecuteTransaction, ConnectButton } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SuietWallet } from '@suiet/wallet-kit';
import { Link } from 'react-router-dom';


// import { ConnectButton } from '@suiet/wallet-kit';

const SignInPage = () => {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [blobId, setBlobId] = useState(null);

  // Handle wallet login with message signing
  const handleWalletLogin = async () => {
    if (!account) {
      setError('Please connect your wallet.');
      return;
    }

    setError(null);
    try {
      const message = new TextEncoder().encode('Login to ChainSign');
      const tx = new Transaction();

      await signAndExecute(
        {
          transaction: tx,
          requestType: 'personalMessage',
          message,
        },
        {
          onSuccess: (result) => {
            console.log('Message signed:', result);
            navigate('/sender'); // Redirect to sender page
          },
          onError: (error) => {
            console.error('Signature failed:', error);
            setError('Failed to sign message. Please try again.');
          },
        }
      );
    } catch (error) {
      console.error('Wallet login failed:', error);
      setError('Login failed. Please try again.');
    }
  };

  // Handle file transfer to Walrus
  const handleFileTransfer = async () => {
    if (!account) {
      setError('Please connect your wallet.');
      return;
    }
    if (!file) {
      setError('Please select a file.');
      return;
    }

    setError(null);
    try {
      // Step 1: Upload file to Walrus via HTTP API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('address', account.address);

      const response = await fetch('https://api.walrus.sui.io/store', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file to Walrus.');
      }

      const { blobId } = await response.json();
      setBlobId(blobId);
      console.log('File stored in Walrus, Blob ID:', blobId);

      // Step 2: Record transfer on Sui blockchain
      const tx = new Transaction();
      // Store blob ID as a Sui object (hypothetical contract)
      tx.moveCall({
        target: '0xYOUR_WALRUS_CONTRACT_ADDRESS::store_blob_metadata',
        arguments: [tx.pure(blobId), tx.pure(account.address)],
      });

      await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Transfer recorded on Sui:', result);
            setError(null);
            alert(`File transferred! Blob ID: ${blobId}`);
          },
          onError: (error) => {
            console.error('Sui transaction failed:', error);
            setError('Failed to record transfer on Sui.');
          },
        }
      );
    } catch (error) {
      console.error('File transfer error:', error);
      setError('Error transferring file. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Login to ChainSign</h2>
        {account ? (
          <div>
            <p>Wallet connected: Yes</p>
            <p>Wallet Address: {account.address}</p>
            <div>
              <p>Move to the next page</p>
              <Link to="/sender">
                <button>Next</button>
              </Link>
            </div>
            {/* <button
              onClick={handleWalletLogin}
              className="login-button"
              disabled={isPending}
            >
              {isPending ? 'Signing...' : 'Sign and Login'}
            </button>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="login-input"
              style={{ marginTop: '1rem' }}
            />
            <button
              onClick={handleFileTransfer}
              className="login-button"
              disabled={isPending || !file}
            >
              {isPending ? 'Transferring...' : 'Transfer File'}
            </button> */}
            {blobId && (
              <p className="success-message">
                File stored in Walrus! Blob ID: {blobId}
              </p>
            )}
          </div>
        ) : (
          <div  className='test-ccc'>
            <p >Wallet connected: No</p>
            <ConnectButton />
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default SignInPage;