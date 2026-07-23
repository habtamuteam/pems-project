import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mar212324'; // ⚠️ Change in production!

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: 'Email and password required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Login attempt for:', email);

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    console.log('Users found:', users.length);

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Invalid credentials (user not found)' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = users[0];

    console.log('Stored hashed password:', user.password);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log('Password match:', isMatch);

    if (!isMatch) {
      return new Response(
        JSON.stringify({ message: 'Invalid credentials (wrong password)' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ✅ Return token and user info
    return new Response(
      JSON.stringify({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ message: 'Server error', error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
