import { IonContent, IonPage, IonInput, IonButton, IonImg } from "@ionic/react";
import React, { useCallback, useState } from "react";
import CameraService from "../../../services/CameraService";
import { createTool } from "../../../store/slices/toolsSlice";
import "./NewTool.css";
import { AppDispatch } from "../../../store";
import { useDispatch } from "react-redux";
import SubpageHeader from "../../../components/PageHeaders/SubpageHeader/SubpageHeader";
import BarcodeScannerService from "../../../services/BarcodeScannerService";
import type { NewTool } from "../../../types";
import { useHistory } from "react-router";

const parseToolQRCode = (qrCode: string): [NewTool] | [any, Error] => {
  try {
    const parts = qrCode.split(";");
    return [
      {
        title: parts[0].toString(),
        quantity: parseInt(parts[1]),
      },
    ];
  } catch (error) {
    return [, new Error("Invalid QR-Code")];
  }
};

const NewTool: React.FC = () => {
  const history = useHistory();

  const dispatch = useDispatch<AppDispatch>();

  const [title, setTitleState] = useState<string>("");
  const [isTitleTouched, setIsTitleTouched] = useState(false);
  const [isTitleValid, setIsTitleValid] = useState<boolean>();

  const [quantity, setQuantityState] = useState<number>(0);
  const [isQuantityTouched, setIsQuantityTouched] = useState(false);
  const [isQuantityValid, setIsQuantityValid] = useState<boolean>();

  const [photo, setPhoto] = useState<string | undefined>();

  const validateTitle = useCallback((title: string) => {
    return title.length > 0;
  }, []);

  const validateQuantity = useCallback((quantity: number) => {
    return quantity > 0;
  }, []);

  const setTitle = useCallback((title: string) => {
    setIsTitleValid(validateTitle(title));
    setTitleState(title);
  }, []);

  const setQuantity = useCallback((quantity: number) => {
    setIsQuantityValid(validateQuantity(quantity));
    setQuantityState(quantity);
  }, []);

  const takePhotoHandler = useCallback(async () => {
    const base64 = await CameraService.takePicture();
    setPhoto(base64);
  }, [CameraService, setPhoto]);

  const scanToolQRCodeHandler = useCallback(async () => {
    const result = await BarcodeScannerService.startBarcodeScanner();
    const tool = parseToolQRCode(result.ScanResult);
    if (tool[1]) {
      console.error(tool[1]);
      return;
    }

    setTitle(tool[0].title);
    setQuantity(tool[0].quantity.toString());
  }, [BarcodeScannerService]);

  const removePhotoHandler = useCallback(() => {
    setPhoto(undefined);
  }, [setPhoto]);

  const submitNewTool = () => {
    if (!isTitleValid || !isQuantityValid) {
      return;
    }

    history.push("/tools");

    dispatch(createTool({ title: title, quantity: quantity, photo }));
  };

  return (
    <IonPage>
      <SubpageHeader title="New Tool" />
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
          value={title}
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
          value={quantity}
          onIonInput={(event) => {
            const value = event?.detail?.value;
            let parsedValue = parseInt(value || "0");
            setQuantity(parsedValue);
            setIsQuantityValid(validateQuantity(parsedValue));
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
        <IonButton expand="full" onClick={scanToolQRCodeHandler}>
          Scan Tool QR-Code
        </IonButton>
        <IonButton expand="full" onClick={submitNewTool}>
          Create Tool
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default NewTool;
