/**
 * System configuration from the backend
 */
export interface SystemConfig {
  coordinatedWindowMinutes: number;
  coordinatedMinWallets: number;
  excludeTokens: string[];
  minAmount: number;
  dedupBySignatureOnly: boolean;
  debugEvents: boolean;
  debugEventsVerbose: boolean;
}

/**
 * Partial config for updates
 */
export type ConfigUpdate = Partial<SystemConfig>;

/**
 * Config field metadata for form generation
 */
export interface ConfigFieldMeta {
  key: keyof SystemConfig;
  label: string;
  description: string;
  type: "number" | "boolean" | "array";
  min?: number;
  max?: number;
}

/**
 * Configuration field definitions
 */
export const CONFIG_FIELDS: ConfigFieldMeta[] = [
  {
    key: "coordinatedWindowMinutes",
    label: "Coordinated Window (Minutes)",
    description: "Time window to detect coordinated trades",
    type: "number",
    min: 1,
    max: 60,
  },
  {
    key: "coordinatedMinWallets",
    label: "Minimum Wallets",
    description: "Minimum unique wallets to trigger coordinated trade detection",
    type: "number",
    min: 2,
    max: 50,
  },
  {
    key: "minAmount",
    label: "Minimum Amount",
    description: "Minimum token amount to track transfers",
    type: "number",
    min: 0,
  },
  {
    key: "dedupBySignatureOnly",
    label: "Dedup by Signature Only",
    description: "Deduplicate transfers by signature only (ignore other fields)",
    type: "boolean",
  },
  {
    key: "debugEvents",
    label: "Debug Events",
    description: "Enable debug logging for events",
    type: "boolean",
  },
  {
    key: "debugEventsVerbose",
    label: "Verbose Debug",
    description: "Enable verbose debug logging (more detailed)",
    type: "boolean",
  },
];
