import TMIClientProvider from "./TMIClientProvider"

export default function Providers({ children }: { children: React.ReactNode }) {
  return <TMIClientProvider>{children}</TMIClientProvider>
}
