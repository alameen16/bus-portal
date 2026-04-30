/**
 * utils/db.js — Simple JSON File Database
 *
 * Since we're not using a real database like MongoDB or PostgreSQL,
 * we store all data in JSON files inside the /data folder.
 *
 * These two functions let us READ and WRITE those files easily
 * from anywhere in the backend.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get the current folder path (needed in ES modules)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to the data folder
const DATA_DIR = join(__dirname, "../data");

/**
 * readDB(filename)
 * Reads a JSON file and returns the parsed array/object.
 *
 * Example: readDB("users") → reads /data/users.json → returns array of users
 */
export function readDB(filename) {
  const filePath = join(DATA_DIR, `${filename}.json`);
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

/**
 * writeDB(filename, data)
 * Converts data to JSON and saves it to a file.
 *
 * Example: writeDB("users", updatedUsers) → saves to /data/users.json
 */
export function writeDB(filename, data) {
  const filePath = join(DATA_DIR, `${filename}.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
