import type { SqlValue, SqliteAdapter } from "./sqliteAdapter";

type Row = Record<string, SqlValue>;

export type MemorySqliteAdapter = SqliteAdapter & {
  tableNames(): string[];
};

export function createMemorySqliteAdapter(): MemorySqliteAdapter {
  const rows = new Map<string, Row[]>();

  const ensureTable = (table: string) => {
    if (!rows.has(table)) {
      rows.set(table, []);
    }
  };

  const insertOrReplace = (table: string, columns: string[], values: SqlValue[]) => {
    ensureTable(table);
    const nextRow = columns.reduce<Row>((row, column, index) => {
      row[column] = values[index];
      return row;
    }, {});
    const tableRows = rows.get(table) ?? [];
    const existingIndex = tableRows.findIndex((row) => row.id === nextRow.id);
    if (existingIndex >= 0) {
      tableRows[existingIndex] = nextRow;
    } else {
      tableRows.push(nextRow);
    }
  };

  const selectRows = (sql: string, params: SqlValue[] = []) => {
    const table = sql.match(/FROM\s+([a-z_]+)/i)?.[1];
    if (!table) {
      return [];
    }
    ensureTable(table);
    let result = [...(rows.get(table) ?? [])];

    if (/WHERE\s+id\s*=\s*\?/i.test(sql)) {
      result = result.filter((row) => row.id === params[0]);
    }
    if (/WHERE\s+schedule_id\s*=\s*\?/i.test(sql)) {
      result = result.filter((row) => row.schedule_id === params[0]);
    }
    if (/date\(start_at\)\s*=\s*date\(\?\)/i.test(sql)) {
      const date = String(params[0]);
      result = result.filter((row) => String(row.start_at).slice(0, 10) === date);
    }
    if (/ORDER\s+BY\s+start_at/i.test(sql)) {
      result.sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)));
    }

    return result;
  };

  return {
    async execAsync(sql) {
      for (const match of sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-z_]+)/gi)) {
        ensureTable(match[1]);
      }
    },
    async runAsync(sql, params = []) {
      const insertMatch = sql.match(/INSERT OR REPLACE INTO\s+([a-z_]+)\s*\(([^)]+)\)/i);
      if (insertMatch) {
        const columns = insertMatch[2].split(",").map((column) => column.trim());
        insertOrReplace(insertMatch[1], columns, params);
        return;
      }

      const deleteMatch = sql.match(/DELETE FROM\s+([a-z_]+)\s+WHERE\s+id\s*=\s*\?/i);
      if (deleteMatch) {
        const tableRows = rows.get(deleteMatch[1]) ?? [];
        rows.set(
          deleteMatch[1],
          tableRows.filter((row) => row.id !== params[0])
        );
      }
    },
    async getAllAsync<T>(sql: string, params: SqlValue[] = []) {
      return selectRows(sql, params) as T[];
    },
    async getFirstAsync<T>(sql: string, params: SqlValue[] = []) {
      return (selectRows(sql, params)[0] as T | undefined) ?? null;
    },
    tableNames() {
      return [...rows.keys()].sort();
    }
  };
}
