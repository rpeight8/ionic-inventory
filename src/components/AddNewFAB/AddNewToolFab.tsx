import { useHistory, useLocation } from "react-router";
import FAB from "../ui/FAB/FAB";
import { add } from "ionicons/icons";

function AddNewToolFab() {
  const history = useHistory();
  const { pathname } = useLocation();
  const onClick = () => {
    history.push(`${pathname}/new`);
  };
  return <FAB icon={add} onClick={onClick} />;
}

export default AddNewToolFab;
