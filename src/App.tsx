import { Redirect, Route, Switch } from "react-router-dom";
import {
  IonApp,
  IonRoute,
  IonRouterOutlet,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import Home from "./pages/Home/Home";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";
import { AuthProvider } from "./providers/AuthContext";
import LoginPage from "./pages/Login/LoginPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import store from "./store";
import { Provider } from "react-redux";
import { StorageProvider } from "./providers/StorageContext";
import Tools from "./pages/Tools/Tools";
import NewTool from "./pages/Tools/New/NewTool";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Provider store={store}>
          <StorageProvider>
            <AuthProvider>
              <IonRouterOutlet>
                <IonRoute
                  path="/login"
                  exact
                  render={(props) => <LoginPage />}
                ></IonRoute>
                <IonRoute
                  exact
                  path="/tools"
                  render={(props) => <ProtectedRoute children={<Tools />} />}
                ></IonRoute>
                <IonRoute
                  exact
                  path="/tools/new"
                  render={(props) => <ProtectedRoute children={<NewTool />} />}
                ></IonRoute>
                <IonRoute
                  exact
                  path="/"
                  render={(props) => <ProtectedRoute children={<Home />} />}
                ></IonRoute>
              </IonRouterOutlet>
            </AuthProvider>
          </StorageProvider>
        </Provider>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
