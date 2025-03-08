const fs = require("fs")
const path = require("path")
const { promisify } = require("util")

// Convert callback-based fs functions to Promise-based
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const unlink = promisify(fs.unlink)
const rmdir = promisify(fs.rmdir)
const mkdir = promisify(fs.mkdir)

/**
 * Cleans the dist directory before a new build
 */
async function cleanDistDirectory() {
  try {
    const distDir = path.join(__dirname, "../dist")

    console.log("Cleaning dist directory...")

    // Check if dist directory exists
    try {
      fs.accessSync(distDir)

      // Remove all files and subdirectories in dist
      const entries = await readdir(distDir)

      for (const entry of entries) {
        const fullPath = path.join(distDir, entry)

        const stats = await stat(fullPath)

        if (stats.isDirectory()) {
          // Delete directory recursively
          await deleteDirRecursive(fullPath)
          console.log(`Removed directory: ${entry}`)
        } else {
          // Delete file
          await unlink(fullPath)
          console.log(`Removed file: ${entry}`)
        }
      }

      console.log("Dist directory cleaned successfully")
    } catch (error) {
      // If directory doesn't exist, create it
      if (error.code === "ENOENT") {
        await mkdir(distDir, { recursive: true })
        console.log("Dist directory created")
      } else {
        throw error
      }
    }

    return { cleaned: true }
  } catch (error) {
    console.error("Error cleaning dist directory:", error)
    throw error
  }
}

/**
 * Helper function to recursively delete a directory
 */
async function deleteDirRecursive(dirPath) {
  try {
    const entries = await readdir(dirPath)

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry)
      const stats = await stat(fullPath)

      if (stats.isDirectory()) {
        await deleteDirRecursive(fullPath)
      } else {
        await unlink(fullPath)
      }
    }

    await rmdir(dirPath)
  } catch (error) {
    console.error(`Error deleting directory ${dirPath}:`, error)
    throw error
  }
}

module.exports = cleanDistDirectory
