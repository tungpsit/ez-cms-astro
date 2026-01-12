import type { DatabaseAdapter, DatabaseConfig, DatabaseType } from './types';

export type { Author, Category, ContactForm, DatabaseAdapter, DatabaseConfig, DatabaseType, FormSubmission, Media, Menu, Page, Post, SubmissionStatus, User } from './types';

let dbInstance: DatabaseAdapter | null = null;
let initPromise: Promise<void> | null = null;

function getDbConfig(): DatabaseConfig {
  const type = (import.meta.env.DB_TYPE || process.env.DB_TYPE || 'sqlite') as DatabaseType;
  
  const config: DatabaseConfig = { type };
  
  switch (type) {
    case 'sqlite': {
      const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
      const defaultPath = isVercel ? '/tmp/cms.db' : './data/cms.db';
      config.sqlite = {
        filename: import.meta.env.DB_SQLITE_PATH || process.env.DB_SQLITE_PATH || defaultPath,
      };
      break;
    }
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
      const connectionString = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;
      if (connectionString) {
        config.postgresql = { connectionString } as any;
      } else {
        config.postgresql = {
          host: import.meta.env.DB_PG_HOST || process.env.DB_PG_HOST || 'localhost',
          port: parseInt(import.meta.env.DB_PG_PORT || process.env.DB_PG_PORT || '5432'),
          user: import.meta.env.DB_PG_USER || process.env.DB_PG_USER || 'postgres',
          password: import.meta.env.DB_PG_PASSWORD || process.env.DB_PG_PASSWORD || '',
          database: import.meta.env.DB_PG_DATABASE || process.env.DB_PG_DATABASE || 'cms',
        };
      }
      break;
    case 'supabase':
      config.supabase = {
        url: import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '',
        key: import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
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
    case 'supabase': {
      const { SupabaseAdapter } = await import('./supabase-adapter');
      if (!config.supabase) throw new Error('Supabase config is required');
      return new SupabaseAdapter(config.supabase);
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
