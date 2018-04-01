import * as React from 'react';
import { store } from 'statorgfc';

import { Results } from '../results';
import { QueryResult } from '../../lib/clickhouse-client';
import { prettyFormatBytes } from '../../lib/formatting';

interface SchemaPageState {
  result: QueryResult | null;
  databaseName: string;
  tableName: string | null;
}

export class SchemaPage extends React.Component {
  state: SchemaPageState;

  constructor(props: any) {
    super(props);

    store.connectComponentState(this, ['databaseName', 'tableName']);
    this.state.result = null;
  }

  async getTableSchema(databaseName: string, tableName: string) {
    if (!databaseName || !tableName) {
      return;
    }

    this.setState({result: null});

    const client = store.get('client');
    if (client == null) {
      return;
    }

    let result = await client.executeQuery(`
      SELECT
        name,
        type,
        data_compressed_bytes as compressed,
        data_uncompressed_bytes as uncompressed
      FROM system.columns
      WHERE database='${databaseName}' AND table='${tableName}'
    `).get();
    this.setState({result});
  }

  componentWillMount() {
    if (this.state.databaseName && this.state.tableName) {
      this.getTableSchema(this.state.databaseName, this.state.tableName);
    }
  }

  componentWillUpdate(nextProps: any, nextState: SchemaPageState) {
    if (this.state.databaseName !== nextState.databaseName || this.state.tableName !== nextState.tableName) {
      if (nextState.tableName) {
        this.getTableSchema(nextState.databaseName, nextState.tableName);
      }
    }
  }

  render() {
    let body;

    const fieldFormatters = {
      compressed: prettyFormatBytes,
      uncompressed: prettyFormatBytes,
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

interface SchemaPageSideBarState {
  tables: Array<string>;
  databaseName: string;
  tableName: string | null;
}

export class SchemaPageSideBar extends React.Component {
  state: SchemaPageSideBarState;

  constructor(props: any) {
    super(props);
    store.connectComponentState(this, ['databaseName', 'tableName']);
    this.state.tables = [];
  }

  async componentWillMount() {
    const client = store.get('client');
    if (client == null) {
      return;
    }

    const tables = await client.getTables('default');

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
              Tapshed
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
