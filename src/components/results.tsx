import * as React from 'react';

import { QueryResult } from '../lib/clickhouse-client';

const numericalTypes = [
  'UInt8',
  'UInt16',
  'UInt32',
  'UInt64',
  'Int8',
  'Int16',
  'Int32',
  'Int64',
  'Float32',
  'Float64'
];

interface FieldFormatters {
  [index: string]: (value: any) => string;
}

interface ResultsProps {
  result: QueryResult | null;
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
          <pre>{this.props.queryError}</pre>
        </div>
      );
    } else if (this.props.result == null) {
      return <div />;
    }

    const result = this.props.result;

    let fields = [];
    let head = [];
    let body = [];

    for (const column of result.meta) {
      fields.push(column.name);
      head.push(<th onClick={() => this.onClickColumn(column.name)} key={column.name}>{column.name}</th>);
    }

    let rows = result.data.slice(0);

    if (this.state.sortBy !== null) {
      const sortBy: string = this.state.sortBy;
      let sortType: string = '';

      for (const value of result.meta) {
        if (value.name === sortBy) {
          sortType = value.type;
        }
      }

      rows.sort((a, b) => {
        a = a[sortBy];
        b = b[sortBy];

        if (numericalTypes.includes(sortType)) {
          if (a != null && b != null) {
            a = parseInt(a, 10);
            b = parseInt(b, 10);
          }
        }

        if (a > b) {
          return 1;
        } else if (a < b) {
          return -1;
        } else {
          return 0;
        }
      });

      if (this.state.sortDir === SortDirection.DESC) {
        rows.reverse();
      }
    }

    for (const [idx, row] of rows.entries()) {
      let cols = [];
      for (const field of fields) {
        if (row[field] === null) {
          cols.push(<td key={field}><span className="null">NULL</span></td>);
        } else {
          let value = row[field];
          if (this.props.fieldFormatters && this.props.fieldFormatters[field]) {
            value = this.props.fieldFormatters[field](value);
          }
          cols.push(<td key={field}>{value}</td>);
        }
      }

      body.push(<tr key={idx}>{cols}</tr>);
    }

    return (
      <table id="results" className="table" data-mode={true}>
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>
          {body}
        </tbody>
      </table>
    );
  }
}
