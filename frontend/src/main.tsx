import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import Login from './pages/Login'
import { AuthProvider } from './contexts/AuthContext'
import keycloak from './keycloak'

const token = localStorage.getItem('kc_token');
const refreshToken = localStorage.getItem('kc_refreshToken');

const root = createRoot(document.getElementById('root')!);

const renderApp = (authenticated: boolean) => {
  root.render(
    <StrictMode>
      {authenticated ? (
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      ) : (
        <Login />
      )}
    </StrictMode>
  );
};

const clearTokens = () => {
  localStorage.removeItem('kc_token');
  localStorage.removeItem('kc_refreshToken');
};

const initOptions: any = {
  onLoad: 'check-sso',
  checkLoginIframe: false,
};

if (token && refreshToken) {
  initOptions.token = token;
  initOptions.refreshToken = refreshToken;
}

keycloak.init(initOptions).then((authenticated) => {
  if (authenticated) {
    console.info("Authenticated via Keycloak");
    // Save updated tokens
    if (keycloak.token) localStorage.setItem('kc_token', keycloak.token);
    if (keycloak.refreshToken) localStorage.setItem('kc_refreshToken', keycloak.refreshToken);
    renderApp(true);
  } else {
    console.info("Not authenticated, showing login page");
    clearTokens();
    renderApp(false);
  }
}).catch((error) => {
  console.error("Keycloak initialization failed", error);
  clearTokens();
  renderApp(false);
});
