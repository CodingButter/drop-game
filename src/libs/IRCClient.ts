import EventEmitter from "./EventEmitter"

/**
 * Type definition for Twitch channels, ensuring format compliance.
 */
type Channel = `#${string}`

/**
 * Defines the structure of message tags received from Twitch IRC.
 */
type Tags = {
  "badge-info"?: string
  badges?: string
  color?: string
  "display-name"?: string
  emotes?: string
  id?: string
  mod?: string
  subscriber?: string
  turbo?: string
  "user-id"?: string
  "user-type"?: string
  "emote-sets"?: string
  [key: string]: string | undefined
}

/**
 * Defines the structure of a chat message in Twitch IRC.
 */
type ChatMessage = {
  channel: string
  tags: Tags
  message: string
  self: boolean
}

/**
 * Defines the event map for the IRCClient, ensuring type safety for event handling.
 */
interface TwitchEventMap extends Record<string, any[]> {
  open: []
  close: []
  error: [{ error: any; message: string }]
  joined: [Channel]
  left: [Channel]
  message: [ChatMessage]
  ping: [string]
  userJoined: [Channel, string]
  userLeft: [Channel, string]
  notice: [{ channel: Channel; message: string }]
  GLOBALUSERSTATE: [{ tags: Tags }]
  globalUserState: [{ emoteSets: string[]; tags: Tags }]
  roomstate: [Channel, Tags]
  debug: [string] // Added debug event
}

/**
 * Enum for Twitch IRC capabilities.
 */
enum TwitchCapabilities {
  Tags = "twitch.tv/tags",
  Commands = "twitch.tv/commands",
  Membership = "twitch.tv/membership",
}

/**
 * IRC Client for Twitch chat interaction.
 * Supports authentication, joining/leaving channels, sending messages,
 * handling events, and responding to Twitch IRC protocol messages.
 */
class IRCClient extends EventEmitter<TwitchEventMap> {
  private socket?: WebSocket
  private server: string
  private oauthToken: string
  private nick: string
  private channels: Set<Channel> = new Set()
  private messageQueue: { channel: Channel; text: string }[] = []
  private rateLimit = 20 // Twitch default rate limit for non-moderators
  private windowMs = 30 * 1000 // 30 seconds rate limit window
  private sentCount = 0
  private windowStart = Date.now()
  private capabilitiesRequested = false

  constructor(server: string, oauthToken: string, nick: string) {
    super()
    this.server = server
    this.oauthToken = oauthToken
    this.nick = nick.toLowerCase()
  }

  getNick(): string {
    return this.nick
  }

  /**
   * Sends a debug message through the event system
   */
  private debug(message: string): void {
    console.log(`[IRC Debug] ${message}`)
    this.emit("debug", message)
  }

  /**
   * Establishes a WebSocket connection to Twitch IRC.
   * Sends authentication and requests necessary capabilities.
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.server, "irc")

      this.socket.addEventListener("open", () => {
        this.debug("WebSocket connection opened, requesting capabilities")

        // Request Twitch IRC capabilities - now with explicit debug info
        const capRequest = `CAP REQ :${Object.values(TwitchCapabilities).join(" ")}`
        this.socket!.send(capRequest)
        this.debug(`Sent: ${capRequest}`)
        this.capabilitiesRequested = true

        // Authenticate with provided OAuth token
        this.socket!.send(`PASS oauth:${this.oauthToken}`)
        this.debug(`Sent: PASS oauth:****`)

        this.socket!.send(`NICK ${this.nick}`)
        this.debug(`Sent: NICK ${this.nick}`)

        this.emit("open")
        resolve()
      })

      this.socket.addEventListener("error", (err) => {
        this.debug(`WebSocket error: ${err}`)
        this.emit("error", { error: err, message: "Connection error" })
        reject(err)
      })

      this.socket.addEventListener("message", (event) => this.handleMessage(event))
      this.socket.addEventListener("close", () => {
        this.debug("WebSocket connection closed")
        this.emit("close")
      })
    })
  }

  /**
   * Explicitly request GLOBALUSERSTATE (attempt to force it)
   */
  requestGlobalUserState(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.debug("Cannot request GLOBALUSERSTATE, socket not open")
      return
    }

    // Re-request capabilities to try and trigger GLOBALUSERSTATE
    const capRequest = `CAP REQ :${Object.values(TwitchCapabilities).join(" ")}`
    this.socket.send(capRequest)
    this.debug(`Re-requested capabilities: ${capRequest}`)
  }

  /**
   * Joins one or multiple Twitch chat channels.
   * Ensures connection is established before joining.
   */
  async join(channel: Channel | Channel[]): Promise<void> {
    const channelsToJoin = Array.isArray(channel) ? channel : [channel]

    // Check if socket exists and is ready
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.debug("Socket not ready, attempting to connect first...")
      try {
        await this.connect()
      } catch (error) {
        this.debug(`Failed to connect: ${error}`)
        throw new Error(`Cannot join channel, connection failed: ${error}`)
      }

      // Double-check that connection succeeded
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        this.debug("WebSocket not in OPEN state after connection attempt")
        throw new Error("Cannot join channel, WebSocket not in OPEN state after connection attempt")
      }
    }

    // Now that we know socket is open, proceed with joining
    const channelList = channelsToJoin.map((ch) => ch.toLowerCase()).join(",")
    this.debug(`Sending JOIN command for: ${channelList}`)
    this.socket.send(`JOIN ${channelList}`)

    channelsToJoin.forEach((ch) => {
      this.channels.add(ch.toLowerCase() as Channel)
      this.emit("joined", ch)
    })
  }

  /**
   * Leaves one or multiple Twitch chat channels.
   * If no channel is specified, it leaves all joined channels.
   */
  leave(channel?: Channel | Channel[]): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return
    const channelsToLeave: Channel[] = channel
      ? Array.isArray(channel)
        ? channel
        : [channel]
      : Array.from(this.channels)
    if (channelsToLeave.length === 0) return
    const channelList = channelsToLeave.join(",")
    this.socket.send(`PART ${channelList}`)
    this.debug(`Sent PART command for: ${channelList}`)
    channelsToLeave.forEach((ch) => {
      this.channels.delete(ch)
      this.emit("left", ch)
    })
  }

  /**
   * Sends a chat message to a specified Twitch channel.
   */
  sendMessage(channel: Channel, message: string): void {
    if (!this.channels.has(channel)) {
      throw new Error(`Cannot send message, not joined to channel ${channel}`)
    }
    this.trySend(channel, message)
  }

  /**
   * Implements Twitch rate-limiting to prevent excessive message sending.
   */
  private trySend(channel: Channel, text: string) {
    const now = Date.now()
    if (now - this.windowStart > this.windowMs) {
      this.windowStart = now
      this.sentCount = 0
    }
    if (this.sentCount < this.rateLimit) {
      this.socket!.send(`PRIVMSG ${channel} :${text}`)
      this.sentCount++
    } else {
      this.messageQueue.push({ channel, text })
    }
  }

  /**
   * Handles incoming Twitch IRC messages, including PING responses and event emissions.
   */
  private handleMessage({ data }: MessageEvent) {
    const lines = data.split(/\r\n/).filter((l: string) => l.length)

    for (const line of lines) {
      this.debug(`[RAW IRC] ${line}`)

      // Handle PING messages
      if (line.startsWith("PING")) {
        const pingResponse = line.replace("PING", "PONG")
        this.socket!.send(pingResponse)
        this.emit("ping", line.split(" ")[1])
        continue
      }

      // Parse IRC message
      try {
        // Parse message components: [tags] [prefix] command [params]
        const tags: Tags = {}
        let prefix = ""
        let command = ""
        let params: string[] = []

        let position = 0

        // Parse tags if present (starts with @)
        if (line.startsWith("@")) {
          const spacePos = line.indexOf(" ")
          const tagsStr = line.slice(1, spacePos)
          position = spacePos + 1

          // Parse tags as key-value pairs
          tagsStr.split(";").forEach((tag: string) => {
            const [key, value] = tag.split("=")
            tags[key] = value === "" ? undefined : value
          })
        }

        // Parse prefix if present (starts with :)
        if (line[position] === ":") {
          const spacePos = line.indexOf(" ", position)
          prefix = line.slice(position + 1, spacePos)
          position = spacePos + 1
        }

        // Parse command
        const spacePos = line.indexOf(" ", position)
        if (spacePos === -1) {
          command = line.slice(position)
          params = []
        } else {
          command = line.slice(position, spacePos)
          position = spacePos + 1

          // Parse parameters
          while (position < line.length) {
            // If parameter starts with :, it's the trailing parameter
            if (line[position] === ":") {
              params.push(line.slice(position + 1))
              break
            }

            // Otherwise, it's a middle parameter
            const nextSpacePos = line.indexOf(" ", position)
            if (nextSpacePos === -1) {
              params.push(line.slice(position))
              break
            }

            params.push(line.slice(position, nextSpacePos))
            position = nextSpacePos + 1
          }
        }

        // Extract username from prefix
        let username = ""
        if (prefix) {
          const usernameBang = prefix.indexOf("!")
          if (usernameBang !== -1) {
            username = prefix.slice(0, usernameBang)
          }
        }

        // Check for capability acknowledgment
        if (command.toUpperCase() === "CAP" && params.length >= 2 && params[1] === "ACK") {
          this.debug(`Capability acknowledgment received: ${params[2]}`)
        }

        // Handle different IRC commands
        switch (command.toUpperCase()) {
          case "PRIVMSG": {
            // Chat message - params[0] is channel, params[1] is message
            const channel = params[0]
            const message = params[1]

            // Create chat message object
            const chatMessage: ChatMessage = {
              channel,
              tags,
              message,
              self: false,
            }

            // Emit the message event for subscribers to handle
            this.emit("message", chatMessage)
            break
          }

          case "JOIN": {
            // User joined - params[0] is channel
            const channel = params[0] as Channel
            this.emit("userJoined", channel, username)
            break
          }

          case "PART": {
            // User left - params[0] is channel
            const channel = params[0] as Channel
            this.emit("userLeft", channel, username)
            break
          }

          case "NOTICE": {
            // Notice message - params[0] is channel, params[1] is message
            const channel = params[0] as Channel
            const message = params[1]
            this.debug(`NOTICE received: ${channel} - ${message}`)
            this.emit("notice", { channel, message })
            break
          }

          case "GLOBALUSERSTATE": {
            // This is the key event we're looking for!
            this.debug("GLOBALUSERSTATE RECEIVED!" + JSON.stringify(tags))

            // Extract emote sets from tags and parse them
            const emoteSetStr = tags["emote-sets"] || ""
            const emoteSets = emoteSetStr.split(",").filter(Boolean)

            this.debug(`Emote sets: ${emoteSetStr}`)

            // Emit both capitalized and lowercase variants for compatibility
            this.emit("GLOBALUSERSTATE", { tags })

            // Emit lowercase version with parsed emoteSets for easier consumption
            this.emit("globalUserState", {
              emoteSets,
              tags,
            })
            break
          }

          case "ROOMSTATE": {
            // Room state - params[0] is channel
            const channel = params[0] as Channel
            this.emit("roomstate", channel, tags)
            break
          }

          case "001": // RPL_WELCOME - Successfully registered
            this.debug("Successfully registered with Twitch IRC (001)")
            // Some IRC servers send GLOBALUSERSTATE after registration completes
            // Let's request capabilities again just to be sure
            if (this.capabilitiesRequested) {
              this.requestGlobalUserState()
            }
            break

          case "002": // RPL_YOURHOST
          case "003": // RPL_CREATED
          case "004": // RPL_MYINFO
          case "375": // RPL_MOTDSTART
          case "372": // RPL_MOTD
          case "376": // RPL_ENDOFMOTD
            // Connection confirmation codes
            this.debug(`Connection confirmation received: ${command}`)
            break

          case "421": // ERR_UNKNOWNCOMMAND
          case "431": // ERR_NONICKNAMEGIVEN
          case "432": // ERR_ERRONEUSNICKNAME
          case "433": // ERR_NICKNAMEINUSE
            // Nickname-related errors
            this.debug(`Nickname error: ${params.join(" ")}`)
            this.emit("error", {
              error: new Error(`Nickname error: ${params.join(" ")}`),
              message: `Nickname error: ${params.join(" ")}`,
            })
            break

          default:
            this.debug(`Unhandled command: ${command}`)
            break
        }
      } catch (error) {
        console.error("Error parsing IRC message:", error, line)
      }
    }
  }
}

export default IRCClient
