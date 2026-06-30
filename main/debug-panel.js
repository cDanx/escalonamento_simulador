(function () {
  'use strict';

  var PASSWORD = 'campiolinho';
  var SESSION_KEY = 'debug:unlocked';

  var STAGES = [
    { key: 'learn:completed',        label: 'Trilha Teórica',      value: 'true' },
    { key: 'challenge:perfect:fifo',  label: 'Desafio FIFO (100%)',  value: 'true' },
    { key: 'challenge:perfect:sjf',   label: 'Desafio SJF (100%)',   value: 'true' },
    { key: 'challenge:perfect:srtf',  label: 'Desafio SRTF (100%)',  value: 'true' },
    { key: 'challenge:perfect:rr',    label: 'Desafio RR (100%)',    value: 'true' },
  ];

  function isUnlocked() {
    try { return sessionStorage.getItem(SESSION_KEY) === 'true'; } catch { return false; }
  }
  function setUnlocked() {
    try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch {}
  }
  function getStageState(key) {
    try { return localStorage.getItem(key) === 'true'; } catch { return false; }
  }
  function toggleStage(key, value) {
    try {
      if (localStorage.getItem(key) === value) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {}
  }

  /* ── Ícone flutuante ─────────────────────────────────────────── */
  function createIcon() {
    var btn = document.createElement('button');
    btn.id = 'dbg-icon';
    btn.title = 'Debug Panel (senha protegido)';
    btn.textContent = '💡';
    btn.style.cssText = [
      'position:fixed', 'bottom:20px', 'right:20px',
      'width:44px', 'height:44px', 'border-radius:50%',
      'background:rgba(24,24,27,0.82)',
      'border:1px solid rgba(255,255,255,0.15)',
      'font-size:20px', 'line-height:1',
      'cursor:pointer', 'z-index:9990',
      'display:flex', 'align-items:center', 'justify-content:center',
      'box-shadow:0 2px 14px rgba(0,0,0,0.3)',
      'transition:transform 150ms',
      'backdrop-filter:blur(4px)',
      'padding:0',
    ].join(';');
    btn.addEventListener('mouseenter', function () { btn.style.transform = 'scale(1.12)'; });
    btn.addEventListener('mouseleave', function () { btn.style.transform = 'scale(1)'; });
    return btn;
  }

  /* ── Modal de senha ──────────────────────────────────────────── */
  function showPasswordModal(onSuccess) {
    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:10000',
      'background:rgba(0,0,0,0.55)', 'backdrop-filter:blur(5px)',
      'display:flex', 'align-items:center', 'justify-content:center',
    ].join(';');

    var modal = document.createElement('div');
    modal.style.cssText = [
      'background:#fff', 'border-radius:16px', 'padding:32px',
      'width:300px', 'box-shadow:0 8px 48px rgba(0,0,0,0.22)',
      'display:flex', 'flex-direction:column', 'gap:14px',
      "font-family:'Inter',system-ui,sans-serif",
    ].join(';');

    modal.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<span style="font-size:26px;">💡</span>' +
        '<div>' +
          '<div style="font-size:16px;font-weight:700;color:#18181b;">Painel de Debug</div>' +
          '<div style="font-size:12px;color:#71717a;">Digite a senha para continuar</div>' +
        '</div>' +
      '</div>' +
      '<input id="dbg-pw-input" type="password" placeholder="Senha…" autocomplete="off" ' +
        'style="border:1.5px solid #e4e4e7;border-radius:8px;padding:10px 14px;' +
               "font-family:'Inter',sans-serif;" +
               'font-size:14px;outline:none;color:#18181b;transition:border-color 150ms;"/>' +
      '<div id="dbg-pw-err" style="display:none;font-size:12px;color:#EF4444;font-weight:600;">Senha incorreta — tente novamente.</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button id="dbg-cancel" style="flex:1;padding:10px;border:1px solid #e4e4e7;' +
          "border-radius:8px;background:#fff;font-family:'Inter',sans-serif;" +
          'font-size:14px;font-weight:600;cursor:pointer;color:#71717a;">Cancelar</button>' +
        '<button id="dbg-enter" style="flex:1;padding:10px;border:none;' +
          "border-radius:8px;background:#18181b;font-family:'Inter',sans-serif;" +
          'font-size:14px;font-weight:700;cursor:pointer;color:#fff;">Entrar</button>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var input = modal.querySelector('#dbg-pw-input');
    var errEl = modal.querySelector('#dbg-pw-err');
    var cancelBtn = modal.querySelector('#dbg-cancel');
    var enterBtn  = modal.querySelector('#dbg-enter');

    setTimeout(function () { input.focus(); }, 80);

    function tryPw() {
      if (input.value === PASSWORD) {
        document.body.removeChild(overlay);
        onSuccess();
      } else {
        errEl.style.display = 'block';
        input.style.borderColor = '#EF4444';
        input.value = '';
        input.focus();
      }
    }

    enterBtn.addEventListener('click', tryPw);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryPw(); });
    cancelBtn.addEventListener('click', function () { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) document.body.removeChild(overlay); });
  }

  /* ── Painel principal ────────────────────────────────────────── */
  function togglePanel() {
    var existing = document.getElementById('dbg-panel');
    if (existing) { existing.remove(); return; }

    var panel = document.createElement('div');
    panel.id = 'dbg-panel';
    panel.style.cssText = [
      'position:fixed', 'bottom:72px', 'right:20px', 'z-index:9991',
      'background:#18181b', 'border-radius:14px', 'padding:18px',
      'width:272px',
      'box-shadow:0 8px 48px rgba(0,0,0,0.4)',
      'border:1px solid rgba(255,255,255,0.1)',
      "font-family:'Inter',system-ui,sans-serif",
    ].join(';');

    function render() {
      var rows = STAGES.map(function (s) {
        var on = getStageState(s.key);
        return (
          '<div style="display:flex;align-items:center;justify-content:space-between;' +
            'background:rgba(255,255,255,0.05);border-radius:8px;padding:9px 11px;margin-bottom:6px;">' +
            '<span style="font-size:12px;font-weight:' + (on ? '600' : '400') + ';' +
              'color:' + (on ? '#4ade80' : '#a1a1aa') + ';">' +
              (on ? '✓ ' : '○ ') + s.label +
            '</span>' +
            '<button data-dbg-key="' + s.key + '" data-dbg-val="' + s.value + '" ' +
              'style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;cursor:pointer;' +
              "font-family:'Inter',sans-serif;" +
              'border:1px solid ' + (on ? '#4ade80' : '#52525b') + ';' +
              'background:' + (on ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)') + ';' +
              'color:' + (on ? '#4ade80' : '#71717a') + ';">' +
              (on ? 'Remover' : 'Liberar') +
            '</button>' +
          '</div>'
        );
      }).join('');

      panel.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
          '<div style="display:flex;align-items:center;gap:7px;">' +
            '<span style="font-size:15px;">🛠️</span>' +
            '<span style="font-size:12px;font-weight:700;color:#fafafa;letter-spacing:0.1em;text-transform:uppercase;">Debug Panel</span>' +
          '</div>' +
          '<button id="dbg-close" style="background:none;border:none;cursor:pointer;' +
            'color:#71717a;font-size:20px;line-height:1;padding:0;">×</button>' +
        '</div>' +
        '<div style="margin-bottom:2px;">' + rows + '</div>' +
        '<div style="display:flex;gap:7px;margin-top:10px;">' +
          '<button id="dbg-all-on" style="flex:1;padding:8px;border:none;border-radius:8px;' +
            'background:linear-gradient(135deg,#e91e8c,#4A7FE8);' +
            'font-family:Inter,sans-serif;font-size:11px;font-weight:700;color:#fff;cursor:pointer;">' +
            '✦ Liberar Tudo</button>' +
          '<button id="dbg-all-off" style="flex:1;padding:8px;background:rgba(255,255,255,0.06);' +
            'border:1px solid rgba(255,255,255,0.1);border-radius:8px;' +
            'font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:#a1a1aa;cursor:pointer;">' +
            '✕ Resetar Tudo</button>' +
        '</div>' +
        '<div style="margin-top:10px;text-align:center;font-size:10px;color:#3f3f46;">' +
          'Recarregue a página para aplicar bloqueios/desbloqueios' +
        '</div>' +
        (window.__debugPanel
          ? '<div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:12px;padding-top:12px;">' +
              '<div style="font-size:10px;font-weight:700;color:#71717a;letter-spacing:0.1em;' +
                'text-transform:uppercase;margin-bottom:8px;">Gabarito desta tela</div>' +
              '<div style="display:flex;gap:7px;">' +
                '<button id="dbg-fill" style="flex:1;padding:8px;' +
                  'border:1px solid rgba(255,255,255,0.15);border-radius:8px;' +
                  'background:rgba(255,255,255,0.07);font-family:Inter,sans-serif;' +
                  'font-size:11px;font-weight:600;color:#e2e8f0;cursor:pointer;">' +
                  '📋 Preencher</button>' +
                '<button id="dbg-fill-send" style="flex:1;padding:8px;border:none;border-radius:8px;' +
                  'background:#4ade80;font-family:Inter,sans-serif;' +
                  'font-size:11px;font-weight:700;color:#052e16;cursor:pointer;">' +
                  '✓ Preencher + Enviar</button>' +
              '</div>' +
            '</div>'
          : '');

      panel.querySelector('#dbg-close').addEventListener('click', function () { panel.remove(); });

      panel.querySelectorAll('[data-dbg-key]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          toggleStage(btn.getAttribute('data-dbg-key'), btn.getAttribute('data-dbg-val'));
          render();
        });
      });

      panel.querySelector('#dbg-all-on').addEventListener('click', function () {
        STAGES.forEach(function (s) { try { localStorage.setItem(s.key, s.value); } catch {} });
        render();
      });

      panel.querySelector('#dbg-all-off').addEventListener('click', function () {
        STAGES.forEach(function (s) { try { localStorage.removeItem(s.key); } catch {} });
        render();
      });

      if (window.__debugPanel) {
        panel.querySelector('#dbg-fill').addEventListener('click', function () {
          window.__debugPanel && window.__debugPanel.fillGabarito();
        });
        panel.querySelector('#dbg-fill-send').addEventListener('click', function () {
          window.__debugPanel && window.__debugPanel.fillAndSubmit();
          panel.remove();
        });
      }
    }

    render();
    document.body.appendChild(panel);
  }

  /* ── Bootstrap ───────────────────────────────────────────────── */
  function init() {
    var icon = createIcon();
    icon.addEventListener('click', function () {
      if (isUnlocked()) {
        togglePanel();
      } else {
        showPasswordModal(function () {
          setUnlocked();
          togglePanel();
        });
      }
    });
    document.body.appendChild(icon);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
