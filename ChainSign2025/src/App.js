import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import Sender from './pages/Sender';
import Receiver from './pages/Receiver';
import AdminPage from './pages/AdminPage';
import { WalletProvider, SuiClientProvider } from '@mysten/dapp-kit';
import { SuiClient } from '@mysten/sui.js/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css'; // Import dapp-kit styles
import StoreHashInBlockchain from './StoreHashInBlockchain';

import client from "./web3";
// import { WalletProvider } from "@aptos-labs/wallet-adapter-react";
// import contractABI from "./abi/contract.json";

// import UploadPDF from './UploadPDF';
// import StoreHashInBlockchain from './StoreHashInBlockchain';


const queryClient = new QueryClient();
// const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

const callContract = async () => {
  const payload = {
    function: "0x<contract_address>::module_name::function_name",
    type_arguments: [],
    arguments: [/* params */],
  };
  const txn = await client.submitTransaction(payload); // Adjust based on SDK
  console.log(txn);
};
function App() {
  
  const [fileURL, setFileURL] = React.useState('');

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider client={client} networks={{ testnet: { url: 'https://fullnode.testnet.sui.io:443' } }} defaultNetwork="testnet">
        <WalletProvider>
          {/* <div className="App">
              <h1>Document Management System</h1>
              <UploadPDF setFileURL={setFileURL} />
              {fileURL && <StoreHashInBlockchain documentId={1} ipfsURL={fileURL} />}
          </div> */}
          {/* <WalletProvider><YourApp /></WalletProvider> */}
          {/* <StoreHashInBlockchain
                        documentId="doc123"
                        ipfsURL="https://ipfs.io/ipfs/QmYourIPFSHash"
                    /> */}
          <Router>
            <Routes>
              <Route path="/" element={<SignInPage />} />
              <Route path="/sender" element={<Sender />} />
              <Route path="/receiver" element={<Receiver />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </Router>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;