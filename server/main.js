const express = require("express")
const fetch = require("node-fetch")
const cors = require("cors")
require("dotenv").config({
  path: "../.env",
})
const app = express()
/**
 * @GOAL: create a endpoint that will capture our twitch oath token
 * @ENTPOINT:"authorize"
 * @METHOD: GET
 * @PORT: 1233
 */
let token = {}
let port = 1233

app.use(cors())
app.use(express.json())
app.get("/authorize", (req, res) => {
  token = req.body
  res.send(token)
})

app.get("/token", (req, res) => {
  res.json(token)
})

// the app will urs irc so get all the permissions we need
app.get("/login", (req, res) => {
  res.redirect(
    `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=http://localhost:${port}/authorize&response_type=token&scope=chat:edit chat:read`
  )
})

// create a proxy endpoint to pass all front end request through.
// make sure to forward all headers. handle post get delete and put requests

app.get("/proxy", async (req, res) => {
  try {
    const { url } = req.query
    const headers = req.headers
    const response = await fetch(url, {
      headers,
    })
    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.log(err)
  }
})

app.post("/proxy", async (req, res) => {
  const { url } = req.query
  const body = JSON.stringify(req.body)
  const headers = req.headers
  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  })
  const data = await response.json()
  res.json(data)
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
