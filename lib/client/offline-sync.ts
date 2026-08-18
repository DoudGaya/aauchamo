"use client";

import { useEffect, useState } from "react";

export type OfflineTransaction = {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body: any;
  createdAt: string;
  retries: number;
};

const QUEUE_STORAGE_KEY = "aau_chamo_offline_outbox_v1";

export function getOfflineQueue(): OfflineTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(QUEUE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineTransaction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new Event("aau_offline_queue_updated"));
  } catch {
    // Ignore storage quota errors
  }
}

export function enqueueOfflineTransaction(url: string, method: string, body: any, headers?: Record<string, string>): OfflineTransaction {
  const queue = getOfflineQueue();
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
  saveOfflineQueue(queue);
  return tx;
}

export async function processOfflineQueue(): Promise<{ succeeded: number; failed: number }> {
  const queue = getOfflineQueue();
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

  saveOfflineQueue(remainingQueue);
  return { succeeded, failed };
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const updateState = () => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      setQueueCount(getOfflineQueue().length);
    }
  };

  useEffect(() => {
    updateState();

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      await processOfflineQueue();
      setIsSyncing(false);
      updateState();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateState();
    };

    const handleQueueUpdate = () => {
      updateState();
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
    updateState();
    return result;
  };

  return {
    isOnline,
    queueCount,
    isSyncing,
    triggerManualSync,
  };
}
