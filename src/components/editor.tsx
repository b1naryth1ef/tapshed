import * as React from 'react';
import AceEditor from 'react-ace';
import 'brace/theme/tomorrow';

import { CSVWriter } from '../lib/csv';

import { ClickhouseClient, NewQueryResult, getResultAsObjects } from '../lib/clickhouse-client';
// import { prettyFormatNumber, prettyFormatSeconds, prettyFormatBytes } from '../lib/formatting';
import { ClickhouseAceMode } from '../lib/clickhouse-ace-mode';

function makeRandom(size: number) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < size; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function download(filename: string, dataType: string, data: string) {
  let element = document.createElement('a');
  element.setAttribute('href', window.URL.createObjectURL(new Blob([data], {type: dataType})));
  // element.setAttribute('href', `data:${dataType};charset=utf-8,` + encodeURIComponent(data));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

interface EditorActionsProps {
  executeQuery: () => void;
  queryExecuting: boolean;
  queryResult: NewQueryResult | null;
  queryError: string | null;
  client: ClickhouseClient;
  contents: string;
}

export class EditorActions extends React.Component {
  props: EditorActionsProps;

  // TODO(NewQueryResult): convert all these to do data manipulation in-browser
  async exportJSON() {
    if (this.props.queryResult) {
      const obj = getResultAsObjects(this.props.queryResult);
      download(`table-${makeRandom(6)}.json`, 'application/json', JSON.stringify(obj));
    }
  }

  async exportCSV() {
    if (this.props.queryResult) {
      const writer = new CSVWriter;

      writer.writeRow(this.props.queryResult.columns.map((col) => { return col.name; }));

      for (const row of this.props.queryResult.rows) {
        writer.writeRow(row);
      }
      download(`table-${makeRandom(6)}.csv`, 'text/csv', writer.getData());
    }
  }

  render() {
    let resultText: string | JSX.Element = '';

    if (this.props.queryExecuting) {
      resultText = 'executing query...';
    } else if (this.props.queryError) {
      resultText = <span className="query-error">Error!</span>;
    } else if (this.props.queryResult != null) {
      // const result = this.props.queryResult;
      // TODO(NewQueryResult)
      // let statsText = `${prettyFormatSeconds(result.statistics.elapsed)}s, `;
      // statsText += `${prettyFormatNumber(result.statistics.rows_read)} rows, `;
      // statsText += `${prettyFormatBytes(result.statistics.bytes_read)}`;
      // resultText = `${result.rows} rows returned (${statsText})`;
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
          <input
            type="button"
            value="JSON"
            className="btn btn-sm btn-default"
            onClick={() => this.exportJSON()}
          />
          <input
            type="button"
            value="CSV"
            className="btn btn-sm btn-default"
            onClick={() => this.exportCSV()}
          />
        </div>
      </div>
    );
  }
}

interface EditorProps {
  client: ClickhouseClient;
  executeQuery: (query: string) => void;
  contents: string;
  queryExecuting: boolean;
  queryResult: NewQueryResult | null;
  queryError: string | null;
}

export class Editor extends React.Component {
  props: EditorProps;
  private aceRef: any;
  private contents: string;

  constructor(props: EditorProps) {
    super(props);
    this.contents = props.contents;
  }

  componentDidMount() {
    const mode = new ClickhouseAceMode();
    this.aceRef.editor.getSession().setMode(mode);
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
          }}
          commands={commands}
          onChange={this.onEditorChange}
          value={this.contents}
          ref={(ref) => { this.aceRef = ref; }}
        />
        <EditorActions
          executeQuery={() => this.props.executeQuery(this.contents)}
          queryResult={this.props.queryResult}
          queryExecuting={this.props.queryExecuting}
          queryError={this.props.queryError}
          client={this.props.client}
          contents={this.props.contents}
        />
      </div>
    );
  }
}
