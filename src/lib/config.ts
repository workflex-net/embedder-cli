// Configuration management

export interface AppConfig {
  apiUrl: string;
  webUrl: string;
  environment: string;
  debug: boolean;
  version: string;
}

const defaults: AppConfig = {
  apiUrl: "https://api.embedder.dev",
  webUrl: "https://embedder.dev",
  environment: process.env.NODE_ENV ?? "production",
  debug: process.env.DEBUG === "true",
  version: "0.0.0",
};

/** Primary config object (OC) */
export const OC: AppConfig = { ...defaults };

export function loadConfig(overrides?: Partial<AppConfig>): AppConfig {
  if (overrides) {
    Object.assign(OC, overrides);
  }
  return OC;
}

export default OC;
