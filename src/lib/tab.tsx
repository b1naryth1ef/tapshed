import { store } from 'statorgfc';

import { Immutable } from './immutable';
import { QueryResult, QueryProgress } from './clickhouse-client';

export class Tab extends Immutable {
  name: string;
  saved: boolean;
  dirty: boolean;
  queryContents: string;
  queryProgress: QueryProgress | null;
  queryResult: QueryResult | null;

  constructor(name: string, saved: boolean, queryContents?: string) {
    super();

    this.name = name;
    this.saved = saved;
    this.dirty = false;
    this.queryContents = queryContents || '';
    this.queryProgress = null;
    this.queryResult = null;
  }

  get queryExecuting(): boolean {
    return this.queryProgress !== null;
  }

  save(name?: string) {
    const client = store.get('client');
    if (client == null) {
      return;
    }

    client.saveSavedQuery(name || this.name, this.queryContents);
    this.update({saved: true, dirty: false});
  }

  delete() {
    const client = store.get('client');
    if (client == null) {
      return;
    }

    client.deleteSavedQuery(this.name);

    let tabs = Object.assign({}, store.get('tabs'));
    delete tabs[this.name];

    let currentTab = store.get('currentTab');
    if (currentTab && currentTab.name === this.name) {
      currentTab = null;
    }

    store.set({tabs: tabs, currentTab: currentTab});
  }

  async execute() {
    const client = store.get('client');
    if (client == null) {
      return;
    }

    const result = await client.executeQuery(
      this.queryContents,
      store.get('databaseName'),
      (progress: QueryProgress) => {
        this.update({queryProgress: progress});
      }
    ).get();

    this.update({queryProgress: null, queryResult: result});
  }

  replace(inst: Tab) {
    let tabs = Object.assign({}, store.get('tabs'));

    for (const tabName of Object.keys(tabs)) {
      if (tabs[tabName] === this) {
        delete tabs[tabName];
      }
    }

    tabs[inst.name] = inst;

    let currentTab = store.get('currentTab');
    if (currentTab && (currentTab.name === this.name || currentTab === this)) {
      currentTab = inst;
    }

    store.set({tabs: tabs, currentTab: currentTab});
  }

  setContents(contents: string) {
    this.update({queryContents: contents, dirty: true});
  }

  setName(name: string) {
    const client = store.get('client');
    if (client == null) {
      return;
    }

    client.deleteSavedQuery(this.name);
    client.saveSavedQuery(name, this.queryContents);

    this.update({name: name, dirty: false});
  }
}
