import {query as executeQuery} from './connection';
export function rawDb() {
  return { prepare(query: string) {
    let parameter = 0;
    const sql = query.replace(/\?/g, () => `$${++parameter}`);
    return { bind(...values: unknown[]) {
      const execute = () => executeQuery(sql, values);
      return {
        async first<T>() { const result = await execute(); return (result.rows[0] as T | undefined) ?? null; },
        async all<T>() { const result = await execute(); return { results: result.rows as T[] }; },
        async run() { const result = await execute(); return { meta: { changes: result.rowCount } }; },
      };
    } };
  } };
}
