import { useEffect, useMemo, useState } from 'react';
import { Activity, Eye, Fingerprint, Gauge, MousePointer2, ShieldCheck, Timer, Zap } from 'lucide-react';
import { createBrowserGait } from '@gaitjs/browser';
import type { GaitSnapshot } from '@gaitjs/core';

const emptySnapshot: GaitSnapshot = {
  schemaVersion: '1.0', libraryVersion: '0.1.0', capturedAt: { durationMs: 0, startedAtMonotonicMs: 0 },
  signals: {
    keyboard: { eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, unmatchedKeyCount: 0 },
    pointer: { eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, sampleCount: 0, distancePx: 0, downCount: 0, upCount: 0, clickCount: 0 },
    touch: { eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, sampleCount: 0, distancePx: 0 },
    wheel: { eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, deltaX: 0, deltaY: 0, deltaZ: 0, pixelCount: 0, lineCount: 0, pageCount: 0, wheelCount: 0 },
    context: { eventsSeen: 0, eventsAccepted: 0, eventsRejected: 0, focusMs: 0, blurCount: 0, visibilityGapMs: 0 },
  },
  quality: { confidence: { score: 0, level: 'low', degradationReasons: ['insufficient_sample'] } },
};

function format(value: number | undefined, digits = 0) { return value === undefined || !Number.isFinite(value) ? '—' : value.toFixed(digits); }

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const points = values.length < 2 ? '0,28 100,28' : values.map((value, index) => `${(index / (values.length - 1)) * 100},${28 - Math.min(25, value * 22)}`).join(' ');
  return <svg aria-hidden="true" className="h-8 w-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points={points} fill="none" stroke={color} strokeWidth="1.7" vectorEffect="non-scaling-stroke" /></svg>;
}

export default function LiveMetricsDemo() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const gait = createBrowserGait({ includeWheel: true });
    const unsubscribe = gait.subscribe((next) => {
      setSnapshot(next);
      setSpeedHistory((history) => [...history.slice(-23), next.signals.pointer.speedPxPerMs?.mean ?? 0]);
    });
    gait.start();
    setReady(true);
    const interval = window.setInterval(() => gait.flush(), 250);
    return () => { window.clearInterval(interval); unsubscribe(); gait.destroy(); };
  }, []);

  const confidence = Math.round(snapshot.quality.confidence.score * 100);
  const confidenceColor = confidence >= 80 ? '#52e5d0' : confidence >= 50 ? '#f6c76b' : '#fb7185';
  const stats = useMemo(() => [
    { label: 'Dwell time', value: `${format(snapshot.signals.keyboard.dwellTimeMs?.mean)} ms`, detail: `p95 ${format(snapshot.signals.keyboard.dwellTimeMs?.p95)} ms`, icon: Timer, color: '#52e5d0' },
    { label: 'Flight time', value: `${format(snapshot.signals.keyboard.flightTimeMs?.mean)} ms`, detail: `p95 ${format(snapshot.signals.keyboard.flightTimeMs?.p95)} ms`, icon: Zap, color: '#9b8cff' },
    { label: 'Pointer speed', value: `${format(snapshot.signals.pointer.speedPxPerMs?.mean, 2)} px/ms`, detail: `${snapshot.signals.pointer.sampleCount} samples`, icon: MousePointer2, color: '#f6c76b' },
    { label: 'Events accepted', value: String(snapshot.signals.keyboard.eventsAccepted + snapshot.signals.pointer.eventsAccepted), detail: `${snapshot.signals.keyboard.eventsRejected + snapshot.signals.pointer.eventsRejected} rejected`, icon: Activity, color: '#fb7185' },
  ], [snapshot]);

  return <section id="demo" aria-labelledby="demo-title" className="glass relative overflow-hidden rounded-[2rem] p-5 sm:p-7">
    <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#52e5d0]/10 blur-3xl" />
    <div className="relative flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[#52e5d0]"><span className={`h-2 w-2 rounded-full ${ready ? 'animate-pulse bg-[#52e5d0]' : 'bg-slate-600'}`} /> live capture</div><h2 id="demo-title" className="display text-2xl font-semibold text-white sm:text-3xl">Feel the signal.</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">Move, type, click. The browser is computing the same aggregates your integration would receive.</p></div><div className="flex items-center gap-2 rounded-full border border-[#52e5d0]/20 bg-[#52e5d0]/[.06] px-3 py-2 text-xs text-[#b8fff5]"><Eye size={14} /> local demo · nothing is sent</div></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, detail, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-white/[.07] bg-black/20 p-4"><div className="mb-5 flex items-center justify-between"><span className="text-xs text-slate-400">{label}</span><Icon size={15} color={color} /></div><div className="text-xl font-semibold text-white">{value}</div><div className="mt-1 text-xs text-slate-500">{detail}</div></div>)}</div>
      <div className="grid gap-3 lg:grid-cols-[1.3fr_.7fr]"><div className="rounded-2xl border border-white/[.07] bg-black/20 p-4"><div className="mb-2 flex items-center justify-between"><div><div className="text-xs text-slate-400">Pointer velocity</div><div className="mt-1 text-sm text-slate-300">Rolling signal, published every 250 ms</div></div><Gauge size={18} color="#f6c76b" /></div><Sparkline values={speedHistory} color="#f6c76b" /></div><div className="rounded-2xl border border-white/[.07] bg-black/20 p-4"><div className="flex items-center justify-between"><div><div className="text-xs text-slate-400">Capture confidence</div><div className="mt-1 text-3xl font-semibold" style={{ color: confidenceColor }}>{confidence}%</div></div><ShieldCheck size={22} color={confidenceColor} /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${confidence}%`, backgroundColor: confidenceColor }} /></div><div className="mt-2 text-xs text-slate-500">{snapshot.quality.confidence.degradationReasons[0] ?? 'clean observation window'}</div></div></div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[.07] pt-4 text-xs text-slate-500"><span><strong className="text-slate-300">{snapshot.signals.pointer.clickCount}</strong> clicks</span><span><strong className="text-slate-300">{snapshot.signals.wheel.wheelCount}</strong> wheel events</span><span><strong className="text-slate-300">{snapshot.signals.touch.sampleCount}</strong> touch samples</span><span><strong className="text-slate-300">{format(snapshot.capturedAt.durationMs / 1000, 1)}s</strong> local window</span><span className="ml-auto inline-flex items-center gap-1.5 text-slate-400"><Fingerprint size={13} /> correlation signal, not identity</span></div>
    </div>
  </section>;
}
