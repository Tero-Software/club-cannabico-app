"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

const PRIMARY = "var(--primary)";
const MUTED_FG = "var(--muted-foreground)";
const BORDER = "var(--border)";
const CARD = "var(--card)";
const FOREGROUND = "var(--foreground)";

type TooltipFormatter = (value: number) => string;

function axisStyle() {
  return { fontSize: 11, fill: MUTED_FG };
}

function tooltipContent(format: TooltipFormatter) {
  return function TooltipInner(props: TooltipContentProps<ValueType, NameType>) {
    const { active, payload, label } = props;
    if (!active || !payload || payload.length === 0) return null;
    const raw = payload[0]?.value;
    const num =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number(raw)
          : Array.isArray(raw)
            ? Number(raw[0] ?? 0)
            : 0;
    return (
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 6,
          padding: "6px 10px",
          fontSize: 12,
          color: FOREGROUND,
        }}
      >
        <div style={{ color: MUTED_FG, marginBottom: 2 }}>{String(label ?? "")}</div>
        <div style={{ fontWeight: 600 }}>{format(num)}</div>
      </div>
    );
  };
}

export function MonthlyGramsChart({
  data,
}: {
  data: { month: string; label: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={BORDER} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle()} tickLine={false} axisLine={{ stroke: BORDER }} />
        <YAxis tick={axisStyle()} tickLine={false} axisLine={{ stroke: BORDER }} />
        <Tooltip content={tooltipContent((v) => `${v.toLocaleString("es-AR", { maximumFractionDigits: 1 })} g`)} cursor={{ fill: BORDER, opacity: 0.3 }} />
        <Bar dataKey="value" fill={PRIMARY} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeekdayChart({
  data,
}: {
  data: { weekday: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={BORDER} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="weekday" tick={axisStyle()} tickLine={false} axisLine={{ stroke: BORDER }} />
        <YAxis tick={axisStyle()} tickLine={false} axisLine={{ stroke: BORDER }} />
        <Tooltip content={tooltipContent((v) => `${v.toLocaleString("es-AR", { maximumFractionDigits: 1 })} g / día`)} cursor={{ fill: BORDER, opacity: 0.3 }} />
        <Bar dataKey="value" fill={PRIMARY} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopStrainsChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const height = Math.max(180, data.length * 32 + 40);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke={BORDER} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={axisStyle()} tickLine={false} axisLine={{ stroke: BORDER }} />
        <YAxis
          type="category"
          dataKey="label"
          tick={axisStyle()}
          tickLine={false}
          axisLine={{ stroke: BORDER }}
          width={110}
        />
        <Tooltip content={tooltipContent((v) => `${v.toLocaleString("es-AR", { maximumFractionDigits: 1 })} g`)} cursor={{ fill: BORDER, opacity: 0.3 }} />
        <Bar dataKey="value" fill={PRIMARY} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ActiveMembersLineChart({
  data,
}: {
  data: { month: string; label: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={BORDER} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle()} tickLine={false} axisLine={{ stroke: BORDER }} />
        <YAxis tick={axisStyle()} tickLine={false} axisLine={{ stroke: BORDER }} allowDecimals={false} />
        <Tooltip content={tooltipContent((v) => `${v} socios`)} cursor={{ stroke: BORDER }} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={PRIMARY}
          strokeWidth={2}
          dot={{ r: 3, fill: PRIMARY, stroke: PRIMARY }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DistributionChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={BORDER} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle()} tickLine={false} axisLine={{ stroke: BORDER }} />
        <YAxis tick={axisStyle()} tickLine={false} axisLine={{ stroke: BORDER }} allowDecimals={false} />
        <Tooltip content={tooltipContent((v) => `${v} socios`)} cursor={{ fill: BORDER, opacity: 0.3 }} />
        <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PRIMARY} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AgeHistogramChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={BORDER} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle()} tickLine={false} axisLine={{ stroke: BORDER }} />
        <YAxis tick={axisStyle()} tickLine={false} axisLine={{ stroke: BORDER }} allowDecimals={false} />
        <Tooltip content={tooltipContent((v) => `${v} socios`)} cursor={{ fill: BORDER, opacity: 0.3 }} />
        <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
