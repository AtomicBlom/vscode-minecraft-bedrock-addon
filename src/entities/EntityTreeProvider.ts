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
import { ParseManifest, InvalidManifest, MinecraftManifest } from "./parsing/ParseManifest";
import { ParseModules, MinecraftModule } from "./parsing/ParseModules";
import { IMinecraftElement, EntityTreeNode } from "./MinecraftManifest";



export class EntityTreeProvider implements TreeDataProvider<EntityTreeNode> {
    private _onDidChangeTreeData: EventEmitter<EntityTreeNode | undefined> = new EventEmitter<EntityTreeNode | undefined>();
	readonly onDidChangeTreeData: Event<EntityTreeNode | undefined> = this._onDidChangeTreeData.event;   

    private _loadingItems : Promise<void> | null = null;
    private _cancelLoadingItems: CancellationTokenSource | null = null;
    modules: EntityTreeNode[] = [];
    locatedElements: Map<string, IMinecraftElement> = new Map<string, IMinecraftElement>();

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

        if (element === undefined) {
            return this.modules;
        } else {
            return [];
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
        const locatedElements = new Map<string, IMinecraftElement>();
        const manifests = ParseManifest.loadManifests(locatedElements, manifestUrls)
        this.modules = 
            [
                ...this.createModuleEntityNodes(ParseModules.loadModules(locatedElements, manifests.filter(this.isValidManifest))),
                ...this.createInvalidManifestModuleEntityNodes(manifests.filter(this.isInvalidManifest))
            ];
        this.locatedElements = locatedElements;

        for (const element of locatedElements) {
            console.log(`${element[0]} - ${element[1].fsLocation}`)
        }

        console.log(`Located ${this.modules.length} manifests`);

        commands.executeCommand('setContext', 'workspaceHasMinecraftManifestJSON', this.modules.length > 0);
    }
    private createInvalidManifestModuleEntityNodes(manifests: InvalidManifest[]) {
        return manifests.map(
            m => new EntityTreeNode(
                "Invalid Module",
                m.fsLocation.toString(),
                ResourceName.InvalidManifest,
                TreeItemCollapsibleState.None
            )
        );
    }

    private createModuleEntityNodes(modules: MinecraftModule[]) {
        return modules.map(
            m => new EntityTreeNode(
                m.label,
                m.description,
                m.icon,
                TreeItemCollapsibleState.None
            )
        );
    }

    private isValidManifest(manifest: MinecraftManifest | InvalidManifest): manifest is MinecraftManifest {
        return (<MinecraftManifest>manifest).format_version !== undefined;
    }

    private isInvalidManifest(manifest: MinecraftManifest | InvalidManifest): manifest is InvalidManifest {
        return (<InvalidManifest>manifest).errors !== undefined;
    }
}