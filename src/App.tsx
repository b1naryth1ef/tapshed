import * as React from 'react';
import { store } from 'statorgfc';

import './assets/Bootstrap.css';
import './assets/font-awesome.css';
import './assets/App.css';

import { NavBar, PageType } from './components/navbar';
// import { SideBar }  from './components/sidebar';
import { ConnectionDialog } from './components/connection';

import { QueryPage, QueryPageSideBar } from './components/pages/query';
import { SchemaPage, SchemaPageSideBar } from './components/pages/schema';
import { PartitionPage, PartitionPageSideBar } from './components/pages/partition';

import { Tab } from './lib/tab';
import { ClickhouseClient, QueryResult, QueryProgress } from './lib/clickhouse-client';

interface AppState {
  client: ClickhouseClient | null;

  page: PageType;
  databaseName: string;
  tableName: string | null;

  queryContents: string;
  queryExecuting: boolean;
  queryResult: QueryResult | null;
  queryError: string | null;
  queryProgress: QueryProgress | null;
}

class App extends React.Component {
  state: AppState;

  constructor(props: Object) {
    super(props);

    this.state = {
      client: null,
      page: PageType.QUERY,
      databaseName: 'default',
      tableName: null,
      queryContents: '',
      queryExecuting: false,
      queryResult: null,
      queryError: null,
      queryProgress: null,
    };

    const cachedConnectionOpts = window.localStorage.getItem('conn');
    if (cachedConnectionOpts) {
      let connectionOpts = JSON.parse(cachedConnectionOpts);
      this.connect(connectionOpts[0], connectionOpts[1], connectionOpts[2], connectionOpts[3], true);
    }
  }

  async executeQuery(query: string) {
    if (this.state.queryExecuting || !this.state.client) {
      return;
    }

    window.localStorage.setItem('cached-query', query);
    this.setState({queryExecuting: true, queryContents: query});

    try {
      const result = await this.state.client.executeQuery(
        query,
        this.state.databaseName,
        (progress: QueryProgress) => {
          this.setState({queryProgress: progress});
        }
      ).get();

      this.setState({
        queryResult: result,
        queryError: null,
        queryExecuting: false,
        queryProgress: null,
      });
    } catch (error) {
      this.setState({
        queryResult: null,
        queryExecuting: false,
        queryError: error,
        queryProgress: null,
      });
    }
  }

  async connect(apiURL: string, url: string, username?: string, password?: string, direct?: boolean) {
    const client = new ClickhouseClient(apiURL, url, username, password);

    if (direct === true) {
      this.state.client = client;
    } else {
      this.setState({
        client: client,
      });
    }

    // After connection we load some stuff
    const savedQueries = await client.getSavedQueries();
    let tabs = Object.assign({}, store.get('tabs'));

    for (const savedQuery of savedQueries) {
      tabs[savedQuery.name] = new Tab(savedQuery.name, true, savedQuery.contents);
    }

    store.set({tabs: tabs, client: client});

    window.localStorage.setItem('conn', JSON.stringify([apiURL, url, username, password]));
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
    const setPage = this.setPage.bind(this);
    const connect = this.connect.bind(this);
    const disconnect = this.disconnect.bind(this);

    if (this.state.client === null) {
      return <ConnectionDialog connect={connect} />;
    }

    let page;
    let sidebar;

    switch (this.state.page) {
      case PageType.QUERY:
        page = (
          <QueryPage />
        );

        sidebar = (
          <QueryPageSideBar />
        );
        break;
      case PageType.SCHEMA:
        page = (
          <SchemaPage />
        );

        sidebar = (
          <SchemaPageSideBar />
        );
        break;
      case PageType.PARTITION:
        page = (
          <PartitionPage />
        );

        sidebar = (
          <PartitionPageSideBar />
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
        {sidebar}
        {page}
      </div>
    );
  }
}

export default App;
