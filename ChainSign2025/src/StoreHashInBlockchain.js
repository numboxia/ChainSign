import React, { useState } from 'react';
import { getSigner, callContractFunction } from './suiClient';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { keccak256 } from 'js-sha3'; // Import keccak256 from js-sha3
import { Buffer } from 'buffer'; // For converting string to bytes

const StoreHashInBlockchain = ({ documentId, ipfsURL }) => {
    const [status, setStatus] = useState('');
    const account = useCurrentAccount();

    const handleStoreHash = async () => {
        try {
            if (!account?.address) {
                setStatus('Please connect your wallet.');
                return;
            }

            const creatorAddress = account.address;
            const signer = await getSigner(creatorAddress);

            // Convert the IPFS URL to bytes
            const ipfsURLBytes = Buffer.from(ipfsURL, 'utf-8');

            // Compute keccak256 hash of the IPFS URL
            const ipfsHash = keccak256(ipfsURLBytes); // Returns hex string
            const ipfsHashBytes = Buffer.from(ipfsHash, 'hex'); // Convert hex to byte array

            // Call the contract function to store the hash
            const params = [documentId, Array.from(ipfsHashBytes)]; // Convert to array for Sui
            const result = await callContractFunction('store_document_hash', params, signer);

            if (result) {
                setStatus('Hash stored successfully!');
            } else {
                setStatus('Failed to store hash on blockchain.');
            }
        } catch (error) {
            console.error('Error storing hash:', error);
            setStatus('Error: ' + error.message);
        }
    };

    return (
        <div>
            <button onClick={handleStoreHash}>Store the file Hash in Blockchain</button>
            {status && <p>{status}</p>}
        </div>
    );
};

export default StoreHashInBlockchain;