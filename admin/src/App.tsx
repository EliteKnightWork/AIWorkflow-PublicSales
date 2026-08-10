import { Auth0Provider, useAuth0, type AppState } from "@auth0/auth0-react";
import { GitHubBanner, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { RefineSnackbarProvider } from "@refinedev/mui";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import type { PropsWithChildren } from "react";
import routerBindings, {
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import dataProvider from "@refinedev/simple-rest";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { ProjectCreate, ProjectEdit, ProjectList } from "./pages/projects";
import { projectDataProvider } from "./providers/projectProvider";
import { CompanyCreate, CompaniesList, CompanyEdit } from "./pages/companies";
import { companiesDataProvider } from "./providers/companiesProvider";
import { Layout } from "./components/layout";
import { HiddenProjectList } from "./pages/hidden_projects";
import { hiddenProjectDataProvider } from "./providers/hiddenProjectProvider";
import { usersDataProvider } from "./providers/usersProvider";
import { UsersEdit, UsersList, UsersCreate } from "./pages/users";
import { ProposalsList } from "./pages/proposals";
import { proposalsDataProvider } from "./providers/proposalsProvider";
import { participateQualificationProvider } from "./providers/participateQualificationProvider";
import { Login, LoginError, ConfigError } from "./pages/logins";
import { useAxiosAuth } from "./hooks/useAxiosAuth";

const RefineApp = () => {
  const isAxiosReady = useAxiosAuth();

  if (!isAxiosReady) {
    return (
      <Box
        alignItems="center"
        display="flex"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <GitHubBanner />
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <CssBaseline />
          <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
          <RefineSnackbarProvider>
            <DevtoolsProvider>
              <Refine
                dataProvider={{
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  default: dataProvider(import.meta.env.VITE_API_URL),
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  project: projectDataProvider(import.meta.env.VITE_API_URL),
                  companies: companiesDataProvider(
                    import.meta.env.VITE_API_URL,
                  ),
                  hiddenProject: hiddenProjectDataProvider(
                    import.meta.env.VITE_API_URL,
                  ),
                  users: usersDataProvider(import.meta.env.VITE_API_URL),
                  proposals: proposalsDataProvider(import.meta.env.VITE_API_URL),
                  participateQualifications: participateQualificationProvider(
                    import.meta.env.VITE_API_URL,
                  ),
                }}
                routerProvider={routerBindings}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  useNewQueryKeys: true,
                  projectId: "qeShkU-p0UivL-oPI50x",
                }}
                resources={[
                  {
                    name: "project",
                    list: "/project",
                    create: "/project/create",
                    edit: "/project/edit/:id",
                    meta: { dataProviderName: "project" },
                  },
                  {
                    name: "hiddenProject",
                    list: "/hiddenProject",
                    meta: { dataProviderName: "hiddenProject" },
                  },
                  {
                    name: "companies",
                    list: "/companies",
                    create: "/companies/create",
                    edit: "/companies/edit/:id",
                    meta: { dataProviderName: "companies" },
                  },
                  {
                    name: "users",
                    list: "/users",
                    create: "/users/create",
                    edit: "/users/edit/:id",
                    meta: { dataProviderName: "users" },
                  },
                  {
                    name: "proposals",
                    list: "/proposals",
                    meta: { dataProviderName: "proposals" },
                  },
                  {
                    name: "participate_qualifications",
                    meta: { dataProviderName: "participateQualifications" },
                  },
                ]}
              >
                <Routes>
                  <Route
                    element={
                      <Layout>
                        <Outlet />
                      </Layout>
                    }
                  >
                    <Route path="/project">
                      <Route index element={<ProjectList />} />
                      <Route path="create" element={<ProjectCreate />} />
                      <Route path="edit/:id" element={<ProjectEdit />} />
                      {/*<Route path="show/:id" element={<CategoryShow />} /> */}
                    </Route>
                    <Route path="/hiddenProject">
                      <Route index element={<HiddenProjectList />} />
                    </Route>
                    <Route path="/companies">
                      <Route index element={<CompaniesList />} />
                      <Route path="create" element={<CompanyCreate />} />
                      <Route path="edit/:id" element={<CompanyEdit />} />
                    </Route>
                    <Route path="/users">
                      <Route index element={<UsersList />} />
                      <Route path="create" element={<UsersCreate />} />
                      <Route path="edit/:id" element={<UsersEdit />} />
                    </Route>
                    <Route path="/proposals">
                      <Route index element={<ProposalsList />} />
                    </Route>
                    <Route
                      path="/*"
                      element={<Navigate to="/project" replace />}
                    ></Route>
                  </Route>
                </Routes>
                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </RefineSnackbarProvider>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
};

const AuthGuard = ({ children }: PropsWithChildren) => {
  const { isLoading, isAuthenticated, loginWithRedirect, error } = useAuth0();
  const triggerLogin = () => {
    void loginWithRedirect({
      appState: {
        returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      },
    });
  };

  if (isLoading) {
    return (
      <Box
        alignItems="center"
        display="flex"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <LoginError
        message={error.message}
        onRetry={triggerLogin}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Login
        onLogin={triggerLogin}
      />
    );
  }

  return <>{children}</>;
};

const App = () => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
  const redirectUri = window.location.origin;

  if (!domain || !clientId || !audience) {
    console.error("Auth0 環境変数が設定されていません");
    return <ConfigError />;
  }

  const authorizationParams: Record<string, string> = {
    redirect_uri: redirectUri,
    audience: audience,
  };

  const onRedirectCallback = (appState?: AppState) => {
    const targetUrl =
      appState?.returnTo ??
      `${window.location.pathname}${window.location.search}${window.location.hash}`;

    window.history.replaceState({}, document.title, targetUrl);
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={authorizationParams}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <AuthGuard>
        <RefineApp />
      </AuthGuard>
    </Auth0Provider>
  );
};

export default App;
