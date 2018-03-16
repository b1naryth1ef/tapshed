import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import { initialize } from './store';
import './assets/index.css';

initialize();

ReactDOM.render(
  <App />,
  document.getElementById('root') as HTMLElement
);
