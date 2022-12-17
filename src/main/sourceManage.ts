/**
 * 管理订阅源相关
 * 新增或删除订阅源。并且负责持久化到存储中
 */

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
    this.folderMap["default"] = new Folder("default");
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

  loadFromFile(filename: string) {
  }

  saveToFile(filename: string) {
  }
}
