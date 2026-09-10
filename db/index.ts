import {neon} from '@neondatabase/serverless';
import {drizzle as neonDrizzle} from 'drizzle-orm/neon-http';
import {drizzle as postgresDrizzle} from 'drizzle-orm/node-postgres';
import {databaseDriver,databaseUrl,postgresPool} from './connection';
import * as schema from './schema';
export async function getDb(){
 if(databaseDriver()==='postgres')return postgresDrizzle(await postgresPool(),{schema});
 return neonDrizzle(neon(databaseUrl()),{schema});
}
