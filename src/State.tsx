import { ClickhouseClient } from './lib/clickhouse-client';

export class State {
  client: ClickhouseClient;
  databaseName: string;

  constructor() {
    this.client = new ClickhouseClient('http://127.0.0.1:8123/');
    this.databaseName = 'default';
  }
}
