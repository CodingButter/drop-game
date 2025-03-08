const fs = require("fs")
const path = require("path")

/**
 * Creates a version banner in the build output
 */
async function createVersionBanner() {
  try {
    // Read package.json to get version
    const packageJsonPath = path.join(__dirname, "../package.json")
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8")
    const packageJson = JSON.parse(packageJsonContent)

    // Create version information
    const versionInfo = {
      version: packageJson.version,
      name: packageJson.name,
      buildTime: new Date().toISOString(),
      nodeVersion: process.version,
    }

    // Ensure the public directory exists
    const publicDir = path.join(__dirname, "../public")
    try {
      fs.mkdirSync(publicDir, { recursive: true })
    } catch (error) {
      // Directory may already exist
    }

    // Write version info to a file that will be included in the build
    const versionFilePath = path.join(publicDir, "version.json")
    fs.writeFileSync(versionFilePath, JSON.stringify(versionInfo, null, 2))

    console.log(`Created version banner: v${versionInfo.version} built at ${versionInfo.buildTime}`)
    return versionInfo
  } catch (error) {
    console.error("Error creating version banner:", error)
    throw error
  }
}

// Export the function as default
module.exports = createVersionBanner
