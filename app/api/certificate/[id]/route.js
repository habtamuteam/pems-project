import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'mar212324';

export async function GET(req, { params }) {
  const { id } = params;

  // 🔐 Authenticate user via JWT
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ message: 'Unauthorized: Missing token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    // ✅ Verify JWT token
    jwt.verify(token, JWT_SECRET);

    // ✅ Query request by ID
    const [results] = await db.query('SELECT * FROM requests WHERE id = ?', [id]);

    if (results.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Certificate not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const request = results[0];

    if (request.stage !== 'Completed') {
      return new Response(
        JSON.stringify({ message: 'Request not yet completed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 📄 Generate PDF certificate
    const doc = new PDFDocument();
    const buffers = [];

    // Load and register custom font
    const fontPath = path.join(process.cwd(), 'app', 'fonts', 'Poppins-Regular.ttf');
    doc.registerFont('Poppins', fs.readFileSync(fontPath));
    doc.font('Poppins');

    doc.fontSize(22).text('Industrial Park Corporation', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('Final Exit Certificate', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).text(`Certificate ID: PEMS-${String(id).padStart(5, '0')}`);
    doc.moveDown();
    doc.text(`Name: ${request.name}`);
    doc.text(`Email: ${request.email}`);
    doc.text(`Department: ${request.department}`);
    doc.text(`Items Returned: ${request.items}`);
    doc.text(`Reason for Exit: ${request.reason}`);
    doc.text(`Supervisor Status: ${request.supervisorStatus}`);
    doc.text(`Property Manager Status: ${request.managerStatus ?? request.propertyManagerStatus}`);
    doc.text(`Security Status: ${request.securityStatus}`);
    doc.moveDown();
    doc.text(`Issued At: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' })}`);

    doc.end();

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      return new Response(pdfData, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=Exit-Certificate-${id}.pdf`,
        },
      });
    });

    return new Promise(resolve => {
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(new Response(pdfData, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Exit-Certificate-${id}.pdf`,
          },
        }));
      });
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return new Response(
        JSON.stringify({ message: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
