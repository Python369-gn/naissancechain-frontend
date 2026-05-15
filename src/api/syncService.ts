import apiClient from "./axios";

const QUEUE_KEY = "naissancechain_sync_queue";
const CACHE_KEY = "naissancechain_records_cache";

export const syncService = {
  /**
   * Add an item to the sync queue
   */
  addToQueue: (data: any) => {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    queue.push({
      id: Date.now(),
      data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log("Record added to sync queue (offline mode)");
  },

  /**
   * Get all items in the sync queue
   */
  getQueue: () => {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  },

  /**
   * Process the sync queue
   */
  processQueue: async () => {
    const queue = syncService.getQueue();
    if (queue.length === 0) return;

    console.log(`Processing sync queue: ${queue.length} items...`);
    const remainingQueue = [];

    for (const item of queue) {
      try {
        await apiClient.post("/enregistrements", item.data);
        console.log(`Successfully synced item ${item.id}`);
      } catch (err) {
        console.error(`Failed to sync item ${item.id}:`, err);
        remainingQueue.push(item);
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    
    if (remainingQueue.length === 0) {
      console.log("Sync completed successfully!");
    }
  },

  /**
   * Cache records for offline viewing
   */
  cacheRecords: (records: any[]) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(records));
  },

  /**
   * Get cached records
   */
  getCachedRecords: () => {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
  },

  /**
   * Check if online and process queue
   */
  init: () => {
    // Process on load if online
    if (navigator.onLine) {
      syncService.processQueue();
    }

    // Listen for online event
    window.addEventListener("online", () => {
      console.log("Back online! Starting synchronization...");
      syncService.processQueue();
    });

    // Optional: periodic check
    setInterval(() => {
      if (navigator.onLine) {
        syncService.processQueue();
      }
    }, 30000); // every 30 seconds
  }
};
