import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi, useMutation } from '@/lib/useApi';

describe('useApi and useMutation Hooks Tests', () => {
  it('should fetch data on mount and handle success', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({ status: 'ok', count: 42 });
    const { result } = renderHook(() => useApi(mockFetcher));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual({ status: 'ok', count: 42 });
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    const mockFetcher = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useApi(mockFetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Network error');
    });
  });

  it('should execute mutation and return result', async () => {
    const mockMutator = vi.fn().mockResolvedValue({ id: 'res-1' });
    const { result } = renderHook(() => useMutation(mockMutator));

    expect(result.current.loading).toBe(false);

    let mutationResult;
    await act(async () => {
      mutationResult = await result.current.execute({ name: 'test' });
    });

    expect(mockMutator).toHaveBeenCalledWith({ name: 'test' });
    expect(mutationResult).toEqual({ id: 'res-1' });
  });
});
