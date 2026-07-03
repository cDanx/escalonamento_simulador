// simulator.js — Round Robin scheduler simulator.
// Generates the same timeline format as timeline.json from a config object.

(function () {
  function snapshot(cycle, note, ranThisCycle, procs, readyQueue, running) {
    const procsCopy = {};
    for (const id of Object.keys(procs)) {
      const p = procs[id];
      procsCopy[id] = {
        state: p.state,
        remaining: p.remaining,
        quantumLeft: p.quantumLeft,
        blockLeft: p.blockLeft,
      };
    }
    return {
      cycle,
      note,
      ranThisCycle,
      procs: procsCopy,
      readyQueue: [...readyQueue],
      running: running ? { id: running } : null,
    };
  }

  function allTerminated(procs) {
    for (const id of Object.keys(procs)) {
      if (procs[id].state !== 'terminated') return false;
    }
    return true;
  }

  // config = {
  //   processes: [{ id, burst, io, arrival }],
  //   quantum: 3,
  //   blockDuration: 3,
  //   maxCycles: 100, // safety cap
  // }
  function simulate(config) {
    const { processes, quantum = 3, blockDuration = 3, maxCycles = 200 } = config;

    const procs = {};
    const meta = {};
    for (const p of processes) {
      procs[p.id] = {
        state: 'new',
        remaining: p.burst,
        quantumLeft: 0,
        blockLeft: 0,
      };
      meta[p.id] = { io: p.io, arrival: p.arrival, burst: p.burst };
    }

    const sortedIds = Object.keys(procs).map(Number).sort((a, b) => a - b);
    const timeline = [];
    timeline.push(snapshot(-1, 'Todos os processos prontos para iniciar', null, procs, [], null));

    let readyQueue = [];
    let running = null;

    for (let cycle = 0; cycle < maxCycles; cycle++) {
      if (allTerminated(procs)) break;

      const events = [];

      // Phase A1: decrement blocked, promote those that finish to ready (deterministic by id).
      for (const id of sortedIds) {
        const p = procs[id];
        if (p.state === 'blocked') {
          p.blockLeft--;
          if (p.blockLeft === 0) {
            p.state = 'ready';
            readyQueue.push(id);
            events.push(`P${id} desbloqueia → APTO`);
          }
        }
      }

      // Phase A2: arrivals (sorted by id for determinism).
      for (const id of sortedIds) {
        if (procs[id].state === 'new' && meta[id].arrival === cycle) {
          procs[id].state = 'ready';
          readyQueue.push(id);
          events.push(`P${id} chega → APTO`);
        }
      }

      // Phase B: dispatch if CPU is idle.
      if (running == null && readyQueue.length > 0) {
        const id = readyQueue.shift();
        running = id;
        procs[id].state = 'running';
        procs[id].quantumLeft = meta[id].io ? 1 : quantum;
        events.push(`P${id} EXECUTANDO`);
      }

      // Phase C: execute one cycle.
      let ranThisCycle = null;
      if (running != null) {
        ranThisCycle = running;
        const p = procs[running];
        p.remaining--;
        p.quantumLeft--;

        // Phase D: post-execution transitions.
        if (p.remaining === 0) {
          p.state = 'terminated';
          events.push(`P${running} ENCERRADO`);
          running = null;
        } else if (meta[running].io && p.quantumLeft === 0) {
          p.state = 'blocked';
          p.blockLeft = blockDuration;
          p.quantumLeft = 0;
          events.push(`P${running} → BLOQUEADO`);
          running = null;
        } else if (p.quantumLeft === 0) {
          p.state = 'ready';
          readyQueue.push(running);
          events.push(`P${running} → APTO`);
          running = null;
        }
      }

      timeline.push(snapshot(cycle, events.join(' | '), ranThisCycle, procs, readyQueue, running));
    }

    return timeline;
  }

  // Default config — matches the original timeline.json scenario.
  const DEFAULT_CONFIG = {
    quantum: 3,
    blockDuration: 3,
    processes: [
      { id: 1, burst: 8,  io: true,  arrival: 0, color: '#E8794A', label: 'E/S' },
      { id: 2, burst: 5,  io: false, arrival: 1, color: '#4A7FE8', label: 'CPU' },
      { id: 3, burst: 10, io: true,  arrival: 4, color: '#47A96A', label: 'E/S' },
      { id: 4, burst: 4,  io: false, arrival: 6, color: '#B85AC4', label: 'CPU' },
      { id: 5, burst: 6,  io: false, arrival: 8, color: '#D4A72C', label: 'CPU' },
    ],
  };

  // ── FIFO ──────────────────────────────────────────────────────────────────
  function simulateFIFO(config) {
    const { processes, maxCycles = 200 } = config;
    const procs = {};
    const meta = {};
    for (const p of processes) {
      procs[p.id] = { state: 'new', remaining: p.burst, quantumLeft: 0, blockLeft: 0 };
      meta[p.id] = { arrival: p.arrival, burst: p.burst };
    }
    const sortedIds = Object.keys(procs).map(Number).sort((a, b) => a - b);
    const timeline = [];
    timeline.push(snapshot(-1, 'Processos aguardando', null, procs, [], null));
    let readyQueue = [];
    let running = null;

    for (let cycle = 0; cycle < maxCycles; cycle++) {
      if (allTerminated(procs)) break;
      const events = [];
      for (const id of sortedIds) {
        if (procs[id].state === 'new' && meta[id].arrival === cycle) {
          procs[id].state = 'ready';
          readyQueue.push(id);
          events.push(`P${id} chega → APTO`);
        }
      }
      if (running == null && readyQueue.length > 0) {
        const id = readyQueue.shift();
        running = id;
        procs[id].state = 'running';
        events.push(`P${id} EXECUTANDO`);
      }
      let ranThisCycle = null;
      if (running != null) {
        ranThisCycle = running;
        procs[running].remaining--;
        if (procs[running].remaining === 0) {
          procs[running].state = 'terminated';
          events.push(`P${running} ENCERRADO`);
          running = null;
        }
      }
      timeline.push(snapshot(cycle, events.join(' | '), ranThisCycle, procs, readyQueue, running));
    }
    return timeline;
  }

  // ── SJF (não-preemptivo) ───────────────────────────────────────────────────
  function simulateSJF(config) {
    const { processes, maxCycles = 200 } = config;
    const procs = {};
    const meta = {};
    for (const p of processes) {
      procs[p.id] = { state: 'new', remaining: p.burst, quantumLeft: 0, blockLeft: 0 };
      meta[p.id] = { arrival: p.arrival, burst: p.burst };
    }
    const sortedIds = Object.keys(procs).map(Number).sort((a, b) => a - b);
    const timeline = [];
    timeline.push(snapshot(-1, 'Processos aguardando', null, procs, [], null));
    let readyQueue = [];
    let running = null;

    for (let cycle = 0; cycle < maxCycles; cycle++) {
      if (allTerminated(procs)) break;
      const events = [];
      for (const id of sortedIds) {
        if (procs[id].state === 'new' && meta[id].arrival === cycle) {
          procs[id].state = 'ready';
          readyQueue.push(id);
          events.push(`P${id} chega → APTO`);
        }
      }
      if (running == null && readyQueue.length > 0) {
        readyQueue.sort((a, b) => procs[a].remaining - procs[b].remaining || a - b);
        const id = readyQueue.shift();
        running = id;
        procs[id].state = 'running';
        events.push(`P${id} EXECUTANDO (burst=${procs[id].remaining})`);
      }
      let ranThisCycle = null;
      if (running != null) {
        ranThisCycle = running;
        procs[running].remaining--;
        if (procs[running].remaining === 0) {
          procs[running].state = 'terminated';
          events.push(`P${running} ENCERRADO`);
          running = null;
        }
      }
      timeline.push(snapshot(cycle, events.join(' | '), ranThisCycle, procs, readyQueue, running));
    }
    return timeline;
  }

  // ── SRTF (preemptivo) ──────────────────────────────────────────────────────
  function simulateSRTF(config) {
    const { processes, maxCycles = 200 } = config;
    const procs = {};
    const meta = {};
    for (const p of processes) {
      procs[p.id] = { state: 'new', remaining: p.burst, quantumLeft: 0, blockLeft: 0 };
      meta[p.id] = { arrival: p.arrival, burst: p.burst };
    }
    const sortedIds = Object.keys(procs).map(Number).sort((a, b) => a - b);
    const timeline = [];
    timeline.push(snapshot(-1, 'Processos aguardando', null, procs, [], null));
    let readyQueue = [];
    let running = null;

    for (let cycle = 0; cycle < maxCycles; cycle++) {
      if (allTerminated(procs)) break;
      const events = [];
      for (const id of sortedIds) {
        if (procs[id].state === 'new' && meta[id].arrival === cycle) {
          procs[id].state = 'ready';
          readyQueue.push(id);
          events.push(`P${id} chega → APTO`);
        }
      }
      if (readyQueue.length > 0) {
        readyQueue.sort((a, b) => procs[a].remaining - procs[b].remaining || a - b);
        const best = readyQueue[0];
        if (running == null) {
          running = readyQueue.shift();
          procs[running].state = 'running';
          events.push(`P${running} EXECUTANDO`);
        } else if (procs[best].remaining < procs[running].remaining) {
          procs[running].state = 'ready';
          readyQueue.push(running);
          readyQueue.sort((a, b) => procs[a].remaining - procs[b].remaining || a - b);
          events.push(`P${running} preemptado → APTO`);
          running = readyQueue.shift();
          procs[running].state = 'running';
          events.push(`P${running} EXECUTANDO (menor restante)`);
        }
      }
      let ranThisCycle = null;
      if (running != null) {
        ranThisCycle = running;
        procs[running].remaining--;
        if (procs[running].remaining === 0) {
          procs[running].state = 'terminated';
          events.push(`P${running} ENCERRADO`);
          running = null;
        }
      }
      timeline.push(snapshot(cycle, events.join(' | '), ranThisCycle, procs, readyQueue, running));
    }
    return timeline;
  }

  // ── Cenários dos desafios ──────────────────────────────────────────────────
  const PROC_COLORS = ['#E8794A', '#4A7FE8', '#47A96A', '#B85AC4', '#D4A72C'];

  const SCENARIOS = {
    fifo: {
      quantum: null,
      processes: [
        { id: 1, burst: 5, arrival: 0, color: PROC_COLORS[0], label: 'CPU', io: false },
        { id: 2, burst: 3, arrival: 2, color: PROC_COLORS[1], label: 'CPU', io: false },
        { id: 3, burst: 2, arrival: 4, color: PROC_COLORS[2], label: 'CPU', io: false },
        { id: 4, burst: 4, arrival: 6, color: PROC_COLORS[3], label: 'CPU', io: false },
      ],
    },
    sjf: {
      quantum: null,
      processes: [
        { id: 1, burst: 6, arrival: 0, color: PROC_COLORS[0], label: 'CPU', io: false },
        { id: 2, burst: 4, arrival: 1, color: PROC_COLORS[1], label: 'CPU', io: false },
        { id: 3, burst: 2, arrival: 2, color: PROC_COLORS[2], label: 'CPU', io: false },
        { id: 4, burst: 3, arrival: 4, color: PROC_COLORS[3], label: 'CPU', io: false },
      ],
    },
    srtf: {
      quantum: null,
      processes: [
        { id: 1, burst: 7, arrival: 0, color: PROC_COLORS[0], label: 'CPU', io: false },
        { id: 2, burst: 4, arrival: 2, color: PROC_COLORS[1], label: 'CPU', io: false },
        { id: 3, burst: 1, arrival: 4, color: PROC_COLORS[2], label: 'CPU', io: false },
        { id: 4, burst: 3, arrival: 5, color: PROC_COLORS[3], label: 'CPU', io: false },
      ],
    },
    rr: {
      quantum: 3,
      processes: [
        { id: 1, burst: 5, arrival: 0, color: PROC_COLORS[0], label: 'CPU', io: false },
        { id: 2, burst: 3, arrival: 1, color: PROC_COLORS[1], label: 'CPU', io: false },
        { id: 3, burst: 7, arrival: 3, color: PROC_COLORS[2], label: 'CPU', io: false },
        { id: 4, burst: 2, arrival: 4, color: PROC_COLORS[3], label: 'CPU', io: false },
      ],
    },
  };

  window.RRSimulator = { simulate, DEFAULT_CONFIG };
  window.Scheduler = {
    fifo: simulateFIFO,
    sjf: simulateSJF,
    srtf: simulateSRTF,
    rr: (cfg) => simulate({ ...cfg, quantum: cfg.quantum || 3 }),
    SCENARIOS,
  };
})();
