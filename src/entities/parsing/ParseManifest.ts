import * as fs from "fs";
import { Uri } from "vscode";
import { Version, ManifestModuleType } from "../Common";
import { IModuleElementLoader } from "./ModuleElementLoader";
import { ResourceModuleElementLoader } from "./ResourceModuleElementLoader";
import { BlankModuleElementLoader } from "./BlankModuleElementLoader";
import { InvalidManifest, MinecraftModule, AddonTreeItem } from "../TreeItems";

export interface IMinecraftManifest {
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
}

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
            const manifestJson = <IMinecraftManifest>JSON.parse(fs.readFileSync(path, 'utf-8'));
            const errors = this.validateManifest(manifestJson);
            if (errors.length > 0) {
                return [new InvalidManifest(errors, manifestUri)];
            }

            return this.loadModules(manifestJson, manifestUri);
        }

        return [new InvalidManifest(["File did not exist"], manifestUri)];
    }

    static validateManifest(packageJson: IMinecraftManifest) {
        const errors: string[] = [];
        if (packageJson.format_version === undefined) {
            errors.push("manifest.error.format-version-not-specified");
        }
        if (packageJson.header === undefined) {
            errors.push("manifest.error.header-not-found");
        }
        return errors;
    }

    static loadModules(manifest: IMinecraftManifest, location: Uri) {
        return manifest.modules.map(
            module => new MinecraftModule(
                {
                    id: `${manifest.header.uuid}/${module.uuid}`,
                    uuid: module.uuid,
                    name: this.getModuleName(module.type, manifest),
                    description: module.description,
                    type: module.type,
                    location: location
                }, 
                () => this.getModuleElementLoader(module.type).load(location)
            )
        );
    }
    static getModuleName(description: string, manifest: IMinecraftManifest) {
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