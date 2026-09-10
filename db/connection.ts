import {neon} from '@neondatabase/serverless';
import type {Pool} from 'pg';
const shared=globalThis as typeof globalThis & {shorojontroPool?:Promise<Pool>};
let neonClient:ReturnType<typeof neon>|undefined;
export function databaseUrl(){const url=process.env.DATABASE_URL||process.env.POSTGRES_URL;if(!url)throw Error('Set DATABASE_URL in .env.local.');return url}
export function databaseDriver(){const driver=process.env.DB_DRIVER||'neon';if(driver!=='neon'&&driver!=='postgres')throw Error('DB_DRIVER must be neon or postgres.');return driver}
export async function postgresPool(){
 return shared.shorojontroPool??=import('pg').then(({Pool})=>{const pool=new Pool({connectionString:databaseUrl(),max:5,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});pool.on('error',()=>console.error('Idle PostgreSQL connection failed.'));return pool});
}
export async function query(sql:string,values:unknown[]){
 if(databaseDriver()==='postgres')return (await postgresPool()).query(sql,values);
 neonClient??=neon(databaseUrl());return neonClient.query(sql,values,{fullResults:true});
}
