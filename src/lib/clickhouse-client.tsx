// import axios from 'axios';

export interface TableInfo {
  database: string;
  engine: string;
  metadata_modification_time: string;
  name: string;
}

export interface TableStats {
  bytes: number;
  rows: number;
  pkb: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
}

export interface NewQueryResult {
  columns: ReadonlyArray<ColumnInfo>;
  rows: ReadonlyArray<any>;
}

export interface QueryProgress {
  num_rows: number;
  total_rows: number;
}

type QueryProgressFunction = (progress: QueryProgress) => void;

export function getResultAsObjects(result: NewQueryResult): ReadonlyArray<TableInfo> {
  let objects = result.rows.map((row) => {
    let obj = {};
    for (let [idx, columnInfo] of result.columns.entries()) {
      obj[columnInfo.name] = row[idx];
    }
    return (obj as TableInfo);
  });

  return (objects as ReadonlyArray<TableInfo>);
}


export class ClickhouseClient {
  url: string;
  username: string | null;
  password: string | null;

  constructor(url: string, username?: string, password?: string) {
    this.url = url;
    this.username = username || null;
    this.password = password || null;
  }

  async getDatabases() {
    let result = await this.executeQuery(`SELECT name FROM system.databases`);
    return result.rows.map((row) => row[0]);
  }

  async getTables(database: string): Promise<ReadonlyArray<TableInfo>> {
    let result = await this.executeQuery(`SELECT * FROM system.tables WHERE database='${database}'`);
    return getResultAsObjects(result);
  }

  async getTableStats(database: string, table: string): Promise<TableStats | null> {
    let result = await this.executeQuery(
      `SELECT
          sum(bytes) as bytes,
          sum(primary_key_bytes_in_memory) as pkb,
          toString(sum(rows)) as rows
        FROM system.parts
        WHERE
          database='${database}'
          AND table='${table}'`
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      bytes: result.rows[0][0],
      rows: result.rows[0][1],
      pkb: result.rows[0][2],
    };
  }

  async executeQueryRaw(
        query: string,
        database: string = 'default',
        onProgress: QueryProgressFunction | null = null
      ): Promise<any> {
    const url = this.url + `/query?database=${encodeURIComponent(database)}&query=${encodeURIComponent(query)}`;
    const source = new EventSource(url);

    return new Promise((resolve, reject) => {
      source.addEventListener('progress', (e: any) => {
        const data = JSON.parse(e.data);
        if (onProgress) {
          onProgress(data);
        }
      });

      source.addEventListener('result', (e: any) => {
        const data = JSON.parse(e.data);
        resolve(data);
      });

      source.onerror = function (event: any) {
        source.close();
        reject();
      };
    });
  }

  async executeQuery(
        query: string,
        database: string = 'default',
        onProgress: QueryProgressFunction | null = null
      ): Promise<NewQueryResult> {
    return this.executeQueryRaw(query, database, onProgress) as Promise<NewQueryResult>;
  }
}

export class Query {
  onProgress: QueryProgressFunction | null;

  private client: ClickhouseClient;
  private eventSource: EventSource;
  private result: Promise<NewQueryResult>;

  constructor(client: ClickhouseClient, query: string, onProgress: QueryProgressFunction | null = null) {
    this.client = client;
    this.onProgress = onProgress;

    const url = this.client.url + `/query?query=${encodeURIComponent(query)}`;
    this.eventSource = new EventSource(url);

    // Track progress
    this.eventSource.addEventListener('progress', (e: any) => {
      const data = JSON.parse(e.data);
      if (this.onProgress) {
        this.onProgress(data);
      }
    });

    this.result = new Promise((resolve, reject) => {
      this.eventSource.addEventListener('result', (e: any) => {
        const data = JSON.parse(e.data);
        resolve(data);
      });

      this.eventSource.onerror = (event: any) => {
        this.eventSource.close();
        reject(event.error);
      };
    });
  }

  get() {
    return this.result;
  }

  cancel() {
    this.eventSource.close();
  }
}
