import { v4 as uuidv4 } from "uuid";

type LocalServerConverterService = {
  toLocal<S extends { id: string }>(entities: S[]): Promise<S[]>;
  toServer<L extends { id: string }>(entities: L[]): Promise<L[]>;
  addLocalServerMappingEntry: (
    localId: string,
    serverId: string
  ) => Promise<void>;
};

type IdMapping = Record<string, string>;
type LocalToServerMapping = IdMapping;
type ServerToLocalMapping = IdMapping;
type IdMappingResult = {
  localToServer: LocalToServerMapping;
  serverToLocal: ServerToLocalMapping;
};

type StorageService = {
  setIdMapping: (idMapping: LocalToServerMapping) => Promise<void>;
  getIdMapping: () => Promise<IdMappingResult>;
};

const createLocalServerConverterService = (
  storageService: StorageService
): LocalServerConverterService => {
  let localToServerMapping: Record<string, string> | undefined;
  let serverToLocalMapping: Record<string, string> | undefined;

  let dirty = false;

  const loadMappings = async () => {
    const { localToServer, serverToLocal } =
      await storageService.getIdMapping();
    localToServerMapping = localToServer;
    serverToLocalMapping = serverToLocal;
  };

  const toLocal = async <S extends { id: string }>(
    entities: S[]
  ): Promise<S[]> => {
    if (!localToServerMapping || !serverToLocalMapping || dirty) {
      await loadMappings();
      dirty = false;
    }

    if (!localToServerMapping || !serverToLocalMapping) {
      throw new Error("Id mappings are not loaded");
    }

    const convertedEntities = entities.map((entity) => {
      if (!entity.id) {
        throw new Error("Entity id is missing");
      }

      //   TODO: Fix ! assertion
      if (serverToLocalMapping![entity.id]) {
        //   TODO: Fix ! assertion
        return { ...entity, id: serverToLocalMapping![entity.id] };
      }

      if (!dirty) {
        dirty = true;
      }
      const uuid = uuidv4();

      //   TODO: Fix ! assertion
      localToServerMapping![uuid] = entity.id;

      return { ...entity, id: uuid };
    });

    if (dirty) await storageService.setIdMapping(localToServerMapping);
    return convertedEntities;
  };

  const toServer = async <L extends { id: string }>(
    entities: L[]
  ): Promise<L[]> => {
    if (!localToServerMapping || dirty) {
      await loadMappings();
      dirty = false;
    }

    if (!localToServerMapping) {
      throw new Error("Id mappings are not loaded");
    }

    const convertedEntities = entities.map((entity) => {
      if (!entity.id) {
        throw new Error("Entity id is missing");
      }

      //   TODO: Fix ! assertion
      if (!localToServerMapping![entity.id]) {
        console.warn("Server id not found in local id: ", entity.id);
      }

      //   TODO: Fix ! assertion
      return { ...entity, id: localToServerMapping![entity.id] };
    });

    return convertedEntities;
  };

  const addLocalServerMappingEntry = async (
    localId: string,
    serverId: string
  ) => {
    if (!localToServerMapping || !serverToLocalMapping) {
      await loadMappings();
    }

    if (!localToServerMapping || !serverToLocalMapping) {
      throw new Error("Id mappings are not loaded");
    }

    localToServerMapping[localId] = serverId;
    serverToLocalMapping[serverId] = localId;

    await storageService.setIdMapping(localToServerMapping);
  };

  return {
    toLocal,
    toServer,
    addLocalServerMappingEntry,
  };
};

export default createLocalServerConverterService;
