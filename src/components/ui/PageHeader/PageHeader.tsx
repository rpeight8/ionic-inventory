import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { Icon } from "../../../types";

type PageHeaderProps = {
  title: string;
  icon: Icon;
  onButtonClick: () => void;
};

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon,
  onButtonClick,
}) => {
  return (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton onClick={onButtonClick}>
            <IonIcon slot="icon-only" icon={icon} />
          </IonButton>
        </IonButtons>
        <IonTitle>{title}</IonTitle>
      </IonToolbar>
    </IonHeader>
  );
};

export default PageHeader;
