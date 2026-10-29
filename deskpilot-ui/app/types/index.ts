export interface KeyInfo {
  label?: string;
  usage?: number;
  limit?: number | null;
  is_free_tier?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}