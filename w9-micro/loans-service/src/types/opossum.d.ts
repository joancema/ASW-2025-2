/**
 * Type definitions for opossum Circuit Breaker library
 */

declare module 'opossum' {
  interface Options {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    volumeThreshold?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    name?: string;
    rollingPercentilesEnabled?: boolean;
    capacity?: number;
    errorFilter?: (error: Error) => boolean;
    cache?: boolean;
    cacheTTL?: number;
  }

  interface Stats {
    failures: number;
    fallbacks: number;
    successes: number;
    rejects: number;
    fires: number;
    timeouts: number;
    cacheHits: number;
    cacheMisses: number;
    semaphoreRejections: number;
    percentiles: { [key: string]: number };
    latencyTimes: number[];
    latencyMean: number;
  }

  class CircuitBreaker<TArgs extends unknown[] = unknown[], TReturn = unknown> {
    constructor(
      action: (...args: TArgs) => Promise<TReturn>,
      options?: Options,
    );

    readonly name: string;
    readonly options: Options;
    readonly stats: Stats;
    readonly opened: boolean;
    readonly closed: boolean;
    readonly halfOpen: boolean;

    fire(...args: TArgs): Promise<TReturn>;
    fallback(func: (...args: TArgs) => TReturn): this;
    
    on(event: 'success', listener: (result: TReturn) => void): this;
    on(event: 'timeout', listener: () => void): this;
    on(event: 'reject', listener: () => void): this;
    on(event: 'open', listener: () => void): this;
    on(event: 'halfOpen', listener: () => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'fallback', listener: (result: TReturn) => void): this;
    on(event: 'failure', listener: (error: Error) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    clearCache(): void;
    open(): void;
    close(): void;
    disable(): void;
    enable(): void;
    shutdown(): void;
  }

  export default CircuitBreaker;
  export { Options, Stats };
}
