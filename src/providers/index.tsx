import { IRCClientProvider } from "./IRCClientProvider"
import { EmoteProvider } from "./EmoteProvider"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <IRCClientProvider>
      <EmoteProvider>{children}</EmoteProvider>
    </IRCClientProvider>
  )
}
