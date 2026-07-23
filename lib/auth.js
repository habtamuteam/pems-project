import jwt from 'jsonwebtoken';

const JWT_SECRET = 'mar212324'; // same secret as in /api/login

export function verifyToken(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded; // { id, email, role }
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
