/**
 * Shared Recharts tooltip styling — dark mode responsive via CSS variables.
 * Usage: <RechartsTooltip {...chartTooltipProps} formatter={...} />
 */
export const chartTooltipProps = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    borderColor: "hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--foreground))",
    fontSize: 12,
    padding: "8px 12px",
  },
  labelStyle: {
    color: "hsl(var(--foreground))",
    fontWeight: 600 as const,
    fontSize: 12,
  },
  itemStyle: {
    color: "hsl(var(--foreground))",
    fontSize: 12,
  },
};
