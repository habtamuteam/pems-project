import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        const { token } = data;

        // Save token
        localStorage.setItem('token', token);

        // Decode token to get role and email
        const payload = JSON.parse(atob(token.split('.')[1]));
        const { role, email } = payload;

        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', email);

        setMessage('Login successful! Redirecting...');

        // Redirect based on role
        if (role === 'Supervisor') router.push('/supervisor');
        else if (role === 'Property Manager') router.push('/property-manager');
        else if (role === 'Security') router.push('/security');
        else if (role === 'Employee') router.push('/'); // or to /employee
        else setMessage('Unknown role: ' + role);
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('An error occurred during login');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 10, padding: 8 }}
        />
        <button type="submit" style={{ width: '100%', padding: 10 }}>
          Login
        </button>
      </form>

      {message && <p style={{ marginTop: 15 }}>{message}</p>}

      <p style={{ marginTop: 20 }}>
        Don’t have an account?{' '}
        <Link href="/register" style={{ color: 'blue', textDecoration: 'underline' }}>
          Register here
        </Link>
      </p>
    </div>
  );
}
