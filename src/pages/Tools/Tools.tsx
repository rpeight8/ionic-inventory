import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonToolbar,
} from "@ionic/react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { fetchTools, selectAllTools } from "../../store/slices/toolsSlice";
import { useCallback, useEffect } from "react";
import AddNewToolFab from "../../components/AddNewFAB/AddNewToolFab";
import { arrowBackOutline } from "ionicons/icons";
import SubpageHeader from "../../components/PageHeaders/SubpageHeader/SubpageHeader";

const Tools: React.FC = () => {
  const tools = useSelector(selectAllTools);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(fetchTools());
  }, [dispatch]);
  console.log(tools);
  return (
    <IonPage>
      <SubpageHeader title="Tools" />
      <IonContent id="main-content">
        <h1>Tools</h1>
        <IonList>
          {tools.map((tool) => (
            <IonItem key={tool.id}>
              <IonLabel>{tool.title}</IonLabel>
            </IonItem>
          ))}
        </IonList>
        <AddNewToolFab />
      </IonContent>
    </IonPage>
  );
};

export default Tools;
