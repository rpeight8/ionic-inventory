import { IonContent, IonItem, IonLabel, IonList, IonPage } from "@ionic/react";
import React from "react";
import { useSelector } from "react-redux";
import { selectAllTools } from "../../store/slices/toolsSlice";

const Tools: React.FC = () => {
  const tools = useSelector(selectAllTools);
  return (
    <IonPage>
      <IonContent id="main-content">
        <h1>Tools</h1>
        <IonList>
          {tools.map((tool) => (
            <IonItem key={tool.id}>
              <IonLabel>{tool.title}</IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Tools;
