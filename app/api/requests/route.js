import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// ✅ Generate Final Exit Certificate PDF and return Buffer
async function generateCertificatePDF(data) {
  const doc = new PDFDocument();
  const chunks = [];

  // ✅ Fix: Load a safe local font instead of Helvetica
  const fontPath = path.join(process.cwd(), 'fonts', 'Poppins-Regular.ttf');
  if (fs.existsSync(fontPath)) {
    doc.font(fontPath);
  } else {
    console.warn('⚠️ Font not found, using default.');
  }

  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(20).fillColor('#003366').text('Industrial Park Corporation', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).fillColor('black').text('Final Exit Certificate', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).fillColor('black');
  doc.text(`Employee Name: ${data.name}`);
  doc.text(`Department: ${data.department}`);
  doc.text(`Email: ${data.email}`);
  doc.text(`Items: ${data.items}`);
  doc.text(`Reason: ${data.reason}`);
  doc.moveDown();

  doc.text(`Supervisor Approval: ${data.supervisorStatus}`);
  doc.text(`Property Manager Approval: ${data.propertyManagerStatus}`);
  doc.text(`Security Verification: ${data.securityStatus}`);
  doc.moveDown();

  doc.text('Final Status: Cleared for Exit', { align: 'left' });
  doc.text(
    `Issued At: ${new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Addis_Ababa',
    })}`
  );

  doc.end();

  // ✅ Return the complete PDF as a buffer
  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

// ✅ GET: Retrieve requests by stage
export async function GET(req) {
  const url = new URL(req.url);
  const stage = url.searchParams.get('stage');
  const user = verifyToken(req);
  console.log('Authenticated user:', user);

  try {
    let sql = 'SELECT * FROM requests';
    let params = [];

    if (stage) {
      sql += ' WHERE current_stage = ? AND status = "Pending"';
      params.push(stage);
    }

    const [rows] = await db.query(sql, params);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ✅ POST: Submit a new request
export async function POST(req) {
  try {
    const { name, department, email, items, reason } = await req.json();

    if (!name || !department || !email || !items || !reason) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
    }

    const [duplicates] = await db.query(
      'SELECT * FROM requests WHERE name = ? AND department = ? AND email = ? AND items = ? AND reason = ? AND status != "Rejected"',
      [name, department, email, JSON.stringify(items), reason]
    );

    if (duplicates.length > 0) {
      return new Response(JSON.stringify({ message: 'Duplicate request exists' }), { status: 409 });
    }

    const [result] = await db.query(
      'INSERT INTO requests (name, department, email, items, reason) VALUES (?, ?, ?, ?, ?)',
      [name, department, email, JSON.stringify(items), reason]
    );

    const [newRequest] = await db.query('SELECT * FROM requests WHERE id = ?', [result.insertId]);

    return new Response(JSON.stringify(newRequest[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ✅ PUT: Approval workflow and PDF emailing
export async function PUT(req) {
  try {
    const { id, role, decision, comment } = await req.json();
    if (!id || !role || !decision) {
      return new Response(JSON.stringify({ message: 'Missing id, role or decision' }), { status: 400 });
    }

    const [rows] = await db.query('SELECT * FROM requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      return new Response(JSON.stringify({ message: 'Request not found' }), { status: 404 });
    }

    const request = rows[0];

    let nextStage;
    if (decision === 'Approved') {
      if (role === 'Supervisor') nextStage = 'PropertyManager';
      else if (role === 'PropertyManager') nextStage = 'Security';
      else if (role === 'Security') nextStage = 'Completed';
      else nextStage = request.current_stage;
    } else {
      nextStage = 'Rejected';
    }

    const now = new Date();

    const validRoles = {
      supervisor: 'supervisorStatus',
      propertymanager: 'propertyManagerStatus',
      security: 'securityStatus',
    };

    const roleKey = role.toLowerCase();
    const updateStatusKey = validRoles[roleKey];

    if (!updateStatusKey) {
      return new Response(JSON.stringify({ message: 'Invalid role provided' }), { status: 400 });
    }

    await db.query(
      `UPDATE requests SET ${updateStatusKey} = ?, current_stage = ?, status = ?, submitted_at = ? WHERE id = ?`,
      [
        decision,
        nextStage,
        decision === 'Approved' && nextStage === 'Completed'
          ? 'Exited'
          : nextStage === 'Rejected'
          ? `Rejected by ${role}`
          : 'Pending',
        now,
        id,
      ]
    );

    const [existingApproval] = await db.query(
      'SELECT * FROM approvals WHERE request_id = ? AND role = ?',
      [id, role]
    );

    if (existingApproval.length > 0) {
      await db.query(
        'UPDATE approvals SET status = ?, comment = ?, approved_at = ? WHERE request_id = ? AND role = ?',
        [decision, comment || '', now, id, role]
      );
    } else {
      await db.query(
        'INSERT INTO approvals (request_id, role, status, comment, approved_at) VALUES (?, ?, ?, ?, ?)',
        [id, role, decision, comment || '', now]
      );
    }

    const [updatedRows] = await db.query('SELECT * FROM requests WHERE id = ?', [id]);
    const updatedRequest = updatedRows[0];

    // ✅ Only generate and send PDF if Security approves
    if (role === 'Security' && decision === 'Approved' && nextStage === 'Completed') {
      const pdfBuffer = await generateCertificatePDF(updatedRequest);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: updatedRequest.email,
        subject: 'Your Final Exit Certificate',
        text: `Dear ${updatedRequest.name},\n\nYour property exit has been approved successfully.\n\nPlease find your attached Final Exit Certificate.\n\nBest regards,\nIndustrial Park Corporation`,
        attachments: [
          {
            filename: `Exit_Certificate_${updatedRequest.id}.pdf`,
            content: pdfBuffer,
          },
        ],
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Certificate emailed to:', updatedRequest.email);
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
      }
    }

    return new Response(JSON.stringify(updatedRequest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PUT /api/requests error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
