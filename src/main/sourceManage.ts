/**
 * 管理订阅源相关
 * 新增或删除订阅源。并且负责持久化到存储中
 */
import { OpmlOutline, OpmlObject } from "./opmlUtil";
import { readOpmlFromFile, dumpOpmlToFile } from "./opmlUtil";

const DEFAULT_FOLDER = "__rss_client_default__";

class Source {
  url: string;
  name: string = "";
  folder: string = "";

  constructor(url: string, name?: string, folder?: string) {
    this.url = url;
    if (name) {
      this.name = name;
    }
    if (folder) {
      this.folder = folder;
    }
  }
}

class Folder {
  name: string;
  sourceArray: Source[] = [];

  constructor(name: string) {
    this.name = name;
  }

  addSource(url: string): void;
  addSource(source: Source): void;
  addSource(value: string | Source): void {
    let source: Source;
    if (typeof value === "string") {
      source = new Source(value);
    } else {
      source = value;
    }
    source.folder = this.name;
    this.sourceArray.push(source);
  }

  removeSource(name: string): void;
  removeSource(index: number): void;
  removeSource(source: Source): void;
  removeSource(value: string | number | Source): void {
    if (typeof value === "string") {
      const index = this.sourceArray.findIndex(source => source.name === value);
      if (index === -1) {
        throw new Error(`source of name 【${value}】not exists!`);
      }
      this.sourceArray.splice(index, 1);
    } else if (typeof value === "number") {
      if (value >= this.sourceArray.length) {
        throw new Error(`index of sourceArray 【${value}】is out of range!`);
      }
      this.sourceArray.splice(value, 1);
    } else {
      const index = this.sourceArray.findIndex(source => source.name === value.name);
      if (index === -1) {
        throw new Error(`source of name 【${value.name}】is not in sourceArray!`);
      }
      this.sourceArray.splice(index, 1);
    }
  }
}

class SourceManage {
  folderMap: Record<string, Folder | null> = {};

  constructor() {
    this.init();
  }

  init() {
    this.folderMap = {
      [DEFAULT_FOLDER]: new Folder(DEFAULT_FOLDER)
    };
  }

  addFolder(folder: Folder): void;
  addFolder(name: string): void;
  addFolder(value: string | Folder): void {
    if (typeof value === "string") {
      this.folderMap[value] = new Folder(value);
    } else {
      this.folderMap[value.name] = value;
    }
  }

  getFolder(name: string): Folder | null {
    return this.folderMap[name];
  }

  getDefaultFolder(): Folder {
    return this.folderMap[DEFAULT_FOLDER]!;
  }

  deleteFolder(name: string): void;
  deleteFolder(folder: Folder): void;
  deleteFolder(value: string | Folder): void {
    if (typeof value === "string") {
      if (!this.folderMap[value]) {
        throw new Error(`folder 【${value}】 not exist!`);
      }
      delete this.folderMap[value];
    } else {
      delete this.folderMap[value.name];
    }
  }

  dump(): OpmlObject {
    const opmlObject = new OpmlObject();
    opmlObject.title = "feedOpml";
    Object.keys(this.folderMap).forEach(folderName => {
      const sourceArray = this.folderMap[folderName]!.sourceArray;
      const outline = new OpmlOutline();
      if (folderName !== DEFAULT_FOLDER) {
        outline.text = folderName;
        outline.title = folderName;
        sourceArray.forEach(item => {
          const subOutline = new OpmlOutline(item.name, item.name, [], "rss", item.url, item.url);
          outline.addOutline(subOutline);
        });
        opmlObject.addOutline(outline);
      } else {
        sourceArray.forEach(item => {
          const subOutline = new OpmlOutline(item.name, item.name, [], "rss", item.url, item.url);
          opmlObject.addOutline(subOutline);
        });
      }
    });
    return opmlObject;
  }

  convertOutlineToSource(outline: OpmlOutline, folder?: Folder): Source {
    const url = outline.getUrl();
    const name = outline.getName();
    const source = new Source(url, name);
    if (folder) {
      source.folder = folder.name;
    }
    return source;
  }

  load(opmlObject: OpmlObject) {
    this.init();
    const outlines = opmlObject.outline;
    outlines.forEach(item => {
      if (item.type === "rss") {
        // 根目录的rss节点直接挂载默认目录里面
        const source = this.convertOutlineToSource(item, this.folderMap[DEFAULT_FOLDER]!);
        this.folderMap[DEFAULT_FOLDER]!.sourceArray.push(source);
      } else {
        this.folderMap[item.getName()] = new Folder(item.getName());
        item.subOutlines.forEach(subItem => {
          const source = this.convertOutlineToSource(subItem, this.folderMap[item.getName()]!);
          this.folderMap[item.getName()]!.sourceArray.push(source);
        });
      }
    });
  }

  async loadFromFile(filename: string) {
    const opmlObject = await readOpmlFromFile(filename);
    this.load(opmlObject);
  }

  async saveToFile(filename: string) {
    const opmlObject = this.dump();
    await dumpOpmlToFile(opmlObject, filename);
  }
}
