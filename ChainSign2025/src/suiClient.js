// src/suiClient.js
import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

// Initialize Sui client (replace with your network: testnet, mainnet, etc.)
const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

// Get signer for the user's address
export async function getSigner(address) {
    // In a real app, the signer is typically provided by the wallet via @mysten/dapp-kit
    // This is a placeholder; replace with actual wallet integration
    const keypair = Ed25519Keypair.deriveKeypair('your-mnemonic-seed-phrase');
    return keypair;
}

// Call a contract function
export async function callContractFunction(functionName, params, signer) {
    try {
        const packageId = 'YOUR_PACKAGE_ID'; // Replace with your contract's package ID
        const moduleName = 'YOUR_MODULE_NAME'; // Replace with your module name
        const tx = {
            packageId,
            module: moduleName,
            function: functionName,
            arguments: params,
            gasBudget: 1000000,
        };
        const result = await client.signAndExecuteTransactionBlock({
            signer,
            transactionBlock: tx,
        });
        return result;
    } catch (error) {
        console.error('Contract call failed:', error);
        return null;
    }
}