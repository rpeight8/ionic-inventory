import { v4 as uuidv4 } from "uuid";
import type { StorageServiceType } from "./StorageService";

type LocalServerConverterServiceType<S, L> = {
  toLocal<S extends { id: string }>(entities: S[]): Promise<S[]>;
  toServer<L extends { id: string }>(entities: L[]): Promise<L[]>;
  addLocalServerMappingEntry: (
    localId: string,
    serverId: string
  ) => Promise<void>;
  removeLocalServerMappingEntry: (localId: string) => Promise<void>;
  initialize: () => Promise<void>;
};

type IdMapping = Record<string, string>;
type LocalToServerMapping = IdMapping;
type ServerToLocalMapping = IdMapping;
type IdMappingResult = {
  localToServer: LocalToServerMapping;
  serverToLocal: ServerToLocalMapping;
};

class LocalServerConverterService<S, L>
  implements LocalServerConverterServiceType<S, L>
{
  private static instance: LocalServerConverterService<any, any>;
  private storageService: StorageServiceType;
  private localToServerMapping: LocalToServerMapping | undefined;
  private serverToLocalMapping: ServerToLocalMapping | undefined;
  private dirty = false;
  private initialized = false;

  private constructor(storageService: StorageServiceType) {
    this.storageService = storageService;
  }

  public static getInstance(
    storageService: StorageServiceType
  ): LocalServerConverterService<any, any> {
    if (!LocalServerConverterService.instance) {
      LocalServerConverterService.instance = new LocalServerConverterService(
        storageService
      );
    }
    return LocalServerConverterService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.storageService.initialize();
      await this.loadMappings();
      this.dirty = false;
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize storage service", error);
      throw new Error("Failed to initialize storage service");
    }
  }

  private async loadMappings(): Promise<void> {
    const { localToServer, serverToLocal } =
      await this.storageService.getIdMapping();
    this.localToServerMapping = localToServer;
    this.serverToLocalMapping = serverToLocal;
  }

  public async toLocal<S extends { id: string }>(entities: S[]): Promise<S[]> {
    if (!this.initialized) {
      throw new Error("Service is not initialized");
    }

    if (
      !this.localToServerMapping ||
      !this.serverToLocalMapping ||
      this.dirty
    ) {
      await this.loadMappings();
      this.dirty = false;
    }

    if (!this.localToServerMapping || !this.serverToLocalMapping) {
      throw new Error("Id mappings are not loaded");
    }

    const convertedEntities = entities.map((entity) => {
      if (!entity.id) {
        throw new Error("Entity id is missing");
      }

      if (this.serverToLocalMapping![entity.id]) {
        return { ...entity, id: this.serverToLocalMapping![entity.id] };
      }

      if (!this.dirty) {
        this.dirty = true;
      }
      const uuid = uuidv4();
      this.localToServerMapping![uuid] = entity.id;
      this.serverToLocalMapping![entity.id] = uuid;

      return { ...entity, id: uuid };
    });

    if (this.dirty)
      await this.storageService.setIdMapping(this.localToServerMapping);
    return convertedEntities;
  }

  public async toServer<L extends { id: string }>(entities: L[]): Promise<L[]> {
    if (!this.initialized) {
      throw new Error("Service is not initialized");
    }

    if (!this.localToServerMapping || this.dirty) {
      await this.loadMappings();
      this.dirty = false;
    }

    if (!this.localToServerMapping) {
      throw new Error("Id mappings are not loaded");
    }

    const convertedEntities = entities.map((entity) => {
      if (!entity.id) {
        throw new Error("Entity id is missing");
      }

      if (!this.localToServerMapping![entity.id]) {
        console.warn("Server id not found for local id: ", entity.id);
      }

      return { ...entity, id: this.localToServerMapping![entity.id] };
    });

    return convertedEntities;
  }

  public async addLocalServerMappingEntry(
    localId: string,
    serverId: string
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error("Service is not initialized");
    }

    if (!this.localToServerMapping || !this.serverToLocalMapping) {
      await this.loadMappings();
    }

    if (!this.localToServerMapping || !this.serverToLocalMapping) {
      throw new Error("Id mappings are not loaded");
    }

    this.localToServerMapping[localId] = serverId;
    this.serverToLocalMapping[serverId] = localId;

    await this.storageService.setIdMapping(this.localToServerMapping);
  }

  public async removeLocalServerMappingEntry(localId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error("Service is not initialized");
    }

    if (
      !this.localToServerMapping ||
      !this.serverToLocalMapping ||
      this.dirty
    ) {
      await this.loadMappings();
      this.dirty = false;
    }

    if (!this.localToServerMapping || !this.serverToLocalMapping) {
      throw new Error("Id mappings are not loaded");
    }

    const serverId = this.localToServerMapping[localId];
    if (serverId) {
      delete this.localToServerMapping[localId];
      delete this.serverToLocalMapping[serverId];
      await this.storageService.setIdMapping(this.localToServerMapping);
    } else {
      console.warn("Server id not found for local id: ", localId);
    }
  }
}

export default LocalServerConverterService;
export type { LocalServerConverterServiceType };
