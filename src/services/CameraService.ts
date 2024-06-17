import { Camera, CameraResultType } from "@capacitor/camera";

type CameraService = {
  takePicture: () => Promise<string | undefined>;
};

const takePicture = async (): Promise<string | undefined> => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    saveToGallery: true,
    resultType: CameraResultType.Base64,
  });

  return image.base64String;
};

const CameraService: CameraService = {
  takePicture,
};

export default CameraService;
export type { CameraService };
