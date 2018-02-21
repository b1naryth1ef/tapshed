import * as React from 'react';

import { ClickhouseClient, TableStats } from '../lib/clickhouse-client';
import { prettyFormatNumber, prettyFormatBytes } from '../lib/formatting';

interface SideBarProps {
  client: ClickhouseClient;
  setTableName: (tableName: string) => void;
  databaseName: string;
  tableName: string;
}

interface SideBarState {
  tables: Array<string>;
  tableStats: TableStats | null;
}

export class SideBar extends React.Component {
  props: SideBarProps;
  state: SideBarState;

  constructor(props: SideBarProps) {
    super(props);
    this.state = {
      tables: [],
      tableStats: null,
    };
  }

  async componentWillMount() {
    const tables = await this.props.client.getTables('default');

    this.setState({
      tables: tables.map((table) => table.name),
    });
  }

  onTableClick(tableName: string) {
    this.props.setTableName(tableName);
  }

  async componentWillUpdate(nextProps: SideBarProps, nextState: SideBarState) {
    if (this.props.tableName !== nextProps.tableName || this.props.databaseName !== nextProps.databaseName) {
      this.setState({tableStats: null});
      const tableStats = await this.props.client.getTableStats(nextProps.databaseName, nextProps.tableName);
      this.setState({tableStats: tableStats});
    }
  }

  render() {
    const tables = this.state.tables;

    let listItems = [];

    for (const tableName of tables) {
      listItems.push(
        <li
            className={tableName === this.props.tableName ? 'active' : ''}
            onClick={() => this.onTableClick(tableName)}
            key={tableName}
        >
          <i className="fa fa-table" />
          {tableName}
        </li>
      );
    }

    let tableInformationRows = [];
    let tableInformation;
    if (this.state.tableStats !== null) {
      tableInformationRows.push(
        <li key="size">
          Size: <span>{prettyFormatBytes(this.state.tableStats.bytes)}</span>
        </li>
      );
      tableInformationRows.push(
        <li key="rows">Rows:
          <span>{prettyFormatNumber(this.state.tableStats.rows)}</span>
        </li>
      );
      tableInformationRows.push(
        <li key="pkb">
          PK Memory: <span>{prettyFormatBytes(this.state.tableStats.pkb)}</span>
        </li>
      );

      tableInformation = (
        <ul style={{display: 'block'}}>
          {tableInformationRows}
        </ul>
      );
    }

    return (
      <div id="sidebar">
        <div className="tables-list">
          <div className="wrap">
            <div className="title main">
              <span className="current-database">{this.props.databaseName}</span>
            </div>
            <div className="tables">
              <ul>{listItems}</ul>
            </div>
          </div>
        </div>
        <div className="table-information">
          <div className="wrap">
            <div className="title">Table Information</div>
            {tableInformation}
          </div>
        </div>
      </div>
    );
  }
}
