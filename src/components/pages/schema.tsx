import * as React from 'react';

import { Results } from '../results';
import { ClickhouseClient, QueryResult } from '../../lib/clickhouse-client';
import { prettyFormatBytes } from '../../lib/formatting';

interface SchemaPageProps {
  client: ClickhouseClient;
  databaseName: string;
  tableName: string;
}

interface SchemaPageState {
  result: QueryResult | null;
}

export class SchemaPage extends React.Component {
  props: SchemaPageProps;
  state: SchemaPageState;

  constructor(props: SchemaPageProps) {
    super(props);
    this.state = {
      result: null,
    };
  }

  async getTableSchema(databaseName: string, tableName: string) {
    if (!databaseName || !tableName) {
      return;
    }

    this.setState({result: null});

    let result = await this.props.client.executeQuery(`
      SELECT
        name,
        type,
        data_compressed_bytes as compressed,
        data_uncompressed_bytes as uncompressed
      FROM system.columns
      WHERE database='${databaseName}' AND table='${tableName}'
    `);
    this.setState({result});
  }

  componentWillMount() {
    if (this.props.databaseName && this.props.tableName) {
      this.getTableSchema(this.props.databaseName, this.props.tableName);
    }
  }

  componentWillUpdate(nextProps: SchemaPageProps, nextState: SchemaPageState) {
    if (this.props.databaseName !== nextProps.databaseName || this.props.tableName !== nextProps.tableName) {
      this.getTableSchema(nextProps.databaseName, nextProps.tableName);
    }
  }

  render() {
    let body;

    const fieldFormatters = {
      compressed: prettyFormatBytes,
      uncompressed: prettyFormatBytes,
    };

    if (!this.props.databaseName || !this.props.tableName) {
      body = <h3>Select a table...</h3>;
    } else if (this.state.result !== null) {
      body = <Results result={this.state.result} fieldFormatters={fieldFormatters} queryError={null} />;
    } else {
      body = <h3>Loading...</h3>;
    }

    return (
      <div id="body">
        <div id="output" style={{position: 'initial'}}>
          <div className="wrapper">
            {body}
          </div>
        </div>
      </div>
    );
  }
}
