import { 
    TreeDataProvider, 
    WorkspaceFolder, 
    Event, 
    TreeItem,
    EventEmitter, 
    window, 
    CancellationTokenSource,
    workspace,
    RelativePattern,
    CancellationToken,
    commands,
    TreeItemCollapsibleState
} from "vscode";
import { ResourceName } from "../resources";
import { ParseManifest } from "./parsing/ParseManifest";
import { AddonTreeItem } from "./TreeItems";

export class EntityTreeProvider implements TreeDataProvider<AddonTreeItem> {
    private _onDidChangeTreeData: EventEmitter<AddonTreeItem | undefined> = new EventEmitter<AddonTreeItem | undefined>();
	readonly onDidChangeTreeData: Event<AddonTreeItem | undefined> = this._onDidChangeTreeData.event;   

    private _loadingItems : Promise<void> | null = null;
    private _cancelLoadingItems: CancellationTokenSource | null = null;
    modules: AddonTreeItem[] = [];

    constructor(private _workspaces: WorkspaceFolder[] | undefined) {
        this.reconstructTree();
    }

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}
    
    getTreeItem(element: AddonTreeItem): TreeItem | Thenable<TreeItem> {
        return element;
    }

    async getChildren(element?: AddonTreeItem | undefined): Promise<AddonTreeItem[]> {
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

        await this._loadingItems;

        if (element === undefined) {
            return this.modules;
        } else {
            return element.children;
        }
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

    async loadItems(folders: WorkspaceFolder[], cancellationToken: CancellationToken): Promise<void> {
        const findManifestTasks = folders.map(f => workspace.findFiles(new RelativePattern(f, "**/manifest.json"), null, undefined, cancellationToken));      

        console.log("Finding Manifest files");
        const findResults = await Promise.all(findManifestTasks);
        const manifestUrls = (findResults).reduce((p, c) => [...p, ...c], []);
        if (cancellationToken.isCancellationRequested) {
            commands.executeCommand('setContext', 'workspaceHasMinecraftManifestJSON', false);
            return;
        }       

        console.log("Loading Manifests...");
        this.modules = ParseManifest.loadManifests(manifestUrls)

        console.log(`Located ${this.modules.length} modules`);

        commands.executeCommand('setContext', 'workspaceHasMinecraftManifestJSON', this.modules.length > 0);
    }
}