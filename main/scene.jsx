// scene.jsx — Cena de simulação genérica para todos os algoritmos de escalonamento.
// Versão parametrizada de rr-scene.jsx. Funciona com FIFO, SJF, SRTF e Round Robin.

const CYCLE_DURATION = 2.2;
const INTRO_DURATION = 2.5;

const STAGE_W = 1920;
const STAGE_H = 1080;

const GANTT_Y = 90;
const GANTT_ROW_H = 20;
const GANTT_ROW_GAP = 3;

const TL_Y = 250;
const TL_X_START = 80;
const TL_X_END = 1840;
const TL_CELL_H = 40;

const MODAL_Y = 340;
const MODAL_H = 640;
const MODAL_W = 344;
const MODAL_GAP = 20;
const MODAL_X_START = 40;

const MODALS = [
  { key: 'new',        title: 'NOVO',        subtitle: 'Recém-criado',        hint: 'Processo acabou de chegar ao sistema' },
  { key: 'ready',      title: 'APTO',      subtitle: 'Aguardando CPU',      hint: 'Fila de aptos — próximo a executar' },
  { key: 'running',    title: 'EXECUTANDO',  subtitle: 'Na CPU',              hint: 'Usando a CPU neste ciclo' },
  { key: 'blocked',    title: 'BLOQUEADO',   subtitle: 'Esperando E/S',       hint: 'Aguardando operação de entrada/saída' },
  { key: 'terminated', title: 'ENCERRADO',   subtitle: 'Finalizado',          hint: 'Completou toda a sua execução' },
];

const MODAL_COLORS = {
  new:        { bg: '#FAFAFA', border: '#D4D4D4', accent: '#737373' },
  ready:      { bg: '#FEF9E7', border: '#F5D76E', accent: '#B7950B' },
  running:    { bg: '#E8F5E9', border: '#66BB6A', accent: '#2E7D32' },
  blocked:    { bg: '#FDECEC', border: '#EF9A9A', accent: '#C62828' },
  terminated: { bg: '#ECEFF1', border: '#90A4AE', accent: '#455A64' },
};

// ── Metadados por algoritmo ────────────────────────────────────────────────────
const ALGO_META = {
  fifo: {
    title: 'Escalonamento FIFO',
    subtitle: 'First In, First Out · sem preempção',
  },
  sjf: {
    title: 'Escalonamento SJF',
    subtitle: 'Shortest Job First · sem preempção',
  },
  srtf: {
    title: 'Escalonamento SRTF',
    subtitle: 'Shortest Remaining Time First · preemptivo',
  },
  rr: {
    title: 'Escalonamento Round Robin',
    subtitle: (q) => `Round Robin · quantum = ${q} ciclos`,
  },
};

// ── Narração por algoritmo ─────────────────────────────────────────────────────
const ALGO_FACTS = {
  fifo: [
    { start: 0,   end: 12,  text: 'No FIFO, processos são executados na ordem em que chegaram. O primeiro a entrar na fila é o primeiro a usar a CPU.' },
    { start: 12,  end: 26,  text: 'Sem preempção: o processo em execução não pode ser interrompido. Ele roda até seu burst terminar completamente.' },
    { start: 26,  end: 44,  text: 'Processos que chegam enquanto a CPU está ocupada ficam no estado APTO, aguardando sua vez na fila FIFO.' },
    { start: 44,  end: 65,  text: 'Desvantagem do FIFO: processos longos bloqueiam todos os outros — é o "efeito comboio". Processos curtos esperam atrás de longos.' },
    { start: 65,  end: 130, text: 'Observe: cada processo executa completamente antes do próximo começar. Simples, porém não considera a duração dos processos.' },
  ],
  sjf: [
    { start: 0,   end: 13,  text: 'No SJF, quando a CPU fica livre, escolhe-se o processo com o menor burst total entre os que estão aptos.' },
    { start: 13,  end: 28,  text: 'SJF minimiza o tempo médio de espera — é matematicamente ótimo entre algoritmos não-preemptivos.' },
    { start: 28,  end: 50,  text: 'Processos que chegam enquanto a CPU está ocupada aguardam. O próximo a rodar é o de menor burst, não o que chegou primeiro.' },
    { start: 50,  end: 75,  text: 'Problema: starvation. Processos longos podem esperar indefinidamente se sempre chegarem processos mais curtos.' },
    { start: 75,  end: 130, text: 'Observe como processos curtos são priorizados quando a CPU fica livre, reduzindo o tempo médio de espera.' },
  ],
  srtf: [
    { start: 0,   end: 13,  text: 'SRTF é a versão preemptiva do SJF. A cada ciclo, o processo com o MENOR TEMPO RESTANTE recebe a CPU.' },
    { start: 13,  end: 28,  text: 'Quando um novo processo chega, o algoritmo compara seu burst com o tempo restante do processo atual.' },
    { start: 28,  end: 50,  text: 'Se o novo processo tiver menos tempo restante, o processo atual é preemptado: vai de volta para a fila APTO.' },
    { start: 50,  end: 72,  text: 'SRTF é ótimo em tempo médio de espera entre todos os algoritmos de escalonamento, inclusive os preemptivos.' },
    { start: 72,  end: 130, text: 'Desvantagem: alto overhead de trocas de contexto e risco de starvation para processos de longa duração.' },
  ],
  rr: [
    { start: 0,   end: 6,   text: 'No Round Robin, cada processo recebe um "quantum" — uma fatia fixa de tempo na CPU. Aqui, o quantum é de 3 ciclos.' },
    { start: 6,   end: 13,  text: 'Os processos chegam escalonadamente. Ao chegar, passam por NOVO e vão para o fim da fila de APTOS.' },
    { start: 13,  end: 20,  text: 'É uma fila FIFO: primeiro a chegar, primeiro a sair. O processo no início da fila recebe a CPU.' },
    { start: 20,  end: 28,  text: 'O processo pode rodar por até 3 ciclos antes de ser preemptado. Se terminar antes, libera a CPU imediatamente.' },
    { start: 28,  end: 36,  text: 'Quando o quantum expira, se ainda tem trabalho, o processo volta para o FIM da fila — nunca para o início!' },
    { start: 36,  end: 46,  text: 'Processos de E/S: após executar 1 ciclo, solicitam I/O e vão para BLOQUEADO por 3 ciclos.' },
    { start: 46,  end: 56,  text: 'Enquanto há processos bloqueados, a CPU não fica ociosa — outros processos continuam sendo escalonados.' },
    { start: 56,  end: 66,  text: 'Quando a E/S termina, o processo volta para o FIM da fila de aptos — não reassume imediatamente a CPU.' },
    { start: 66,  end: 78,  text: 'Processos CPU-bound apenas alternam entre APTO e EXECUTANDO até completar seu tempo total de CPU.' },
    { start: 78,  end: 92,  text: 'O Round Robin é justo: todos recebem fatias iguais. A desvantagem é o overhead das trocas de contexto frequentes.' },
    { start: 92,  end: 130, text: 'Observe os cards transitando entre os cinco estados até todos terminarem. Esta é a essência do Round Robin.' },
  ],
};

// ── Utilitários ────────────────────────────────────────────────────────────────

function computeTerminationOrder(timeline) {
  const order = {};
  let rank = 0;
  for (let i = 0; i < timeline.length; i++) {
    const snap = timeline[i];
    for (const pid of Object.keys(snap.procs)) {
      if (snap.procs[pid].state === 'terminated' && !(pid in order)) {
        order[pid] = rank++;
      }
    }
  }
  return order;
}

function computeBlockOrderAt(timeline, atCycle) {
  const entryCycle = {};
  for (let i = 0; i <= atCycle && i < timeline.length; i++) {
    const snap = timeline[i];
    const prev = i > 0 ? timeline[i - 1] : null;
    for (const pid of Object.keys(snap.procs)) {
      if (snap.procs[pid].state === 'blocked') {
        if (!prev || prev.procs[pid].state !== 'blocked') entryCycle[pid] = i;
      } else {
        if (pid in entryCycle && snap.procs[pid].state !== 'blocked') delete entryCycle[pid];
      }
    }
  }
  const sorted = Object.entries(entryCycle).sort((a, b) => a[1] - b[1]).map(e => Number(e[0]));
  return sorted;
}

function getModalX(key) {
  const idx = MODALS.findIndex(m => m.key === key);
  return MODAL_X_START + idx * (MODAL_W + MODAL_GAP);
}

function getProcessSlot(cycle, procId, timeline, termOrder, procIds) {
  if (!timeline || cycle < 0) return { state: 'new', slotIdx: 0, queuePos: -1 };
  const clamped = Math.min(cycle, timeline.length - 1);
  const snap = timeline[clamped];
  const p = snap.procs[procId];
  let slotIdx = 0, queuePos = -1;

  if (p.state === 'ready') {
    queuePos = snap.readyQueue.indexOf(procId);
    slotIdx = queuePos;
  } else if (p.state === 'blocked') {
    const blockedOrder = computeBlockOrderAt(timeline, clamped);
    slotIdx = Math.max(0, blockedOrder.indexOf(procId));
  } else if (p.state === 'terminated') {
    slotIdx = (termOrder && termOrder[procId] != null) ? termOrder[procId] : 0;
  } else if (p.state === 'running') {
    slotIdx = 0;
  } else if (p.state === 'new') {
    const ids = procIds || Object.keys(snap.procs).map(Number).sort((a, b) => a - b);
    const stillNew = ids.filter(id => snap.procs[id].state === 'new').sort((a, b) => a - b);
    slotIdx = stillNew.indexOf(procId);
    if (slotIdx < 0) slotIdx = ids.indexOf(procId);
  }

  return { state: p.state, slotIdx, queuePos, remaining: p.remaining, blockLeft: p.blockLeft, quantumLeft: p.quantumLeft };
}

function slotToXY(state, slotIdx, tweaks) {
  const tw = tweaks || {};
  const modalX = getModalX(state);
  const cardH = tw.cardHeight ?? 84;
  const gap = tw.cardGap ?? 14;
  const padH = tw.modalPaddingH ?? 22;
  const cardW = MODAL_W - padH * 2;
  const topOffset = tw.topOffset ?? 184;

  const x = modalX + padH;
  const y = MODAL_Y + topOffset + slotIdx * (cardH + gap);
  return { x, y, w: cardW, h: cardH };
}

// ── Componentes ────────────────────────────────────────────────────────────────

function GanttChart({ timeline, stepIdx, procs }) {
  const byCycle = React.useMemo(() => {
    const out = {};
    for (let i = 0; i < timeline.length; i++) {
      const e = timeline[i];
      if (e.cycle < 0) continue;
      if (!out[e.cycle] || e.running) out[e.cycle] = e;
    }
    return out;
  }, [timeline]);

  const cycles = React.useMemo(() => Object.keys(byCycle).map(Number).sort((a, b) => a - b), [byCycle]);
  const maxCycleNum = cycles[cycles.length - 1] ?? 0;
  const cellW = (TL_X_END - TL_X_START) / (maxCycleNum + 1);

  const curIdx = Math.min(Math.max(0, Math.floor(stepIdx)), timeline.length - 1);
  const curCycle = timeline[curIdx].cycle;
  const frac = Math.min(1, stepIdx - Math.floor(stepIdx));
  const finished = stepIdx >= timeline.length - 0.001;
  const fillCurrent = finished ? 1 : Math.max(0, Math.min(1, frac / 0.75));

  const colorFor = (state) => {
    if (state === 'running')    return { bg: '#66BB6A', fg: '#fff',    letter: 'R' };
    if (state === 'ready')      return { bg: '#FCEFA5', fg: '#7A5500', letter: 'P' };
    if (state === 'blocked')    return { bg: '#EF9A9A', fg: '#7A1A1A', letter: 'B' };
    if (state === 'new')        return { bg: '#EFEFEF', fg: '#737373', letter: 'N' };
    if (state === 'terminated') return { bg: '#B0BEC5', fg: '#fff',    letter: '✓' };
    return { bg: 'transparent', fg: '#000', letter: '' };
  };

  const HEADER_H = 22;
  const LEGEND_H = 18;
  const ROWS_TOP = GANTT_Y + HEADER_H + LEGEND_H + 6;
  const ROWS_H = procs.length * (GANTT_ROW_H + GANTT_ROW_GAP);

  const legendItems = [
    { bg: '#66BB6A', label: 'Executando (R)' },
    { bg: '#FCEFA5', label: 'Apto (P)' },
    { bg: '#EF9A9A', label: 'Bloqueado (B)' },
    { bg: '#EFEFEF', label: 'Novo (N)' },
    { bg: '#B0BEC5', label: 'Encerrado (✓)' },
  ];

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: STAGE_W, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', left: TL_X_START, top: GANTT_Y,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 12, fontWeight: 700, color: '#525252',
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>Diagrama de Gantt — execução ciclo a ciclo</div>

      <div style={{
        position: 'absolute', left: TL_X_START, top: GANTT_Y + HEADER_H,
        display: 'flex', gap: 16, alignItems: 'center',
        fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#525252',
      }}>
        {legendItems.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 10, borderRadius: 2, background: it.bg, border: '1px solid rgba(0,0,0,0.06)' }} />
            <span>{it.label}</span>
          </div>
        ))}
      </div>

      <svg style={{ position: 'absolute', left: 0, top: 0, width: STAGE_W, height: ROWS_TOP + ROWS_H + 10, overflow: 'visible' }}>
        {Array.from({ length: maxCycleNum + 2 }).map((_, c) => {
          const x = TL_X_START + c * cellW;
          return <line key={`g${c}`} x1={x} y1={ROWS_TOP - 2} x2={x} y2={ROWS_TOP + ROWS_H} stroke="#F0F0F0" strokeWidth={1} />;
        })}

        {procs.map((p, pi) => {
          const y = ROWS_TOP + pi * (GANTT_ROW_H + GANTT_ROW_GAP);
          return (
            <g key={p.id}>
              <text x={TL_X_START - 10} y={y + GANTT_ROW_H / 2 + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace" fontSize={12} fontWeight={700} fill={p.color}>
                P{p.id}
              </text>
              <rect x={TL_X_START} y={y}
                width={(maxCycleNum + 1) * cellW} height={GANTT_ROW_H}
                fill="#FAFAFA" stroke="#E5E5E5" strokeWidth={0.5} rx={2} />

              {cycles.filter(c => c <= curCycle).map((c) => {
                const snap = byCycle[c];
                let st = snap.procs[p.id].state;
                const note = snap.note || '';
                const tag = `P${p.id}`;
                if (snap.ranThisCycle === p.id) st = 'running';
                const wasBlockedThisCycle = note.includes(`${tag} desbloqueia`);
                if (wasBlockedThisCycle && st !== 'running') st = 'blocked';
                const col = colorFor(st);
                const cellX = TL_X_START + c * cellW;
                const isCurrent = c === curCycle;
                const width = isCurrent ? cellW * fillCurrent : cellW;
                if (width < 0.5) return null;
                return (
                  <g key={c}>
                    <rect x={cellX + 0.5} y={y + 1}
                      width={Math.max(0, width - 1)} height={GANTT_ROW_H - 2}
                      fill={col.bg} rx={2} />
                    {!isCurrent && cellW > 14 && (
                      <text x={cellX + cellW / 2} y={y + GANTT_ROW_H / 2 + 3.5}
                        textAnchor="middle"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize={10} fontWeight={700} fill={col.fg}>
                        {col.letter}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TimelineHeader({ currentCycle, totalCycles, algo, quantum }) {
  const meta = ALGO_META[algo] || ALGO_META.fifo;
  const subtitle = typeof meta.subtitle === 'function' ? meta.subtitle(quantum) : meta.subtitle;
  const cellW = (TL_X_END - TL_X_START) / totalCycles;

  const intPart = Math.floor(currentCycle);
  const frac = currentCycle - intPart;
  const HOLD = 0.55;
  let easedFrac;
  if (frac < HOLD) {
    easedFrac = 0;
  } else {
    const t = (frac - HOLD) / (1 - HOLD);
    easedFrac = Easing.easeInOutCubic(Math.min(1, t));
  }
  const smoothCycle = intPart + easedFrac;
  const cursorX = TL_X_START + (smoothCycle + 0.5) * cellW;

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: STAGE_W, height: 180 }}>
      <div style={{
        position: 'absolute', left: 40, top: 20,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 26, fontWeight: 700, color: '#1a1a1a',
        letterSpacing: '-0.02em',
      }}>
        {meta.title} <span style={{ color: '#737373', fontWeight: 500, fontSize: 22 }}>· {subtitle}</span>
      </div>
      <div style={{
        position: 'absolute', right: 40, top: 26,
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        fontSize: 18, color: '#525252', fontVariantNumeric: 'tabular-nums',
      }}>
        ciclo {String(Math.floor(currentCycle)).padStart(2, '0')} / {totalCycles - 1}
      </div>

      <svg style={{ position: 'absolute', left: 0, top: TL_Y - 10, width: STAGE_W, height: TL_CELL_H + 40, overflow: 'visible' }}>
        {Array.from({ length: totalCycles }).map((_, i) => {
          const x = TL_X_START + i * cellW;
          const past = i < currentCycle;
          const current = Math.floor(currentCycle) === i;
          return (
            <g key={i}>
              <rect x={x} y={10} width={cellW - 2} height={TL_CELL_H}
                fill={current ? '#1a1a1a' : past ? '#E5E5E5' : '#FAFAFA'}
                stroke="#D4D4D4" strokeWidth={0.5} rx={3} />
              <text x={x + cellW / 2} y={10 + TL_CELL_H / 2 + 6}
                textAnchor="middle"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize={14} fontWeight={current ? 700 : 500}
                fill={current ? '#fff' : past ? '#737373' : '#A3A3A3'}>
                {i}
              </text>
            </g>
          );
        })}

        <polygon points={`${cursorX - 7},${-4} ${cursorX + 7},${-4} ${cursorX},${8}`} fill="#DC2626" />
        <line x1={cursorX} x2={cursorX} y1={8} y2={TL_CELL_H + 14} stroke="#DC2626" strokeWidth={2} />
      </svg>
    </div>
  );
}

function StateModal({ modal, idx }) {
  const x = getModalX(modal.key);
  const colors = MODAL_COLORS[modal.key];

  return (
    <div style={{
      position: 'absolute',
      left: x, top: MODAL_Y,
      width: MODAL_W, height: MODAL_H,
      background: colors.bg,
      border: `2px solid ${colors.border}`,
      borderRadius: 16,
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    }}>
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${colors.border}66` }}>
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.18em',
          color: colors.accent,
        }}>
          ESTADO {idx + 1}
        </div>
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 28, fontWeight: 800, color: '#111',
          letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1,
        }}>
          {modal.title}
        </div>
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14, fontWeight: 500, color: colors.accent, marginTop: 4,
        }}>
          {modal.subtitle}
        </div>
        <div style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12, color: '#666', marginTop: 8, lineHeight: 1.35,
          fontStyle: 'italic',
        }}>
          {modal.hint}
        </div>
      </div>
    </div>
  );
}

function ProcessCard({ proc, cycle, timeline, termOrder, tweaks, procIds }) {
  const curIdx = Math.min(Math.floor(cycle), timeline.length - 1);
  const prevIdx = Math.max(0, curIdx - 1);
  const slot = getProcessSlot(curIdx, proc.id, timeline, termOrder, procIds);
  const prevSlot = getProcessSlot(prevIdx, proc.id, timeline, termOrder, procIds);

  let cycleFrac = cycle - Math.floor(cycle);
  if (Math.floor(cycle) >= timeline.length) cycleFrac = 1;

  const note = (timeline[curIdx] && timeline[curIdx].note) || '';
  const tag = `P${proc.id}`;
  const ranThisCycle =
    note.includes(`${tag} → BLOQUEADO`) ||
    note.includes(`${tag} → APTO`) ||
    note.includes(`${tag} ENCERRADO`) ||
    (timeline[curIdx] && timeline[curIdx].running && timeline[curIdx].running.id === proc.id);

  const runningPos = slotToXY('running', 0, tweaks);
  const target = slotToXY(slot.state, slot.slotIdx, tweaks);
  const prev = slotToXY(prevSlot.state, prevSlot.slotIdx, tweaks);

  let x, y, displayState;

  if (ranThisCycle && slot.state !== 'running') {
    const PHASE_IN = 0.30;
    const PHASE_OUT = 0.55;
    if (cycleFrac < PHASE_IN) {
      const t = cycleFrac / PHASE_IN;
      const e = Easing.easeInOutCubic(t);
      x = prev.x + (runningPos.x - prev.x) * e;
      y = prev.y + (runningPos.y - prev.y) * e;
      displayState = e < 0.5 ? prevSlot.state : 'running';
    } else if (cycleFrac < PHASE_OUT) {
      x = runningPos.x; y = runningPos.y;
      displayState = 'running';
    } else {
      const t = (cycleFrac - PHASE_OUT) / (1 - PHASE_OUT);
      const e = Easing.easeInOutCubic(t);
      x = runningPos.x + (target.x - runningPos.x) * e;
      y = runningPos.y + (target.y - runningPos.y) * e;
      displayState = e < 0.5 ? 'running' : slot.state;
    }
  } else {
    const SWITCH_START = 0.55;
    const switchT = cycleFrac < SWITCH_START ? 0 : Math.min(1, (cycleFrac - SWITCH_START) / (1 - SWITCH_START));
    const eased = Easing.easeInOutCubic(switchT);
    x = prev.x + (target.x - prev.x) * eased;
    y = prev.y + (target.y - prev.y) * eased;
    displayState = slot.state;
  }

  let visibleQuantum = slot.quantumLeft;
  let visibleBlockLeft = slot.blockLeft;
  if (displayState === 'running' && slot.state !== 'running') {
    visibleQuantum = proc.io ? 1 : 0;
    visibleBlockLeft = 0;
  }

  return (
    <ProcessCardVisual
      proc={proc}
      x={x} y={y}
      w={target.w} h={target.h}
      state={displayState}
      remaining={slot.remaining}
      blockLeft={visibleBlockLeft}
      quantumLeft={visibleQuantum}
    />
  );
}

function ProcessCardVisual({ proc, x, y, w, h, state, remaining, blockLeft, quantumLeft }) {
  const colors = MODAL_COLORS[state];
  const progress = 1 - remaining / proc.burst;

  return (
    <div style={{
      position: 'absolute',
      left: 0, top: 0,
      width: w, height: h,
      transform: `translate(${x}px, ${y}px)`,
      transition: 'none',
      boxSizing: 'border-box',
      background: '#fff',
      border: `2px solid ${proc.color}`,
      borderRadius: 12,
      boxShadow: state === 'running'
        ? `0 0 0 4px ${proc.color}33, 0 6px 20px rgba(0,0,0,0.12)`
        : '0 2px 8px rgba(0,0,0,0.08)',
      padding: '10px 14px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      fontFamily: 'Inter, system-ui, sans-serif',
      willChange: 'transform',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: proc.color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16,
          }}>P{proc.id}</div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Processo {proc.id}</div>
            <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>{proc.label} · {proc.burst}c</div>
          </div>
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontSize: 12, fontWeight: 600,
          color: colors.accent,
          background: colors.bg,
          padding: '2px 8px', borderRadius: 4,
          border: `1px solid ${colors.border}`,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {state === 'running' && quantumLeft > 0 && `q:${quantumLeft}`}
          {state === 'running' && quantumLeft === 0 && 'CPU'}
          {state === 'blocked' && `E/S:${blockLeft}`}
          {state === 'ready' && 'na fila'}
          {state === 'new' && 'novo'}
          {state === 'terminated' && '✓'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          flex: 1, height: 6, borderRadius: 3, background: '#F0F0F0',
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress * 100}%`,
            background: proc.color,
            transition: 'none',
          }} />
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontSize: 11, color: '#525252',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 38, textAlign: 'right',
        }}>
          {proc.burst - remaining}/{proc.burst}
        </div>
      </div>
    </div>
  );
}

function NarrationBar({ time, algo }) {
  const facts = ALGO_FACTS[algo] || ALGO_FACTS.fifo;
  const fact = facts.find(f => time >= f.start && time < f.end) || facts[facts.length - 1];

  return (
    <div style={{
      position: 'absolute',
      left: 40, right: 40, bottom: 24,
      background: '#1a1a1a',
      borderRadius: 12,
      padding: '16px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 16,
        background: '#FCD34D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 18,
      }}>💡</div>
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 18, fontWeight: 500, color: '#fafafa',
        lineHeight: 1.4, letterSpacing: '-0.005em',
      }}>
        {fact.text}
      </div>
    </div>
  );
}

// ── Cena principal genérica ────────────────────────────────────────────────────

function SimulationScene({ timeline, tweaks, procs, quantum = 3, algo = 'fifo' }) {
  const time = useTime();
  const totalSteps = timeline.length;
  const maxCycleNum = Math.max(...timeline.map(e => e.cycle));
  const termOrder = React.useMemo(() => computeTerminationOrder(timeline), [timeline]);
  const procIds = React.useMemo(() => procs.map(p => p.id).sort((a, b) => a - b), [procs]);

  const rawStep = Math.max(0, (time - INTRO_DURATION) / CYCLE_DURATION);
  const clampedStep = Math.min(rawStep, totalSteps);

  const intStep = Math.min(Math.floor(clampedStep), totalSteps - 1);
  const frac = Math.min(1, clampedStep - intStep);
  const curCycleNum = timeline[intStep].cycle;
  const nextStep = Math.min(intStep + 1, totalSteps - 1);
  const nextCycleNum = timeline[nextStep].cycle;
  const displayCycle = curCycleNum + (nextCycleNum - curCycleNum) * frac;

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <TimelineHeader
        currentCycle={Math.max(0, displayCycle)}
        totalCycles={maxCycleNum + 1}
        algo={algo}
        quantum={quantum}
      />
      <GanttChart timeline={timeline} stepIdx={clampedStep} procs={procs} />

      {MODALS.map((m, i) => (
        <StateModal key={m.key} modal={m} idx={i} />
      ))}

      {procs.map(p => (
        <ProcessCard
          key={p.id}
          proc={p}
          cycle={clampedStep}
          timeline={timeline}
          termOrder={termOrder}
          tweaks={tweaks}
          procIds={procIds}
        />
      ))}

      <NarrationBar time={time} algo={algo} />
    </div>
  );
}

// Backward compat — RoundRobinScene é alias com algo=rr
function RoundRobinScene(props) {
  return <SimulationScene {...props} algo="rr" />;
}

Object.assign(window, {
  SimulationScene, RoundRobinScene,
  CYCLE_DURATION, INTRO_DURATION,
});
