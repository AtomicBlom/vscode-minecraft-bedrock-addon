import * as fs from "fs";
import { Uri } from "vscode";
import { Version, ManifestModuleType } from "../MinecraftManifest";


export interface MinecraftManifest {
    fsLocation: import("vscode").Uri;
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

    //Not part of the JSON
    errors: string[];
}

export class ParseManifest {
    static loadManifests(manifestUrls: Uri[]) {
        return manifestUrls
            .map(m => this.loadManifest(m))
            .filter(m => m !== null)
            .map(m => <MinecraftManifest>m);
    }

    static loadManifest(manifestUri: Uri) {
        console.log(`Loading manifest from ${manifestUri}`);
        const path = manifestUri.fsPath;
        if (this.pathExists(path)) {
            const packageJson = <MinecraftManifest>JSON.parse(fs.readFileSync(path, 'utf-8'));
            packageJson.errors = [];
            if (packageJson.format_version === undefined) {
                packageJson.errors.push("manifest.error.format-version-not-specified");
            }
            if (packageJson.header === undefined) {
                packageJson.errors.push("manifest.error.header-not-found");
            }
            if (packageJson.format_version === undefined || packageJson.header === undefined) {
                console.log(`manifest at '${manifestUri}' was not a valid Minecraft Bedrock manifest.`);
            }

            packageJson.fsLocation = manifestUri;
            return packageJson;
        }

        return null;
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