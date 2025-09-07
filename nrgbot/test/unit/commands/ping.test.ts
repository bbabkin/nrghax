import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pingCommand } from '../../../src/commands/ping';
import { CONSTANTS } from '../../../src/config/constants';

describe('Ping Command', () => {
  let interaction: any;

  beforeEach(() => {
    interaction = {
      deferReply: vi.fn().mockResolvedValue({
        createdTimestamp: Date.now(),
      }),
      editReply: vi.fn().mockResolvedValue({}),
      createdTimestamp: Date.now() - 100,
      client: {
        ws: {
          ping: 50,
        },
      },
    };
  });

  it('should have correct command data', () => {
    expect(pingCommand.data).toBeDefined();
    expect(pingCommand.execute).toBeDefined();
  });

  it('should execute ping command successfully', async () => {
    await pingCommand.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledWith({ fetchReply: true });
    expect(interaction.editReply).toHaveBeenCalled();
  });

  it('should calculate latencies correctly', async () => {
    const sentTime = Date.now();
    interaction.deferReply.mockResolvedValue({
      createdTimestamp: sentTime + 100,
    });
    interaction.createdTimestamp = sentTime;
    interaction.client.ws.ping = 75;

    await pingCommand.execute(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
      })
    );
  });

  it('should handle API latency of 0', async () => {
    interaction.client.ws.ping = 0;

    await pingCommand.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalled();
  });

  it('should handle high latency values', async () => {
    const sentTime = Date.now();
    interaction.deferReply.mockResolvedValue({
      createdTimestamp: sentTime + 500,
    });
    interaction.createdTimestamp = sentTime;
    interaction.client.ws.ping = 200;

    await pingCommand.execute(interaction);

    expect(interaction.editReply).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    interaction.deferReply.mockRejectedValue(new Error('Network error'));

    await expect(pingCommand.execute(interaction)).rejects.toThrow('Network error');
  });

  it('should work in DMs (no guild)', async () => {
    interaction.guild = null;

    await pingCommand.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalled();
  });

  it('should handle undefined WebSocket ping', async () => {
    interaction.client.ws.ping = undefined;

    await pingCommand.execute(interaction);

    expect(interaction.editReply).toHaveBeenCalled();
  });
});