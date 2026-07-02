import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../utils/index"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-green-600 text-white shadow-sm shadow-black/5 hover:bg-green-500",
        destructive:
          "bg-red-600 text-white shadow-sm shadow-black/5 hover:bg-red-500",
        outline:
          "border border-gray-300 bg-white shadow-sm shadow-black/5 hover:bg-gray-100 text-gray-900",
        secondary:
          "bg-gray-100 text-gray-900 shadow-sm shadow-black/5 hover:bg-gray-200",
        ghost: "hover:bg-gray-100 text-gray-900",
        link: "text-green-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
