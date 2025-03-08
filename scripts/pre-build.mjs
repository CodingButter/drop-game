// Use CommonJS require
const fs = require("fs")
const path = require("path")

// Path to scripts directory (the same directory this file is in)
const scriptsDir = __dirname

/**
 * Runs all scripts in the scripts directory except for this file
 */
async function runAllScripts() {
  try {
    console.log("🚀 Running pre-build scripts...")

    // Read all files in the scripts directory
    const files = fs.readdirSync(scriptsDir)

    // Filter for JavaScript files only, and exclude this file
    const currentFileName = path.basename(__filename)
    const scriptFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return (
        (ext === ".js" || ext === ".mjs" || ext === ".cjs") &&
        file !== currentFileName &&
        file !== "pre-build.js"
      ) // Also exclude pre-build.js if it exists
    })

    if (scriptFiles.length === 0) {
      console.log("No scripts found in the scripts directory (excluding pre-build scripts).")
      return
    }

    console.log(`Found ${scriptFiles.length} script(s) to execute.`)

    // Run each script in sequence
    for (const file of scriptFiles) {
      const scriptPath = path.join(scriptsDir, file)
      console.log(`Executing script: ${file}`)

      try {
        // Require the script
        const scriptModule = require(scriptPath)

        // Check if it has a default export and it's a function
        const scriptFunction = scriptModule.default || scriptModule

        if (typeof scriptFunction === "function") {
          const startTime = Date.now()

          // Handle both synchronous and asynchronous functions
          const result = scriptFunction()

          // If it returns a promise, wait for it
          if (result && typeof result.then === "function") {
            await result
          }

          const executionTime = Date.now() - startTime
          console.log(`✅ Script ${file} executed successfully in ${executionTime}ms.`)
        } else {
          console.warn(`⚠️ Script ${file} does not export a function.`)
        }
      } catch (scriptError) {
        console.error(`❌ Error executing script ${file}:`, scriptError)
        // Continue with other scripts even if one fails
      }
    }

    console.log("✨ All pre-build scripts completed.")
  } catch (error) {
    console.error("❌ Failed to run pre-build scripts:", error)
    process.exit(1)
  }
}

// Run the function
runAllScripts().catch((error) => {
  console.error("❌ Unhandled error in pre-build script:", error)
  process.exit(1)
})
