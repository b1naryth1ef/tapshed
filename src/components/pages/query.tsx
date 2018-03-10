import * as React from 'react';

import { Editor } from '../editor';
import { Results } from '../results';
import { ClickhouseClient, QueryResult, QueryProgress, SavedQuery } from '../../lib/clickhouse-client';
import { makeRandom } from '../../lib/random';

interface QueryPageProps {
  executeQuery: (query: string) => void;
  setQueryContents: (query: string) => void;
  queryContents: string;
  queryExecuting: boolean;
  queryResult: QueryResult | null;
  queryError: string | null;
  queryProgress: QueryProgress | null;
  client: ClickhouseClient;
}

export class QueryPage extends React.Component {
  props: QueryPageProps;

  render() {
    let queryProgress = null;
    if (this.props.queryProgress) {
      let queryProgressPercentage = (
        this.props.queryProgress.num_rows / this.props.queryProgress.total_rows
      ) * 100;

      queryProgress = (
        <div className="progress">
          <div className="progress-bar" style={{width: `${queryProgressPercentage}%`}}>
            {Math.round(queryProgressPercentage)}%
          </div>
        </div>
      );
    }

    return (
      <div id="body">
        <div id="input">
          <div className="wrapper">
            <Editor
              executeQuery={this.props.executeQuery}
              setQueryContents={this.props.setQueryContents}
              contents={this.props.queryContents}
              queryResult={this.props.queryResult}
              queryExecuting={this.props.queryExecuting}
              queryError={this.props.queryError}
              client={this.props.client}
            />
          </div>
        </div>
        <div id="output">
          {queryProgress}
          <div className="wrapper">
            <Results
              result={this.props.queryResult}
              fieldFormatters={null}
              queryError={this.props.queryError}
            />
          </div>
        </div>
      </div>
    );
  }
}


interface QueryPageSideBarProps {
  client: ClickhouseClient;
  queryContents: string;
  setQueryContents: (query: string) => void;
}

interface QueryPageSideBarState {
  openQueries: ReadonlyArray<string>;
  savedQueries: { [key: string]: SavedQuery };
  currentQuery: string | null;
}

// Create a store for this
export class QueryPageSideBar extends React.Component {
  props: QueryPageSideBarProps;
  state: QueryPageSideBarState;

  constructor(props: QueryPageSideBarProps) {
    super(props);

    this.state = {
      currentQuery: null,
      openQueries: [],
      savedQueries: {},
    };
  }

  componentWillMount() {
    this.setState({
      savedQueries: this.props.client.getSavedQueries()
    });
  }

  componentWillUpdate(nextProps: QueryPageSideBarProps, nextState: QueryPageSideBarState) {
    if (this.props.queryContents !== nextProps.queryContents && this.state.currentQuery === nextState.currentQuery) {
      if (this.state.currentQuery) {
        this.state.savedQueries[this.state.currentQuery].contents = nextProps.queryContents;
      }
    }
  }

  addQuery() {
    const queryName = `New Query ${makeRandom(6)}`;

    let savedQueries = Object.assign({}, this.state.savedQueries);
    savedQueries[queryName] = {
      name: `New Query ${makeRandom(6)}`,
      contents: '',
      edited: true,
    };

    // Copy open queries
    let openQueries = this.state.openQueries.slice(0);
    openQueries.push(queryName);
    this.setState({openQueries: openQueries, savedQueries: savedQueries});
  }

  openQuery(name: string) {
    let openQueries = this.state.openQueries.slice(0);
    openQueries.push(name);
    this.props.setQueryContents(this.state.savedQueries[name].contents);
    this.setState({openQueries: openQueries, currentQuery: name});
  }

  selectQuery(name: string) {
    this.props.setQueryContents(this.state.savedQueries[name].contents);
    this.setState({currentQuery: name});
  }

  render() {
    let tabs = [];

    tabs.push(<li key="open-queries"><b>Open Queries</b></li>);
    for (const queryName of this.state.openQueries) {
      const selected = (queryName === this.state.currentQuery);
      tabs.push(
        <li key={queryName} className={selected ? 'active' : ''} onClick={() => { this.selectQuery(queryName); }}>
          <i className="fa fa-file" />
          {queryName}
        </li>
      );
    }

    tabs.push(<hr key="hr-1" />);
    tabs.push(<li key="saved-queries"><b>Saved Queries</b></li>);
    for (const queryName of Object.keys(this.state.savedQueries)) {
      if (this.state.openQueries.indexOf(queryName) !== -1) {
        continue;
      }
      tabs.push(
        <li key={queryName} onClick={() => { this.openQuery(queryName); }}>
          <i className="fa fa-file" />
          {queryName}
        </li>
      );
    }

    tabs.push(<hr key="hr-2" />);
    tabs.push(
      <li key="open-new" onClick={() => { this.addQuery(); }}>
        <i className="fa fa-plus" />
        Open New Query
      </li>
    );

    return (
      <div id="sidebar">
        <div className="tables-list">
          <div className="wrap">
            <div className="title main">
              <span className="current-database">test</span>
            </div>
            <div className="tables">
              <ul>{tabs}</ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
