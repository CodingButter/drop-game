// src/components/chat/EmotesPicker.tsx
import React, { useState, useEffect, useRef } from "react"
import { X, Search } from "lucide-react"
import { useEmotes } from "../../hooks/useEmotes"

interface EmotesPickerProps {
  onClose: () => void
  onSelectEmote: (emoteCode: string) => void
  channelName: string | null
}

const EmotesPicker: React.FC<EmotesPickerProps> = ({ onClose, onSelectEmote, channelName }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [twitchEmotes, setTwitchEmotes] = useState<Array<{ id: string; code: string }>>([])
  const [bttvEmotes, setBttvEmotes] = useState<Array<{ id: string; code: string; url: string }>>([])
  const [ffzEmotes, setFfzEmotes] = useState<Array<{ id: string; code: string; url: string }>>([])
  const [activeTab, setActiveTab] = useState<"twitch" | "bttv" | "ffz" | "recent">("twitch")
  const [recentEmotes, setRecentEmotes] = useState<string[]>([])

  const pickerRef = useRef<HTMLDivElement>(null)
  const { loadedChannels } = useEmotes()

  // Load recent emotes from localStorage
  useEffect(() => {
    const storedEmotes = localStorage.getItem("recentEmotes")
    if (storedEmotes) {
      try {
        setRecentEmotes(JSON.parse(storedEmotes))
      } catch (e) {
        console.error("Failed to parse recent emotes:", e)
      }
    }
  }, [])

  // Mock loading emotes - in a real app, you'd fetch these from API or context
  useEffect(() => {
    // Mock Twitch emotes
    setTwitchEmotes([
      { id: "58765", code: "KappaPride" },
      { id: "25", code: "Kappa" },
      { id: "30259", code: "HeyGuys" },
      { id: "28087", code: "WutFace" },
      { id: "41", code: "Kreygasm" },
      { id: "1904", code: "PogChamp" },
      { id: "81103", code: "TriHard" },
      { id: "114836", code: "LUL" },
      { id: "86", code: "BibleThump" },
      { id: "245", code: "ResidentSleeper" },
      { id: "555555584", code: "CoolCat" },
      { id: "555555585", code: "DansGame" },
    ])

    // Mock BTTV emotes
    setBttvEmotes([
      {
        id: "54fa90c901e468494b85b54f",
        code: "FeelsBadMan",
        url: "https://cdn.betterttv.net/emote/54fa90c901e468494b85b54f/1x",
      },
      {
        id: "54fa909501e468494b85b53f",
        code: "FeelsGoodMan",
        url: "https://cdn.betterttv.net/emote/54fa909501e468494b85b53f/1x",
      },
      {
        id: "5590b223b344e2c42a9e28e3",
        code: "RIP",
        url: "https://cdn.betterttv.net/emote/5590b223b344e2c42a9e28e3/1x",
      },
      {
        id: "55028cd2135896936880fdd7",
        code: "OhMyGod",
        url: "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/1x",
      },
      {
        id: "5cdae4baa08c430e35632b91",
        code: "PepeHands",
        url: "https://cdn.betterttv.net/emote/5cdae4baa08c430e35632b91/1x",
      },
    ])

    // Mock FFZ emotes
    setFfzEmotes([
      { id: "3218", code: "OMEGALUL", url: "https://cdn.frankerfacez.com/emote/128054/1" },
      { id: "4057", code: "KEKW", url: "https://cdn.frankerfacez.com/emote/381875/1" },
      { id: "5724", code: "monkaS", url: "https://cdn.frankerfacez.com/emote/130762/1" },
      { id: "1896", code: "PogU", url: "https://cdn.frankerfacez.com/emote/256055/1" },
    ])
  }, [channelName])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  // Handle emote selection
  const handleEmoteSelect = (emoteCode: string) => {
    onSelectEmote(emoteCode)

    // Save to recent emotes
    setRecentEmotes((prev) => {
      const updated = [emoteCode, ...prev.filter((e) => e !== emoteCode)].slice(0, 20)
      localStorage.setItem("recentEmotes", JSON.stringify(updated))
      return updated
    })
  }

  // Filter emotes based on search
  const filteredTwitchEmotes = twitchEmotes.filter((emote) =>
    emote.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredBttvEmotes = bttvEmotes.filter((emote) =>
    emote.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFfzEmotes = ffzEmotes.filter((emote) =>
    emote.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRecentEmotes = recentEmotes.filter((emoteCode) =>
    emoteCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Render emote grid for a specific provider
  const renderEmoteGrid = (
    emotes: Array<{ id?: string; code: string; url?: string }> | string[],
    provider: "twitch" | "bttv" | "ffz" | "recent"
  ) => {
    if (emotes.length === 0) {
      return (
        <div className="py-8 text-center text-text-secondary">
          {searchQuery ? "No matching emotes found" : "No emotes available"}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-8 gap-2 p-2">
        {emotes.map((emote, index) => {
          const emoteCode = typeof emote === "string" ? emote : emote.code
          const emoteUrl =
            typeof emote === "string"
              ? undefined
              : provider === "twitch"
              ? `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`
              : emote.url

          return (
            <button
              key={index}
              className="flex flex-col items-center justify-center p-1 hover:bg-background-tertiary rounded transition-colors"
              onClick={() => handleEmoteSelect(emoteCode)}
              title={emoteCode}
            >
              {emoteUrl ? (
                <img src={emoteUrl} alt={emoteCode} className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-8 h-8 flex items-center justify-center font-mono text-xs">
                  {emoteCode}
                </div>
              )}
              <span className="text-xs mt-1 truncate w-full text-center">{emoteCode}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 w-80 md:w-96 bg-surface border border-border rounded-lg shadow-lg z-10 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-background-secondary border-b border-border">
        <h3 className="font-medium">Emotes</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-background-tertiary rounded-full transition-colors"
          aria-label="Close emote picker"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emotes..."
            className="w-full pl-8 pr-4 py-1.5 bg-background-tertiary rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Search size={16} className="absolute left-2.5 top-2 text-text-secondary" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === "twitch"
              ? "bg-background-tertiary text-primary border-b-2 border-primary"
              : "text-text-secondary hover:bg-background-tertiary"
          }`}
          onClick={() => setActiveTab("twitch")}
        >
          Twitch
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === "bttv"
              ? "bg-background-tertiary text-primary border-b-2 border-primary"
              : "text-text-secondary hover:bg-background-tertiary"
          }`}
          onClick={() => setActiveTab("bttv")}
        >
          BTTV
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === "ffz"
              ? "bg-background-tertiary text-primary border-b-2 border-primary"
              : "text-text-secondary hover:bg-background-tertiary"
          }`}
          onClick={() => setActiveTab("ffz")}
        >
          FFZ
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === "recent"
              ? "bg-background-tertiary text-primary border-b-2 border-primary"
              : "text-text-secondary hover:bg-background-tertiary"
          }`}
          onClick={() => setActiveTab("recent")}
        >
          Recent
        </button>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {activeTab === "twitch" && renderEmoteGrid(filteredTwitchEmotes, "twitch")}
        {activeTab === "bttv" && renderEmoteGrid(filteredBttvEmotes, "bttv")}
        {activeTab === "ffz" && renderEmoteGrid(filteredFfzEmotes, "ffz")}
        {activeTab === "recent" && renderEmoteGrid(filteredRecentEmotes, "recent")}
      </div>

      {/* Footer */}
      <div className="p-2 bg-background-secondary border-t border-border text-xs text-text-tertiary">
        {channelName ? `Channel: ${channelName}` : "No channel selected"} •
        {loadedChannels.length > 0
          ? ` ${loadedChannels.length} channel(s) loaded`
          : " No channels loaded"}
      </div>
    </div>
  )
}

export default EmotesPicker
