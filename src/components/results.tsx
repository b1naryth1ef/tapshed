import * as React from 'react';

import { QueryResult } from '../lib/clickhouse-client';

interface ResultsProps {
  result: QueryResult | null;
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
    if (this.props.result == null) {
      return <div />;
    }

    let fields = [];
    let head = [];
    let body = [];

    for (const column of this.props.result.meta) {
      fields.push(column.name);
      head.push(<th onClick={() => this.onClickColumn(column.name)} key={column.name}>{column.name}</th>);
    }

    let rows = this.props.result.data.slice(0);

    if (this.state.sortBy !== null) {
      let sortBy: string = this.state.sortBy;

      rows.sort((a, b) => {
        if (a[sortBy] > b[sortBy]) {
          return -1;
        } else if (a[sortBy] < b[sortBy]) {
          return 1;
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
          cols.push(<td key={field}>{row[field]}</td>);
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
