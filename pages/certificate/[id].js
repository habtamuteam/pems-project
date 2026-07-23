// pages/certificate/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function ExitCertificate() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/requests?id=${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch certificate data');

        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error loading certificate:', error);
      }
    };

    fetchData();
  }, [id]);

  if (!data) return <p style={{ padding: 20 }}>Loading certificate...</p>;

  const { name, department, email, items, reason, supervisorStatus, managerStatus, securityStatus } = data;

  return (
    <div style={{ maxWidth: '800px', margin: 'auto', padding: '40px', fontFamily: 'serif', border: '1px solid #ccc' }}>
      <h1 style={{ textAlign: 'center' }}>Industrial Park Corporation</h1>
      <h2 style={{ textAlign: 'center' }}>Final Exit Certificate</h2>
      <hr />

      <p><strong>Employee Name:</strong> {name}</p>
      <p><strong>Department:</strong> {department}</p>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Reason for Exit:</strong> {reason}</p>
      <p><strong>Items to Exit:</strong> {items}</p>

      <hr />

      <p><strong>Supervisor Approval:</strong> {supervisorStatus}</p>
      <p><strong>Property Manager Approval:</strong> {managerStatus}</p>
      <p><strong>Security Verification:</strong> {securityStatus}</p>

      <div style={{ marginTop: 30 }}>
        <p><strong>Final Status:</strong> {securityStatus === 'Approved' ? 'Cleared for Exit' : 'Pending/Denied'}</p>
      </div>

      {securityStatus === 'Approved' && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button
            onClick={() => window.print()}
            style={{
              backgroundColor: '#0070f3',
              color: '#fff',
              padding: '10px 20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            🖨️ Print Certificate
          </button>
        </div>
      )}
    </div>
  );
}
