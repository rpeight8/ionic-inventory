import {
  IonButtons,
  IonContent,
  IonHeader,
  IonList,
  IonMenu,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import React from "react";
import "./MainPageHeader.css";

type MainPageHeaderProps = {
  menuTitle: string;
  children: React.ReactNode;
};

const MainPageHeader: React.FC<MainPageHeaderProps> = ({
  menuTitle,
  children,
}) => {
  return (
    <>
      <IonMenu contentId="main-content">
        <IonHeader>
          <IonToolbar>
            <IonTitle>{menuTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonList>{children}</IonList>
        </IonContent>
      </IonMenu>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
    </>
  );
};

export default MainPageHeader;
