import * as React from 'react';
import AceEditor from 'react-ace';
import 'brace/theme/tomorrow';

import { QueryResult } from '../lib/clickhouse-client';
import { prettyFormatNumber, prettyFormatSeconds, prettyFormatBytes } from '../lib/formatting';

interface EditorActionsProps {
  executeQuery: () => void;
  queryResult: QueryResult | null;
  queryExecuting: boolean;
}

export class EditorActions extends React.Component {
  props: EditorActionsProps;

  render() {
    let resultText: string = '';

    if (this.props.queryExecuting) {
      resultText = 'executing query...';
    } else if (this.props.queryResult != null) {
      const result = this.props.queryResult;
      let statsText = `${prettyFormatSeconds(result.statistics.elapsed)}s, `;
      statsText += `${prettyFormatNumber(result.statistics.rows_read)} rows, `;
      statsText += `${prettyFormatBytes(result.statistics.bytes_read)}`;
      resultText = `${result.rows} rows returned (${statsText})`;
    }

    return (
      <div className="actions">
        <input
          type="button"
          id="run"
          value="Run Query"
          className="btn btn-sm btn-primary"
          disabled={this.props.queryExecuting}
          onClick={this.props.executeQuery}
        />
        <input
          type="button"
          id="run"
          value="Save Query"
          className="btn btn-sm btn-warning"
          disabled={this.props.queryExecuting}
        />
        <div className="pull-right">
          <span id="result-rows-count">{resultText}</span>
          <input type="button" id="json" value="JSON" className="btn btn-sm btn-default" />
        </div>
      </div>
    );
  }
}


interface EditorProps {
  executeQuery: (query: string) => void;
  contents: string;
  queryResult: QueryResult | null;
  queryExecuting: boolean;
}

export class Editor extends React.Component {
  props: EditorProps;
  private contents: string;

  constructor(props: EditorProps) {
    super(props);
    this.contents = props.contents;
  }

  onEditorChange = (newValue: string) => {
    this.contents = newValue;
  }

  render() {
    const commands = [
      {
        name: 'run_query',
        bindKey: {
          win: 'Ctrl-Enter',
          mac: 'Command-Enter',
        },
        exec: () => this.props.executeQuery(this.contents),
      }
    ];

    return (
      <div>
        <AceEditor
          name="custom_query"
          theme="tomorrow"
          height="193px"
          width="100%"
          fontSize={13}
          setOptions={{
            tabSize: 2,
            useSoftTabs: true,
            enableSnippets: true,
          }}
          commands={commands}
          onChange={this.onEditorChange}
          value={this.contents}
        />
        <EditorActions
          executeQuery={() => this.props.executeQuery(this.contents)}
          queryResult={this.props.queryResult}
          queryExecuting={this.props.queryExecuting}
        />
      </div>
    );
  }
}
