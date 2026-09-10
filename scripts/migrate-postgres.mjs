import {neon} from '@neondatabase/serverless';
import {readFile} from 'node:fs/promises';
const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;
if(!url)throw new Error('Set DATABASE_URL in .env.local or connect the Vercel database.');
const driver=process.env.DB_DRIVER||'neon';
if(!['neon','postgres'].includes(driver))throw new Error('DB_DRIVER must be neon or postgres.');
const source=await readFile(new URL('../db/postgres.sql',import.meta.url),'utf8');
if(driver==='postgres'){
 const {Client}=await import('pg');const client=new Client({connectionString:url,connectionTimeoutMillis:10000});
 try{await client.connect();await client.query('BEGIN');await client.query(source);await client.query('COMMIT')}
 catch(error){try{await client.query('ROLLBACK')}catch{}throw error}
 finally{await client.end()}
}else{
 const sql=neon(url);await sql.transaction(source.split(';').map(s=>s.trim()).filter(Boolean).map(s=>sql.query(s)));
}
console.log('PostgreSQL schema is ready.');
