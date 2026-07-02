"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { gsap } from "gsap";
import { LANES } from "@/lib/types";
import type { TNode } from "@/lib/nodes";

const LANE_H = 46;
const PAD = { top: 14, right: 28, bottom: 22, left: 132 };

/** Horizontal multi-lane D3 incident timeline. Renders nodes per lane along a time axis. */
export function IncidentTimeline({ nodes, selectedKey, onSelect }: { nodes: TNode[]; selectedKey?: string | null; onSelect?: (n: TNode) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [w, setW] = useState(900);
  const [tip, setTip] = useState<{ x: number; y: number; n: TNode } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(Math.max(560, Math.floor(e.contentRect.width)));
    });
    ro.observe(el);
    setW(Math.max(560, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const H = PAD.top + PAD.bottom + LANE_H * LANES.length;
    const svg = d3.select(el).attr("viewBox", `0 0 ${w} ${H}`).attr("width", "100%").attr("height", H);
    svg.selectAll("*").remove();

    // lane bands + labels
    LANES.forEach((lane, i) => {
      const y = PAD.top + i * LANE_H;
      svg.append("rect").attr("x", 0).attr("y", y).attr("width", w).attr("height", LANE_H)
        .attr("fill", i % 2 === 0 ? "#101216" : "#15181C").attr("opacity", 0.7);
      svg.append("line").attr("x1", PAD.left).attr("x2", w - PAD.right).attr("y1", y + LANE_H).attr("y2", y + LANE_H)
        .attr("stroke", "#262B31").attr("stroke-width", 1);
      svg.append("text").attr("x", 14).attr("y", y + LANE_H / 2 + 4).attr("fill", "#9BA4AE")
        .attr("font-size", 11).attr("font-weight", 600).text(lane);
      svg.append("line").attr("x1", PAD.left).attr("x2", PAD.left).attr("y1", PAD.top).attr("y2", PAD.top + LANE_H * LANES.length)
        .attr("stroke", "#262B31").attr("stroke-width", 1);
    });

    if (nodes.length === 0) {
      svg.append("text").attr("x", (PAD.left + w) / 2).attr("y", PAD.top + LANE_H * LANES.length / 2)
        .attr("text-anchor", "middle").attr("fill", "#5C656F").attr("font-size", 12).text("no timeline events yet");
      return;
    }

    const ts = nodes.map((n) => n.t);
    const min = Math.min(...ts), max = Math.max(...ts);
    const x = d3.scaleLinear().domain(min === max ? [min - 1, max + 1] : [min, max]).range([PAD.left + 26, w - PAD.right - 78]);
    const laneY = (lane: string) => PAD.top + LANES.indexOf(lane as never) * LANE_H + LANE_H / 2;

    // connector path through chronological nodes
    const line = d3.line<TNode>().x((n) => x(n.t)).y((n) => laneY(n.lane)).curve(d3.curveMonotoneX);
    svg.append("path").datum(nodes).attr("fill", "none").attr("stroke", "#333A42").attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "2 4").attr("d", line);

    const g = svg.append("g");
    const sel = g.selectAll("g.node").data(nodes, (d: any) => d.key).join("g").attr("class", "node").style("cursor", "pointer");
    sel.attr("transform", (n) => `translate(${x(n.t)},${laneY(n.lane)})`);
    sel.append("circle").attr("r", (n) => (n.key === selectedKey ? 9 : 6.5))
      .attr("fill", (n) => n.color).attr("fill-opacity", 0.22)
      .attr("stroke", (n) => n.color).attr("stroke-width", (n) => (n.key === selectedKey ? 2.5 : 1.6));
    sel.append("circle").attr("r", 2.4).attr("fill", (n) => n.color);
    // per-lane label dodge: alternate label above/below when nodes are horizontally close
    const dyByKey = new Map<string, number>();
    LANES.forEach((lane) => {
      const inLane = nodes.filter((n) => n.lane === lane).sort((a, b2) => x(a.t) - x(b2.t));
      let lastX = -1e9, slot = 0;
      for (const n of inLane) {
        const nx = x(n.t);
        if (nx - lastX < 78) slot = slot === 0 ? 1 : 0; else slot = 0;
        dyByKey.set(n.key, slot === 0 ? 3.5 : -10);
        lastX = nx;
      }
    });
    const rightEdge = w - PAD.right - 90;
    sel.append("text")
      .attr("x", (n) => (x(n.t) > rightEdge ? -11 : 11))
      .attr("text-anchor", (n) => (x(n.t) > rightEdge ? "end" : "start"))
      .attr("y", (n) => dyByKey.get(n.key) ?? 3.5).attr("fill", "#C9D0D8").attr("font-size", 10)
      .text((n) => (n.label.length > 20 ? n.label.slice(0, 19) + "…" : n.label));

    sel.on("mouseenter", function (event, n) {
      const [mx, my] = d3.pointer(event, wrapRef.current);
      setTip({ x: mx, y: my, n });
    }).on("mousemove", function (event, n) {
      const [mx, my] = d3.pointer(event, wrapRef.current);
      setTip({ x: mx, y: my, n });
    }).on("mouseleave", () => setTip(null))
      .on("click", (_e, n) => onSelect?.(n));

    // GSAP entrance
    gsap.fromTo(sel.nodes(), { opacity: 0, scale: 0.4, transformOrigin: "center" }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.04, ease: "back.out(1.7)" });
  }, [nodes, w, selectedKey, onSelect]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg ref={svgRef} role="img" aria-label="Incident timeline" />
      {tip && (
        <div className="pointer-events-none absolute z-20 max-w-[280px] panel2 px-2.5 py-1.5 text-xs shadow-pop"
          style={{ left: Math.min(tip.x + 12, (wrapRef.current?.clientWidth ?? 600) - 280), top: tip.y + 12 }}>
          <div className="font-semibold text-ink">{tip.n.lane} | {tip.n.label}</div>
          <div className="mt-0.5 text-muted">{tip.n.detail}</div>
        </div>
      )}
    </div>
  );
}
