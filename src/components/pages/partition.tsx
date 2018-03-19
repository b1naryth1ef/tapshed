import * as React from 'react';
import { store } from 'statorgfc';

import { Results } from '../results';
import { QueryResult } from '../../lib/clickhouse-client';
import { prettyFormatBytes } from '../../lib/formatting';

interface PartitionPageState {
  result: QueryResult | null;
  databaseName: string;
  tableName: string | null;
}

export class PartitionPage extends React.Component {
  state: PartitionPageState;

  constructor(props: any) {
    super(props);

    store.connectComponentState(this, ['databaseName', 'tableName']);
    this.state.result = null;
  }

  async getTablePartitions(databaseName: string, tableName: string) {
    this.setState({result: null});

    const client = store.get('client');
    if (client == null) {
      return;
    }

    let result = await client.executeQuery(`
      SELECT
        table,
        partition,
        sum(rows) as rows,
        sum(bytes) as bytes
      FROM system.parts
      WHERE database='${databaseName}' AND table='${tableName}'
      GROUP BY table, partition
    `).get();

    this.setState({result});
  }

  componentWillMount() {
    if (this.state.databaseName && this.state.tableName) {
      this.getTablePartitions(this.state.databaseName, this.state.tableName);
    }
  }

  componentWillUpdate(nextProps: any, nextState: PartitionPageState) {
    if (this.state.databaseName !== nextState.databaseName || this.state.tableName !== nextState.tableName) {
      if (nextState.databaseName && nextState.tableName) {
        this.getTablePartitions(nextState.databaseName, nextState.tableName);
      }
    }
  }

  render() {
    let body;

    const fieldFormatters = {
      bytes: prettyFormatBytes,
    };

    if (!this.state.databaseName || !this.state.tableName) {
      body = <h3>Select a table...</h3>;
    } else if (this.state.result !== null) {
      body = <Results result={this.state.result} fieldFormatters={fieldFormatters} />;
    } else {
      body = <h3>Loading...</h3>;
    }

    return (
      <div id="body">
        <div id="output" style={{position: 'initial'}}>
          <div className="wrapper">
            {body}
          </div>
        </div>
      </div>
    );
  }
}

interface PartitionPageSideBarState {
  tables: Array<string>;
  tableName: string | null;
  databaseName: string | null;
}

export class PartitionPageSideBar extends React.Component {
  state: PartitionPageSideBarState;

  constructor(props: any) {
    super(props);

    store.connectComponentState(this, ['tableName']);
    this.state.tables = [];
  }

  async componentWillMount() {
    const client = store.get('client');
    if (client == null) {
      return;
    }
    const tables = await client.getTables('default', true);

    this.setState({
      tables: tables.map((table: any) => table.name),
    });
  }

  onTableClick(tableName: string) {
    store.set({tableName});
  }

  render() {
    const tables = this.state.tables;

    let listItems = [];

    for (const tableName of tables) {
      listItems.push(
        <li
            className={tableName === this.state.tableName ? 'active' : ''}
            onClick={() => this.onTableClick(tableName)}
            key={tableName}
        >
          <i className="fa fa-table" />
          {tableName}
        </li>
      );
    }

    return (
      <div id="sidebar">
        <div className="tables-list">
          <div className="wrap">
            <div className="title main">
              <span className="current-database">{this.state.databaseName}</span>
            </div>
            <div className="tables">
              <ul>{listItems}</ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
