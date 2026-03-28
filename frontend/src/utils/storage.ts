// frontend/src/utils/storage.ts

/**
 * Persist data to localStorage as a JSON string.
 * 
 * @param key - The storage key
 * @param data - The data object to save
 */
export const saveDraft = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };
  
  /**
 * Retrieve and parse JSON data from localStorage.
 * 
 * @param key - The storage key
 * @returns Parsed data of type T, or null if missing/invalid
 */
export const getDraft = <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  };
  
  /**
 * Remove an item from localStorage.
 * 
 * @param key - The storage key to clear
 */
export const clearDraft = (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };