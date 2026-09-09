import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) throw new Error('Connect the Neon database to this Vercel environment before building.');
const sql = neon(url);
const source = await readFile(new URL('../db/postgres.sql', import.meta.url), 'utf8');
await sql.transaction(source.split(';').map(s => s.trim()).filter(Boolean).map(s => sql.query(s)));
console.log('PostgreSQL schema is ready.');
