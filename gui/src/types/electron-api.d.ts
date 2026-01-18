export type RallyOptions = {
  rounds?: number;
  a?: string;
  b?: string;
  first?: string;
  seed?: string;
  mode?: string;
};

export type ResumeRequest = {
  additionalRounds: number;
  mode?: string;
};

export type LaunchResult = {
  success: boolean;
  message?: string;
  pid?: number;
};

export type RallyStatus = {
  code: number | null;
  signal: NodeJS.Signals | null;
};

declare global {
  interface Window {
    electronAPI: {
      launchChrome: () => Promise<LaunchResult>;
      checkCdp: () => Promise<string>;
      startRally: (options?: RallyOptions) => Promise<LaunchResult>;
      stopRally: () => Promise<LaunchResult>;
      resumeRally: (options: ResumeRequest) => Promise<LaunchResult>;
      getRallyResult: () => Promise<any[] | null>;
      getLastErrorImages: () => Promise<{ errorA: string | null; errorB: string | null }>;
      onRallyLog: (callback: (line: string) => void) => () => void;
      onRallyStatus: (callback: (status: RallyStatus) => void) => () => void;
      saveFile: (content: string, filterName: string, extensions: string[]) => Promise<{ success: boolean; filePath?: string; message?: string }>;
    };
  }
}

export { };
