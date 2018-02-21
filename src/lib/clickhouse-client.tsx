import axios from 'axios';

interface QueryStatistics {
  elapsed: number;
  bytes_read: number;
  rows_read: number;
}

interface QueryColumnMetadata {
  name: string;
  type: string;
}

export interface QueryResult {
  data: ReadonlyArray<any>;
  meta: ReadonlyArray<QueryColumnMetadata>;
  rows: number;
  statistics: QueryStatistics;
}

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

export class ClickhouseClient {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  async getDatabases() {
    let result = await this.executeQuery(`SELECT * FROM system.databases`);
    return result.data.map((row) => row.name);
  }

  async getTables(database: string): Promise<ReadonlyArray<TableInfo>> {
    let result = await this.executeQuery(`SELECT * FROM system.tables WHERE database='${database}'`);
    return result.data;
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

    if (result.data.length === 0) {
      return null;
    }

    return {
      bytes: result.data[0].bytes,
      rows: result.data[0].rows,
      pkb: result.data[0].pkb,
    };
  }

  formatQuery(query: string) {
    // If the query ends with a semicolon just strip it
    if (query.slice(-1) === ';') {
      query = query.slice(0, -1);
    }

    // Format the result as JSON
    query = query + ' FORMAT JSON';
    return query;
  }

  executeQuery(query: string, database: string = 'default'): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      axios.get(this.url, {
        params: {
          add_http_cors_header: 1,
          output_format_json_quote_64bit_integers: 1,
          output_format_json_quote_denormals: 1,
          query: this.formatQuery(query),
          database: database,
        }
      }).then((res) => {
        resolve(res.data);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}
