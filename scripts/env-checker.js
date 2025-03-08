const fs = require("fs")
const path = require("path")

/**
 * Validates that all required environment variables are present
 * and creates a .env.example file if it doesn't exist
 */
async function checkEnvironmentVariables() {
  try {
    console.log("Checking environment variables...")

    const rootDir = path.join(__dirname, "..")
    const envPath = path.join(rootDir, ".env")
    const exampleEnvPath = path.join(rootDir, ".env.example")

    // Check if .env file exists
    let envExists = false
    try {
      fs.accessSync(envPath)
      envExists = true
    } catch {
      console.log("No .env file found")
    }

    // Required variables that should be defined
    const requiredVariables = [
      "VITE_OAUTH_TOKEN",
      "VITE_DEFAULT_CHANNEL",
      "VITE_DEFAULT_NICK",
      "VITE_DEFAULT_SERVER",
    ]

    // Check for missing variables if .env exists
    if (envExists) {
      const envContent = fs.readFileSync(envPath, "utf-8")
      const definedVariables = envContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => line.split("=")[0])

      const missingVariables = requiredVariables.filter(
        (variable) => !definedVariables.includes(variable)
      )

      if (missingVariables.length > 0) {
        console.log("Missing required environment variables:")
        missingVariables.forEach((variable) => {
          console.log(`  - ${variable}`)
        })
      } else {
        console.log("All required environment variables are defined")
      }
    }

    // Create or update .env.example
    let exampleEnvContent = "# Example environment variables for this application\n\n"
    requiredVariables.forEach((variable) => {
      exampleEnvContent += `${variable}=\n`
    })

    fs.writeFileSync(exampleEnvPath, exampleEnvContent)
    console.log(".env.example file created/updated")

    return {
      envExists,
      requiredVariables,
    }
  } catch (error) {
    console.error("Error checking environment variables:", error)
    throw error
  }
}

module.exports = checkEnvironmentVariables
