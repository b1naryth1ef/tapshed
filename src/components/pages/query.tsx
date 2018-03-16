import * as React from 'react';
import { store } from 'statorgfc';

import { Tab } from '../../lib/tab';
import { Editor } from '../editor';
import { Results } from '../results';
import { makeRandom } from '../../lib/random';

interface QueryPageState {
  currentTab: Tab | null;
}

export class QueryPage extends React.Component {
  state: QueryPageState;

  constructor(props: any) {
    super(props);

    store.connectComponentState(this, ['currentTab']);
  }

  render() {
    const currentTab = this.state.currentTab;

    if (!currentTab) {
      return <div />;
    }

    let queryProgress = null;
    if (currentTab.queryProgress) {
      let queryProgressPercentage = (
        currentTab.queryProgress.num_rows / currentTab.queryProgress.total_rows
      ) * 100;

      queryProgress = (
        <div className="progress">
          <div className="progress-bar" style={{width: `${queryProgressPercentage}%`}}>
            {Math.round(queryProgressPercentage)}%
          </div>
        </div>
      );
    }

    return (
      <div id="body">
        <div id="input">
          <div className="wrapper">
            <Editor currentTab={currentTab} />
          </div>
        </div>
        <div id="output">
          {queryProgress}
          <div className="wrapper">
            <Results
              result={currentTab.queryResult}
              fieldFormatters={null}
            />
          </div>
        </div>
      </div>
    );
  }
}


interface QueryPageSideBarState {
  tabs: { [key: string]: Tab };
  openTabs: ReadonlyArray<string>;
  currentTab: Tab | null;
}

// Create a store for this
export class QueryPageSideBar extends React.Component {
  state: QueryPageSideBarState;

  constructor(props: any) {
    super(props);

    store.connectComponentState(this, ['tabs', 'currentTab']);
  }

  selectTab(name: string) {
    store.set({currentTab: this.state.tabs[name]});
  }

  openNewTab() {
    const newTabName = `New Tab ${makeRandom(6)}`;
    let tabs = Object.assign({}, this.state.tabs);
    tabs[newTabName] = new Tab(newTabName, false, '');
    store.set({tabs: tabs, currentTab: tabs[newTabName]});
  }

  render() {
    let tabs = [];

    tabs.push(<hr key="hr-1" />);
    tabs.push(<li key="saved-queries"><b>Saved Queries</b></li>);


    let keys = Object.keys(this.state.tabs);
    keys.sort();
    for (const queryName of keys) {
      const selected = (this.state.currentTab && queryName === this.state.currentTab.name);
      const iconName = (
        (this.state.tabs[queryName].queryResult !== null) ? 'fa-asterisk' : 'fa-file'
      );
      tabs.push(
        <li key={queryName} className={selected ? 'active' : ''} onClick={() => { this.selectTab(queryName); }}>
          <i className={`fa ${iconName}`} />
          {this.state.tabs[queryName].dirty ? <b>*</b> : ''}{queryName}
        </li>
      );
    }

    tabs.push(<hr key="hr-2" />);
    tabs.push(
      <li key="open-new" onClick={() => { this.openNewTab(); }}>
        <i className="fa fa-plus" />
        <b>Open New Query</b>
      </li>
    );

    return (
      <div id="sidebar">
        <div className="tables-list">
          <div className="wrap">
            <div className="title main">
              <span className="current-database">test</span>
            </div>
            <div className="tables">
              <ul>{tabs}</ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
