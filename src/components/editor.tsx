import * as React from 'react';
import AceEditor from 'react-ace';
import 'brace/theme/tomorrow';

import { CSVWriter } from '../lib/csv';

import { ClickhouseClient, QueryResult, getResultAsObjects } from '../lib/clickhouse-client';
import { prettyFormatNumber, prettyFormatSeconds, prettyFormatBytes } from '../lib/formatting';
import { ClickhouseAceMode } from '../lib/clickhouse-ace-mode';
import { makeRandom } from '../lib/random';

function download(filename: string, dataType: string, data: string) {
  let element = document.createElement('a');
  element.setAttribute('href', window.URL.createObjectURL(new Blob([data], {type: dataType})));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

interface EditorActionsProps {
  executeQuery: () => void;
  queryExecuting: boolean;
  queryResult: QueryResult | null;
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
    } else if (this.props.queryResult != null && this.props.queryResult.stats) {
      const stats = this.props.queryResult.stats;
      let statsText = `${prettyFormatSeconds(stats.duration / 1000)}s, `;
      statsText += `${prettyFormatNumber(stats.rows)} rows, `;
      statsText += `${prettyFormatBytes(stats.bytes)}`;
      resultText = `${this.props.queryResult.rows.length} rows returned (${statsText})`;
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
  setQueryContents: (query: string) => void;
  executeQuery: (query: string) => void;
  contents: string;
  queryExecuting: boolean;
  queryResult: QueryResult | null;
  queryError: string | null;
}

export class Editor extends React.Component {
  props: EditorProps;
  private aceRef: any;

  constructor(props: EditorProps) {
    super(props);
  }

  componentDidMount() {
    const mode = new ClickhouseAceMode();
    this.aceRef.editor.getSession().setMode(mode);
  }


  render() {
    const commands = [
      {
        name: 'run_query',
        bindKey: {
          win: 'Ctrl-Enter',
          mac: 'Command-Enter',
        },
        exec: () => this.props.executeQuery(this.props.contents),
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
          onChange={this.props.setQueryContents}
          value={this.props.contents}
          ref={(ref) => { this.aceRef = ref; }}
        />
        <EditorActions
          executeQuery={() => this.props.executeQuery(this.props.contents)}
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
