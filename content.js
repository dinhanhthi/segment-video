(() => {
  const ROOT_ID = "segment-video-capture-extension-root";

  if (document.getElementById(ROOT_ID)) {
    return;
  }

  const state = {
    pendingStart: null,
    segments: [],
    drag: null
  };

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "segment-capture-host";
  document.documentElement.appendChild(root);

  const shadow = root.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        color-scheme: light;
        --svc-bg: #101318;
        --svc-surface: #ffffff;
        --svc-surface-soft: #f4f6f8;
        --svc-text: #111827;
        --svc-muted: #667085;
        --svc-border: #d9dee7;
        --svc-accent: #2563eb;
        --svc-accent-dark: #1d4ed8;
        --svc-danger: #dc2626;
        --svc-shadow: 0 18px 48px rgba(17, 24, 39, 0.22);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .svc-controls {
        position: fixed;
        right: 18px;
        bottom: 22px;
        z-index: 2147483647;
        display: flex;
        gap: 8px;
        align-items: center;
        padding: 8px;
        background: rgba(16, 19, 24, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 12px;
        box-shadow: var(--svc-shadow);
        backdrop-filter: blur(12px);
        cursor: default;
        touch-action: none;
      }

      .svc-controls.is-dragging {
        cursor: grabbing;
      }

      .svc-drag-handle {
        width: 16px;
        align-self: stretch;
        min-height: 34px;
        border-radius: 7px;
        cursor: grab;
        background-image: radial-gradient(circle, rgba(255, 255, 255, 0.72) 1.2px, transparent 1.6px);
        background-position: center;
        background-size: 5px 5px;
        opacity: 0.72;
      }

      .svc-drag-handle:hover {
        opacity: 1;
      }

      .svc-button {
        appearance: none;
        border: 0;
        border-radius: 8px;
        padding: 10px 13px;
        color: #ffffff;
        background: var(--svc-accent);
        font: 700 13px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
      }

      .svc-button:hover {
        background: var(--svc-accent-dark);
      }

      .svc-button:focus-visible {
        outline: 2px solid #ffffff;
        outline-offset: 2px;
      }

      .svc-button[data-kind="stop"] {
        background: var(--svc-danger);
      }

      .svc-button[data-kind="stop"]:hover {
        background: #b91c1c;
      }

      .svc-panel {
        position: fixed;
        right: 18px;
        bottom: 82px;
        z-index: 2147483647;
        width: min(340px, calc(100vw - 36px));
        box-sizing: border-box;
        padding: 12px;
        color: var(--svc-text);
        background: var(--svc-surface);
        border: 1px solid var(--svc-border);
        border-radius: 12px;
        box-shadow: var(--svc-shadow);
      }

      .svc-panel[hidden],
      .svc-modal-backdrop[hidden] {
        display: none;
      }

      .svc-panel-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        margin-bottom: 9px;
      }

      .svc-title {
        margin: 0;
        color: var(--svc-text);
        font: 800 13px/1.2 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .svc-status {
        min-height: 18px;
        margin: 0 0 10px;
        color: var(--svc-muted);
        font: 500 12px/1.45 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .svc-list {
        display: grid;
        gap: 6px;
        max-height: 168px;
        overflow: auto;
      }

      .svc-empty,
      .svc-row,
      .svc-pending {
        box-sizing: border-box;
        border-radius: 8px;
        padding: 8px 10px;
        background: var(--svc-surface-soft);
        font: 600 12px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }

      .svc-row {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
      }

      .svc-segment-text {
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .svc-delete {
        appearance: none;
        flex: 0 0 auto;
        border: 1px solid rgba(220, 38, 38, 0.28);
        border-radius: 7px;
        padding: 5px 7px;
        color: var(--svc-danger);
        background: #ffffff;
        font: 800 11px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        cursor: pointer;
      }

      .svc-delete:hover {
        border-color: rgba(220, 38, 38, 0.55);
        background: #fff1f2;
      }

      .svc-empty {
        color: var(--svc-muted);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-weight: 500;
      }

      .svc-pending {
        margin-bottom: 6px;
        color: #8a4b00;
        background: #fff4da;
      }

      .svc-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: grid;
        place-items: center;
        box-sizing: border-box;
        padding: 24px;
        background: rgba(15, 23, 42, 0.36);
      }

      .svc-modal {
        width: min(560px, 100%);
        box-sizing: border-box;
        color: var(--svc-text);
        background: var(--svc-surface);
        border: 1px solid var(--svc-border);
        border-radius: 12px;
        box-shadow: var(--svc-shadow);
        overflow: hidden;
      }

      .svc-modal-head,
      .svc-modal-actions {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
      }

      .svc-modal-head {
        border-bottom: 1px solid var(--svc-border);
      }

      .svc-output {
        margin: 0;
        padding: 16px;
        max-height: min(54vh, 440px);
        overflow: auto;
        color: #0f172a;
        background: #f8fafc;
        font: 700 13px/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        white-space: pre;
      }

      .svc-action {
        appearance: none;
        border: 1px solid var(--svc-border);
        border-radius: 8px;
        padding: 9px 12px;
        background: #ffffff;
        color: var(--svc-text);
        font: 700 13px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        cursor: pointer;
      }

      .svc-action[data-primary="true"] {
        border-color: var(--svc-accent);
        background: var(--svc-accent);
        color: #ffffff;
      }

      .svc-action:hover {
        border-color: #aab2c0;
      }

      .svc-action[data-primary="true"]:hover {
        background: var(--svc-accent-dark);
      }

      @media (max-width: 460px) {
        .svc-controls {
          right: 10px;
          bottom: 10px;
          left: 10px;
          justify-content: stretch;
        }

        .svc-button {
          flex: 1;
          padding-inline: 8px;
        }

        .svc-panel {
          right: 10px;
          bottom: 70px;
          width: calc(100vw - 20px);
        }
      }
    </style>

    <section class="svc-panel" aria-live="polite" hidden>
      <div class="svc-panel-header">
        <h2 class="svc-title">Captured segments</h2>
      </div>
      <p class="svc-status"></p>
      <div class="svc-list"></div>
    </section>

    <div class="svc-controls" role="group" aria-label="Segment Videos controls">
      <div class="svc-drag-handle" role="button" tabindex="0" aria-label="Drag controls" title="Drag controls"></div>
      <button class="svc-button" type="button" data-action="start">Start</button>
      <button class="svc-button" type="button" data-action="end">End</button>
      <button class="svc-button" type="button" data-action="stop" data-kind="stop">Stop</button>
    </div>

    <div class="svc-modal-backdrop" hidden>
      <div class="svc-modal" role="dialog" aria-modal="true" aria-labelledby="svc-modal-title">
        <div class="svc-modal-head">
          <h2 class="svc-title" id="svc-modal-title">Segments output</h2>
        </div>
        <pre class="svc-output"></pre>
        <div class="svc-modal-actions">
          <button class="svc-action" type="button" data-action="close">Close</button>
          <button class="svc-action" type="button" data-action="copy" data-primary="true">Copy</button>
        </div>
      </div>
    </div>
  `;

  const panel = shadow.querySelector(".svc-panel");
  const controls = shadow.querySelector(".svc-controls");
  const status = shadow.querySelector(".svc-status");
  const list = shadow.querySelector(".svc-list");
  const output = shadow.querySelector(".svc-output");
  const modal = shadow.querySelector(".svc-modal-backdrop");
  const copyButton = shadow.querySelector('[data-action="copy"]');

  function getCandidateVideos() {
    return Array.from(document.querySelectorAll("video"))
      .filter((video) => Number.isFinite(video.currentTime))
      .map((video) => {
        const rect = video.getBoundingClientRect();
        const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
        const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
        const visibleArea = visibleWidth * visibleHeight;
        const readyScore = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA ? 1 : 0;
        const playingScore = !video.paused && !video.ended ? 1 : 0;

        return {
          video,
          score: playingScore * 1000000000 + readyScore * 1000000 + visibleArea
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  function getCurrentVideo() {
    return getCandidateVideos()[0]?.video ?? null;
  }

  function formatTimestamp(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, "0");
    const paddedSeconds = String(remainingSeconds).padStart(2, "0");

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${paddedMinutes}:${paddedSeconds}`;
    }

    return `${paddedMinutes}:${paddedSeconds}`;
  }

  function captureTimestamp() {
    const video = getCurrentVideo();

    if (!video) {
      throw new Error("No video element found on this page.");
    }

    return formatTimestamp(video.currentTime);
  }

  function isMp4Url(url) {
    return /\.mp4(?:[?#]|$)/i.test(url);
  }

  function isUsableVideoUrl(url) {
    return /^https?:\/\//i.test(url) && !url.startsWith("blob:");
  }

  function getVideoUrls(video) {
    if (!video) {
      return [];
    }

    return [
      video.currentSrc,
      video.src,
      ...Array.from(video.querySelectorAll("source")).map((source) => source.src)
    ].filter(Boolean);
  }

  function getPerformanceVideoUrls() {
    if (!window.performance?.getEntriesByType) {
      return [];
    }

    return performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter(Boolean);
  }

  function captureVideoUrl() {
    const currentVideo = getCurrentVideo();
    const currentVideoUrls = getVideoUrls(currentVideo);
    const pageVideoUrls = Array.from(document.querySelectorAll("video")).flatMap(getVideoUrls);
    const candidateUrls = [...currentVideoUrls, ...pageVideoUrls, ...getPerformanceVideoUrls()];
    const uniqueUrls = Array.from(new Set(candidateUrls));

    return (
      uniqueUrls.find((url) => isUsableVideoUrl(url) && isMp4Url(url)) ??
      uniqueUrls.find(isUsableVideoUrl) ??
      ""
    );
  }

  function escapeShellString(value) {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function buildSegmentsOutput() {
    const rows = state.segments.map((segment) => `  "${segment.start}-${segment.end}"`);
    return `VIDEO_URL="${escapeShellString(captureVideoUrl())}"\n\nSEGMENTS=(\n${rows.join("\n")}\n)`;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setControlsPosition(left, top) {
    const rect = controls.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height);

    controls.style.left = `${clamp(left, 0, maxLeft)}px`;
    controls.style.top = `${clamp(top, 0, maxTop)}px`;
    controls.style.right = "auto";
    controls.style.bottom = "auto";
    positionPanelNearControls();
  }

  function positionPanelNearControls() {
    if (panel.hidden) {
      return;
    }

    const controlsRect = controls.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const gap = 10;
    const desiredTop =
      controlsRect.top >= panelRect.height + gap
        ? controlsRect.top - panelRect.height - gap
        : controlsRect.bottom + gap;
    const maxLeft = Math.max(0, window.innerWidth - panelRect.width);
    const maxTop = Math.max(0, window.innerHeight - panelRect.height);

    panel.style.left = `${clamp(controlsRect.left, 0, maxLeft)}px`;
    panel.style.top = `${clamp(desiredTop, 0, maxTop)}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  }

  function renderPanel(message) {
    panel.hidden = false;
    status.textContent = message;
    list.innerHTML = "";

    if (state.pendingStart) {
      const pending = document.createElement("div");
      pending.className = "svc-pending";
      pending.textContent = `Start: ${state.pendingStart}`;
      list.appendChild(pending);
    }

    if (state.segments.length === 0) {
      const empty = document.createElement("div");
      empty.className = "svc-empty";
      empty.textContent = "No completed segments yet.";
      list.appendChild(empty);
      positionPanelNearControls();
      return;
    }

    state.segments.forEach((segment, index) => {
      const row = document.createElement("div");
      row.className = "svc-row";

      const text = document.createElement("span");
      text.className = "svc-segment-text";
      text.textContent = `${index + 1}. ${segment.start}-${segment.end}`;

      const deleteButton = document.createElement("button");
      deleteButton.className = "svc-delete";
      deleteButton.type = "button";
      deleteButton.dataset.action = "delete-segment";
      deleteButton.dataset.index = String(index);
      deleteButton.setAttribute("aria-label", `Delete segment ${index + 1}`);
      deleteButton.textContent = "Delete";

      row.append(text, deleteButton);
      list.appendChild(row);
    });

    positionPanelNearControls();
  }

  function openOutputModal() {
    output.textContent = buildSegmentsOutput();
    modal.hidden = false;
    copyButton.textContent = "Copy";
    copyButton.focus();
  }

  async function copyOutput() {
    const text = output.textContent;

    try {
      await navigator.clipboard.writeText(text);
    } catch (_error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    copyButton.textContent = "Copied";
    setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1400);
  }

  function handleStart() {
    try {
      state.pendingStart = captureTimestamp();
      renderPanel(`Start captured at ${state.pendingStart}.`);
    } catch (error) {
      renderPanel(error.message);
    }
  }

  function handleEnd() {
    try {
      const end = captureTimestamp();

      if (!state.pendingStart) {
        renderPanel(`End captured at ${end}, but no start timestamp is set.`);
        return;
      }

      const start = state.pendingStart;
      state.segments.push({ start, end });
      state.pendingStart = null;
      renderPanel(`Segment added: ${start}-${end}.`);
    } catch (error) {
      renderPanel(error.message);
    }
  }

  function handleStop() {
    renderPanel(`${state.segments.length} segment${state.segments.length === 1 ? "" : "s"} ready.`);
    openOutputModal();
  }

  function handleDeleteSegment(index) {
    if (!Number.isInteger(index) || index < 0 || index >= state.segments.length) {
      return;
    }

    const [removedSegment] = state.segments.splice(index, 1);
    renderPanel(`Segment removed: ${removedSegment.start}-${removedSegment.end}.`);
  }

  controls.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = controls.getBoundingClientRect();
    state.drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false
    };
    controls.classList.add("is-dragging");
    controls.setPointerCapture(event.pointerId);
  });

  controls.addEventListener("pointermove", (event) => {
    const drag = state.drag;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const movedX = Math.abs(event.clientX - drag.startX);
    const movedY = Math.abs(event.clientY - drag.startY);

    if (movedX > 3 || movedY > 3) {
      drag.moved = true;
    }

    if (!drag.moved) {
      return;
    }

    event.preventDefault();
    setControlsPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
  });

  function finishDrag(event) {
    const drag = state.drag;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    controls.classList.remove("is-dragging");
    if (controls.hasPointerCapture(event.pointerId)) {
      controls.releasePointerCapture(event.pointerId);
    }
    state.drag = null;
  }

  controls.addEventListener("pointerup", finishDrag);
  controls.addEventListener("pointercancel", finishDrag);
  window.addEventListener("resize", () => {
    const rect = controls.getBoundingClientRect();
    setControlsPosition(rect.left, rect.top);
  });

  shadow.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    const action = button.dataset.action;

    if (action === "start") {
      handleStart();
    }

    if (action === "end") {
      handleEnd();
    }

    if (action === "stop") {
      handleStop();
    }

    if (action === "delete-segment") {
      handleDeleteSegment(Number(button.dataset.index));
    }

    if (action === "copy") {
      copyOutput();
    }

    if (action === "close") {
      modal.hidden = true;
    }
  });

  shadow.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      modal.hidden = true;
    }
  });
})();
