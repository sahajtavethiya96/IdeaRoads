"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { FeedbackTrendPoint } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

interface FeedbackTrendCardProps {
  isPending?: boolean;
  points: FeedbackTrendPoint[];
  weekly: boolean;
}

const chartConfig: ChartConfig = {
  count: {
    label: "New feedback",
    color: "var(--ir-primary)",
  },
};

function formatTick(dateStr: string, weekly: boolean): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return weekly ? `Week of ${label}` : label;
}

export function FeedbackTrendCard({
  isPending,
  points,
  weekly,
}: FeedbackTrendCardProps) {
  const total = points.reduce((sum, p) => sum + p.count, 0);

  return (
    <div
      className={cn(
        "rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs transition-opacity duration-150 ease-ir-standard",
        isPending && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-ir-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-ir-heading">
            Feedback trend
          </h2>
          <p className="mt-0.5 text-xs text-ir-muted">
            New feedback {weekly ? "per week" : "per day"}
          </p>
        </div>
        <span className="text-lg font-semibold tabular-nums text-ir-heading">
          {total.toLocaleString()}
        </span>
      </div>

      {total === 0 ? (
        <div className="flex h-48 items-center justify-center px-5 text-sm text-ir-muted">
          No feedback yet in this period.
        </div>
      ) : (
        <ChartContainer
          className="aspect-auto h-48 w-full px-2 py-4"
          config={chartConfig}
        >
          <AreaChart
            data={points}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="var(--ir-border)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={40}
              tickFormatter={(value) => formatTick(value, weekly)}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatTick(String(value), weekly)}
                />
              }
              cursor={{ stroke: "var(--ir-border)" }}
            />
            <Area
              activeDot={{
                r: 4,
                stroke: "var(--ir-surface)",
                strokeWidth: 2,
              }}
              dataKey="count"
              dot={false}
              fill="var(--color-count)"
              fillOpacity={0.1}
              stroke="var(--color-count)"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
