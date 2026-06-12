import { Button } from "./button.jsx"
import { Badge } from "./badge"
import { Bell } from "lucide-react"

export function NotificationButton({ count = 0, onClick }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="relative"
      onClick={onClick}
      aria-label="Notifications"
    >
      <Bell size={16} strokeWidth={2} aria-hidden="true" />
      {count > 0 && (
        <Badge className="absolute -top-2 left-full min-w-[1.25rem] -translate-x-1/2 px-1">
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </Button>
  )
}
