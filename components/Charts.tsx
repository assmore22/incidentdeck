"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { TNode } from "@/lib/nodes";
import type { Reputation } from "@/lib/types";
import { bpsToPct } from "@/lib/format";
import { truncateHex } from "@/lib/format";

/** Mobile vertical timeline-first list (no D3 swimlane; one column, time-ordered). */
export function VerticalTimeline({ nodes, selectedKey, onSelect }: { nodes: TNode[]; selectedKey?: string | null; onSelect?: (n: TNode) => void }) {
  if (nodes.length === 0) {
    return <div className="rounded-md border border-dashed border-line bg-bg2/40 px-4 py-8 text-center text-xs text-muted">no timeline events yet</div>;
  }
  return (
    <ol className="relative ml-2 border-l border-line">
      {nodes.map((n) => (
        <li key={n.key} className="relative pl-5 pb-4">
          <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2" style={{ borderColor: n.color, background: "#0B0C0E" }} />
          <button type="button" onClick={() => onSelect?.(n)}
            className={`w-full rounded-md border p-2.5 text-left transition-colors ${n.key === selectedKey ? "border-signal/60 bg-signal/5" : "border-line bg-panel hover:border-line2"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xs font-semibold uppercase tracking-wide" style={{ color: n.color }}>{n.lane}</span>
              <span className="text-2xs text-faint">{n.label}</span>
            </div>
            <div className="mt-1 line-clamp-3 text-xs text-muted">{n.detail}</div>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** D3 radial confidence gauge (0-10000 bps → arc). Renders on desktop + mobile. */
export function ConfidenceGauge({ bps, verdictColor = "#8E9BFF", size = 168 }: { bps: number; verdictColor?: string; size?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pct = bpsToPct(bps);
    const svg = d3.select(el).attr("viewBox", `0 0 ${size} ${size * 0.62}`).attr("width", "100%").attr("height", size * 0.62);
    svg.selectAll("*").remove();
    const cx = size / 2, cy = size * 0.56, r = size * 0.42;
    const start = -Math.PI / 2 - Math.PI / 2, end = -Math.PI / 2 + Math.PI / 2; // 180° arc
    const arc = d3.arc().innerRadius(r - 11).outerRadius(r).startAngle(start);
    svg.append("path").attr("transform", `translate(${cx},${cy})`).attr("d", arc({ endAngle: end } as never) as string)
      .attr("fill", "#1B1F24");
    const frac = pct / 100;
    const valEnd = start + (end - start) * frac;
    const fg = svg.append("path").attr("transform", `translate(${cx},${cy})`).attr("fill", verdictColor);
    const i = d3.interpolate(start, valEnd);
    fg.transition().duration(650).attrTween("d", () => (tt) => arc({ endAngle: i(tt) } as never) as string);
    svg.append("text").attr("x", cx).attr("y", cy - 6).attr("text-anchor", "middle").attr("fill", "#E8EBEF")
      .attr("font-size", size * 0.2).attr("font-weight", 700).attr("font-family", "ui-monospace, monospace").text(`${pct}%`);
    svg.append("text").attr("x", cx).attr("y", cy + 12).attr("text-anchor", "middle").attr("fill", "#9BA4AE")
      .attr("font-size", 10).attr("letter-spacing", 1).text("CONFIDENCE");
  }, [bps, verdictColor, size]);
  return <svg ref={ref} role="img" aria-label="Confidence gauge" />;
}

/** D3 horizontal reputation bars for the reputation board. */
export function ReputationBars({ reporters }: { reporters: Reputation[] }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const data = [...reporters].sort((a, b) => b.reputationBps - a.reputationBps).slice(0, 12);
    const W = 640, rowH = 30, M = { top: 8, right: 64, bottom: 8, left: 120 };
    const H = M.top + M.bottom + Math.max(1, data.length) * rowH;
    const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").attr("height", H);
    svg.selectAll("*").remove();
    if (data.length === 0) {
      svg.append("text").attr("x", W / 2).attr("y", H / 2).attr("text-anchor", "middle").attr("fill", "#5C656F").attr("font-size", 12).text("no reporters yet");
      return;
    }
    const x = d3.scaleLinear().domain([0, 10000]).range([M.left, W - M.right]);
    [0, 5000, 10000].forEach((t) => {
      svg.append("line").attr("x1", x(t)).attr("x2", x(t)).attr("y1", M.top).attr("y2", H - M.bottom).attr("stroke", "#262B31").attr("stroke-width", 1);
    });
    const rows = svg.append("g").selectAll("g").data(data).join("g").attr("transform", (_d, i) => `translate(0,${M.top + i * rowH})`);
    rows.append("text").attr("x", 8).attr("y", rowH / 2 + 4).attr("fill", "#9BA4AE").attr("font-size", 11)
      .attr("font-family", "ui-monospace, monospace").text((d) => truncateHex(d.address, 6, 4));
    rows.append("rect").attr("x", x(0)).attr("y", 6).attr("height", rowH - 12).attr("rx", 3)
      .attr("fill", "#8E9BFF").attr("fill-opacity", 0.85)
      .attr("width", 0)
      .transition().duration(600).attr("width", (d) => x(d.reputationBps) - x(0));
    rows.append("text").attr("x", W - M.right + 8).attr("y", rowH / 2 + 4).attr("fill", "#E8EBEF").attr("font-size", 11)
      .attr("font-family", "ui-monospace, monospace").text((d) => `${(d.reputationBps / 100).toFixed(0)}%`);
  }, [reporters]);
  return <svg ref={ref} role="img" aria-label="Reputation board" />;
}
