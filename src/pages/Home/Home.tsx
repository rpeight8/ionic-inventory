import { IonContent, IonItem, IonLabel, IonPage } from "@ionic/react";
import MainPageHeader from "../../components/PageHeaders/MainPageHeader/MainPageHeader";
import "./Home.css";

const Home: React.FC = () => {
  return (
    <IonPage>
      <MainPageHeader menuTitle="Main">
        <IonItem routerLink="/tools">
          <IonLabel>Tools</IonLabel>
        </IonItem>
        <IonItem routerLink="/toolboxes">
          <IonLabel>Toolboxes</IonLabel>
        </IonItem>
      </MainPageHeader>
      <IonContent id="main-content">Main</IonContent>
    </IonPage>
  );
};

export default Home;
