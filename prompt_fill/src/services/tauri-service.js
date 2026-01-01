// src/services/tauri-service.js
import { invoke } from '@tauri-apps/api/core';

/**
 * Reads the entire application data from the local JSON file via the Rust backend.
 * @returns {Promise<object|null>} A promise that resolves to the parsed data object, or null if not found or error.
 */
export async function readDataFile() {
  try {
    // This will call the 'read_data' command in the Rust backend
    const dataString = await invoke('read_data');
    return JSON.parse(dataString);
  } catch (error) {
    console.error("Failed to read data file via Tauri:", error);
    // Return a default structure if the file doesn't exist or is corrupted
    return null;
  }
}

/**
 * Writes the entire application data to the local JSON file via the Rust backend.
 * @param {object} data - The complete data object to be saved.
 * @returns {Promise<void>}
 */
export async function writeDataFile(data) {
  try {
    // This will call the 'write_data' command in the Rust backend
    await invoke('write_data', { data: JSON.stringify(data, null, 2) });
  } catch (error) {
    console.error("Failed to write data file via Tauri:", error);
  }
}
