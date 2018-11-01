import { Uri } from "vscode";
import { AddonTreeItem } from "../TreeItems";

export interface IModuleElementLoader {
    load(location: Uri): Promise<AddonTreeItem[]>;
    
}