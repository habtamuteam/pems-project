import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // replace with your MySQL password if you have one
  database: 'pems',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default db;
