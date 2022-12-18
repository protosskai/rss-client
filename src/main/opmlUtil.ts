import { promises as fs } from "fs";
import xml2js from "xml2js";
import { FALSE } from "sass";

export class OpmlOutline {
  title: string = "";
  text: string = "";
  subOutlines: OpmlOutline[] = [];
  type?: "rss" | "folder" | null = null;
  xmlUrl?: string | null = null;
  htmlUrl?: string | null = null;

  constructor(title?: string, text?: string, subOutlines?: OpmlOutline[], type?: "rss" | null, xmlUrl?: string | null, htmlUrl?: string | null) {
    if (title) {
      this.title = title;
    }
    if (text) {
      this.text = text;
    }
    if (subOutlines) {
      this.subOutlines = subOutlines;
    }
    if (type) {
      this.type = type;
    }
    if (xmlUrl) {
      this.xmlUrl = xmlUrl;
    }
    if (htmlUrl) {
      this.htmlUrl = htmlUrl;
    }
  }

  addOutline(outline: OpmlOutline) {
    const target = this.subOutlines.find((item => item.text === outline.text));
    if (target) {
      throw new Error("outline exist!");
    }
    this.subOutlines.push(outline);
  }

  getName(): string {
    let name: string | null = null;
    if (this.text) {
      name = this.text;
    }
    if (this.title) {
      name = this.title;
    }
    if (name === null) {
      throw new Error("text and title invalid!");
    }
    return name;
  }

  getUrl(): string {
    let url: string | null = null;
    if (this.xmlUrl) {
      url = this.xmlUrl;
    }
    if (this.htmlUrl) {
      url = this.htmlUrl;
    }
    if (url === null) {
      throw new Error("xmlUrl and htmlUrl invalid!");
    }
    return url;
  }
}

export class OpmlObject {
  title: string = "";
  outline: OpmlOutline[] = [];

  constructor(title?: string, outline?: OpmlOutline[]) {
    if (title) {
      this.title = title;
    }
    if (outline) {
      this.outline = outline;
    }
  }

  addOutline(outline: OpmlOutline) {
    const target = this.outline.find((item => item.text === outline.text));
    if (target) {
      throw new Error("outline exist!");
    }
    this.outline.push(outline);
  }
}

function buildOpmlOutline(jsonData: any): OpmlOutline {
  const outline = new OpmlOutline();
  if (jsonData.$.hasOwnProperty("title")) {
    outline.title = jsonData.$.title;
  }
  if (jsonData.$.hasOwnProperty("text")) {
    outline.text = jsonData.$.text;
  }
  if (jsonData.$.hasOwnProperty("type") && jsonData.$["type"] === "rss") {
    outline.text = "rss";
  }
  if (jsonData.$.hasOwnProperty("xmlUrl")) {
    outline.xmlUrl = jsonData.$.xmlUrl;
  }
  if (jsonData.$.hasOwnProperty("htmlUrl")) {
    outline.htmlUrl = jsonData.$.htmlUrl;
  }
  if (jsonData.hasOwnProperty("outline")) {
    jsonData.outline.forEach((item: any) => {
      outline.subOutlines.push(buildOpmlOutline(item));
    });
  }
  if (outline.subOutlines.length > 0 && outline.type === null) {
    outline.type = "folder";
  }
  return outline;
}

function buildOpmlObject(title: string, outlines: object[]): OpmlObject {
  const opmlObject = new OpmlObject();
  opmlObject.title = title;
  outlines.forEach((item: any) => {
    opmlObject.outline.push(buildOpmlOutline(item));
  });
  return opmlObject;
}

export async function readOpmlFromFile(filename: string): Promise<OpmlObject> {
  const data = await fs.readFile(filename);
  return new Promise<OpmlObject>((resolve, reject) => {
    xml2js.parseString(data, (err, result) => {
      if (err) {
        reject(err);
      }
      if (!result.hasOwnProperty("opml")) {
        reject("invalid opml format file, [opml] valid!");
      }
      const opml = result["opml"];
      if (!opml.hasOwnProperty("head") || !opml.hasOwnProperty("body")) {
        reject("invalid opml format file, [head] valid!");
      }
      const head = opml["head"];
      let title: string | null = null;
      head.forEach((item: any) => {
        if (item.hasOwnProperty("title")) {
          title = item["title"];
        }
      });
      if (title === null) {
        reject("invalid opml format file, [title] is null");
      }
      const body = opml["body"];
      let outline: object[] | null = null;
      body.forEach((item: any) => {
        if (item.hasOwnProperty("outline")) {
          outline = item["outline"];
        }
      });
      if (outline === null) {
        reject("invalid opml format file, [outline] is null");
      }
      const opmlObject = buildOpmlObject(title!, outline!);
      // console.log(JSON.stringify(opmlObject, null, 4));
      resolve(opmlObject);
    });
  });
}

function dumpOpmlOutline(outline: OpmlOutline) {
  const result: any = { $: {} };
  if (outline.title) {
    result.$.title = outline.title;
  }
  if (outline.text) {
    result.$.text = outline.text;
  }
  if (outline.type === "rss") {
    result.$.type = outline.type;
  }
  if (outline.xmlUrl) {
    result.$.xmlUrl = outline.xmlUrl;
  }
  if (outline.htmlUrl) {
    result.$.htmlUrl = outline.htmlUrl;
  }
  if (outline.subOutlines.length > 0) {
    result.outline = [];
    outline.subOutlines.forEach((item) => {
      result.outline.push(dumpOpmlOutline(item));
    });
  }
  return result;
}

export async function dumpOpmlToFile(opmlObject: OpmlObject, filename: string): Promise<void> {
  const result: any = {
    opml: {
      $: {
        version: "1.0"
      }
    }
  };
  if (opmlObject.title) {
    result.opml["head"] = [];
    result.opml["head"].push({
      title: opmlObject.title
    });
  }
  if (opmlObject.outline.length > 0) {
    result.opml["body"] = [{ outline: [] }];
    opmlObject.outline.forEach((item) => {
      result.opml["body"][0]["outline"].push(dumpOpmlOutline(item));
    });
  }
  const builder = new xml2js.Builder();
  const xml = builder.buildObject(result);
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(filename, xml).then(() => {
      resolve();
    }).catch((err) => reject(err));
  });
}

async function test() {
  const opmlObj = await readOpmlFromFile("a.txt");
  const dumpObj = await dumpOpmlToFile(opmlObj, "b.opml");
}


test();




