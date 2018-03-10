import * as React from 'react';

import { Editor } from '../editor';
import { Results } from '../results';
import { ClickhouseClient, QueryResult, QueryProgress } from '../../lib/clickhouse-client';

interface QueryPageProps {
  executeQuery: (query: string) => void;
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

export class QueryPageSideBar extends React.Component {
  render() {
    return (
      <div id="sidebar">
        <div className="tables-list">
          <div className="wrap">
            <div className="title main">
              <span className="current-database">test</span>
            </div>
            <div className="tables">
              hi
            </div>
          </div>
        </div>
      </div>
    );
  }
}
