/* =========================================================
dashboard.js — logic for dashboard.html (Genie-Gym)
========================================================= */
const currentUser = getCurrentUser(); // from auth.js
if (!currentUser) throw new Error("Not logged in - redirecting to login page.");

const SPLIT_KEY = "genie_split_" + currentUser.email;
const HISTORY_KEY = "genie_history_" + currentUser.email;
const BANK_KEY = "genie_bank_" + currentUser.email;
const TODAY_EX_DONE_KEY = "genie_ex_done_" + currentUser.email + "_" + new Date().toISOString().slice(0, 10);

// Default Presets
const presets = {
    ppl: {
        name: "Push / Pull / Legs (PPL)",
        days: {
            "Monday": { focus: "Push (Chest, Shoulders, Triceps)", exercises: ["Barbell Bench Press (3x8)", "Overhead Press (3x10)", "Tricep Pushdowns (3x12)"] },
            "Tuesday": { focus: "Pull (Back, Biceps)", exercises: ["Lat Pulldown (3x10)", "Barbell Row (3x8)", "Barbell Bicep Curls (3x12)"] },
            "Wednesday": { focus: "Legs (Quads, Hamstrings)", exercises: ["Barbell Squat (3x6)", "Romanian Deadlift (3x8)", "Calf Raises (4x15)"] },
            "Thursday": { focus: "Rest & Recovery", exercises: [] },
            "Friday": { focus: "Push (Hypertrophy Focus)", exercises: ["Incline Dumbbell Press (3x12)", "Overhead Press (3x10)"] },
            "Saturday": { focus: "Pull & Core", exercises: ["Pull-ups (3xMax)", "Barbell Bicep Curls (3x12)"] },
            "Sunday": { focus: "Rest Day", exercises: [] }
        }
    },
    ul: {
        name: "Upper / Lower Split (ULx2)",
        days: {
            "Monday": { focus: "Upper Body Power", exercises: ["Barbell Bench Press (3x8)", "Barbell Row (3x8)", "Overhead Press (3x10)"] },
            "Tuesday": { focus: "Lower Body Power", exercises: ["Barbell Squat (3x6)", "Romanian Deadlift (3x8)"] },
            "Wednesday": { focus: "Rest Day", exercises: [] },
            "Thursday": { focus: "Upper Body Hypertrophy", exercises: ["Incline Dumbbell Press (3x12)", "Lat Pulldown (3x10)"] },
            "Friday": { focus: "Lower Body Hypertrophy", exercises: ["Leg Press (3x12)", "Calf Raises (4x15)"] },
            "Saturday": { focus: "Active Recovery", exercises: [] },
            "Sunday": { focus: "Rest Day", exercises: [] }
        }
    },
    fbeod: {
        name: "Full Body Every Other Day",
        days: {
            "Monday": { focus: "Full Body A", exercises: ["Barbell Squat (3x6)", "Barbell Bench Press (3x8)", "Lat Pulldown (3x10)"] },
            "Tuesday": { focus: "Rest Day", exercises: [] },
            "Wednesday": { focus: "Full Body B", exercises: ["Barbell Row (3x8)", "Overhead Press (3x10)", "Romanian Deadlift (3x8)"] },
            "Thursday": { focus: "Rest Day", exercises: [] },
            "Friday": { focus: "Full Body C", exercises: ["Leg Press (3x12)", "Incline Dumbbell Press (3x12)", "Pull-ups (3xMax)"] },
            "Saturday": { focus: "Rest Day", exercises: [] },
            "Sunday": { focus: "Rest Day", exercises: [] }
        }
    }
};

const defaultExerciseBank = [
    "Barbell Bench Press (3x8)",
    "Overhead Press (3x10)",
    "Incline Dumbbell Press (3x12)",
    "Lat Pulldown (3x10)",
    "Barbell Row (3x8)",
    "Pull-ups (3xMax)",
    "Barbell Squat (3x6)",
    "Romanian Deadlift (3x8)",
    "Leg Press (3x12)",
    "Barbell Bicep Curls (3x12)",
    "Tricep Pushdowns (3x12)",
    "Calf Raises (4x15)"
];

let userSplit = loadUserSplit();
let historyRecords = loadHistory();
let exerciseBank = loadExerciseBank();
let completedExercises = loadCompletedExercises();

function loadUserSplit() {
    try {
        const saved = JSON.parse(localStorage.getItem(SPLIT_KEY));
        if (saved && saved.days) return saved;
    } catch (e) {}
    return presets.ppl;
}

function saveUserSplit() {
    localStorage.setItem(SPLIT_KEY, JSON.stringify(userSplit));
}

function loadHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
        if (Array.isArray(saved)) return saved;
    } catch (e) {}
    return [];
}

function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyRecords));
}

function loadExerciseBank() {
    try {
        const saved = JSON.parse(localStorage.getItem(BANK_KEY));
        if (Array.isArray(saved)) return saved;
    } catch (e) {}
    return [...defaultExerciseBank];
}

function saveExerciseBank() {
    localStorage.setItem(BANK_KEY, JSON.stringify(exerciseBank));
}

function loadCompletedExercises() {
    try {
        const saved = JSON.parse(localStorage.getItem(TODAY_EX_DONE_KEY));
        if (Array.isArray(saved)) return saved;
    } catch (e) {}
    return [];
}

function saveCompletedExercises() {
    localStorage.setItem(TODAY_EX_DONE_KEY, JSON.stringify(completedExercises));
}

// ---------- Dark Mode Handler ----------
function initTheme() {
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const themeIcon = document.getElementById("themeIcon");
    const isDark = localStorage.getItem("genie_theme_" + currentUser.email) === "dark";

    if (isDark) {
        document.body.classList.add("dark-mode");
        if (themeIcon) themeIcon.className = "bi bi-sun-fill";
    } else {
        document.body.classList.remove("dark-mode");
        if (themeIcon) themeIcon.className = "bi bi-moon-stars";
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            const darkNow = document.body.classList.contains("dark-mode");
            localStorage.setItem("genie_theme_" + currentUser.email, darkNow ? "dark" : "light");
            if (themeIcon) {
                themeIcon.className = darkNow ? "bi bi-sun-fill" : "bi bi-moon-stars";
            }
        });
    }
}

// ---------- Auto-sync Day Completion ----------
function checkAndAutoSyncDayCompletion() {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = daysOfWeek[new Date().getDay()];
    const todayData = userSplit.days[todayName] || { exercises: [] };
    const todayStr = new Date().toISOString().slice(0, 10);

    const existingIndex = historyRecords.findIndex(r => r.date === todayStr);
    const totalExercises = todayData.exercises.length;

    if (totalExercises > 0 && completedExercises.length === totalExercises) {
        if (existingIndex === -1) {
            historyRecords.push({
                id: Date.now(),
                title: todayData.focus,
                category: todayName,
                date: todayStr,
                done: true,
                exercises: [...todayData.exercises]
            });
            saveHistory();
        }
    } else {
        if (existingIndex !== -1) {
            historyRecords.splice(existingIndex, 1);
            saveHistory();
        }
    }
}

// Strictly show exercises done today in the summary card
function getTotalCompletedExerciseCount() {
    return completedExercises.length;
}

// ---------- Render Dashboard UI ----------
function renderDashboard() {
    document.getElementById("navUserName").textContent = currentUser.name;
    document.getElementById("welcomeName").textContent = currentUser.name.split(" ")[0];
    document.getElementById("todayDate").textContent = new Date().toLocaleDateString("en-PH", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    checkAndAutoSyncDayCompletion();

    document.getElementById("statSplitName").textContent = userSplit.name;
    document.getElementById("statTotal").textContent = getTotalCompletedExerciseCount();
    document.getElementById("statExercises").textContent = exerciseBank.length + " Items";

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = daysOfWeek[new Date().getDay()];
    document.getElementById("todayDayBadge").textContent = todayName;

    const todayData = userSplit.days[todayName] || { focus: "Rest Day", exercises: [] };
    const todayContainer = document.getElementById("todaysWorkoutContent");
    
    let htmlContent = `<h5 class="fw-bold text-dark mb-2 fs-6 fs-md-5">${todayData.focus}</h5>`;
    if (todayData.exercises && todayData.exercises.length > 0) {
        htmlContent += `<ul class="list-unstyled mb-0 d-flex flex-column gap-2">`;
        todayData.exercises.forEach((ex, idx) => {
            const isDone = completedExercises.includes(idx);
            htmlContent += `
                <li class="d-flex justify-content-between align-items-center p-2 border rounded ${isDone ? 'bg-success-subtle border-success' : 'bg-body'}">
                    <span class="small ${isDone ? 'text-decoration-line-through text-success fw-semibold' : ''}">${ex}</span>
                    <div class="d-flex align-items-center gap-1 ms-2">
                        <button class="btn btn-link btn-sm p-0 text-decoration-none" data-bs-toggle="modal" data-bs-target="#altModal" title="View Alternatives">
                            <i class="bi bi-shuffle"></i>
                        </button>
                        <button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-outline-success'} toggle-ex-done py-0 px-2" data-index="${idx}">
                            <i class="bi ${isDone ? 'bi-check-all' : 'bi-check'}"></i> ${isDone ? 'Done' : 'Mark'}
                        </button>
                    </div>
                </li>`;
        });
        htmlContent += `</ul>`;
    } else {
        htmlContent += `<p class="text-muted small mt-2 mb-0">Enjoy your rest day or perform light stretching!</p>`;
    }
    todayContainer.innerHTML = htmlContent;

    document.querySelectorAll(".toggle-ex-done").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = Number(e.currentTarget.getAttribute("data-index"));
            if (completedExercises.includes(idx)) {
                completedExercises = completedExercises.filter(i => i !== idx);
            } else {
                completedExercises.push(idx);
            }
            saveCompletedExercises();
            renderDashboard();
        });
    });

    const graphContainer = document.getElementById("weeklyGraphContainer");
    graphContainer.innerHTML = Object.keys(userSplit.days).map(day => {
        const dayInfo = userSplit.days[day];
        const isToday = day === todayName;
        const activeClass = isToday ? "border-primary bg-primary-subtle shadow-sm" : "border-light";
        const badgeClass = isToday ? "bg-primary text-white" : "bg-secondary text-white";

        return `
            <div class="p-2 px-3 border rounded d-flex justify-content-between align-items-center ${activeClass}">
                <div class="d-flex align-items-center gap-2 gap-sm-3 me-2">
                    <span class="badge ${badgeClass} p-1 p-sm-2" style="min-width: 75px; text-align: center;">${day}</span>
                    <span class="fw-semibold text-dark small text-truncate" style="max-width: 180px;">${dayInfo.focus}</span>
                </div>
                ${isToday ? '<span class="badge bg-success small">Today</span>' : ''}
            </div>
        `;
    }).join("");
}

// ---------- Modal Helpers ----------
function renderExerciseBankDraggables() {
    const container = document.getElementById("exerciseBank");
    if (!container) return;

    container.innerHTML = exerciseBank.map(ex => `
        <div class="p-2 border rounded shadow-sm draggable-item" draggable="true" data-ex="${ex}">
            <i class="bi bi-grip-vertical me-1 text-muted"></i>${ex}
        </div>
    `).join("");

    initDragListeners();
}

function renderBankListModal() {
    const query = (document.getElementById("bankSearchInput").value || "").toLowerCase();
    const container = document.getElementById("bankListGroup");
    if (!container) return;

    const filtered = exerciseBank.filter(ex => ex.toLowerCase().includes(query));

    container.innerHTML = filtered.length > 0 ? filtered.map(ex => `
        <div class="list-group-item d-flex justify-content-between align-items-center p-2">
            <span class="small"><i class="bi bi-activity text-primary me-2"></i>${ex}</span>
            <button class="btn btn-sm btn-outline-danger border-0 delete-ex-btn" data-ex="${ex}" title="Remove from bank">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `).join("") : `<div class="p-3 text-center text-muted small">No exercises found.</div>`;

    container.querySelectorAll(".delete-ex-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const exToRemove = e.target.closest("button").getAttribute("data-ex");
            exerciseBank = exerciseBank.filter(item => item !== exToRemove);
            saveExerciseBank();
            renderBankListModal();
            renderExerciseBankDraggables();
            renderDashboard();
        });
    });
}

// ---------- Drag & Drop Setup ----------
function setupDropZones() {
    renderExerciseBankDraggables();

    const container = document.getElementById("dropZonesContainer");
    container.innerHTML = Object.keys(userSplit.days).map(day => {
        const dayData = userSplit.days[day];
        return `
            <div class="border rounded p-2 p-md-3 shadow-sm drop-zone" data-day="${day}">
                <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-2 gap-2">
                    <span class="fw-bold text-primary small">${day}</span>
                    <input type="text" class="form-control form-control-sm w-100 w-sm-50 day-focus-input" value="${dayData.focus}" placeholder="Workout Focus">
                </div>
                <div class="assigned-exercises-list border border-dashed rounded p-2 d-flex flex-wrap gap-1" style="min-height: 48px;">
                    ${dayData.exercises.map(ex => `
                        <span class="badge bg-primary d-flex align-items-center gap-1 p-2 assigned-badge" style="font-size: 0.8rem;">
                            ${ex} <i class="bi bi-x-circle text-white ms-1 remove-ex-btn" role="button"></i>
                        </span>
                    `).join("")}
                    ${dayData.exercises.length === 0 ? '<span class="text-muted small m-auto placeholder-text" style="font-size: 0.75rem;">Drag exercises here</span>' : ''}
                </div>
            </div>
        `;
    }).join("");

    initDropZoneListeners();
}

function initDragListeners() {
    document.querySelectorAll(".draggable-item").forEach(item => {
        item.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", item.getAttribute("data-ex"));
        });
    });
}

function initDropZoneListeners() {
    const dropZones = document.querySelectorAll(".drop-zone");

    dropZones.forEach(zone => {
        zone.addEventListener("dragover", (e) => e.preventDefault());

        zone.addEventListener("drop", (e) => {
            e.preventDefault();
            const exName = e.dataTransfer.getData("text/plain");
            if (!exName) return;

            const listContainer = zone.querySelector(".assigned-exercises-list");
            const placeholder = listContainer.querySelector(".placeholder-text");
            if (placeholder) placeholder.remove();

            const badge = document.createElement("span");
            badge.className = "badge bg-primary d-flex align-items-center gap-1 p-2 assigned-badge";
            badge.style.fontSize = "0.8rem";
            badge.innerHTML = `${exName} <i class="bi bi-x-circle text-white ms-1 remove-ex-btn" role="button"></i>`;
            
            badge.querySelector(".remove-ex-btn").addEventListener("click", () => badge.remove());
            listContainer.appendChild(badge);
        });
    });

    document.querySelectorAll(".remove-ex-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.target.closest(".assigned-badge").remove();
        });
    });
}

// ---------- Event Listeners ----------
document.getElementById("splitTemplateSelect").addEventListener("change", (e) => {
    const val = e.target.value;
    if (presets[val]) {
        userSplit = JSON.parse(JSON.stringify(presets[val]));
        setupDropZones();
    }
});

document.getElementById("saveSplitBtn").addEventListener("click", () => {
    const newDays = {};
    document.querySelectorAll(".drop-zone").forEach(zone => {
        const dayName = zone.getAttribute("data-day");
        const focus = zone.querySelector(".day-focus-input").value;
        const exercises = [];
        zone.querySelectorAll(".assigned-badge").forEach(badge => {
            exercises.push(badge.textContent.trim());
        });
        newDays[dayName] = { focus, exercises };
    });

    userSplit.days = newDays;
    userSplit.name = document.getElementById("splitTemplateSelect").options[document.getElementById("splitTemplateSelect").selectedIndex].text;
    saveUserSplit();
    renderDashboard();

    const modal = bootstrap.Modal.getInstance(document.getElementById("splitModal"));
    if (modal) modal.hide();
});

document.getElementById("splitModal").addEventListener("show.bs.modal", () => {
    setupDropZones();
});

document.getElementById("bankModal").addEventListener("show.bs.modal", () => {
    renderBankListModal();
});

document.getElementById("bankSearchInput").addEventListener("input", renderBankListModal);

document.getElementById("openAddExModalBtn").addEventListener("click", () => {
    bootstrap.Modal.getOrCreateInstance(document.getElementById("addExerciseModal")).show();
});

document.getElementById("addExFromSplitModalBtn").addEventListener("click", () => {
    bootstrap.Modal.getOrCreateInstance(document.getElementById("addExerciseModal")).show();
});

document.getElementById("addExerciseForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const newEx = document.getElementById("newExName").value.trim();
    if (!newEx) return;

    if (!exerciseBank.includes(newEx)) {
        exerciseBank.push(newEx);
        saveExerciseBank();
    }

    document.getElementById("addExerciseForm").reset();
    const addModalInstance = bootstrap.Modal.getInstance(document.getElementById("addExerciseModal"));
    if (addModalInstance) addModalInstance.hide();

    renderExerciseBankDraggables();
    renderBankListModal();
    renderDashboard();
});

document.getElementById("logoutBtn").addEventListener("click", logout);

// ---------- Startup Calls ----------
initTheme();
renderDashboard();