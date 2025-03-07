import { DisplayObject } from "../types/ddc";

export const parseDisplayPath = (path: string): DisplayObject => {
  const regex = /\\\\[?]\\DISPLAY#([A-Z]+)([A-Z0-9]+)#.*UID(\d+)#\{([^}]+)\}/;
  const match = path.match(regex);
  
  if (!match) {
    throw new Error(`Invalid display path format: ${path}`);
  }

  return {
    raw: path,
    manufacturer: match[1],
    model: match[2],
    uid: match[3],
    guid: match[4],
  };
};
