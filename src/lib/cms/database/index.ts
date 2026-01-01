import type { DatabaseAdapter, DatabaseType, DatabaseConfig } from './types';

export type { DatabaseAdapter, DatabaseType, DatabaseConfig, Category, Post, Page, Author, Menu, User, Media } from './types';

let dbInstance: DatabaseAdapter | null = null;
let initPromise: Promise<void> | null = null;

function getDbConfig(): DatabaseConfig {
  const type = (import.meta.env.DB_TYPE || process.env.DB_TYPE || 'sqlite') as DatabaseType;
  
  const config: DatabaseConfig = { type };
  
  switch (type) {
    case 'sqlite':
      config.sqlite = {
        filename: import.meta.env.DB_SQLITE_PATH || process.env.DB_SQLITE_PATH || './data/cms.db',
      };
      break;
    case 'mysql':
      config.mysql = {
        host: import.meta.env.DB_MYSQL_HOST || process.env.DB_MYSQL_HOST || 'localhost',
        port: parseInt(import.meta.env.DB_MYSQL_PORT || process.env.DB_MYSQL_PORT || '3306'),
        user: import.meta.env.DB_MYSQL_USER || process.env.DB_MYSQL_USER || 'root',
        password: import.meta.env.DB_MYSQL_PASSWORD || process.env.DB_MYSQL_PASSWORD || '',
        database: import.meta.env.DB_MYSQL_DATABASE || process.env.DB_MYSQL_DATABASE || 'cms',
      };
      break;
    case 'postgresql':
      config.postgresql = {
        host: import.meta.env.DB_PG_HOST || process.env.DB_PG_HOST || 'localhost',
        port: parseInt(import.meta.env.DB_PG_PORT || process.env.DB_PG_PORT || '5432'),
        user: import.meta.env.DB_PG_USER || process.env.DB_PG_USER || 'postgres',
        password: import.meta.env.DB_PG_PASSWORD || process.env.DB_PG_PASSWORD || '',
        database: import.meta.env.DB_PG_DATABASE || process.env.DB_PG_DATABASE || 'cms',
      };
      break;
  }
  
  return config;
}

async function createAdapter(config: DatabaseConfig): Promise<DatabaseAdapter> {
  switch (config.type) {
    case 'sqlite': {
      const { SqliteAdapter } = await import('./sqlite-adapter');
      return new SqliteAdapter(config.sqlite?.filename);
    }
    case 'mysql': {
      const { MysqlAdapter } = await import('./mysql-adapter');
      if (!config.mysql) throw new Error('MySQL config is required');
      return new MysqlAdapter(config.mysql);
    }
    case 'postgresql': {
      const { PostgresqlAdapter } = await import('./postgresql-adapter');
      if (!config.postgresql) throw new Error('PostgreSQL config is required');
      return new PostgresqlAdapter(config.postgresql);
    }
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}

export async function getDatabase(): Promise<DatabaseAdapter> {
  if (dbInstance) return dbInstance;
  
  if (initPromise) {
    await initPromise;
    return dbInstance!;
  }
  
  initPromise = (async () => {
    const config = getDbConfig();
    console.log(`[CMS] Initializing ${config.type} database...`);
    dbInstance = await createAdapter(config);
    await dbInstance.init();
    console.log(`[CMS] Database ${config.type} initialized successfully`);
  })();
  
  await initPromise;
  return dbInstance!;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    initPromise = null;
  }
}
