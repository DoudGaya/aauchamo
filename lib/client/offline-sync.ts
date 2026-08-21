"use client";

import { useEffect, useState } from "react";
import { get, set } from "idb-keyval";

export type OfflineTransaction = {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body: any;
  createdAt: string;
  retries: number;
};

const QUEUE_STORAGE_KEY = "aau_chamo_offline_outbox_v2";

export async function getOfflineQueue(): Promise<OfflineTransaction[]> {
  if (typeof window === "undefined") return [];
  try {
    const data = await get<OfflineTransaction[]>(QUEUE_STORAGE_KEY);
    return data || [];
  } catch {
    return [];
  }
}

export async function saveOfflineQueue(queue: OfflineTransaction[]): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await set(QUEUE_STORAGE_KEY, queue);
    window.dispatchEvent(new Event("aau_offline_queue_updated"));
  } catch {
    // Ignore storage quota errors
  }
}

export async function enqueueOfflineTransaction(url: string, method: string, body: any, headers?: Record<string, string>): Promise<OfflineTransaction> {
  const queue = await getOfflineQueue();
  const tx: OfflineTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    url,
    method,
    headers,
    body,
    createdAt: new Date().toISOString(),
    retries: 0,
  };
  queue.push(tx);
  await saveOfflineQueue(queue);
  return tx;
}

export async function processOfflineQueue(): Promise<{ succeeded: number; failed: number }> {
  const queue = await getOfflineQueue();
  if (!queue.length) return { succeeded: 0, failed: 0 };

  let succeeded = 0;
  let failed = 0;
  const remainingQueue: OfflineTransaction[] = [];

  for (const tx of queue) {
    try {
      const response = await fetch(tx.url, {
        method: tx.method,
        headers: tx.headers || { "content-type": "application/json" },
        body: typeof tx.body === "string" ? tx.body : JSON.stringify(tx.body),
      });

      if (response.ok) {
        succeeded++;
      } else {
        // Retry logic up to 5 times
        if (tx.retries < 5) {
          remainingQueue.push({ ...tx, retries: tx.retries + 1 });
        }
        failed++;
      }
    } catch {
      // Still offline or network glitch
      remainingQueue.push(tx);
      failed++;
    }
  }

  await saveOfflineQueue(remainingQueue);
  return { succeeded, failed };
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const updateState = async () => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const queue = await getOfflineQueue();
      setQueueCount(queue.length);
    }
  };

  useEffect(() => {
    updateState();

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      await processOfflineQueue();
      setIsSyncing(false);
      await updateState();
    };

    const handleOffline = async () => {
      setIsOnline(false);
      await updateState();
    };

    const handleQueueUpdate = async () => {
      await updateState();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("aau_offline_queue_updated", handleQueueUpdate);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("aau_offline_queue_updated", handleQueueUpdate);
    };
  }, []);

  const triggerManualSync = async () => {
    setIsSyncing(true);
    const result = await processOfflineQueue();
    setIsSyncing(false);
    await updateState();
    return result;
  };

  return {
    isOnline,
    queueCount,
    isSyncing,
    triggerManualSync,
  };
}

const CACHE_STORAGE_KEY = "aau_chamo_offline_cache_v2";

export async function fetchWithOfflineCache<T>(url: string, defaultData: T): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    
    // Save to cache
    const cache = (await get<Record<string, any>>(CACHE_STORAGE_KEY)) || {};
    cache[url] = data;
    await set(CACHE_STORAGE_KEY, cache);
    
    return data;
  } catch (error) {
    // If offline or fetch fails, try to return from cache
    const cache = await get<Record<string, any>>(CACHE_STORAGE_KEY);
    if (cache && cache[url]) {
      return cache[url] as T;
    }
    return defaultData;
  }
}
