/**
 * Roke AR Game Engine - Core Shared Logic
 * Manages the editable level index, dynamic sidebar rendering,
 * and cookie-based persistence for player state and level progress.
 */

/* ==========================================================================
   EDITABLE LEVEL INDEX
   Add, remove, or modify challenge levels here.
   Relative hyperlinks are generated dynamically from this list.
   ========================================================================== */
const GAME_LEVELS = [
  { id: "tutorial", title: "Tutorial: Orientation", url: "index.html", available: true },
  { id: "level1", title: "Level 1: Workstation Recon", url: "level1.html", available: true },
  { id: "level2", title: "Level 2: Physical Security", url: "level2.html", available: true },
  { id: "level3", title: "Level 3: Access Control", url: "level3.html", available: true },
  { id: "level4", title: "Level 4: Data Security", url: "level4.html", available: false },
  { id: "level5", title: "Level 5: Service Recovery", url: "level5.html", available: false }
];

/* ==========================================================================
   COOKIE STORAGE HELPERS
   All state is persisted strictly in the user's local cookies.
   Includes safe localStorage synchronization as local fallback.
   ========================================================================== */

/**
 * Sets a cookie in the user's browser.
 * @param {string} name 
 * @param {string} value 
 * @param {number} days 
 */
function setGameCookie(name, value, days = 365) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  document.cookie = cookieStr;

  try {
    localStorage.setItem(name, value);
  } catch (e) {
    // localStorage might be unavailable in restricted environments
  }
}

/**
 * Retrieves a cookie by name.
 * @param {string} name 
 * @returns {string}
 */
function getGameCookie(name) {
  let val = "";
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + encodeURIComponent(name) + '=([^;]*)'));
  if (match) {
    val = decodeURIComponent(match[1]);
  }
  if (!val) {
    try {
      val = localStorage.getItem(name) || "";
    } catch (e) {}
  }
  return val;
}

/**
 * Returns the stored player name or default fallback.
 * @returns {string}
 */
function getPlayerName() {
  return getGameCookie("player_name") || "";
}

/**
 * Saves the player's name into cookie storage.
 * @param {string} name 
 */
function setPlayerName(name) {
  setGameCookie("player_name", name.trim());
}

/**
 * Returns an array of completed level IDs.
 * @returns {string[]}
 */
function getCompletedLevels() {
  const raw = getGameCookie("completed_levels");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }
}

/**
 * Marks a level as completed in cookies.
 * @param {string} levelId 
 */
function markLevelCompleted(levelId) {
  const completed = getCompletedLevels();
  if (!completed.includes(levelId)) {
    completed.push(levelId);
    setGameCookie("completed_levels", JSON.stringify(completed));
  }
  updateSidebarProgress();
}

/**
 * Checks if a specific level is marked completed.
 * @param {string} levelId 
 * @returns {boolean}
 */
function isLevelCompleted(levelId) {
  return getCompletedLevels().includes(levelId);
}

/* ==========================================================================
   DYNAMIC SIDEBAR & PROGRESS RENDERING
   ========================================================================== */

/**
 * Renders the level navigation list inside the sidebar.
 */
function renderSidebarLevels() {
  const container = document.getElementById("sidebar-levels");
  if (!container) return;

  const completed = getCompletedLevels();
  const currentFilename = window.location.pathname.split("/").pop() || "index.html";

  container.innerHTML = "";

  GAME_LEVELS.forEach((level, index) => {
    const isCompleted = completed.includes(level.id);
    const isCurrent = currentFilename === level.url || 
                     (currentFilename === "" && level.url === "index.html");

    const link = document.createElement("a");
    link.href = level.available ? level.url : "#";
    link.className = `level-link ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!level.available ? 'disabled opacity-50' : ''}`;
    link.id = `link-${level.id}`;
    if (!level.available) {
      link.setAttribute("aria-disabled", "true");
      link.style.pointerEvents = "none";
    }

    const numStr = String(index + 1).padStart(2, "0");
    let statusText = "[LOCKED]";
    if (isCompleted) {
      statusText = "[COMPLETED]";
    } else if (isCurrent) {
      statusText = "[CURRENT]";
    } else if (level.available) {
      statusText = "[AVAILABLE]";
    }

    link.innerHTML = `
      <div class="level-link-info">
        <span class="level-link-id">LEVEL ${numStr}</span>
        <span class="level-link-title">${level.title}</span>
      </div>
      <span class="level-link-tag">${statusText}</span>
    `;

    container.appendChild(link);
  });
}

/**
 * Updates the progress indicator inside the sidebar.
 */
function updateSidebarProgress() {
  const container = document.getElementById("sidebar-progress");
  if (!container) return;

  const completed = getCompletedLevels();
  const total = GAME_LEVELS.length;
  const count = completed.length;
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;

  container.innerHTML = `
    <div class="progress-panel">
      <div class="progress-header">
        <span>OVERALL PROGRESS</span>
        <span class="progress-counter">${count} / ${total} COMPLETED</span>
      </div>
      <div class="progress-track" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-fill" style="width: ${percent}%;"></div>
      </div>
    </div>
  `;
}

/**
 * Updates header badges or player name indicators if present.
 */
function updateHeaderPlayerStatus() {
  const nameEl = document.getElementById("header-player-name");
  if (nameEl) {
    const name = getPlayerName();
    nameEl.textContent = name ? name.toUpperCase() : "GRADUATE";
  }
}

/**
 * Initializes the full sidebar and progress tracking.
 */
function initGameSidebar() {
  renderSidebarLevels();
  updateSidebarProgress();
  updateHeaderPlayerStatus();
}

document.addEventListener("DOMContentLoaded", () => {
  initGameSidebar();
});
