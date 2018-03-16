import { store } from 'statorgfc';

export function initialize() {
  store.initialize({
    tabs: {},
    currentTab: null,
    client: null,
    databaseName: 'default',
  });
}
