import * as React from 'react';

import { NewQueryResult } from '../lib/clickhouse-client';

// const numericalTypes = [
//   'UInt8',
//   'UInt16',
//   'UInt32',
//   'UInt64',
//   'Int8',
//   'Int16',
//   'Int32',
//   'Int64',
//   'Float32',
//   'Float64'
// ];

interface FieldFormatters {
  [index: string]: (value: any) => string;
}

interface ResultsProps {
  result: NewQueryResult | null;
  queryError: string | null;
  fieldFormatters: FieldFormatters | null;
}

enum SortDirection {
  ASC,
  DESC,
}

interface ResultsState {
  sortBy: string | null;
  sortDir: SortDirection;
}

export class Results extends React.Component {
  props: ResultsProps;
  state: ResultsState;

  constructor(props: ResultsProps) {
    super(props);
    this.state = {
      sortBy: null,
      sortDir: SortDirection.ASC,
    };
  }

  onClickColumn(columnName: string) {
    if (this.state.sortBy === columnName) {
      if (this.state.sortDir === SortDirection.ASC) {
        this.setState({sortDir: SortDirection.DESC});
      } else {
        this.setState({sortBy: null, sortDir: SortDirection.ASC});
      }
    } else {
      this.setState({sortBy: columnName});
    }
  }

  async componentWillUpdate(nextProps: ResultsProps, nextState: ResultsState) {
    if (nextProps.result !== this.props.result) {
      this.setState({sortBy: null, sortDir: SortDirection.ASC});
    }
  }

  render() {
    if (this.props.queryError !== null) {
      return (
        <div>
          <pre>{String(this.props.queryError)}</pre>
        </div>
      );
    } else if (this.props.result == null) {
      return <div />;
    }

    const result = this.props.result;
    let headings = result.columns.map((col) => {
      return <th onClick={() => this.onClickColumn(col.name)} key={col.name}>{col.name}</th>;
    });

    const columnNameIndexes = result.columns.map((col) => { return col.name; });

    // TODO: sorting

    let fieldFormatters = {};
    if (this.props.fieldFormatters) {
      for (const field of Object.keys(this.props.fieldFormatters)) {
        fieldFormatters[columnNameIndexes.indexOf(field)] = this.props.fieldFormatters[field];
      }
    }

    let rawRows = result.rows.slice(0);
    if (this.state.sortBy !== null) {
      const sortByIndex: number = columnNameIndexes.indexOf(this.state.sortBy);

      rawRows.sort((a, b) => {
        a = a[sortByIndex];
        b = b[sortByIndex];

        if (a > b) {
          return 1;
        } else if (a < b) {
          return -1;
        } else {
          return 0;
        }
      });

      if (this.state.sortDir === SortDirection.DESC) {
        rawRows.reverse();
      }
    }

    let rows = [];
    for (const [rowIndex, row] of rawRows.entries()) {
      let cols = [];
      for (let [colIndex, col] of row.entries()) {
        if (fieldFormatters[colIndex]) {
          col = fieldFormatters[colIndex](col);
        }

        cols.push(<td key={result.columns[colIndex].name}>{col}</td>);
      }

      rows.push(<tr key={rowIndex}>{cols}</tr>);
    }

    return (
      <table id="results" className="table" data-mode={true}>
        <thead>
          <tr>{headings}</tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    );
  }
}
