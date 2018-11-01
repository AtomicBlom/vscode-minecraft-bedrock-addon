import { Uri, TreeItem, TreeItemCollapsibleState } from "vscode";
import { ResourceName } from "../resources";

import * as path from "path";

export interface IMinecraftElement {
    fsLocation: Uri;
    id: string;
    children: IMinecraftElement[];
}

export const enum ManifestModuleType {
    Data = "data",
    ClientData = "client_data",
    Resources = "resources",
    InvalidManifest = "InvalidManifest"
}

export type Version = [number, number, number];

export class EntityTreeNode extends TreeItem {
    constructor(
        public readonly label: string, 
        private readonly _tooltip: string,
        public readonly imageKey: ResourceName,
        public readonly collapsibleState: TreeItemCollapsibleState,
        ) {
            super(label, collapsibleState);
        }

    get tooltip(): string {
        return this._tooltip;
    }

    iconPath = {
		light: path.join(__filename, '..', '..', '..', 'resources', 'light', this.imageKey),
		dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', this.imageKey)
	};
}