declare module "recharts" {
    import type { ComponentType, ReactNode } from "react";

    export const PieChart: ComponentType<{ children?: ReactNode; width?: number | string; height?: number | string }>;
    export const Pie: ComponentType<Record<string, unknown> & { children?: ReactNode }>;
    export const ResponsiveContainer: ComponentType<{ children?: ReactNode; width?: number | string; height?: number | string }>;
    export const Tooltip: ComponentType<Record<string, unknown>>;
    export const Cell: ComponentType<Record<string, unknown>>;
}
