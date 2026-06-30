// final-scene.jsx — Animated simulation scene for the Final Phase.
// Uses Stage + useTime() from animations.jsx. Must load after animations.jsx.

const FINAL_CYCLE_DUR  = 2.0;   // seconds per simulation cycle
const FINAL_INTRO_DUR  = 2.2;   // intro hold before cycles start

const FSW = 1920, FSH = 1080;

// ── Zone layout ─────────────────────────────────────────────────────────────
const FS_ZONE_W    = 278;
const FS_ZONE_GAP  = 14;
const FS_ZONES_TOP = 228;
const FS_ZONE_HDR  = 66;
const FS_CARD_H    = 80;
const FS_CARD_GAP  = 7;
const FS_CARD_W    = FS_ZONE_W - 18; // inner card width

// 6 zones: total = 6*278 + 5*14 = 1668+70 = 1738; left = (1920-1738)/2 = 91
const FS_ZONES_LEFT = Math.round((FSW - (6 * FS_ZONE_W + 5 * FS_ZONE_GAP)) / 2);

const FS_ZONE_DEFS = [
  { key: 'inactive',   label: 'INATIVO',   sub: 'Não chegou ainda',    bg:'#F9FAFB', border:'#D1D5DB', accent:'#6B7280', hdr:'#F3F4F6' },
  { key: 'queueA',     label: 'FILA A',    sub: 'Prioridade alta',     bg:'#EFF6FF', border:'#93C5FD', accent:'#1D4ED8', hdr:'#DBEAFE' },
  { key: 'running',    label: 'CPU',       sub: 'Executando',          bg:'#F0FDF4', border:'#4ADE80', accent:'#15803D', hdr:'#DCFCE7' },
  { key: 'queueB',     label: 'FILA B',    sub: 'Prioridade baixa',    bg:'#F5F3FF', border:'#A78BFA', accent:'#6D28D9', hdr:'#EDE9FE' },
  { key: 'blocked',    label: 'BLOQUEADO', sub: 'Aguardando E/S',      bg:'#FFF1F2', border:'#FCA5A5', accent:'#B91C1C', hdr:'#FEE2E2' },
  { key: 'terminated', label: 'TERMINADO', sub: 'Finalizado',          bg:'#F8FAFC', border:'#CBD5E1', accent:'#475569', hdr:'#F1F5F9' },
];

const FS_PROC_COLORS = ['#4A7FE8', '#47A96A', '#E8794A', '#B85AC4', '#E8A825'];

const FS_GANTT_COLORS = {
  'E': { bg: '#86EFAC', fg: '#14532D' },
  'A': { bg: '#93C5FD', fg: '#1E3A8A' },
  'B': { bg: '#C4B5FD', fg: '#3B0764' },
  'X': { bg: '#FCA5A5', fg: '#7F1D1D' },
  '.': { bg: '#F3F4F6', fg: '#9CA3AF' },
};

// ── Utility: zone X position ────────────────────────────────────────────────
function fsZoneX(key) {
  const i = FS_ZONE_DEFS.findIndex(z => z.key === key);
  return FS_ZONES_LEFT + i * (FS_ZONE_W + FS_ZONE_GAP);
}

// ── Utility: derive zone key from engine data ───────────────────────────────
function fsDeriveZone(gantt, proc, cycle) {
  if (cycle < 0 || cycle < proc.arrival) return 'inactive';
  const c = Math.min(cycle, gantt[proc.id].length - 1);
  const sym = gantt[proc.id][c];
  if (sym === 'E') return 'running';
  if (sym === 'A') return 'queueA';
  if (sym === 'B') return 'queueB';
  if (sym === 'X') return 'blocked';
  return 'terminated'; // '.' after arrival
}

// ── Utility: compute termination cycle per process ──────────────────────────
function fsComputeTermCycles(gantt, procs) {
  const out = {};
  procs.forEach(p => {
    let hadActive = false;
    for (let i = 0; i < gantt[p.id].length; i++) {
      const s = gantt[p.id][i];
      if (s !== '.') { hadActive = true; }
      else if (hadActive) { out[p.id] = i; break; }
    }
    if (!(p.id in out)) out[p.id] = Infinity;
  });
  return out;
}

// ── Utility: slot index within a zone ──────────────────────────────────────
function fsSlotIndex(zone, procId, procs, snapshots, termCycles, cycle) {
  const c = Math.max(0, Math.min(cycle, snapshots.length - 1));
  const snap = snapshots[c];

  if (zone === 'running') return 0;

  if (zone === 'queueA') {
    const i = snap.queueA.indexOf(procId);
    return Math.max(0, i);
  }
  if (zone === 'queueB') {
    const i = snap.queueB.indexOf(procId);
    return Math.max(0, i);
  }
  if (zone === 'blocked') {
    const i = snap.blocked.findIndex(b => b.id === procId);
    return Math.max(0, i);
  }
  if (zone === 'inactive') {
    const inactive = procs
      .filter(p => cycle < 0 ? true : cycle < p.arrival)
      .sort((a, b) => a.arrival - b.arrival);
    const i = inactive.findIndex(p => p.id === procId);
    return Math.max(0, i);
  }
  if (zone === 'terminated') {
    const order = procs
      .filter(p => (termCycles[p.id] ?? Infinity) <= c)
      .sort((a, b) => (termCycles[a.id] ?? Infinity) - (termCycles[b.id] ?? Infinity));
    const i = order.findIndex(p => p.id === procId);
    return Math.max(0, i);
  }
  return 0;
}

// ── Utility: card top-left position given zone + slot ──────────────────────
function fsCardPos(zone, slot) {
  return {
    x: fsZoneX(zone) + 9,
    y: FS_ZONES_TOP + FS_ZONE_HDR + slot * (FS_CARD_H + FS_CARD_GAP),
  };
}

// ── Gantt chart ─────────────────────────────────────────────────────────────
function FinalGanttChart({ gantt, procs, displayCycles, currentCycle, cycleFrac }) {
  const GL = 80;                          // left margin
  const GR = FSW - 80;                    // right margin
  const GY = 66;                          // top of chart area
  const ROW_H = 20, ROW_GAP = 4;
  const HDR_H = 20;                       // cycle number row height
  const cellW = (GR - GL) / displayCycles;

  const curInt = Math.min(Math.floor(currentCycle), displayCycles - 1);
  // How much of the current cell is filled
  const fillFrac = currentCycle >= displayCycles ? 1 : Math.min(1, cycleFrac / 0.75);

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: FSW, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', left: GL, top: GY - 18,
        fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700,
        color: '#9CA3AF', letterSpacing: '0.13em', textTransform: 'uppercase',
      }}>Diagrama de Gantt</div>

      {/* Legend */}
      <div style={{
        position: 'absolute', left: GL, top: GY - 18,
        right: 80, display: 'flex', justifyContent: 'flex-end', gap: 14,
        fontFamily: 'Inter, sans-serif', fontSize: 10, alignItems: 'center',
      }}>
        {Object.entries({ E:'Executando', A:'Fila A', B:'Fila B', X:'Bloqueado', '.':'Inativo' }).map(([sym, lbl]) => (
          <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 10, borderRadius: 2, background: FS_GANTT_COLORS[sym].bg }} />
            <span style={{ color: '#6B7280' }}>{sym}={lbl}</span>
          </div>
        ))}
      </div>

      <svg style={{
        position: 'absolute', left: 0, top: GY,
        width: FSW, height: HDR_H + procs.length * (ROW_H + ROW_GAP) + 8,
        overflow: 'visible',
      }}>
        {/* Cycle number headers */}
        {Array.from({ length: displayCycles }).map((_, c) => (
          <text key={c}
            x={GL + c * cellW + cellW / 2} y={HDR_H - 4}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize={9} fontWeight={curInt === c ? 800 : 400}
            fill={curInt === c ? '#DC2626' : '#9CA3AF'}
          >{c}</text>
        ))}

        {/* Process rows */}
        {procs.map((p, pi) => {
          const rowY = HDR_H + pi * (ROW_H + ROW_GAP);
          const color = FS_PROC_COLORS[pi];
          return (
            <g key={p.id}>
              <text x={GL - 8} y={rowY + ROW_H / 2 + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace" fontSize={11} fontWeight={700}
                fill={color}>{p.id}</text>
              {/* Background track */}
              <rect x={GL} y={rowY} width={displayCycles * cellW} height={ROW_H}
                fill="#F9FAFB" stroke="#E5E7EB" strokeWidth={0.5} rx={2} />
              {/* Filled cells */}
              {Array.from({ length: curInt + 1 }).map((_, c) => {
                if (c >= displayCycles) return null;
                const sym = gantt[p.id][c] || '.';
                const col = FS_GANTT_COLORS[sym] || FS_GANTT_COLORS['.'];
                const isCur = c === curInt;
                const w = isCur ? cellW * fillFrac : cellW;
                if (w < 0.5) return null;
                return (
                  <rect key={c}
                    x={GL + c * cellW + 0.5} y={rowY + 1}
                    width={Math.max(0, w - 1)} height={ROW_H - 2}
                    fill={col.bg} rx={1.5} />
                );
              })}
            </g>
          );
        })}

        {/* Red playhead cursor */}
        {(() => {
          const cx = GL + Math.min(currentCycle, displayCycles - 0.5) * cellW;
          const totalRowH = procs.length * (ROW_H + ROW_GAP);
          return (
            <g>
              <polygon points={`${cx-5},${-2} ${cx+5},${-2} ${cx},${8}`} fill="#DC2626" />
              <line x1={cx} y1={8} x2={cx} y2={HDR_H + totalRowH} stroke="#DC2626" strokeWidth={1.5} opacity={0.35} />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ── Zone background panels ──────────────────────────────────────────────────
function FinalZonePanels() {
  const panelH = FSH - FS_ZONES_TOP - 100; // leaves room for narration
  return (
    <>
      {FS_ZONE_DEFS.map(z => (
        <div key={z.key} style={{
          position: 'absolute',
          left: fsZoneX(z.key), top: FS_ZONES_TOP,
          width: FS_ZONE_W, height: panelH,
          background: z.bg,
          border: `1.5px solid ${z.border}`,
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          <div style={{
            background: z.hdr,
            borderBottom: `1px solid ${z.border}`,
            padding: '12px 14px 10px',
            height: FS_ZONE_HDR,
            boxSizing: 'border-box',
          }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.16em', color: z.accent, textTransform: 'uppercase',
            }}>{z.label}</div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: z.accent,
              opacity: 0.65, marginTop: 3, fontWeight: 500,
            }}>{z.sub}</div>
          </div>
        </div>
      ))}
    </>
  );
}

// ── Individual process card ─────────────────────────────────────────────────
function FinalProcCard({ proc, procIdx, procs, gantt, snapshots, termCycles, displayCycles, cycle }) {
  const cycleFrac = cycle - Math.floor(cycle);
  const curC  = Math.min(Math.max(0, Math.floor(cycle)), displayCycles - 1);
  const prevC = Math.max(-1, curC - 1);

  // During intro (cycle < 0) treat everything as pre-simulation (-1)
  const effectiveCur  = cycle < 0 ? -1 : curC;
  const effectivePrev = cycle < 0 ? -1 : Math.max(0, prevC);

  const curZone  = fsDeriveZone(gantt, proc, effectiveCur);
  const prevZone = fsDeriveZone(gantt, proc, effectivePrev);

  const curSlot  = fsSlotIndex(curZone,  proc.id, procs, snapshots, termCycles, effectiveCur);
  const prevSlot = fsSlotIndex(prevZone, proc.id, procs, snapshots, termCycles, effectivePrev);

  const curPos  = fsCardPos(curZone,  curSlot);
  const prevPos = fsCardPos(prevZone, prevSlot);

  // Smooth transition: hold at prev until 0.45 into the cycle, then ease to target
  const SWITCH = 0.45;
  const rawT = cycleFrac < SWITCH ? 0 : (cycleFrac - SWITCH) / (1 - SWITCH);
  const eased = Easing.easeInOutCubic(Math.min(1, rawT));

  const x = prevPos.x + (curPos.x - prevPos.x) * eased;
  const y = prevPos.y + (curPos.y - prevPos.y) * eased;

  // Display zone for styling (switches midway through move)
  const dispZone = eased < 0.5 ? prevZone : curZone;
  const zoneDef  = FS_ZONE_DEFS.find(z => z.key === dispZone) || FS_ZONE_DEFS[0];
  const color    = FS_PROC_COLORS[procIdx];

  // Progress bar
  const execSoFar = gantt[proc.id].slice(0, curC + 1).filter(s => s === 'E').length;
  const progress  = proc.totalCycles > 0 ? execSoFar / proc.totalCycles : 0;

  // IO info for blocked card
  const snap = snapshots[Math.max(0, curC)];
  const blockedInfo = snap?.blocked?.find(b => b.id === proc.id);

  const isRunning = dispZone === 'running';

  return (
    <div style={{
      position: 'absolute',
      left: 0, top: 0,
      width: FS_CARD_W, height: FS_CARD_H - 3,
      transform: `translate(${x}px, ${y}px)`,
      boxSizing: 'border-box',
      background: '#fff',
      border: `2px solid ${color}`,
      borderRadius: 10,
      boxShadow: isRunning
        ? `0 0 0 4px ${color}44, 0 4px 18px rgba(0,0,0,0.14)`
        : '0 1px 5px rgba(0,0,0,0.07)',
      padding: '9px 12px',
      display: 'flex', flexDirection: 'column', gap: 7,
      fontFamily: 'Inter, sans-serif',
      willChange: 'transform',
      zIndex: isRunning ? 10 : 1,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, flexShrink: 0,
          }}>{proc.id}</div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>
              {proc.type === 'cpu-bound' ? 'CPU-bound' : 'IO-bound'}
            </div>
            <div style={{ fontSize: 10, color: '#666' }}>
              {proc.totalCycles}c · chega t={proc.arrival}
            </div>
          </div>
        </div>
        {/* State badge */}
        <div style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
          background: zoneDef.hdr, color: zoneDef.accent,
          border: `1px solid ${zoneDef.border}`,
          fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap',
        }}>
          {dispZone === 'blocked' && blockedInfo
            ? `E/S →t${blockedInfo.blockedUntil}`
            : zoneDef.label}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          flex: 1, height: 5, borderRadius: 3, background: '#F0F0F0', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: dispZone === 'terminated' ? '#94A3B8' : color,
            borderRadius: 3, transition: 'none',
          }} />
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: '#6B7280', minWidth: 38, textAlign: 'right',
        }}>{execSoFar}/{proc.totalCycles}c</div>
      </div>
    </div>
  );
}

// ── Title bar ───────────────────────────────────────────────────────────────
function FinalSceneHeader({ currentCycle, displayCycles }) {
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: FSW, height: 56, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', left: 40, top: 16,
        fontFamily: 'Inter, sans-serif', fontSize: 22, fontWeight: 800,
        color: '#111', letterSpacing: '-0.02em',
      }}>
        Fase Final
        <span style={{ color: '#9CA3AF', fontSize: 17, fontWeight: 500 }}>
          {' '}· Filas Múltiplas com Retroalimentação
        </span>
      </div>
      <div style={{
        position: 'absolute', right: 40, top: 20,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 17, color: '#525252',
        fontVariantNumeric: 'tabular-nums',
      }}>
        ciclo {String(Math.max(0, Math.floor(currentCycle))).padStart(2, '0')} / {displayCycles - 1}
      </div>
    </div>
  );
}

// ── Narration bar ───────────────────────────────────────────────────────────
const FS_NARRATIONS = [
  { s: 0,   e: 6,   t: 'Fase Final: escalonamento com filas de múltiplos níveis (feedback scheduling). Dois níveis: Fila A (alta prioridade) e Fila B (baixa prioridade). Novos processos entram sempre na Fila A.' },
  { s: 6,   e: 14,  t: 'O escalonador usa Round Robin interno com quantum = 2 ciclos. Ao esgotar o quantum, o processo volta ao fim da mesma fila. Ao consumir o quantum total da fila (A=6, B=4 ciclos), migra para a Fila B.' },
  { s: 14,  e: 24,  t: 'Processos IO-bound (P2, P3, P5) solicitam E/S após certos ciclos de CPU. Ficam bloqueados por 3 ciclos e retornam à Fila A — prioridade restaurada após cada E/S.' },
  { s: 24,  e: 38,  t: 'Fila A tem prioridade absoluta sobre a Fila B. Um processo em Fila B só executa quando a Fila A está completamente vazia. Isso garante que processos IO-bound sejam atendidos rapidamente.' },
  { s: 38,  e: 54,  t: 'Observe os processos CPU-bound (P1, P4) migrando para a Fila B após consumir seu quantum de fila. Eles ficam com prioridade reduzida, cedendo espaço para processos interativos.' },
  { s: 54,  e: 72,  t: 'Este esquema favorece processos interativos ao restaurar prioridade após E/S. CPU-bound são "penalizados" gradualmente, similar ao que o sistema operacional Unix histórico usava.' },
  { s: 72,  e: 999, t: 'Gantt: E=Executando na CPU, A=Aguardando na Fila A, B=Aguardando na Fila B, X=Bloqueado em E/S, .=Inativo. Observe a dinâmica completa de escalonamento com retroalimentação.' },
];

function FinalNarrationBar({ time }) {
  const fact = FS_NARRATIONS.find(f => time >= f.s && time < f.e)
    || FS_NARRATIONS[FS_NARRATIONS.length - 1];
  return (
    <div style={{
      position: 'absolute',
      left: 40, right: 40, bottom: 18,
      background: '#1a1a1a',
      borderRadius: 12,
      padding: '14px 22px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 15,
        background: '#FCD34D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 16,
      }}>💡</div>
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 500,
        color: '#fafafa', lineHeight: 1.4,
      }}>{fact.t}</div>
    </div>
  );
}

// ── Main scene component ────────────────────────────────────────────────────
function FinalSimulationScene({ engineResult }) {
  const time = useTime();
  const { gantt, snapshots } = engineResult;
  const procs        = window.FinalEngine.PROCESSES;
  const displayCycles = window.FinalEngine.DISPLAY_CYCLES;

  const termCycles = React.useMemo(
    () => fsComputeTermCycles(gantt, procs),
    [gantt, procs]
  );

  // rawStep: negative during intro, 0..displayCycles during playback
  const rawStep     = (time - FINAL_INTRO_DUR) / FINAL_CYCLE_DUR;
  const clampedStep = Math.min(rawStep, displayCycles);
  const currentCycle = Math.max(0, clampedStep);
  const cycleFrac    = currentCycle - Math.floor(currentCycle);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <FinalSceneHeader currentCycle={currentCycle} displayCycles={displayCycles} />

      <FinalGanttChart
        gantt={gantt}
        procs={procs}
        displayCycles={displayCycles}
        currentCycle={currentCycle}
        cycleFrac={cycleFrac}
      />

      <FinalZonePanels />

      {procs.map((p, i) => (
        <FinalProcCard
          key={p.id}
          proc={p}
          procIdx={i}
          procs={procs}
          gantt={gantt}
          snapshots={snapshots}
          termCycles={termCycles}
          displayCycles={displayCycles}
          cycle={clampedStep}
        />
      ))}

      <FinalNarrationBar time={time} />
    </div>
  );
}

// Export to window for use in final.html
Object.assign(window, {
  FinalSimulationScene,
  FINAL_CYCLE_DUR,
  FINAL_INTRO_DUR,
});
