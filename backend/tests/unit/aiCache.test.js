import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BoundedTtlCache } from '../../src/ai/cache.js';

describe('BoundedTtlCache', () => {
  let cache;

  beforeEach(() => {
    cache = new BoundedTtlCache(1000, 3); // 1000ms TTL, max 3 entries
  });

  it('should store and retrieve values correctly', () => {
    cache.set('key1', { value: 'data1' });
    expect(cache.get('key1')).toEqual({ value: 'data1' });
    expect(cache.size).toBe(1);
  });

  it('should return null for non-existent or deleted keys', () => {
    cache.set('key1', 'data1');
    cache.delete('key1');
    expect(cache.get('key1')).toBeNull();
  });

  it('should expire entries after TTL', async () => {
    vi.useFakeTimers();
    cache.set('key1', 'data1');

    expect(cache.get('key1')).toBe('data1');

    // Advance time past 1000ms TTL
    vi.advanceTimersByTime(1001);

    expect(cache.get('key1')).toBeNull();
    vi.useRealTimers();
  });

  it('should evict oldest entry when capacity limit is reached', () => {
    cache.set('key1', 'val1');
    cache.set('key2', 'val2');
    cache.set('key3', 'val3');
    expect(cache.size).toBe(3);

    // Adding 4th item should evict key1
    cache.set('key4', 'val4');
    expect(cache.size).toBe(3);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key4')).toBe('val4');
  });

  it('should clear all entries', () => {
    cache.set('key1', 'val1');
    cache.set('key2', 'val2');
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
