import { IModuleElementLoader } from "./IModuleElementLoader";
import { Uri } from "vscode";
import { AddonTreeItem, NotImplementedTreeItem } from "../TreeItems";
export class ResourceModuleElementLoader implements IModuleElementLoader {
    load(location: Uri): Promise<AddonTreeItem[]> {

        

        return Promise.resolve([new NotImplementedTreeItem()]);
    }
}