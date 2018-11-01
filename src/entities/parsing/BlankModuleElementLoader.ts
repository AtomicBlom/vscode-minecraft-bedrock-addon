import { IModuleElementLoader } from "./IModuleElementLoader";
import { Uri } from "vscode";
import { AddonTreeItem } from "../TreeItems";

export class BlankModuleElementLoader implements IModuleElementLoader {
    load(location: Uri): Promise<AddonTreeItem[]> {
        return Promise.resolve([]);
    }
}