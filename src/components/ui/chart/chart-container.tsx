
import * as React from "react"
import { cn } from "@/lib/utils"
import { ChartConfig } from "./context"

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactNode
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  const id = React.useId()

  return (
    <div
      data-chart={id}
      className={cn("chart-container relative", className)}
      {...props}
    >
      {/* Make sure we wrap the children properly to satisfy TypeScript */}
      {children}
    </div>
  )
}
