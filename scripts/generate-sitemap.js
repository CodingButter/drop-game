const fs = require("fs")
const path = require("path")

/**
 * Generates a sitemap.xml by recursively scanning the pages directory
 */
async function generateSitemap() {
  try {
    console.log("Generating sitemap.xml from pages directory...")

    // Base URL for your site - in a real app this should come from env variables
    const baseUrl = "https://example.com" // Replace with your actual domain

    // Path to pages directory
    const pagesDir = path.join(__dirname, "../src/pages")

    // Get all routes by recursively scanning the pages directory
    const routes = scanPagesDirectory(pagesDir)

    console.log(`Found ${routes.length} routes from pages directory`)

    // Create sitemap XML content
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    // Add each route to the sitemap
    routes.forEach((route) => {
      sitemap += "  <url>\n"
      sitemap += `    <loc>${baseUrl}${route}</loc>\n`
      sitemap += "    <lastmod>" + new Date().toISOString() + "</lastmod>\n"
      sitemap += "    <changefreq>weekly</changefreq>\n"
      sitemap += "    <priority>0.8</priority>\n"
      sitemap += "  </url>\n"
    })

    sitemap += "</urlset>"

    // Ensure the public directory exists
    const publicDir = path.join(__dirname, "../public")
    try {
      fs.accessSync(publicDir)
    } catch {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    // Write sitemap.xml to the public directory
    const sitemapPath = path.join(publicDir, "sitemap.xml")
    fs.writeFileSync(sitemapPath, sitemap)

    console.log(`Sitemap generated with ${routes.length} routes`)
    return { routeCount: routes.length, routes }
  } catch (error) {
    console.error("Error generating sitemap:", error)
    throw error
  }
}

/**
 * Recursively scans the pages directory to find all route paths
 * @param {string} dir - The directory to scan
 * @param {string} [baseRoute=''] - The base route path for the current directory
 * @returns {string[]} - Array of route paths
 */
function scanPagesDirectory(dir, baseRoute = "") {
  // Check if the directory exists
  if (!fs.existsSync(dir)) {
    console.warn(`Pages directory not found: ${dir}`)
    return []
  }

  let routes = []

  // Get all files and directories in the current directory
  const items = fs.readdirSync(dir)

  // Files that should be excluded from the sitemap
  const excludePatterns = [
    /^_/, // Files starting with underscore (e.g. _app.tsx, _document.tsx)
    /\.(test|spec|d)\./, // Test files and type declaration files
    /\.(css|scss|less|svg|png|jpg|jpeg|gif)$/, // Asset files
    /types\./, // Type files
    /util/, // Utility files
    /components?/, // Component files/folders
    /hooks/, // Hook files/folders
    /context/, // Context files/folders
    /providers?/, // Provider files/folders
    /helpers?/, // Helper files/folders
    /constants?/, // Constants files
  ]

  // Process each item in the directory
  items.forEach((item) => {
    const itemPath = path.join(dir, item)
    const stats = fs.statSync(itemPath)

    // Check if the item should be excluded
    const shouldExclude = excludePatterns.some((pattern) => pattern.test(item))

    if (shouldExclude) {
      return
    }

    if (stats.isDirectory()) {
      // Process directory - recursively scan subdirectories
      const directoryName = item
      const subRouteBase = path.join(baseRoute, directoryName)

      // Skip if this is a utility/component directory
      if (excludePatterns.some((pattern) => pattern.test(directoryName))) {
        return
      }

      const subRoutes = scanPagesDirectory(itemPath, subRouteBase)
      routes = routes.concat(subRoutes)
    } else {
      // Process file - convert to route if it's a page file
      const fileName = item

      // Only include JS/TS/JSX/TSX files
      if (!/\.(js|jsx|ts|tsx)$/.test(fileName)) {
        return
      }

      // Skip excluded files
      if (excludePatterns.some((pattern) => pattern.test(fileName))) {
        return
      }

      // Generate route based on file name
      let route = ""

      // Handle index files (they should map to the directory route)
      if (/^index\.(js|jsx|ts|tsx)$/.test(fileName)) {
        route = baseRoute
      } else {
        // Remove file extension and handle special cases
        const routeName = fileName.replace(/\.(js|jsx|ts|tsx)$/, "")

        // Handle dynamic routes (e.g., [id].tsx becomes :id in the route)
        const normalizedName = routeName.replace(/\[([^\]]+)\]/g, ":$1")

        route = path.join(baseRoute, normalizedName)
      }

      // Format the route path properly
      route = "/" + route.replace(/\\/g, "/").replace(/^\/?/, "")

      // Add to routes list if not already included and not empty
      if (route && !routes.includes(route)) {
        // Make sure root route is just '/'
        if (route === "/index") {
          route = "/"
        }

        routes.push(route)
      }
    }
  })

  return routes
}

module.exports = generateSitemap
