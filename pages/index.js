import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    email: '',
    items: '',
    reason: '',
  });
  const [message, setMessage] = useState('');
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const { name, email, role } = payload;

    if (role !== 'Employee') {
      router.push(`/${role.toLowerCase().replace(' ', '-')}`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      name: name || '',
      email: email || '',
    }));
  }, []);

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('Submitting...');

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setMessage('✅ Request submitted successfully!');
      setFormData({ ...formData, department: '', items: '', reason: '' });
    } else {
      const { message: errorMsg } = await res.json();
      setMessage(`❌ Failed: ${errorMsg}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className={styles.background}>
      <div className={`${styles.container} ${fadeIn ? styles.fadeIn : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.title}>Industrial Park Corporation</h1>
            <h2 className={styles.subtitle}>Property Exit Management System</h2>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e63946',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              height: 'fit-content',
            }}
          >
            Logout
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            name="department"
            placeholder="Your Department"
            value={formData.department}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <textarea
            name="items"
            placeholder="List of Items"
            value={formData.items}
            onChange={handleChange}
            required
          />
          <textarea
            name="reason"
            placeholder="Reason for Property Exit"
            value={formData.reason}
            onChange={handleChange}
            required
          />
          <button type="submit">Submit Request</button>
        </form>

        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
}
