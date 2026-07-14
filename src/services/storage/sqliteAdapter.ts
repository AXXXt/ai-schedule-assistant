import { createMemorySqliteAdapter, type MemorySqliteAdapter } from "./memorySqliteAdapter";

export type SqlValue = string | number | boolean | null | undefined;

export type SqliteAdapter = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SqlValue[]): Promise<void>;
  getAllAsync<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
};

let memoryAdapter: MemorySqliteAdapter | null = null;

export async function openAppDatabase(): Promise<SqliteAdapter> {
  if (!memoryAdapter) {
    memoryAdapter = createMemorySqliteAdapter();
  }
  return memoryAdapter;
}
