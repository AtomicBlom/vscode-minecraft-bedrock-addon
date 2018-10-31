export const enum ManifestModuleType {
    Data = "data",
    ClientData = "client_data",
    Resources = "resources"
}

export type Version = [number, number, number];

export interface MinecraftManifest {
    format_version?: number;
    header: {
        description: string;
        name: string;
        uuid: string;
        version: Version;
        min_engine_version?: Version;
    };
    modules?: {
        description: string;
        type: ManifestModuleType;
        uuid: string;
        version: Version;
    }[];
    dependencies?: {
        uuid: string;
        version: Version;
    }[];
}