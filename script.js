const STORAGE_KEYS = {
    currentUser: "highscoreApp_currentUser",
    leaderboard: "highscoreApp_leaderboard",
    settings: "highscoreApp_settings"
};

const DEFAULT_LEADERBOARD = [
    { name: "Chunchu", score: 12450, rank: 1 },
    { name: "Alex", score: 11200, rank: 2 },
    { name: "Rahul", score: 10450, rank: 3 },
    { name: "Mia", score: 9850, rank: 4 },
    { name: "Sora", score: 9200, rank: 5 },
    { name: "Lina", score: 8600, rank: 6 },
    { name: "Noah", score: 7970, rank: 7 },
    { name: "Zane", score: 7300, rank: 8 },
    { name: "Ari", score: 6800, rank: 9 },
    { name: "Ven", score: 6400, rank: 10 }
];

const DEFAULT_USER = {
    username: "Chunchu",
    level: 12,
    points: 12450,
    matches: 248,
    wins: 168,
    xp: 75,
    bio: "Competitive player chasing new high scores.",
    achievements: ["First Win", "Top 10 Rank", "Score 10K"],
    joined: "Jan 2025"
};

const DEFAULT_SETTINGS = {
    darkMode: false,
    notifications: true,
    showPodium: true
};

function initPage() {
    initializeData();

    const page = document.body.dataset.page || "";
    const requiresAuth = ["dashboard", "leaderboard", "profile", "settings"];
    const user = getCurrentUser();

    if (requiresAuth.includes(page) && !user) {
        window.location.href = "login.html";
        return;
    }

    renderNav();
    attachPageEvents(page);

    if (page === "dashboard") {
        renderDashboard();
    } else if (page === "leaderboard") {
        renderLeaderboard();
    } else if (page === "profile") {
        renderProfile();
    } else if (page === "settings") {
        renderSettings();
    } else if (page === "login") {
        prepareLogin();
    }
}

document.addEventListener("DOMContentLoaded", initPage);

function initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.leaderboard)) {
        localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(DEFAULT_LEADERBOARD));
    }
    if (!localStorage.getItem(STORAGE_KEYS.settings)) {
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
    }
}

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function saveCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

function getLeaderboardData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.leaderboard);
        return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_LEADERBOARD));
    } catch (error) {
        return JSON.parse(JSON.stringify(DEFAULT_LEADERBOARD));
    }
}

function saveLeaderboardData(data) {
    localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(data));
}

function getSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.settings);
        return raw ? JSON.parse(raw) : { ...DEFAULT_SETTINGS };
    } catch (error) {
        return { ...DEFAULT_SETTINGS };
    }
}

function renderNav() {
    const settings = getSettings();
    document.body.classList.toggle("dark-mode", settings.darkMode);
}

function attachPageEvents(page) {
    if (page === "leaderboard") {
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", () => renderLeaderboard(searchInput.value));
        }
    }
    if (page === "profile") {
        const scoreButtons = document.querySelectorAll(".score-action button");
        scoreButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const amount = Number(button.dataset.points);
                changeUserScore(amount);
            });
        });
    }
    if (page === "settings") {
        const form = document.getElementById("settingsForm");
        if (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                saveSettings();
            });
        }
    }
}

function prepareLogin() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) {
        return;
    }
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const username = document.getElementById("usernameInput").value.trim();
        if (!username) {
            return;
        }

        const leaderboard = getLeaderboardData();
        const existing = leaderboard.find((player) => player.name.toLowerCase() === username.toLowerCase());
        const user = existing
            ? {
                username: existing.name,
                level: Math.max(2, Math.floor(existing.score / 1200)),
                points: existing.score,
                matches: Math.max(12, Math.floor(existing.score / 45)),
                wins: Math.max(4, Math.floor(existing.score / 90)),
                xp: Math.min(95, Math.floor((existing.score % 1200) / 12)),
                bio: "Back to climb the leaderboard.",
                achievements: ["Leaderboard Veteran"],
                joined: "Jan 2025"
            }
            : {
                ...DEFAULT_USER,
                username,
                points: 1500,
                level: 2,
                matches: 12,
                wins: 3,
                xp: 34,
                achievements: ["Welcome Badge"],
                bio: "Ready to climb every leaderboard.",
                joined: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })
            };

        saveCurrentUser(user);
        updateLeaderboardForUser(user);
        window.location.href = "dashboard.html";
    });
}

function renderDashboard() {
    const user = getCurrentUser();
    updateLeaderboardForUser(user);
    const leaderboard = sortLeaderboard(getLeaderboardData());
    const rank = calculateRank(user, leaderboard);

    const profileCard = document.getElementById("profileCard");
    const rankValue = document.getElementById("rankValue");
    const pointsValue = document.getElementById("pointsValue");
    const matchesValue = document.getElementById("matchesValue");
    const winsValue = document.getElementById("winsValue");
    const xpFill = document.getElementById("xpFill");
    const nextLevelText = document.getElementById("nextLevelText");
    const podiumContainer = document.getElementById("dashboardPodium");
    const achievementGrid = document.getElementById("achievementGrid");

    if (profileCard) {
        profileCard.innerHTML = `
            <div class="profile-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div class="profile-details">
                <h2>${user.username}</h2>
                <p>${user.bio}</p>
                <span>Level ${user.level}</span>
            </div>
        `;
    }
    if (rankValue) rankValue.textContent = `#${rank}`;
    if (pointsValue) pointsValue.textContent = formatNumber(user.points);
    if (matchesValue) matchesValue.textContent = formatNumber(user.matches);
    if (winsValue) winsValue.textContent = formatNumber(user.wins);
    if (xpFill) xpFill.style.width = `${Math.min(100, user.xp)}%`;
    if (nextLevelText) nextLevelText.textContent = `${100 - Math.min(100, user.xp)} XP until level ${user.level + 1}`;

    if (podiumContainer) {
        podiumContainer.innerHTML = "";
        leaderboard.slice(0, 3).forEach((player, index) => {
            podiumContainer.innerHTML += `
                <div class="podium-card highlight podium-${index + 1}">
                    <span class="podium-rank">${index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>
                    <strong>${player.name}</strong>
                    <small>${formatNumber(player.score)} pts</small>
                </div>
            `;
        });
    }

    if (achievementGrid) {
        achievementGrid.innerHTML = "";
        const achievements = user.achievements.length ? user.achievements : ["No achievements yet"];
        achievements.forEach((achievement) => {
            achievementGrid.innerHTML += `
                <div class="achievement-pill">${achievement}</div>
            `;
        });
    }
}

function renderLeaderboard(filter = "") {
    const leaderboard = sortLeaderboard(getLeaderboardData());
    const podiumContainer = document.getElementById("leaderboardPodium");
    const tableBody = document.getElementById("leaderboardBody");

    const filtered = leaderboard.filter((player) => player.name.toLowerCase().includes(filter.toLowerCase()));

    if (podiumContainer) {
        podiumContainer.innerHTML = "";
        filtered.slice(0, 3).forEach((player, index) => {
            podiumContainer.innerHTML += `
                <div class="podium-card podium-${index + 1}">
                    <span class="podium-rank">${index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>
                    <strong>${player.name}</strong>
                    <small>${formatNumber(player.score)} pts</small>
                </div>
            `;
        });
    }

    if (tableBody) {
        tableBody.innerHTML = "";
        filtered.forEach((player, index) => {
            const rank = index + 1;
            tableBody.innerHTML += `
                <tr>
                    <td>${rank}</td>
                    <td>${player.name}</td>
                    <td>${formatNumber(player.score)}</td>
                    <td><button class="table-action" onclick="boostPlayer('${player.name}')">Boost</button></td>
                </tr>
            `;
        });
    }
}

function renderProfile() {
    const user = getCurrentUser();
    if (!user) {
        logout();
        return;
    }

    const profileName = document.getElementById("profileName");
    const profileBio = document.getElementById("profileBio");
    const profileJoined = document.getElementById("profileJoined");
    const profileAvatar = document.getElementById("profileAvatar");
    const profileStats = document.getElementById("profileStats");
    const achievementGrid = document.getElementById("profileAchievements");
    const xpFill = document.getElementById("profileXpFill");
    const xpText = document.getElementById("profileXpText");

    if (profileName) profileName.textContent = user.username;
    if (profileBio) profileBio.textContent = user.bio;
    if (profileJoined) profileJoined.textContent = `Joined ${user.joined}`;
    if (profileAvatar) profileAvatar.textContent = user.username.charAt(0).toUpperCase();

    if (profileStats) {
        profileStats.innerHTML = `
            <div class="stat-card small-card">
                <h4>Rank</h4>
                <p>#${calculateRank(user, sortLeaderboard(getLeaderboardData()))}</p>
            </div>
            <div class="stat-card small-card">
                <h4>Points</h4>
                <p>${formatNumber(user.points)}</p>
            </div>
            <div class="stat-card small-card">
                <h4>Matches</h4>
                <p>${formatNumber(user.matches)}</p>
            </div>
            <div class="stat-card small-card">
                <h4>Wins</h4>
                <p>${formatNumber(user.wins)}</p>
            </div>
        `;
    }

    if (achievementGrid) {
        achievementGrid.innerHTML = "";
        const achievements = user.achievements.length ? user.achievements : ["No achievements yet"];
        achievements.forEach((achievement) => {
            achievementGrid.innerHTML += `<div class="achievement-pill">${achievement}</div>`;
        });
    }

    if (xpFill) xpFill.style.width = `${Math.min(100, user.xp)}%`;
    if (xpText) xpText.textContent = `${100 - Math.min(100, user.xp)} XP to level ${user.level + 1}`;
}

function renderSettings() {
    const settings = getSettings();
    const user = getCurrentUser();

    const themeToggle = document.getElementById("themeToggle");
    const notifyToggle = document.getElementById("notifyToggle");
    const bioField = document.getElementById("profileBioField");

    if (themeToggle) themeToggle.checked = settings.darkMode;
    if (notifyToggle) notifyToggle.checked = settings.notifications;
    if (bioField && user) bioField.value = user.bio || "";
}

function calculateRank(user, leaderboard) {
    if (!user || !leaderboard) {
        return "—";
    }
    const index = leaderboard.findIndex((player) => player.name.toLowerCase() === user.username.toLowerCase());
    return index >= 0 ? index + 1 : leaderboard.length + 1;
}

function sortLeaderboard(board) {
    return [...board].sort((a, b) => b.score - a.score);
}

function updateLeaderboardForUser(user) {
    if (!user) {
        return;
    }
    const board = getLeaderboardData();
    const existingIndex = board.findIndex((player) => player.name.toLowerCase() === user.username.toLowerCase());
    if (existingIndex >= 0) {
        board[existingIndex].score = user.points;
    } else {
        board.push({ name: user.username, score: user.points });
    }
    const sorted = sortLeaderboard(board);
    const unique = [];
    sorted.forEach((player) => {
        if (!unique.some((entry) => entry.name.toLowerCase() === player.name.toLowerCase())) {
            unique.push(player);
        }
    });
    saveLeaderboardData(unique.slice(0, 12));
}

function formatNumber(value) {
    return value.toLocaleString();
}

function goToLogin() {
    window.location.href = "login.html";
}

function logout() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    window.location.href = "index.html";
}

function goToDashboard() {
    window.location.href = "dashboard.html";
}

function goToLeaderboard() {
    window.location.href = "leaderboard.html";
}

function goToProfile() {
    window.location.href = "profile.html";
}

function goToSettings() {
    window.location.href = "settings.html";
}

function changeUserScore(amount) {
    const user = getCurrentUser();
    if (!user) {
        return;
    }
    user.points = Math.max(0, user.points + amount);
    user.matches += 1;
    user.wins += amount > 0 ? 1 : 0;
    user.xp += Math.floor(Math.abs(amount) / 12);

    if (user.xp >= 100) {
        user.level += 1;
        user.xp -= 100;
        user.achievements = Array.from(new Set([...user.achievements, `Level ${user.level} Reached`]));
    }

    if (user.points >= 10000 && !user.achievements.includes("Score 10K")) {
        user.achievements.push("Score 10K");
    }
    if (user.points >= 20000 && !user.achievements.includes("Champion")) {
        user.achievements.push("Champion");
    }

    saveCurrentUser(user);
    updateLeaderboardForUser(user);
    renderDashboard();
    renderProfile();
    renderLeaderboard();
}

function boostPlayer(name) {
    const leaderboard = getLeaderboardData();
    const player = leaderboard.find((item) => item.name === name);
    if (!player) {
        return;
    }
    player.score += 120;
    saveLeaderboardData(leaderboard);
    renderLeaderboard(document.getElementById("searchInput")?.value || "");
}

function saveSettings() {
    const themeToggle = document.getElementById("themeToggle");
    const notifyToggle = document.getElementById("notifyToggle");
    const bioField = document.getElementById("profileBioField");
    const settings = getSettings();
    const user = getCurrentUser();

    if (themeToggle) settings.darkMode = themeToggle.checked;
    if (notifyToggle) settings.notifications = notifyToggle.checked;
    if (bioField && user) {
        user.bio = bioField.value.trim() || user.bio;
        saveCurrentUser(user);
    }

    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    renderNav();
    renderDashboard();
    renderProfile();
    renderSettings();
}

function resetProgress() {
    localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(DEFAULT_LEADERBOARD));
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
    const user = getCurrentUser();
    if (user) {
        const resetUser = {
            ...DEFAULT_USER,
            username: user.username,
            points: 1500,
            level: 2,
            matches: 12,
            wins: 3,
            xp: 34,
            bio: "Ready to climb every leaderboard.",
            achievements: ["Welcome Badge"],
            joined: user.joined || new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })
        };
        saveCurrentUser(resetUser);
        updateLeaderboardForUser(resetUser);
    }

    window.location.reload();
}
