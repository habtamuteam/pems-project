import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SecurityDashboard() {
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
      const res = await fetch('/api/requests?stage=Security', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDecision = async (id, decision) => {
    setActionStatus(`Processing ${decision.toLowerCase()}...`);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, role: 'Security', decision }),
      });

      if (res.ok) {
        await fetchRequests();
        setActionStatus(`Request ${decision.toLowerCase()} successfully.`);
      } else {
        setActionStatus('Failed to update request.');
      }
    } catch (error) {
      console.error('Error during approval/rejection:', error);
      setActionStatus('An error occurred while processing the request.');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      <h2>Security Dashboard</h2>

      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        requests.map(req => (
          <div key={req.id} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 20, borderRadius: 8 }}>
            <p><strong>Name:</strong> {req.name}</p>
            <p><strong>Department:</strong> {req.department}</p>
            <p><strong>Reason:</strong> {req.reason}</p>
            <p><strong>Items:</strong> {req.items}</p>
            <p><strong>Status:</strong> {req.securityStatus}</p>

            {req.securityStatus === 'Pending' && (
              <>
                <button
                  onClick={() => handleDecision(req.id, 'Approved')}
                  style={{
                    marginRight: 10,
                    backgroundColor: '#00b894',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDecision(req.id, 'Rejected')}
                  style={{
                    backgroundColor: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Reject
                </button>
              </>
            )}

            {req.securityStatus === 'Approved' && req.stage === 'Completed' && (
              <div style={{ marginTop: 10 }}>
                <Link href={`/certificate/${req.id}`} legacyBehavior>
                  <a target="_blank" style={{ color: 'green', textDecoration: 'underline' }}>
                    View Exit Certificate
                  </a>
                </Link>
              </div>
            )}
          </div>
        ))
      )}

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
