import * as React from 'react';
import './assets/Bootstrap.css';
import './assets/font-awesome.css';
import './assets/App.css';

import { NavBar, PageType } from './components/navbar';
import { SideBar }  from './components/sidebar';
import { ConnectionDialog } from './components/connection';

import { QueryPage } from './components/pages/query';
import { SchemaPage } from './components/pages/schema';

import { ClickhouseClient, QueryResult } from './lib/clickhouse-client';

interface AppState {
  client: ClickhouseClient | null;

  page: PageType;
  databaseName: string;
  tableName: string | null;

  queryContents: string;
  queryExecuting: boolean;
  queryResult: QueryResult | null;
  queryError: string | null;
}

class App extends React.Component {
  state: AppState;

  constructor(props: Object) {
    super(props);

    let client: ClickhouseClient | null = null;

    const cachedConnectionOpts = window.localStorage.getItem('conn');
    if (cachedConnectionOpts) {
      let connectionOpts = JSON.parse(cachedConnectionOpts);
      client = new ClickhouseClient(connectionOpts[0], connectionOpts[1], connectionOpts[2]);
    }

    this.state = {
      client: client, // new ClickhouseClient('http://127.0.0.1:8123/'),
      page: PageType.QUERY,
      databaseName: 'default',
      tableName: null,
      queryContents: window.localStorage.getItem('cached-query') || '',
      queryExecuting: false,
      queryResult: null,
      queryError: null,
    };
  }

  async executeQuery(query: string) {
    if (this.state.queryExecuting || !this.state.client) {
      return;
    }

    window.localStorage.setItem('cached-query', query);
    this.setState({queryExecuting: true, queryContents: query});

    try {
      const result = await this.state.client.executeQuery(query);

      this.setState({
        queryResult: result,
        queryError: null,
        queryExecuting: false,
      });
    } catch (error) {
      this.setState({
        queryResult: null,
        queryExecuting: false,
        queryError: error,
      });
    }
  }

  connect(url: string, username: string | null, password: string | null) {
    this.setState({
      client: new ClickhouseClient(url),
    });

    window.localStorage.setItem('conn', JSON.stringify([url, username, password]));
  }

  disconnect() {
    this.setState({client: null});
  }

  setTableName(tableName: string) {
    this.setState({tableName: tableName});
  }

  setPage(pageType: PageType) {
    this.setState({page: pageType});
  }

  render() {
    const executeQuery = this.executeQuery.bind(this);
    const setTableName = this.setTableName.bind(this);
    const setPage = this.setPage.bind(this);
    const connect = this.connect.bind(this);
    const disconnect = this.disconnect.bind(this);

    if (this.state.client === null) {
      return <ConnectionDialog connect={connect} />;
    }

    let page;
    switch (this.state.page) {
      case PageType.QUERY:
        page = (
          <QueryPage
            client={this.state.client}
            executeQuery={executeQuery}
            queryContents={this.state.queryContents}
            queryExecuting={this.state.queryExecuting}
            queryResult={this.state.queryResult}
            queryError={this.state.queryError}
          />
        );
        break;
      case PageType.SCHEMA:
        page = (
          <SchemaPage
            client={this.state.client}
            databaseName={this.state.databaseName}
            tableName={this.state.tableName || ''}
          />
        );
        break;
      default:
        throw new Error('Ummm... what?');
    }

    return (
      <div id="main" style={{display: 'block'}}>
        <NavBar
          page={this.state.page}
          setPage={setPage}
          disconnect={disconnect}
        />
        <SideBar
          client={this.state.client}
          setTableName={setTableName}
          databaseName={this.state.databaseName}
          tableName={this.state.tableName || ''}
        />
        {page}
      </div>
    );
  }
}

export default App;
