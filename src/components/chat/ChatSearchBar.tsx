import React, { useState, useEffect } from "react"
import { Search, X, Filter } from "lucide-react"

interface ChatSearchBarProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: ChatFilters) => void
}

export interface ChatFilters {
  showJoinLeave: boolean
  showTimestamps: boolean
  highlightMentions: boolean
  onlyFromUser: string | null
}

const ChatSearchBar: React.FC<ChatSearchBarProps> = ({ onSearch, onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ChatFilters>({
    showJoinLeave: true,
    showTimestamps: true,
    highlightMentions: true,
    onlyFromUser: null,
  })

  // Update search when query changes
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      onSearch(searchQuery)
    }, 300)

    return () => clearTimeout(delaySearch)
  }, [searchQuery, onSearch])

  // Update filters when they change
  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const handleClearSearch = () => {
    setSearchQuery("")
    onSearch("")
  }

  const updateFilter = (key: keyof ChatFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-2">
      <div className="flex items-center">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in chat..."
            className="w-full bg-gray-700 text-white px-3 py-2 pr-8 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex">
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="text-gray-400 hover:text-white mr-1"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`text-gray-400 hover:text-white ${showFilters ? "text-blue-400" : ""}`}
              aria-label="Show filters"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="mt-2 p-2 bg-gray-700 rounded-md">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Filter Options</h4>
          <div className="space-y-2">
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="checkbox"
                checked={filters.showJoinLeave}
                onChange={(e) => updateFilter("showJoinLeave", e.target.checked)}
                className="mr-2"
              />
              Show join/leave messages
            </label>
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="checkbox"
                checked={filters.showTimestamps}
                onChange={(e) => updateFilter("showTimestamps", e.target.checked)}
                className="mr-2"
              />
              Show timestamps
            </label>
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="checkbox"
                checked={filters.highlightMentions}
                onChange={(e) => updateFilter("highlightMentions", e.target.checked)}
                className="mr-2"
              />
              Highlight mentions
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatSearchBar
