import { MinecraftManifest } from "./ParseManifest";
import { ManifestModuleType, IMinecraftElement } from "../MinecraftManifest";
import { ResourceName } from "../../resources";
import * as path from "path";
import { Uri } from "vscode";

export interface IMinecraftModule extends IMinecraftElement {
    id: string;
    uuid: string; 
    name: string;
    description: string;
    type: ManifestModuleType;
}

export class MinecraftModule implements IMinecraftElement {
    id: string = "";
    uuid: string = "";
    name: string = "New Module";
    description: string = "";
    type: ManifestModuleType = ManifestModuleType.Resources;

    children: IMinecraftElement[];
    
    constructor(module: Partial<IMinecraftModule>, 
                public manifest: MinecraftManifest,
                public fsLocation: Uri) {
        Object.assign(this, module);
        
        this.children = [];
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

export class ParseModules {
    static loadModules(elements: Map<string, IMinecraftElement>, manifests: MinecraftManifest[]) {
        const modules = manifests
            .map(
                (manifest: MinecraftManifest) => {
                    return manifest.modules.map(
                        module => new MinecraftModule(
                            {
                                id: `${manifest.header.uuid}/${module.uuid}`,
                                uuid: module.uuid,
                                name: manifest.header.name,
                                description: module.description,
                                type: module.type
                            }, 
                            manifest,
                            manifest.fsLocation.with({
                                path: path.dirname(manifest.fsLocation.path)
                            })
                        ));
                    }
            )
            .reduce((p, c) => [...p, ...c], []);

        modules.forEach(module => 
            elements.set(module.id, module)
        );

        return modules;
    }
}