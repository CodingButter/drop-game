/// <reference types="vite/client" />
interface ImportMetaEnv {
  VITE_OAUTH_TOKEN: `[a-zA-Z0-9]{30}`
  VITE_DEFAULT_CHANNEL: string
  vite_DEFAULT_NICK: string
  vite_DEFAULT_SERVER: string
  // others...
}
