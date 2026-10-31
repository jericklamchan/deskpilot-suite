export interface ModelOption {
  id: string;
  name: string;
  provider: 'Anthropic' | 'OpenAI' | 'xAI' | 'Google' | 'Meta';
  description?: string;
}

export const SUPPORTED_MODELS: readonly ModelOption[] = [
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Auto-Router',
    provider: 'OpenAI',
    description: 'Automatically routes to active free models.',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Advanced reasoning and coding performance.',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'High-speed multimodal flagship model.',
  },
  {
    id: 'x-ai/grok-4.7',
    name: 'Grok 4.7',
    provider: 'xAI',
    description: 'Flagship xAI reasoning model on OpenRouter.',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'Meta',
    description: 'Free open-weight model with strong tool execution.',
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini Flash 2.0 (Free)',
    provider: 'Google',
    description: 'Ultra-fast free reasoning model.',
  },
] as const;

export type ModelId = (typeof SUPPORTED_MODELS)[number]['id'];