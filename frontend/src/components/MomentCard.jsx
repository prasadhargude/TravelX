"use client"

import { CheckCircle2 } from "lucide-react"

function MomentCard({ moment, onClick }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div
      onClick={onClick}
      className="group relative bg-muted rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-xl"
    >
      <img
        src={moment.imageUrl || "/placeholder.svg"}
        alt={moment.caption}
        className="w-full aspect-video object-cover"
      />
      <div className="p-4">
        <p className="text-sm text-foreground mb-2 line-clamp-2">{moment.caption}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDate(moment.timestamp)}</span>
          {moment.posted && (
            <div className="flex items-center gap-1 text-accent">
              <CheckCircle2 size={14} />
              <span>Posted</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MomentCard
