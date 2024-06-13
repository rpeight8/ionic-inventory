import {
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonPage,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import ExploreContainer from "../../components/ExploreContainer";
import "./Home.css";
import {
  Link,
  Redirect,
  Route,
  RouteComponentProps,
  Router,
  Switch,
  useLocation,
  useRouteMatch,
} from "react-router-dom";
import Tools from "../Tools/Tools";
import Toolboxes from "../Toolboxes/Toolboxes";

const Home: React.FC = () => {
  const location = useLocation();
  const getCurrentRouteName = () => {
    switch (location.pathname) {
      case "/app/tools":
        return "Tools";
      case "/app/toolboxes":
        return "Toolboxes";
      default:
        return "Home";
    }
  };

  return (
    <IonPage>
      <IonMenu contentId="main-content">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Menu Content</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonList>
            <IonItem routerLink="/app/tools">
              <IonLabel>Tools</IonLabel>
            </IonItem>
            <IonItem routerLink="/app/toolboxes">
              <IonLabel>Toolboxes</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>{getCurrentRouteName()}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent id="main-content">
        <IonRouterOutlet>
          <Route path={`/app/tools`} component={Tools}></Route>
          <Route exact path={`/app/tools/:id`} component={Toolboxes}></Route>
          <Route exact path={`/app/toolboxes`} component={Toolboxes}></Route>
        </IonRouterOutlet>
      </IonContent>
    </IonPage>
  );
};

export default Home;
