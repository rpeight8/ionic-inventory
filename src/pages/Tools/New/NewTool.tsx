import { IonContent, IonPage, IonInput, IonButton, IonImg } from "@ionic/react";
import React, { useCallback, useState } from "react";
import CameraService from "../../../services/CameraService";
import { createTool } from "../../../store/slices/toolsSlice";
import "./NewTool.css";
import { AppDispatch } from "../../../store";
import { useDispatch } from "react-redux";

const NewTool: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const [title, setTitle] = useState("");
  const [isTitleTouched, setIsTitleTouched] = useState(false);
  const [isTitleValid, setIsTitleValid] = useState<boolean>();

  const [quantity, setQuantity] = useState("");
  const [isQuantityTouched, setIsQuantityTouched] = useState(false);
  const [isQuantityValid, setIsQuantityValid] = useState<boolean>();

  const [photo, setPhoto] = useState<string | undefined>();

  const validateTitle = useCallback((title: string) => {
    return title.length > 0;
  }, []);

  const validateQuantity = useCallback((quantity: string) => {
    return parseInt(quantity) > 0;
  }, []);

  const takePhotoHandler = useCallback(async () => {
    const base64 = await CameraService.takePicture();
    setPhoto(base64);
  }, []);

  const removePhotoHandler = useCallback(() => {
    setPhoto(undefined);
  }, []);

  const submit = () => {
    if (!isTitleValid || !isQuantityValid) {
      return;
    }

    dispatch(createTool({ title: title, quantity: parseInt(quantity), photo }));
    console.log("submit");
  };

  return (
    <IonPage>
      <IonContent id="main-content">
        <IonInput
          className={`${isTitleValid && "ion-valid"} ${
            isTitleValid === false && "ion-invalid"
          } ${isTitleTouched && "ion-touched"}`}
          type="text"
          fill="solid"
          label="Title"
          labelPlacement="floating"
          helperText="Enter a tool title"
          errorText="Invalid tool title"
          onIonInput={(event) => {
            setTitle(event.detail.value!);
            setIsTitleValid(validateTitle(event.detail.value!));
          }}
          onIonBlur={() => setIsTitleTouched(true)}
        ></IonInput>
        <IonInput
          className={`${isQuantityValid && "ion-valid"} ${
            isQuantityValid === false && "ion-invalid"
          } ${isQuantityTouched && "ion-touched"}`}
          type="number"
          fill="solid"
          label="Quantity"
          labelPlacement="floating"
          helperText="Enter a quantity"
          errorText="Invalid quantity"
          onIonInput={(event) => {
            setQuantity(event.detail.value!);
            setIsQuantityValid(validateQuantity(event.detail.value!));
          }}
          onIonBlur={() => setIsQuantityTouched(true)}
        ></IonInput>
        {photo && (
          <IonImg
            className="photo-preview"
            src={`data:image/jpeg;base64,${photo}`}
            alt="Pic"
          ></IonImg>
        )}
        {(photo && (
          <div className="button-container">
            <IonButton onClick={takePhotoHandler}>Take new Photo</IonButton>
            <IonButton onClick={removePhotoHandler}>Remove Photo</IonButton>
          </div>
        )) || (
          <IonButton expand="full" onClick={takePhotoHandler}>
            Take Photo
          </IonButton>
        )}
        <IonButton expand="full" onClick={submit}>
          Create Tool
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default NewTool;
