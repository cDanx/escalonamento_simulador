// final-engine.js
// Motor puro de simulação para a fase final (filas múltiplas A/B com retroalimentação).
// Sem dependência de React/DOM — pode ser testado isoladamente (ex: node final-engine.js).

(function (root) {

  var PROCESSES = [
    { id: 'P1', totalCycles: 7, arrival: 0, ioAfterCycles: [], type: 'cpu-bound' },
    { id: 'P2', totalCycles: 6, arrival: 1, ioAfterCycles: [1, 2, 5], type: 'io-bound' },
    { id: 'P3', totalCycles: 5, arrival: 2, ioAfterCycles: [3, 4], type: 'io-bound' },
    { id: 'P4', totalCycles: 6, arrival: 3, ioAfterCycles: [], type: 'cpu-bound' },
    { id: 'P5', totalCycles: 4, arrival: 4, ioAfterCycles: [1, 2], type: 'io-bound' },
  ];

  var SCHEDULER_CONFIG = {
    quantumInternal: 2,
    quantumQueueA: 6,
    quantumQueueB: 4,
    ioBlockDuration: 3,
    totalCyclesToSimulate: 40,
  };

  // Número de colunas mostradas/comparadas na UI (ciclos 0..30)
  var DISPLAY_CYCLES = 31;

  function simulate(processes, config) {
    processes = processes || PROCESSES;
    config = config || SCHEDULER_CONFIG;

    var runtime = {};
    processes.forEach(function (p) {
      runtime[p.id] = {
        id: p.id,
        cyclesExecuted: 0,
        ioCount: 0,
        currentQueue: null,
        blockedSince: null,
        blockedUntil: null,
        finished: false,
        firstRunCycle: null,
        finishCycle: null,
        cyclesInCurrentQueueSlot: 0,
        waitingCycles: 0,
      };
    });

    var byId = {};
    processes.forEach(function (p) { byId[p.id] = p; });

    var queueA = [];
    var queueB = [];
    var runner = null; // { id, queue, burstLeft }
    var pendingRequeue = null; // { id, queue }

    var gantt = {};
    processes.forEach(function (p) { gantt[p.id] = []; });

    var snapshots = []; // estado por ciclo, para o modo "passo a passo"

    var finishedCount = 0;
    var t;

    for (t = 0; t < config.totalCyclesToSimulate; t++) {
      if (finishedCount === processes.length) {
        // tudo terminado: preenche o resto com '.'
        processes.forEach(function (p) { gantt[p.id].push('.'); });
        snapshots.push({ cycle: t, running: null, queueA: [], queueB: [], blocked: [] });
        continue;
      }

      // 1. CHEGADAS → Fila A
      processes.forEach(function (p) {
        if (p.arrival === t) { queueA.push(p.id); runtime[p.id].currentQueue = 'A'; }
      });

      // 2. DESBLOQUEIOS (retorno de E/S) → Fila A
      processes.forEach(function (p) {
        var rt = runtime[p.id];
        if (rt.blockedUntil === t) {
          queueA.push(p.id);
          rt.blockedSince = null;
          rt.blockedUntil = null;
          rt.currentQueue = 'A';
        }
      });

      // 2.5 — reentrada do processo que consumiu o quantum no ciclo anterior → Fila B
      if (pendingRequeue) {
        queueB.push(pendingRequeue.id);
        runtime[pendingRequeue.id].currentQueue = 'B';
        pendingRequeue = null;
      }

      // 3. PREEMPÇÃO DE FILA: um processo da Fila B em execução é interrompido
      //    se houver processo na Fila A (prioridade) e volta para a Fila A.
      if (runner && runner.queue === 'B' && queueA.length) {
        queueA.push(runner.id);
        runtime[runner.id].currentQueue = 'A';
        runner = null;
      }

      // 4. DECIDE QUEM EXECUTA (Fila A tem prioridade sobre a Fila B)
      if (runner == null) {
        if (queueA.length) {
          runner = { id: queueA.shift(), queue: 'A', burstLeft: config.quantumInternal };
        } else if (queueB.length) {
          runner = { id: queueB.shift(), queue: 'B', burstLeft: config.quantumInternal };
        }
        if (runner) runtime[runner.id].currentQueue = runner.queue;
      }

      // Registra estado deste ciclo para todos os processos (com base nas filas/bloqueados atuais)
      processes.forEach(function (p) {
        var rt = runtime[p.id];
        var symbol;
        if (runner && runner.id === p.id) {
          symbol = 'E';
        } else if (t < p.arrival) {
          symbol = '.';
        } else if (rt.finished && t >= rt.finishCycle) {
          symbol = '.';
        } else if (rt.blockedUntil != null && t < rt.blockedUntil) {
          symbol = 'X';
        } else if (queueA.indexOf(p.id) !== -1) {
          symbol = 'A';
        } else if (queueB.indexOf(p.id) !== -1) {
          symbol = 'B';
        } else {
          symbol = '.';
        }
        if (symbol === 'A' || symbol === 'B') rt.waitingCycles++;
        gantt[p.id].push(symbol);
      });

      snapshots.push({
        cycle: t,
        running: runner ? runner.id : null,
        queueA: queueA.slice(),
        queueB: queueB.slice(),
        blocked: processes
          .filter(function (p) { return runtime[p.id].blockedUntil != null; })
          .map(function (p) { return { id: p.id, blockedUntil: runtime[p.id].blockedUntil }; }),
      });

      if (!runner) continue; // CPU ociosa neste ciclo

      var proc = byId[runner.id];
      var rt = runtime[runner.id];

      // 5. EXECUTA 1 ciclo
      rt.cyclesExecuted += 1;
      if (rt.firstRunCycle == null) rt.firstRunCycle = t;
      runner.burstLeft -= 1;

      // 6. VERIFICA E/S — vai para bloqueado e retornará à Fila A
      if (proc.ioAfterCycles[rt.ioCount] === rt.cyclesExecuted) {
        rt.blockedSince = t + 1;
        rt.blockedUntil = t + 1 + config.ioBlockDuration;
        rt.ioCount += 1;
        rt.currentQueue = null;
        runner = null;
      }
      // 7. VERIFICA TÉRMINO
      else if (rt.cyclesExecuted === proc.totalCycles) {
        rt.finished = true;
        rt.finishCycle = t + 1;
        rt.currentQueue = null;
        runner = null;
        finishedCount++;
      }
      // 8. CONSUMIU TODO O QUANTUM RR (2 ciclos) sem bloquear/terminar → Fila B
      else if (runner.burstLeft === 0) {
        pendingRequeue = { id: proc.id, queue: 'B' };
        rt.currentQueue = 'B';
        runner = null;
      }
      // senão: processo continua executando no próximo ciclo (mesmo "runner")
    }

    var ganttDisplay = {};
    processes.forEach(function (p) {
      ganttDisplay[p.id] = gantt[p.id].slice(0, DISPLAY_CYCLES);
      while (ganttDisplay[p.id].length < DISPLAY_CYCLES) ganttDisplay[p.id].push('.');
    });

    return {
      gantt: ganttDisplay,
      ganttFull: gantt,
      runtime: runtime,
      snapshots: snapshots,
      metrics: computeMetrics(processes, runtime),
    };
  }

  function computeMetrics(processes, runtime) {
    var waiting = processes.map(function (p) { return runtime[p.id].waitingCycles; });
    var avgWaitingTime = waiting.reduce(function (a, b) { return a + b; }, 0) / processes.length;

    var turnarounds = processes.map(function (p) {
      var rt = runtime[p.id];
      return { id: p.id, value: rt.finishCycle - p.arrival };
    });
    var bestTurnaround = turnarounds.reduce(function (best, cur) {
      return cur.value < best.value ? cur : best;
    });

    var responseTimes = processes.map(function (p) {
      var rt = runtime[p.id];
      return { id: p.id, value: rt.firstRunCycle - p.arrival };
    });
    var worstResponse = responseTimes.reduce(function (worst, cur) {
      return cur.value > worst.value ? cur : worst;
    });

    return {
      avgWaitingTime: avgWaitingTime,
      waitingByProcess: waiting.reduce(function (acc, v, i) { acc[processes[i].id] = v; return acc; }, {}),
      bestTurnaroundProcess: bestTurnaround.id,
      turnaroundByProcess: turnarounds.reduce(function (acc, t) { acc[t.id] = t.value; return acc; }, {}),
      worstResponseProcess: worstResponse.id,
      responseByProcess: responseTimes.reduce(function (acc, r) { acc[r.id] = r.value; return acc; }, {}),
    };
  }

  var FinalEngine = {
    PROCESSES: PROCESSES,
    SCHEDULER_CONFIG: SCHEDULER_CONFIG,
    DISPLAY_CYCLES: DISPLAY_CYCLES,
    simulate: simulate,
    computeMetrics: computeMetrics,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinalEngine;
  } else {
    root.FinalEngine = FinalEngine;
  }

})(typeof window !== 'undefined' ? window : globalThis);
