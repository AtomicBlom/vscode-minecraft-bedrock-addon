import * as fs from "fs";
import { Uri } from "vscode";
import { Version, ManifestModuleType } from "../Common";
import { IModuleElementLoader } from "./IModuleElementLoader";
import { ResourceModuleElementLoader } from "./ResourceModuleElementLoader";
import { BlankModuleElementLoader } from "./BlankModuleElementLoader";
import { InvalidManifest, MinecraftModule, AddonTreeItem } from "../TreeItems";
import { Manifest, MinecraftBedrockManifestPackType } from "./json/manifest";

/*export interface IMinecraftAddonManifest {
    format_version?: number;
    header: {
        description: string;
        name: string;
        uuid: string;
        version: Version;
        min_engine_version?: Version;
    };
    modules: {
        description: string;
        type: ManifestModuleType;
        uuid: string;
        version: Version;
    }[];
    dependencies?: {
        uuid: string;
        version: Version;
    }[];
}*/

export class ParseManifest {
    static loadManifests(manifestUrls: Uri[]) {
        return manifestUrls
            .map(m => this.loadModulesFromManifest(m))
            .reduce((p, c) => [...p, ...c], []);
    }

    static loadModulesFromManifest(manifestUri: Uri) : AddonTreeItem[] {
        console.log(`Loading manifest from ${manifestUri}`);
        const path = manifestUri.fsPath;
        if (this.pathExists(path)) {
            const manifestJson = <Manifest>JSON.parse(fs.readFileSync(path, 'utf-8'));
            const errors = this.validateManifest(manifestJson);
            if (errors.length > 0) {
                return [new InvalidManifest(errors, manifestUri)];
            }

            return this.loadModules(manifestJson, manifestUri);
        }

        return [new InvalidManifest(["File did not exist"], manifestUri)];
    }

    static validateManifest(packageJson: Manifest) {
        const errors: string[] = [];
        if (packageJson.format_version === undefined) {
            errors.push("manifest.error.format-version-not-specified");
        }
        if (packageJson.header === undefined) {
            errors.push("manifest.error.header-not-found");
        }
        return errors;
    }

    static loadModules(manifest: Manifest, location: Uri) {
        if (!manifest.modules ) {
            return [];
        }
        return manifest.modules.map(
            module => new MinecraftModule(
                {
                    id: `${manifest.header.uuid}/${module.uuid}`,
                    uuid: module.uuid,
                    name: this.getModuleName(module.type, manifest),
                    description: module.description,
                    type: this.mapModuleType(module.type),
                    location: location
                }, 
                () => this.getModuleElementLoader(this.mapModuleType(module.type)).load(location)
            )
        );
    }
    static mapModuleType(type: MinecraftBedrockManifestPackType): ManifestModuleType {
        switch(type) {
            case "client_data":
                return ManifestModuleType.ClientData;
            case "data":
                return ManifestModuleType.Data;
            case "resources":
                return ManifestModuleType.Resources;
            default:
                throw new Error("module.type.unknown");
        }
    }
    static getModuleName(description: string, manifest: Manifest) {
        if (!!manifest && !!manifest.header && !!manifest.header.name) {
            return `${description} (${manifest.header.name})`;
        } else {
            return `${description}`;
        }
    }

    static getModuleElementLoader(type: ManifestModuleType): IModuleElementLoader {
        switch (type) {
            case ManifestModuleType.ClientData:
                return new BlankModuleElementLoader();
            case ManifestModuleType.Data:
                return new BlankModuleElementLoader();
            case ManifestModuleType.Resources:
                return new ResourceModuleElementLoader();
            default:
                return new BlankModuleElementLoader();
        }
    }

    private static pathExists(p: string) {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}