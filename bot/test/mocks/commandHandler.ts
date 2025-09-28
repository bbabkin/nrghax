import { vi } from 'vitest';

export const setupCommandHandler = vi.fn((client) => {
  client.on('interactionCreate', vi.fn());
  return {
    commands: new Map(),
    handleCommand: vi.fn(),
    handleAutocomplete: vi.fn(),
    deployCommands: vi.fn(),
  };
});

export const CommandHandler = vi.fn(() => ({
  commands: new Map(),
  handleCommand: vi.fn(),
  handleAutocomplete: vi.fn(),
  deployCommands: vi.fn(),
}));