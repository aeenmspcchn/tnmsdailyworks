// Application State
let currentUser = null;
let workEntries = [];

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  loadStoredData();
  setDefaultDates();
  checkAuthSession();
});

// Load entries from localStorage
function loadStoredData() {
  const data = localStorage.getItem("work_portal_entries");
  if (data) {
    try {
      workEntries = JSON.parse(data);
    } catch (e) {
      workEntries = [];
    }
  } else {
    // Seed sample data if empty
    workEntries = [
      {
        id: "1",
        date: new Date().toISOString().split("T")[0],
        typeOfWork: "Development",
        workDoneBy: "John Doe",
        workDoneOn: "Main Portal API",
        description: "Configured backend REST API routes and validated response formats.",
        timestamp: new Date().toISOString()
      },
      {
        id: "2",
        date: new Date().toISOString().split("T")[0],
        typeOfWork: "Inspection",
        workDoneBy: "Jane Smith",
        workDoneOn: "Server Room B",
        description: "Routine hardware diagnostic checks. Replaced faulty ethernet cables.",
        timestamp: new Date().toISOString()
      }
    ];
    saveEntries();
  }
}

function saveEntries() {
  localStorage.setItem("work_portal_entries", JSON.stringify(workEntries));
}

function setDefaultDates() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("formDate").value = today;
  document.getElementById("filterStartDate").value = today;
  document.getElementById("filterEndDate").value = today;
}

// Auth Handlers
function checkAuthSession() {
  const session = localStorage.getItem("work_portal_user");
  if (session) {
    currentUser = JSON.parse(session);
    document.getElementById("authScreen").classList.add("hidden");
    updateUserUI();
    renderReports();
  }
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const role = document.getElementById("loginRole").value;

  if (username) {
    currentUser = { username, role };
    localStorage.setItem("work_portal_user", JSON.stringify(currentUser));
    document.getElementById("authScreen").classList.add("hidden");
    updateUserUI();
    renderReports();
  }
}

function handleLogout() {
  localStorage.removeItem("work_portal_user");
  currentUser = null;
  document.getElementById("authScreen").classList.remove("hidden");
}

function updateUserUI() {
  if (!currentUser) return;
  document.getElementById("currentUserName").textContent = currentUser.username;
  document.getElementById("currentUserRole").textContent = currentUser.role;
  document.getElementById("formWorkDoneBy").value = currentUser.username;
  
  const initials = currentUser.username.slice(0, 2).toUpperCase();
  document.getElementById("userAvatar").textContent = initials;
}

// Navigation Tabs
function switchTab(tab) {
  const entrySection = document.getElementById("entrySection");
  const reportSection = document.getElementById("reportSection");

  const navEntryTab = document.getElementById("navEntryTab");
  const navReportTab = document.getElementById("navReportTab");
  const mobileNavEntry = document.getElementById("mobileNavEntryTab");
  const mobileNavReport = document.getElementById("mobileNavReportTab");

  if (tab === 'entry') {
    entrySection.classList.remove("hidden");
    reportSection.classList.add("hidden");

    navEntryTab.className = "nav-tab px-4 py-1.5 rounded-lg transition bg-white text-indigo-600 shadow-sm";
    navReportTab.className = "nav-tab px-4 py-1.5 rounded-lg transition hover:text-gray-900";
    mobileNavEntry.className = "flex-1 py-2 text-center rounded-lg bg-indigo-50 text-indigo-600 font-semibold";
    mobileNavReport.className = "flex-1 py-2 text-center rounded-lg text-gray-600";
  } else {
    entrySection.classList.add("hidden");
    reportSection.classList.remove("hidden");

    navReportTab.className = "nav-tab px-4 py-1.5 rounded-lg transition bg-white text-indigo-600 shadow-sm";
    navEntryTab.className = "nav-tab px-4 py-1.5 rounded-lg transition hover:text-gray-900";
    mobileNavReport.className = "flex-1 py-2 text-center rounded-lg bg-indigo-50 text-indigo-600 font-semibold";
    mobileNavEntry.className = "flex-1 py-2 text-center rounded-lg text-gray-600";

    renderReports();
  }
}

// Form Submission
function handleFormSubmit(e) {
  e.preventDefault();
  
  const newEntry = {
    id: Date.now().toString(),
    date: document.getElementById("formDate").value,
    typeOfWork: document.getElementById("formTypeOfWork").value,
    workDoneBy: document.getElementById("formWorkDoneBy").value,
    workDoneOn: document.getElementById("formWorkDoneOn").value,
    description: document.getElementById("formDescription").value,
    timestamp: new Date().toISOString()
  };

  workEntries.unshift(newEntry);
  saveEntries();

  // Reset form fields except "Work Done By"
  document.getElementById("formTypeOfWork").value = "";
  document.getElementById("formWorkDoneOn").value = "";
  document.getElementById("formDescription").value = "";

  alert("Work entry saved successfully!");
  switchTab("report");
}

// Filter Preset Handler
function setFilterPreset(preset) {
  const startDateInput = document.getElementById("filterStartDate");
  const endDateInput = document.getElementById("filterEndDate");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  if (preset === 'today') {
    startDateInput.value = todayStr;
    endDateInput.value = todayStr;
  } else if (preset === 'yesterday') {
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().split("T")[0];
    startDateInput.value = yestStr;
    endDateInput.value = yestStr;
  } else if (preset === 'thisMonth') {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    startDateInput.value = firstDay;
    endDateInput.value = todayStr;
  } else if (preset === 'all') {
    startDateInput.value = "";
    endDateInput.value = "";
  }

  renderReports();
}

// Report Rendering Logic
function renderReports() {
  const startDate = document.getElementById("filterStartDate").value;
  const endDate = document.getElementById("filterEndDate").value;
  const container = document.getElementById("reportContainer");

  // Filter entries
  let filtered = workEntries.filter(entry => {
    if (startDate && entry.date < startDate) return false;
    if (endDate && entry.date > endDate) return false;
    return true;
  });

  // Update statistics
  document.getElementById("statTotalEntries").textContent = filtered.length;
  const uniqueStaff = new Set(filtered.map(e => e.workDoneBy)).size;
  const uniqueTypes = new Set(filtered.map(e => e.typeOfWork)).size;
  document.getElementById("statUniqueStaff").textContent = uniqueStaff;
  document.getElementById("statCategories").textContent = uniqueTypes;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-white p-12 text-center rounded-2xl border border-gray-200">
        <i class="fa-regular fa-folder-open text-4xl text-gray-300 mb-3 block"></i>
        <h3 class="font-bold text-gray-700">No Entries Found</h3>
        <p class="text-xs text-gray-400 mt-1">Try selecting a different date range or add new work logs.</p>
      </div>
    `;
    return;
  }

  // Group by Date
  const grouped = {};
  filtered.forEach(entry => {
    if (!grouped[entry.date]) grouped[entry.date] = [];
    grouped[entry.date].push(entry);
  });

  // Sort dates descending
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  container.innerHTML = sortedDates.map(dateStr => {
    const dayEntries = grouped[dateStr];
    const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="day-group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 bg-slate-50 border-b border-gray-200 flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <i class="fa-regular fa-calendar-days text-indigo-600"></i>
            <h3 class="font-bold text-gray-800 text-sm">${formattedDate}</h3>
          </div>
          <span class="text-xs font-semibold px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
            ${dayEntries.length} ${dayEntries.length === 1 ? 'Task' : 'Tasks'} Logged
          </span>
        </div>

        <div class="divide-y divide-gray-100">
          ${dayEntries.map(item => `
            <div class="p-6 hover:bg-gray-50/50 transition">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div class="flex items-center space-x-2">
                  <span class="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                    ${item.typeOfWork}
                  </span>
                  <span class="text-xs text-gray-400">Target: <strong class="text-gray-700">${item.workDoneOn}</strong></span>
                </div>
                <div class="text-xs text-gray-500 flex items-center space-x-1">
                  <i class="fa-solid fa-user-gear text-gray-400"></i>
                  <span>${item.workDoneBy}</span>
                </div>
              </div>
              <p class="text-sm text-gray-800 mt-2 leading-relaxed whitespace-pre-line">${item.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// CSV Export Utility
function exportCSV() {
  if (workEntries.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = ["ID", "Date", "Type of Work", "Work Done By", "Work Done On", "Description"];
  const rows = workEntries.map(e => [
    `"${e.id}"`,
    `"${e.date}"`,
    `"${e.typeOfWork}"`,
    `"${e.workDoneBy}"`,
    `"${e.workDoneOn}"`,
    `"${e.description.replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `work_log_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}