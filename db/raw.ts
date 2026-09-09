import { neon } from '@neondatabase/serverless';
let client: ReturnType<typeof neon> | undefined;
function sqlClient() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('Database connection is not configured.');
  return client ??= neon(url);
}
export function rawDb() {
  return { prepare(query: string) {
    let parameter = 0;
    const sql = query.replace(/\?/g, () => `$${++parameter}`);
    return { bind(...values: unknown[]) {
      const execute = () => sqlClient().query(sql, values, { fullResults: true });
      return {
        async first<T>() { const result = await execute(); return (result.rows[0] as T | undefined) ?? null; },
        async all<T>() { const result = await execute(); return { results: result.rows as T[] }; },
        async run() { const result = await execute(); return { meta: { changes: result.rowCount } }; },
      };
    } };
  } };
}
