import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SnackbarProvider } from 'notistack';
import { store, persistor } from './store/store';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SnackbarProvider
          maxSnack={5}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          dense
        >
          <App />
        </SnackbarProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);