/**
 * Utility functions for message handling
 */

// Counter to ensure unique IDs even when created in the same millisecond
let messageCounter = 0

/**
 * Generates a unique ID for messages
 * Combines timestamp with a counter to ensure uniqueness
 */
export const generateUniqueId = (): string => {
  const timestamp = Date.now()
  const uniqueId = `${timestamp}-${messageCounter++}`
  return uniqueId
}
