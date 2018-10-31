import { MinecraftManifest } from "./ParseManifest";
import { ManifestModuleType } from "../MinecraftManifest";
import { ResourceName } from "../../resources";

export class ParseModules {
    static loadModules(manifests: MinecraftManifest[]) {
        return manifests
            .map(
                (manifest: MinecraftManifest) => {
                    if (manifest.errors.length > 0) {
                        return [new MinecraftModule(
                            `${manifest.fsLocation}`,
                            "",
                            manifest.fsLocation.fsPath,
                            "",
                            manifest,
                            ManifestModuleType.InvalidManifest
                        )]
                    }
                    return manifest.modules.map(
                        module => new MinecraftModule(
                                `${manifest.header.uuid}/${module.uuid}`,
                                module.uuid,
                                manifest.header.name,
                                module.description,
                                manifest,
                                module.type
                            )
                        )
                    }
            )
            .reduce((p, c) => [...p, ...c], []);
    }
}

export class MinecraftModule {
    constructor(public nodeId: string,
                public uuid: string, 
                public name: string,
                public description: string,
                public manifest: MinecraftManifest,
                public type: ManifestModuleType) {
    }

    get icon() {
        switch (this.type) {
            case ManifestModuleType.ClientData:
                return ResourceName.ClientData;
            case ManifestModuleType.Data:
                return ResourceName.Data;
            case ManifestModuleType.Resources:
                return ResourceName.Resources;
            case ManifestModuleType.InvalidManifest:
                return ResourceName.InvalidManifest;
        }
    }

    get label() {
        if (!!this.manifest && !!this.manifest.header && !!this.manifest.header.name) {
            return `${this.name} (${this.manifest.header.name})`;
        } else {
            return `${this.name}`;
        }
    }
}