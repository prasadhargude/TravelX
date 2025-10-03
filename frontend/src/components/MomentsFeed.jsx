"use client"

import { useState } from "react"
import MomentCard from "./MomentCard"

function MomentsFeed({ moments, onMomentClick }) {
  const [activeTab, setActiveTab] = useState("inside")

  const filteredMoments = moments.filter((m) => m.category === activeTab)

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header with Tabs */}
      <div className="p-6 border-b border-border">
        <h1 className="text-3xl font-bold mb-6">Your Moments</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("inside")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "inside"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            📸 Inside Selfies
          </button>
          <button
            onClick={() => setActiveTab("outside")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "outside" ? "bg-accent text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            🌄 Outside Moments
          </button>
        </div>
      </div>

      {/* Moments Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredMoments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No {activeTab} moments yet. Start capturing!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMoments.map((moment) => (
              <MomentCard key={moment.id} moment={moment} onClick={() => onMomentClick(moment)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MomentsFeed
