import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Employee' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Registering...');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setMessage(data.message || 'Something went wrong');

      if (res.ok) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    } catch (err) {
      setMessage('Registration failed. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: 'auto', padding: 20 }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: 8, marginBottom: 10 }}
        >
          <option value="Employee">Employee</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Property Manager">Property Manager</option>
          <option value="Security">Security</option>
        </select>

        <button type="submit" style={{ width: '100%', padding: 10 }}>
          Register
        </button>
      </form>

      {message && <p style={{ marginTop: 15 }}>{message}</p>}

      <p style={{ marginTop: 20 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
          Login here
        </Link>
      </p>
    </div>
  );
}
