import { Uri, TreeItem, TreeItemCollapsibleState } from "vscode";
import { ResourceName } from "../resources";

import * as path from "path";
import { ManifestModuleType } from "./Common";

export abstract class AddonTreeItem extends TreeItem {
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
    
    abstract get children(): Promise<AddonTreeItem[]>;
}

export class NotImplementedTreeItem extends AddonTreeItem {
    children: Promise<AddonTreeItem[]>;

    /**
     *
     */
    constructor() {
        super(
            "Not Implemented", 
            "If you need this, please file a bug", 
            ResourceName.Unimplemented,
            TreeItemCollapsibleState.None);
        this.children = Promise.resolve([]);
    }
    
}

export class InvalidManifest extends AddonTreeItem {
    children: Promise<AddonTreeItem[]>;

    constructor(public errors: string[],
        public uri: Uri) 
    {
        super(
            "Bad Manifest",
            uri.fsPath,
            ResourceName.InvalidManifest,
            TreeItemCollapsibleState.None
        );
        this.children = Promise.resolve([]);
    }
}

interface IMinecraftModuleParameters {
    id: string;
    uuid: string; 
    name: string;
    description: string;
    type: ManifestModuleType;
    location: Uri;
}

export class MinecraftModule extends AddonTreeItem { 
    children: Promise<AddonTreeItem[]>;

    constructor(parameters: IMinecraftModuleParameters, 
        private loadChildren: () => Promise<AddonTreeItem[]>) {
        super(parameters.name, 
            parameters.description, 
            MinecraftModule.getImageKeyFromResourceName(parameters.type),
            TreeItemCollapsibleState.Expanded);

        this.children = this.loadChildren();
    }

    reloadChildren() {
        this.children = this.loadChildren();
    }

    static getImageKeyFromResourceName(type: ManifestModuleType): ResourceName {
        switch (type) {
            case ManifestModuleType.ClientData:
                return ResourceName.ClientData;
            case ManifestModuleType.Data:
                return ResourceName.Data;
            case ManifestModuleType.Resources:
                return ResourceName.Resources;
            default:
                return ResourceName.Unimplemented;
        }
    }
}