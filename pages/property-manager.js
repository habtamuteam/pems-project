import { useState, useEffect } from 'react';

export default function PropertyManagerPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    } else {
      fetchRequests();
    }
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/requests?stage=PropertyManager', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    }
    setLoading(false);
  }

  async function handleAction(id, decision) {
    setActionStatus(`Processing ${decision.toLowerCase()}...`);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, role: 'PropertyManager', decision }),
      });
      if (res.ok) {
        setActionStatus(`Request ${decision.toLowerCase()} successfully.`);
        fetchRequests();
      } else {
        setActionStatus('Failed to update request.');
      }
    } catch (error) {
      console.error('Error during approval/rejection:', error);
      setActionStatus('An error occurred while processing the request.');
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>Property Manager Review Panel</h1>

      {loading && <p>Loading requests...</p>}
      {!loading && requests.length === 0 && <p>No pending requests.</p>}

      {requests.map((req) => (
        <div
          key={req.id}
          style={{
            border: '1px solid #ccc',
            borderRadius: 10,
            padding: 15,
            marginBottom: 20,
            backgroundColor: '#f0f8ff',
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
          }}
        >
          <p><strong>Name:</strong> {req.name}</p>
          <p><strong>Department:</strong> {req.department}</p>
          <p><strong>Items:</strong> {req.items}</p>
          <p><strong>Reason:</strong> {req.reason}</p>
          <p><strong>Status:</strong> {req.status}</p>
          <button
            onClick={() => handleAction(req.id, 'Approved')}
            style={{
              backgroundColor: '#00b894',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              marginRight: '10px',
              fontWeight: 'bold',
            }}
          >
            Approve
          </button>
          <button
            onClick={() => handleAction(req.id, 'Rejected')}
            style={{
              backgroundColor: '#e74c3c',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Reject
          </button>
        </div>
      ))}

      {actionStatus && <p style={{ marginTop: 20, color: 'green', fontWeight: 'bold' }}>{actionStatus}</p>}

      {/* Logout Button at the Bottom */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          style={{
            backgroundColor: '#e63946',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 6px 18px rgba(230, 57, 70, 0.6)',
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
