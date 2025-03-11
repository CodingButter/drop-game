// Context Providers
export { TIRCClientProvider } from "./src/context/TIRCClientProvider";
export { EmoteProvider } from "./src/context/EmoteProvider";

// Hooks
export { useTIRC } from "./src/hooks/useTIRC";
export { useEmotes } from "./src/hooks/useEmotes";

// Components
export { Message } from "./src/components/Message";
export { MessageInput } from "./src/components/MessageInput";

// Utility Functions (optional, for manual usage)
export { fetchBTTVGlobalEmotes, fetchFFZGlobalEmotes, fetchTwitchEmotes } from "./src/utils/emoteUtils";

export { TIRCProvider } from "./src/context/index";

export type { ITIRCClientConfig } from "./src/lib/TIRCClient";
export type { IMessage } from "./src/hooks/useTIRC";
export type { IEmote } from "./typings/index";