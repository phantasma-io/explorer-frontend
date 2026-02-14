"use client";

import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Crown, Percent, UserPlus } from "lucide-react";
import { useEcho } from "@/lib/i18n/use-echo";
import { useAddressStats } from "@/lib/hooks/use-address-stats";
import { useStakingStats } from "@/lib/hooks/use-staking-stats";
import { formatRawTokenAmount, numberFormat } from "@/lib/utils/format";
import { unixToDate } from "@/lib/utils/time";

type ChartDatum = {
  timestamp: number;
  value: number;
};

type ChartGeometry = {
  linePath: string;
  areaPath: string;
  min: number;
  max: number;
  points: { x: number; y: number; timestamp: number; value: number }[];
  baselineY: number;
  firstLabel: string;
  lastLabel: string;
};

type StakingChartMode = "ratio" | "staked";

const monthLabelFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  year: "numeric",
});

const dayLabelFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const monthTooltipFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  year: "numeric",
});

const dayTooltipFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const chartWidth = 820;
const chartHeight = 250;
const chartPadding = 24;

const toFixedValue = (value: number, digits = 2) => numberFormat(value.toFixed(digits));

const rawSoulToValue = (raw?: string | null) => {
  if (!raw || !/^-?\d+$/.test(raw)) {
    return NaN;
  }

  const negative = raw.startsWith("-");
  const digits = negative ? raw.slice(1) : raw;
  const padded = digits.padStart(9, "0");
  const integerPart = padded.slice(0, -8);
  const decimalPart = padded.slice(-8);
  const value = Number(`${negative ? "-" : ""}${integerPart}.${decimalPart}`);
  return Number.isFinite(value) ? value : NaN;
};

const toLabel = (timestamp: number, monthly: boolean) => {
  const date = unixToDate(timestamp);
  return monthly
    ? monthLabelFormatter.format(date)
    : dayLabelFormatter.format(date);
};

const toTooltipDate = (timestamp: number, monthly: boolean) => {
  const date = unixToDate(timestamp);
  return monthly
    ? monthTooltipFormatter.format(date)
    : dayTooltipFormatter.format(date);
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function getHoveredPointIndex(event: ReactPointerEvent<SVGSVGElement>, pointsCount: number): number {
  if (pointsCount <= 1) {
    return 0;
  }

  const bounds = event.currentTarget.getBoundingClientRect();
  if (bounds.width <= 0) {
    return 0;
  }

  const xRatio = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
  return Math.round(xRatio * (pointsCount - 1));
}

function buildChartGeometry(data: ChartDatum[], monthly: boolean): ChartGeometry | null {
  if (!data.length) {
    return null;
  }

  const minValue = Math.min(...data.map((item) => item.value));
  const maxValue = Math.max(...data.map((item) => item.value));

  const min = minValue === maxValue ? minValue - 1 : minValue;
  const max = minValue === maxValue ? maxValue + 1 : maxValue;

  const usableWidth = chartWidth - chartPadding * 2;
  const usableHeight = chartHeight - chartPadding * 2;
  const xStep = data.length > 1 ? usableWidth / (data.length - 1) : 0;

  const points = data.map((item, index) => {
    const x = chartPadding + xStep * index;
    const ratio = (item.value - min) / (max - min);
    const y = chartHeight - chartPadding - ratio * usableHeight;
    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const last = points[points.length - 1];
  const first = points[0];
  const baseline = chartHeight - chartPadding;
  const areaPath = `${linePath} L${last.x.toFixed(2)} ${baseline.toFixed(2)} L${first.x.toFixed(2)} ${baseline.toFixed(2)} Z`;

  return {
    linePath,
    areaPath,
    min,
    max,
    points: points.map((point, index) => ({
      x: point.x,
      y: point.y,
      timestamp: data[index].timestamp,
      value: data[index].value,
    })),
    baselineY: baseline,
    firstLabel: toLabel(data[0].timestamp, monthly),
    lastLabel: toLabel(data[data.length - 1].timestamp, monthly),
  };
}

export function HomeNetworkInsights() {
  const { echo } = useEcho();
  const { loading: stakingLoading, daily, monthly, latestDaily } = useStakingStats("main");
  const { loading: addressesLoading, newAddressesDaily } = useAddressStats("main");

  const ratioSeries = useMemo<ChartDatum[]>(() => {
    return daily
      .map((item) => {
        const hasSupply = typeof item.soul_supply_raw === "string" && item.soul_supply_raw !== "0";
        if (!hasSupply) {
          return {
            timestamp: item.date_unix_seconds ?? 0,
            value: NaN,
          };
        }

        const ratioFromPercent = typeof item.staking_percent === "number" ? item.staking_percent : null;
        const ratioFromValue = typeof item.staking_ratio === "number" ? item.staking_ratio * 100 : null;
        const value = ratioFromPercent ?? ratioFromValue;
        return {
          timestamp: item.date_unix_seconds ?? 0,
          value: typeof value === "number" && Number.isFinite(value) ? value : NaN,
        };
      })
      .filter((item) => item.timestamp > 0 && Number.isFinite(item.value));
  }, [daily]);

  const stakedSoulSeries = useMemo<ChartDatum[]>(() => {
    return daily
      .map((item) => ({
        timestamp: item.date_unix_seconds ?? 0,
        value: rawSoulToValue(item.staked_soul_raw),
      }))
      .filter((item) => item.timestamp > 0 && Number.isFinite(item.value));
  }, [daily]);

  const mastersSeries = useMemo<ChartDatum[]>(() => {
    return monthly
      .map((item) => ({
        timestamp: item.month_unix_seconds ?? 0,
        value: typeof item.masters_count === "number" ? item.masters_count : NaN,
      }))
      .filter((item) => item.timestamp > 0 && Number.isFinite(item.value));
  }, [monthly]);

  const newAddressesSeries = useMemo<ChartDatum[]>(() => {
    return newAddressesDaily
      .map((item) => ({
        timestamp: item.date_unix_seconds ?? 0,
        value: typeof item.cumulative_addresses_count === "number" ? item.cumulative_addresses_count : NaN,
      }))
      .filter((item) => item.timestamp > 0 && Number.isFinite(item.value));
  }, [newAddressesDaily]);

  const ratioGeometry = useMemo(() => buildChartGeometry(ratioSeries, false), [ratioSeries]);
  const stakedSoulGeometry = useMemo(() => buildChartGeometry(stakedSoulSeries, false), [stakedSoulSeries]);
  const mastersGeometry = useMemo(() => buildChartGeometry(mastersSeries, true), [mastersSeries]);
  const newAddressesGeometry = useMemo(() => buildChartGeometry(newAddressesSeries, false), [newAddressesSeries]);

  const [stakingMode, setStakingMode] = useState<StakingChartMode>("ratio");
  const [ratioHoverIndex, setRatioHoverIndex] = useState<number | null>(null);
  const [stakedHoverIndex, setStakedHoverIndex] = useState<number | null>(null);
  const [mastersHoverIndex, setMastersHoverIndex] = useState<number | null>(null);
  const [newAddressesHoverIndex, setNewAddressesHoverIndex] = useState<number | null>(null);

  const stakingGeometry = stakingMode === "ratio" ? ratioGeometry : stakedSoulGeometry;
  const stakingHoverIndex = stakingMode === "ratio" ? ratioHoverIndex : stakedHoverIndex;
  const stakingHoveredPoint = stakingGeometry && stakingHoverIndex !== null
    ? stakingGeometry.points[stakingHoverIndex] ?? null
    : null;

  const mastersHoveredPoint = mastersGeometry && mastersHoverIndex !== null
    ? mastersGeometry.points[mastersHoverIndex] ?? null
    : null;
  const newAddressesHoveredPoint = newAddressesGeometry && newAddressesHoverIndex !== null
    ? newAddressesGeometry.points[newAddressesHoverIndex] ?? null
    : null;

  const stakingTooltipPosition = stakingHoveredPoint
    ? {
      left: `${clamp((stakingHoveredPoint.x / chartWidth) * 100, 7, 93)}%`,
      top: `${clamp((stakingHoveredPoint.y / chartHeight) * 100 - 16, 7, 69)}%`,
    }
    : null;
  const mastersTooltipPosition = mastersHoveredPoint
    ? {
      left: `${clamp((mastersHoveredPoint.x / chartWidth) * 100, 7, 93)}%`,
      top: `${clamp((mastersHoveredPoint.y / chartHeight) * 100 - 16, 7, 69)}%`,
    }
    : null;
  const newAddressesTooltipPosition = newAddressesHoveredPoint
    ? {
      left: `${clamp((newAddressesHoveredPoint.x / chartWidth) * 100, 7, 93)}%`,
      top: `${clamp((newAddressesHoveredPoint.y / chartHeight) * 100 - 16, 7, 69)}%`,
    }
    : null;

  const handleStakingPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!stakingGeometry) {
      return;
    }

    const index = getHoveredPointIndex(event, stakingGeometry.points.length);
    if (stakingMode === "ratio") {
      setRatioHoverIndex(index);
      return;
    }
    setStakedHoverIndex(index);
  };

  const handleMastersPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!mastersGeometry) {
      return;
    }

    setMastersHoverIndex(getHoveredPointIndex(event, mastersGeometry.points.length));
  };

  const handleNewAddressesPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!newAddressesGeometry) {
      return;
    }

    setNewAddressesHoverIndex(getHoveredPointIndex(event, newAddressesGeometry.points.length));
  };

  const latestHasSupply = typeof latestDaily?.soul_supply_raw === "string" && latestDaily.soul_supply_raw !== "0";
  const latestStakingPercent = (() => {
    if (!latestHasSupply) {
      return null;
    }
    if (typeof latestDaily?.staking_percent === "number") {
      return latestDaily.staking_percent;
    }
    if (typeof latestDaily?.staking_ratio === "number") {
      return latestDaily.staking_ratio * 100;
    }
    return null;
  })();

  const gaugePercent = Math.max(0, Math.min(100, latestStakingPercent ?? 0));
  const gaugeBackground = `conic-gradient(rgb(var(--brand-cyan)) 0 ${gaugePercent}%, color-mix(in oklab, var(--foreground) 18%, transparent) ${gaugePercent}% 100%)`;

  const latestStakers = typeof latestDaily?.stakers_count === "number"
    ? latestDaily.stakers_count
    : null;
  const latestStakedSoul = formatRawTokenAmount(latestDaily?.staked_soul_raw);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <article className="glass-panel h-full rounded-3xl p-5 md:p-6 flex flex-col">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{echo("all_time_soul_masters")}</h3>
          </div>
          <Crown className="h-5 w-5 text-amber-400" />
        </header>

        {stakingLoading ? (
          <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-14 text-center text-sm text-muted-foreground">
            {echo("loading")}
          </div>
        ) : mastersGeometry ? (
          <div className="relative rounded-2xl border border-border/60 bg-card/70 p-3">
            {mastersHoveredPoint && mastersTooltipPosition ? (
              <div
                className="pointer-events-none absolute z-10 min-w-44 -translate-x-1/2 rounded-xl border border-border/80 bg-background/95 px-3 py-2 shadow-[0_18px_36px_rgba(2,8,20,0.35)] backdrop-blur"
                style={mastersTooltipPosition}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{echo("date")}</div>
                <div className="text-xs font-medium text-foreground">{toTooltipDate(mastersHoveredPoint.timestamp, true)} UTC</div>
                <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{echo("value")}</span>
                  <span className="font-semibold text-amber-300">{numberFormat(mastersHoveredPoint.value.toFixed(0))}</span>
                </div>
              </div>
            ) : null}

            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-72 w-full touch-none"
              preserveAspectRatio="none"
              onPointerMove={handleMastersPointerMove}
              onPointerDown={handleMastersPointerMove}
              onPointerLeave={() => setMastersHoverIndex(null)}
            >
              <defs>
                <linearGradient id="mastersAreaGradientTop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(224,177,79,0.44)" />
                  <stop offset="100%" stopColor="rgba(224,177,79,0.08)" />
                </linearGradient>
              </defs>
              <path d={mastersGeometry.areaPath} fill="url(#mastersAreaGradientTop)" />
              <path
                d={mastersGeometry.linePath}
                fill="none"
                stroke="rgb(224,177,79)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {mastersHoveredPoint ? (
                <>
                  <line
                    x1={mastersHoveredPoint.x}
                    y1={chartPadding}
                    x2={mastersHoveredPoint.x}
                    y2={mastersGeometry.baselineY}
                    stroke="rgba(148,163,184,0.5)"
                    strokeDasharray="4 6"
                    strokeWidth="1.3"
                  />
                  <circle
                    cx={mastersHoveredPoint.x}
                    cy={mastersHoveredPoint.y}
                    r="5.4"
                    fill="rgb(224,177,79)"
                    stroke="rgba(2,8,20,0.95)"
                    strokeWidth="2.2"
                  />
                </>
              ) : null}
            </svg>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{mastersGeometry.firstLabel}</span>
              <span>
                {echo("range")}: {numberFormat(Math.floor(mastersGeometry.min))} - {numberFormat(Math.ceil(mastersGeometry.max))}
              </span>
              <span>{mastersGeometry.lastLabel}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-14 text-center text-sm text-muted-foreground">
            {echo("no_stats_data")}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex items-end justify-between gap-3">
              <span className="text-base font-medium text-muted-foreground">{echo("stakers")}</span>
              <span className="text-2xl font-semibold text-foreground">
                {latestStakers !== null ? numberFormat(latestStakers) : "—"}
              </span>
            </div>
          </div>
        </div>
      </article>

      <article className="glass-panel h-full rounded-3xl p-5 md:p-6 flex flex-col">
        <header className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{echo("staked_vs_supply")}</h3>
        </header>

        <div className="flex flex-1 items-center justify-center py-2">
          <div
            className="relative grid h-[16.5rem] w-[16.5rem] place-items-center rounded-full p-[18px]"
            style={{ background: gaugeBackground }}
          >
            <div className="grid h-full w-full place-items-center rounded-full border border-border/70 bg-card">
              <div className="text-center">
                <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <Percent className="h-4 w-4" /> {echo("staking_ratio")}
                </div>
                <div className="mt-2 text-4xl font-semibold text-foreground">
                  {latestStakingPercent !== null ? `${toFixedValue(latestStakingPercent, 2)}%` : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex items-end justify-between gap-3">
              <span className="text-base font-medium text-muted-foreground">{echo("staked_soul")}</span>
              <span className="text-2xl font-semibold text-foreground text-right">{latestStakedSoul}</span>
            </div>
          </div>
        </div>
      </article>

      <article className="glass-panel rounded-3xl p-5 md:p-6">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{echo("all_time_staking_ratio")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{echo("staking_ratio_caption")}</p>
          </div>
          <div className="inline-flex rounded-xl border border-border/70 bg-card/70 p-1">
            <button
              type="button"
              onClick={() => setStakingMode("ratio")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                stakingMode === "ratio"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {echo("staking_ratio")}
            </button>
            <button
              type="button"
              onClick={() => setStakingMode("staked")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                stakingMode === "staked"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {echo("staked_soul")}
            </button>
          </div>
        </header>

        {stakingLoading ? (
          <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-14 text-center text-sm text-muted-foreground">
            {echo("loading")}
          </div>
        ) : stakingGeometry ? (
          <div className="relative rounded-2xl border border-border/60 bg-card/70 p-3">
            {stakingHoveredPoint && stakingTooltipPosition ? (
              <div
                className="pointer-events-none absolute z-10 min-w-44 -translate-x-1/2 rounded-xl border border-border/80 bg-background/95 px-3 py-2 shadow-[0_18px_36px_rgba(2,8,20,0.35)] backdrop-blur"
                style={stakingTooltipPosition}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{echo("date")}</div>
                <div className="text-xs font-medium text-foreground">{toTooltipDate(stakingHoveredPoint.timestamp, false)} UTC</div>
                <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{echo("value")}</span>
                  <span className={`font-semibold ${stakingMode === "ratio" ? "text-cyan-300" : "text-emerald-300"}`}>
                    {stakingMode === "ratio"
                      ? `${toFixedValue(stakingHoveredPoint.value, 4)}%`
                      : `${toFixedValue(stakingHoveredPoint.value, 2)} SOUL`}
                  </span>
                </div>
              </div>
            ) : null}

            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-64 w-full touch-none"
              preserveAspectRatio="none"
              onPointerMove={handleStakingPointerMove}
              onPointerDown={handleStakingPointerMove}
              onPointerLeave={() => {
                if (stakingMode === "ratio") {
                  setRatioHoverIndex(null);
                  return;
                }
                setStakedHoverIndex(null);
              }}
            >
              <defs>
                <linearGradient id="stakingModeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  {stakingMode === "ratio" ? (
                    <>
                      <stop offset="0%" stopColor="rgba(31,175,229,0.48)" />
                      <stop offset="100%" stopColor="rgba(31,175,229,0.08)" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="rgba(56,189,120,0.44)" />
                      <stop offset="100%" stopColor="rgba(56,189,120,0.08)" />
                    </>
                  )}
                </linearGradient>
              </defs>
              <path d={stakingGeometry.areaPath} fill="url(#stakingModeAreaGradient)" />
              <path
                d={stakingGeometry.linePath}
                fill="none"
                stroke={stakingMode === "ratio" ? "rgb(31,175,229)" : "rgb(56,189,120)"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {stakingHoveredPoint ? (
                <>
                  <line
                    x1={stakingHoveredPoint.x}
                    y1={chartPadding}
                    x2={stakingHoveredPoint.x}
                    y2={stakingGeometry.baselineY}
                    stroke="rgba(148,163,184,0.5)"
                    strokeDasharray="4 6"
                    strokeWidth="1.3"
                  />
                  <circle
                    cx={stakingHoveredPoint.x}
                    cy={stakingHoveredPoint.y}
                    r="5.4"
                    fill={stakingMode === "ratio" ? "rgb(31,175,229)" : "rgb(56,189,120)"}
                    stroke="rgba(2,8,20,0.95)"
                    strokeWidth="2.2"
                  />
                </>
              ) : null}
            </svg>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{stakingGeometry.firstLabel}</span>
              <span>
                {echo("range")}: {stakingMode === "ratio"
                  ? `${toFixedValue(stakingGeometry.min, 2)}% - ${toFixedValue(stakingGeometry.max, 2)}%`
                  : `${toFixedValue(stakingGeometry.min, 0)} SOUL - ${toFixedValue(stakingGeometry.max, 0)} SOUL`}
              </span>
              <span>{stakingGeometry.lastLabel}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-14 text-center text-sm text-muted-foreground">
            {echo("no_stats_data")}
          </div>
        )}
      </article>

      <article className="glass-panel rounded-3xl p-5 md:p-6">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{echo("all_time_new_addresses")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{echo("new_addresses_caption")}</p>
          </div>
          <UserPlus className="h-5 w-5 text-teal-400" />
        </header>

        {addressesLoading ? (
          <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-14 text-center text-sm text-muted-foreground">
            {echo("loading")}
          </div>
        ) : newAddressesGeometry ? (
          <div className="relative rounded-2xl border border-border/60 bg-card/70 p-3">
            {newAddressesHoveredPoint && newAddressesTooltipPosition ? (
              <div
                className="pointer-events-none absolute z-10 min-w-44 -translate-x-1/2 rounded-xl border border-border/80 bg-background/95 px-3 py-2 shadow-[0_18px_36px_rgba(2,8,20,0.35)] backdrop-blur"
                style={newAddressesTooltipPosition}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{echo("date")}</div>
                <div className="text-xs font-medium text-foreground">{toTooltipDate(newAddressesHoveredPoint.timestamp, false)} UTC</div>
                <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{echo("value")}</span>
                  <span className="font-semibold text-teal-300">{numberFormat(newAddressesHoveredPoint.value.toFixed(0))}</span>
                </div>
              </div>
            ) : null}

            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-64 w-full touch-none"
              preserveAspectRatio="none"
              onPointerMove={handleNewAddressesPointerMove}
              onPointerDown={handleNewAddressesPointerMove}
              onPointerLeave={() => setNewAddressesHoverIndex(null)}
            >
              <defs>
                <linearGradient id="newAddressesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(45,212,191,0.42)" />
                  <stop offset="100%" stopColor="rgba(45,212,191,0.08)" />
                </linearGradient>
              </defs>
              <path d={newAddressesGeometry.areaPath} fill="url(#newAddressesAreaGradient)" />
              <path
                d={newAddressesGeometry.linePath}
                fill="none"
                stroke="rgb(45,212,191)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {newAddressesHoveredPoint ? (
                <>
                  <line
                    x1={newAddressesHoveredPoint.x}
                    y1={chartPadding}
                    x2={newAddressesHoveredPoint.x}
                    y2={newAddressesGeometry.baselineY}
                    stroke="rgba(148,163,184,0.5)"
                    strokeDasharray="4 6"
                    strokeWidth="1.3"
                  />
                  <circle
                    cx={newAddressesHoveredPoint.x}
                    cy={newAddressesHoveredPoint.y}
                    r="5.4"
                    fill="rgb(45,212,191)"
                    stroke="rgba(2,8,20,0.95)"
                    strokeWidth="2.2"
                  />
                </>
              ) : null}
            </svg>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{newAddressesGeometry.firstLabel}</span>
              <span>
                {echo("range")}: {numberFormat(Math.floor(newAddressesGeometry.min))} - {numberFormat(Math.ceil(newAddressesGeometry.max))}
              </span>
              <span>{newAddressesGeometry.lastLabel}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-14 text-center text-sm text-muted-foreground">
            {echo("no_stats_data")}
          </div>
        )}
      </article>
    </section>
  );
}
