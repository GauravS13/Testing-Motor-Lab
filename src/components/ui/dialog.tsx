"use client"

import { X } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [isOpen, setIsOpen] = React.useState(open || false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
         {/* Context provider logic would go here in a real implementation, 
             passing onOpenChange down. For this simple custom version,
             we'll rely on the parent checking `open`.
         */}
         {/* We clone children to inject the close handler if needed, 
             but simpler is to expose a transparent wrapper.
         */}
         <div className="relative">
             {/* Close Button implementation usually sits in DialogContent, 
                 but we'll put a global close capability here/via overlay click. 
                 Since we can't easily click overlay here without wrapping content...
             */}
             {children}
         </div>
      </div>
       {/* Overlay click handler */}
      <div 
        className="absolute inset-0 z-[-1]" 
        onClick={() => onOpenChange?.(false)}
      />
    </div>
  )
}

// Minimal implementation of sub-components to match standard API usage
// Note: This is a simplified "fake" Dialog to avoid installing Radix UI
// It relies on the parent passing `open={true}` to the root Dialog.

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("grid gap-4", className)}
    {...props}
  >
    {children}
    {/* Global close button usually goes here */}
  </div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-gray-900",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

// Close button helper
const DialogCloseButton = ({ onClick }: { onClick?: () => void }) => (
    <button 
        onClick={onClick}
        className="absolute right-4 top-4 opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
    >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
    </button>
)

export {
    Dialog, DialogCloseButton, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
}

