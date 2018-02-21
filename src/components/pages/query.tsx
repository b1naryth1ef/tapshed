import * as React from 'react';

import { Editor } from '../editor';
import { Results } from '../results';
import { QueryResult } from '../../lib/clickhouse-client';

interface QueryPageProps {
  executeQuery: (query: string) => void;
  queryContents: string;
  queryResult: QueryResult | null;
  queryExecuting: boolean;
}

export class QueryPage extends React.Component {
  props: QueryPageProps;

  render() {
    return (
      <div id="body">
        <div id="input">
          <div className="wrapper">
            <Editor
              executeQuery={this.props.executeQuery}
              contents={this.props.queryContents}
              queryResult={this.props.queryResult}
              queryExecuting={this.props.queryExecuting}
            />
          </div>
        </div>
        <div id="output">
          <div className="wrapper">
            <Results result={this.props.queryResult} fieldFormatters={null}/>
          </div>
        </div>
      </div>
    );
  }
}