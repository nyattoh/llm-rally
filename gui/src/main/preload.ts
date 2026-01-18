import { contextBridge, ipcRenderer } from "electron";

type RallyOptions = {
  rounds?: number;
  a?: string;
  b?: string;
  first?: string;
  seed?: string;
  mode?: string;
};

type ResumeRequest = {
  additionalRounds: number;
  mode?: string;
};

type LaunchResult = {
  success: boolean;
  message?: string;
  pid?: number;
};

type RallyStatus = { code: number | null; signal: NodeJS.Signals | null };

const createListener = <T>(channel: string, callback: (payload: T) => void) => {
  const listener = (_event: unknown, payload: T) => {
    callback(payload);
  };
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld("electronAPI", {
  launchChrome: () => ipcRenderer.invoke("launch-chrome"),
  checkCdp: () => ipcRenderer.invoke("check-cdp"),
  startRally: (options?: RallyOptions) => ipcRenderer.invoke("start-rally", options ?? {}),
  stopRally: () => ipcRenderer.invoke("stop-rally"),
  resumeRally: (options: ResumeRequest) => ipcRenderer.invoke("resume-rally", options),
  getRallyResult: () => ipcRenderer.invoke("get-rally-result"),
  getLastErrorImages: () => ipcRenderer.invoke("get-last-error-image"),
  onRallyLog: (callback: (line: string) => void) => createListener<string>("rally-log", callback),
  onRallyStatus: (callback: (status: RallyStatus) => void) => createListener<RallyStatus>("rally-status", callback),
  saveFile: (content: string, filterName: string, extensions: string[]) => ipcRenderer.invoke("save-file", { content, filterName, extensions })
});
