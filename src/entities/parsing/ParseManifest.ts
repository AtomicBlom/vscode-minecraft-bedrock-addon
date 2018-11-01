import * as fs from "fs";
import { Uri } from "vscode";
import { Version, ManifestModuleType, IMinecraftElement } from "../MinecraftManifest";


export class InvalidManifest {
    constructor(public errors: string[],
                public fsLocation: Uri
    ) {}
}

export interface MinecraftManifest extends IMinecraftElement {
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
    static loadManifests(elements: Map<string, IMinecraftElement>, manifestUrls: Uri[]) {
        return manifestUrls
            .map(m => this.loadManifest(elements, m))
            .map(m => <MinecraftManifest | InvalidManifest>m);
    }

    static loadManifest(elements: Map<string, IMinecraftElement>,manifestUri: Uri) {
        console.log(`Loading manifest from ${manifestUri}`);
        const path = manifestUri.fsPath;
        if (this.pathExists(path)) {
            const manifestJson = <MinecraftManifest>JSON.parse(fs.readFileSync(path, 'utf-8'));
            const errors = this.validateManifest(manifestJson);
            if (errors.length > 0) {
                return new InvalidManifest(
                    errors,
                    manifestUri
                );
            }
            manifestJson.fsLocation = manifestUri;
            manifestJson.id = manifestJson.header.uuid;
            manifestJson.children = [];

            elements.set(manifestJson.header.uuid, manifestJson);

            return manifestJson;
        }

        return null;
    }
    static validateManifest(packageJson: MinecraftManifest): any {
        const errors: string[] = [];
        if (packageJson.format_version === undefined) {
            errors.push("manifest.error.format-version-not-specified");
        }
        if (packageJson.header === undefined) {
            errors.push("manifest.error.header-not-found");
        }
        return errors;
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