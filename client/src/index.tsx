import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
const root = createRoot(container!); // "!" asserts container is not null
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
