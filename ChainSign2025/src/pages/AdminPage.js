import React, { useState } from 'react';
import './AdminPage.css';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const navigate = useNavigate();
  const [employeeAddress, setEmployeeAddress] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAddEmployee = async () => {
    if (!account) {
      setError('Please connect your wallet.');
      return;
    }
    if (!employeeAddress) {
      setError('Please enter an employee address.');
      return;
    }

    setError(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: '0xYOUR_PACKAGE_ID::documentmanagement::add_employee',
        arguments: [
          tx.object('0xYOUR_REGISTRY_ID'),
          tx.pure(employeeAddress, 'address'),
        ],
      });

      await signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            setSuccess(`Employee ${employeeAddress} added successfully.`);
            setEmployeeAddress('');
            setTimeout(() => setSuccess(null), 3000);
          },
          onError: (error) => {
            setError('Failed to add employee: ' + error.message);
          },
        }
      );
    } catch (error) {
      setError('Error adding employee: ' + error.message);
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="admin-container">
      <div className="sidebar1">
        <ul>
          <li><a href="/admin/users">Users</a></li>
          <li><a href="/admin/documents">Documents</a></li>
          <li><a href="/admin/settings">Settings</a></li>
        </ul>
      </div>

      <div className="main-content">
        <header>
          <h1>Admin Dashboard</h1>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </header>
        <div className="dashboard-content">
          <h2>Add Employee</h2>
          {account ? (
            <div>
              <p>Admin Address: {account.address}</p>
              <input
                type="text"
                placeholder="Employee Address"
                value={employeeAddress}
                onChange={(e) => setEmployeeAddress(e.target.value)}
                style={{ padding: '10px', width: '300px', marginBottom: '10px' }}
              />
              <button
                onClick={handleAddEmployee}
                disabled={isPending || !employeeAddress}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4a90e2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: isPending || !employeeAddress ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Adding...' : 'Add Employee'}
              </button>
              {success && <p style={{ color: '#28a745' }}>{success}</p>}
              {error && <p style={{ color: '#dc3545' }}>{error}</p>}
            </div>
          ) : (
            <p>Please connect your wallet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;