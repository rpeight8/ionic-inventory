import React from "react";
import { IonFab, IonFabButton, IonIcon } from "@ionic/react";
import type { IonicIcon } from "../../../types";

type FABProps = {
  icon: IonicIcon;
  horizontal?: "start" | "end" | "center";
  vertical?: "top" | "bottom" | "center";
  onClick: () => void;
};

function FAB({
  icon,
  vertical = "bottom",
  horizontal = "end",
  onClick,
}: FABProps) {
  return (
    <IonFab vertical={vertical} horizontal={horizontal} onClick={onClick}>
      <IonFabButton>
        <IonIcon icon={icon}></IonIcon>
      </IonFabButton>
    </IonFab>
  );
}
export default FAB;
export type { FABProps };
