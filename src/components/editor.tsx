import * as React from 'react';
import AceEditor from 'react-ace';
import 'brace/theme/tomorrow';

import { Tab } from '../lib/tab';
import { CSVWriter } from '../lib/csv';

import { getResultAsObjects } from '../lib/clickhouse-client';
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
  currentTab: Tab;
}

export class EditorActions extends React.Component {
  props: EditorActionsProps;

  async exportJSON() {
    if (this.props.currentTab.queryResult) {
      const obj = getResultAsObjects(this.props.currentTab.queryResult);
      download(`table-${makeRandom(6)}.json`, 'application/json', JSON.stringify(obj));
    }
  }

  async exportCSV() {
    if (this.props.currentTab.queryResult) {
      const writer = new CSVWriter;

      writer.writeRow(this.props.currentTab.queryResult.columns.map((col) => { return col.name; }));

      for (const row of this.props.currentTab.queryResult.rows) {
        writer.writeRow(row);
      }
      download(`table-${makeRandom(6)}.csv`, 'text/csv', writer.getData());
    }
  }

  render() {
    const currentTab = this.props.currentTab;
    const executing = (currentTab.queryProgress !== null);
    let resultText: string | JSX.Element = '';


    if (executing) {
      resultText = 'executing query...';
    // } else if (this.props.queryError) {
    //   resultText = <span className="query-error">Error!</span>;
    } else if (currentTab.queryResult != null && currentTab.queryResult.stats) {
      const stats = currentTab.queryResult.stats;
      let statsText = `${prettyFormatSeconds(stats.duration / 1000)}s, `;
      statsText += `${prettyFormatNumber(stats.rows)} rows, `;
      statsText += `${prettyFormatBytes(stats.bytes)}`;
      resultText = `${currentTab.queryResult.rows.length} rows returned (${statsText})`;
    }

    let deleteButton = null;
    if (currentTab.saved) {
      deleteButton =  (
        <input
          type="button"
          id="delete"
          value="Delete Query"
          className="btn btn-sm btn-danger"
          onClick={() => { this.props.currentTab.delete(); }}
          disabled={executing}
        />
      );
    }

    return (
      <div className="actions">
        <input
          type="button"
          id="run"
          value="Run Query"
          className="btn btn-sm btn-primary"
          disabled={executing}
          onClick={() => { this.props.currentTab.execute(); }}
        />
        <input
          type="button"
          id="save"
          value="Save Query"
          className="btn btn-sm btn-warning"
          onClick={() => { this.props.currentTab.save(); }}
          disabled={executing}
        />
        {deleteButton}
        <input
          type="button"
          id="run"
          value="Rename Query"
          className="btn btn-sm btn-default"
          disabled={executing}
          onClick={() => { 
            const newName = window.prompt('Query Name', this.props.currentTab.name);
            if (newName) {
              this.props.currentTab.setName(newName);
            }
          }}
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
  currentTab: Tab;
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
    const currentTab = this.props.currentTab;

    const commands = [
      {
        name: 'run_query',
        bindKey: {
          win: 'Ctrl-Enter',
          mac: 'Command-Enter',
        },
        exec: () => this.props.currentTab.execute(),
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
          onChange={(contents) => { this.props.currentTab.setContents(contents); }}
          value={currentTab.queryContents}
          ref={(ref) => { this.aceRef = ref; }}
        />
        <EditorActions
          currentTab={this.props.currentTab}
        />
      </div>
    );
  }
}
