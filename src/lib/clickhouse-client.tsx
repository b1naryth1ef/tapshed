import Dexie from 'dexie';
import JSONbig from 'json-bigint';

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

export interface QueryResultStats {
  rows: number;
  bytes: number;
  duration: number;
}

export interface QueryResultError {
  code: number;
  message: string;
}

export interface QueryResult {
  columns: ReadonlyArray<ColumnInfo>;
  rows: ReadonlyArray<any>;
  error: QueryResultError | null;
  stats: QueryResultStats | null;
}

export interface QueryProgress {
  num_rows: number;
  total_rows: number;
}

export interface SavedQuery {
  name: string;
  contents: string;
}

type QueryProgressFunction = (progress: QueryProgress) => void;

export function getResultAsObjects(result: QueryResult): ReadonlyArray<TableInfo> {
  let objects = result.rows.map((row) => {
    let obj = {};
    for (let [idx, columnInfo] of result.columns.entries()) {
      obj[columnInfo.name] = row[idx];
    }
    return (obj as TableInfo);
  });

  return (objects as ReadonlyArray<TableInfo>);
}

export class ExecutingQuery {
  private source: EventSource;
  private promise: Promise<QueryResult>;

  constructor(source: EventSource, promise: Promise<QueryResult>) {
    this.source = source;
    this.promise = promise;
  }

  cancel() {
    this.source.close();
  }

  get(): Promise<QueryResult> {
    return this.promise;
  }
}


class SavedQueriesDatabase extends Dexie {
  queries: Dexie.Table<SavedQuery, string>;

  constructor() {
    super('SavedQueries');
    this.version(1).stores({
      queries: 'name,contents',
    });
  }
}

export class ClickhouseClient {
  apiURL: string;
  url: string;
  username: string | null;
  password: string | null;
  private db: SavedQueriesDatabase;

  constructor(apiURL: string, url: string, username?: string, password?: string) {
    this.apiURL = apiURL;
    this.url = url;
    this.username = username || null;
    this.password = password || null;

    this.db = new SavedQueriesDatabase;
  }

  async saveSavedQuery(name: string, contents: string) {
    await this.db.queries.put({name: name, contents: contents});
  }

  async deleteSavedQuery(name: string) {
    await this.db.queries.where({name: name}).delete();
  }

  async getSavedQueries() {
    return await this.db.queries.toArray();
  }

  async getDatabases() {
    let result = await this.executeQuery(`SELECT name FROM system.databases`).get();
    return result.rows.map((row) => row[0]);
  }

  async getTables(database: string, localOnly: boolean = false): Promise<ReadonlyArray<TableInfo>> {
    let result;

    if (localOnly) {
      result = await this.executeQuery(`
        SELECT *
        FROM system.tables
        WHERE database='${database}' AND engine != 'Distributed'
      `).get();
    } else {
      result = await this.executeQuery(`SELECT * FROM system.tables WHERE database='${database}'`).get();
    }

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
    ).get();

    if (result.rows.length === 0) {
      return null;
    }

    return {
      bytes: result.rows[0][0],
      rows: result.rows[0][1],
      pkb: result.rows[0][2],
    };
  }

  executeQueryRaw(
      query: string, database: string = 'default', onProgress: QueryProgressFunction | null = null): ExecutingQuery {

    const url = this.apiURL + `/query?` +
      `database=${encodeURIComponent(database)}` +
      `&query=${encodeURIComponent(query)}` +
      `&url=${encodeURIComponent(this.url)}` +
      `&progress=${onProgress !== null ? '1' : '0'}`;

    const source = new EventSource(url);

    const promise = new Promise<QueryResult>((resolve, reject) => {
      source.addEventListener('progress', (e: any) => {
        const data = JSON.parse(e.data);
        if (onProgress) {
          onProgress(data);
        }
      });

      source.addEventListener('result', (e: any) => {
        const data = JSONbig.parse(e.data);
        // const data = JSON.parse(e.data);
        resolve(data);
      });

      source.onerror = function (event: any) {
        source.close();
        reject();
      };
    });

    return new ExecutingQuery(source, promise);
  }

  executeQuery(
        query: string,
        database: string = 'default',
        onProgress: QueryProgressFunction | null = null
      ): ExecutingQuery {
    return this.executeQueryRaw(query, database, onProgress);
  }
}
