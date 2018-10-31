import { 
    TreeDataProvider, 
    WorkspaceFolder, 
    Event, 
    TreeItem, 
    ProviderResult, 
    EventEmitter, 
    window, 
    CancellationTokenSource,
    Uri,
    workspace,
    RelativePattern,
    CancellationToken,
    commands,
    TreeItemCollapsibleState
} from "vscode";
import * as fs from "fs";
import * as path from "path";
import { MinecraftManifest } from "./MinecraftManifest";
import { ResourceName } from "../resources";

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

export class EntityTreeProvider implements TreeDataProvider<EntityTreeNode> {
    private _onDidChangeTreeData: EventEmitter<EntityTreeNode | undefined> = new EventEmitter<EntityTreeNode | undefined>();
	readonly onDidChangeTreeData: Event<EntityTreeNode | undefined> = this._onDidChangeTreeData.event;   

    private _loadingItems : Promise<EntityTreeNode[]> | null = null;
    private _cancelLoadingItems: CancellationTokenSource | null = null;

    constructor(private _workspaces: WorkspaceFolder[] | undefined) {
        this.reconstructTree();
    }

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}
    
    getTreeItem(element: EntityTreeNode): TreeItem | Thenable<TreeItem> {
        return element;
    }

    async getChildren(element?: EntityTreeNode | undefined): Promise<EntityTreeNode[]> {
        if (!this._workspaces || this._workspaces.length === 0) {
			window.showInformationMessage('No dependency in empty workspace');
			return [];
        }

        if (!this._loadingItems) {
            this.reconstructTree();
        }

        if (this._loadingItems === null) {
            return [];
        }

        console.log("Retrieving Items");
        var items = await this._loadingItems;
        console.log("Items retrieved");
        return items;
    }

    async reconstructTree() {
        if (!!this._cancelLoadingItems) {
            this._cancelLoadingItems.cancel();
            await this._loadingItems;
            this._cancelLoadingItems = null;
            this._loadingItems = null;
        }

        if (!this._workspaces || this._workspaces.length === 0) {
            
            console.log("No workspaces");
            commands.executeCommand('setContext', 'workspaceHasMinecraftManifestJSON', false);
            return;
        }

        console.log("Reconstructing Entity Tree");

        this._cancelLoadingItems = new CancellationTokenSource();
        this._cancelLoadingItems.token.onCancellationRequested(() => console.log("loading files cancelled"));
        this._loadingItems = this.loadItems(this._workspaces, this._cancelLoadingItems.token);
    }

    async loadItems(folders: WorkspaceFolder[], cancellationToken: CancellationToken): Promise<EntityTreeNode[]> {
        const findManifestTasks = folders.map(f => workspace.findFiles(new RelativePattern(f, "**/manifest.json"), null, undefined, cancellationToken));      

        console.log("Finding Manifest files");
        const findResults = await Promise.all(findManifestTasks);
        const manifestUrls = (findResults).reduce((p, c) => [...p, ...c], []);
        if (cancellationToken.isCancellationRequested) {
            commands.executeCommand('setContext', 'workspaceHasMinecraftManifestJSON', false);
            return [];
        }       

        console.log("Loading Manifests...");
        const manifests = <MinecraftManifest[]>manifestUrls.map(m => this.loadManifest(m)).filter(m => m !== null);
        console.log(`Located ${manifests.length} manifests`);

        commands.executeCommand('setContext', 'workspaceHasMinecraftManifestJSON', manifests.length > 0);

        return manifests.map(
            m => new EntityTreeNode(
                m.header.name,
                m.header.description,
                ResourceName.AddOn,
                TreeItemCollapsibleState.Expanded
            )
        );
    }    
    loadManifest(manifestUri: Uri): MinecraftManifest | null {
        console.log(`Loading manifest from ${manifestUri}`);
        const path = manifestUri.fsPath;
        if (this.pathExists(path)) {
            const packageJson = <MinecraftManifest>JSON.parse(fs.readFileSync(path, 'utf-8'));
            if (packageJson.format_version === undefined || packageJson.header === undefined) {
                console.log(`manifest at '${manifestUri}' was not a valid Minecraft Bedrock manifest.`);
                return null;
            }
            return packageJson;
        }

        return null;
    }

    private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}