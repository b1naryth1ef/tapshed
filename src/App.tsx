import * as React from 'react';
import './assets/Bootstrap.css';
import './assets/font-awesome.css';
import './assets/App.css';

import { NavBar, PageType } from './components/navbar';
import { SideBar }  from './components/sidebar';

import { QueryPage } from './components/pages/query';
import { SchemaPage } from './components/pages/schema';

import { ClickhouseClient, QueryResult } from './lib/clickhouse-client';

interface AppState {
  client: ClickhouseClient;

  page: PageType;
  databaseName: string;
  tableName: string | null;

  queryContents: string;
  queryResult: QueryResult | null;
  queryExecuting: boolean;
}

class App extends React.Component {
  state: AppState;

  constructor(props: Object) {
    super(props);

    this.state = {
      client: new ClickhouseClient('http://127.0.0.1:8123/'),
      page: PageType.QUERY,
      databaseName: 'default',
      tableName: null,
      queryContents: window.localStorage.getItem('cached-query') || '',
      queryResult: null,
      queryExecuting: false,
    };
  }

  async executeQuery(query: string) {
    if (this.state.queryExecuting) {
      return;
    }

    this.setState({queryExecuting: true});

    const result = await this.state.client.executeQuery(query);
    this.setState({
      queryContents: query,
      queryResult: result,
      queryExecuting: false,
    });
    window.localStorage.setItem('cached-query', query);
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

    let page;
    switch (this.state.page) {
      case PageType.QUERY:
        page = (
          <QueryPage
            executeQuery={executeQuery}
            queryContents={this.state.queryContents}
            queryResult={this.state.queryResult}
            queryExecuting={this.state.queryExecuting}
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
