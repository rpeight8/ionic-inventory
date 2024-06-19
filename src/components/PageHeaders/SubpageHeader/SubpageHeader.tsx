import { arrowBackOutline } from "ionicons/icons";
import PageHeader from "../../ui/PageHeader/PageHeader";
import { useHistory } from "react-router";
import { useCallback } from "react";

type SubpageHeaderProps = {
  title: string;
};

const SubpageHeader: React.FC<SubpageHeaderProps> = ({ title }) => {
  const history = useHistory();

  const handleBack = useCallback(() => {
    history.go(-1);
  }, [history]);

  return (
    <PageHeader
      title={title}
      icon={arrowBackOutline}
      onButtonClick={handleBack}
    />
  );
};

export default SubpageHeader;
