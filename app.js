// ==========================================
// 1. CONFIGURE USERS, ROLES & PASSWORDS HERE
// ==========================================

const SYSTEM_USERS = [
  { username: "John Doe", role: "Operator", pin: "1234" },
  { username: "Jane Smith", role: "Operator", pin: "1234" },
  { username: "Robert Fox", role: "Supervisor", pin: "5678" },
  { username: "Emily Davis", role: "Manager", pin: "admin99" }
];
// Application State
let currentUser = null;
let workEntries = [];
let editingEntryId = null;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  populateUserDropdown();
  loadStoredData();
  setDefaultDates();
  checkAuthSession();
});

function populateUserDropdown() {
  const select = document.getElementById("loginUserSelect");
  if (!select) return;
  
  select.innerHTML = '<option value="">-- Choose User Profile --</option>' + 
    SYSTEM_USERS.map(u => `<option value="${u.username}">${u.username} (${u.role})</option>`).join('');
}

function loadStoredData() {
  const data = localStorage.getItem("work_portal_entries");
  if (data) {
    try {
      workEntries = JSON.parse(data);
    } catch (e) {
      workEntries = [];
    }
  } else {
    workEntries = [
      {
        id: "1",
        date: new Date().toISOString().split("T")[0],
        typeOfWork: "Development",
        workDoneBy: "John Doe",
        workDoneOn: "Main Portal API",
        description: "Configured backend REST API routes and validated response formats.",
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

function checkAuthSession() {
  const session = localStorage.getItem("work_portal_user");
  if (session) {
    currentUser = JSON.parse(session);
    document.getElementById("authScreen").classList.add("hidden");
    updateUserUI();
    renderReports();
  }
}

// Password Verification Handler
// Password Verification Handler for Typed Usernames
function handleLogin(e) {
  e.preventDefault();
  const typedUsername = document.getElementById("loginUsername").value.trim();
  const enteredPassword = document.getElementById("loginPassword").value;

  // Search case-insensitively for the user in our SYSTEM_USERS list
  const foundUser = SYSTEM_USERS.find(u => u.username.toLowerCase() === typedUsername.toLowerCase());

  if (foundUser && foundUser.pin === enteredPassword) {
    currentUser = { username: foundUser.username, role: foundUser.role };
    localStorage.setItem("work_portal_user", JSON.stringify(currentUser));
    
    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("loginPassword").value = ""; // clear password
    updateUserUI();
    renderReports();
  } else {
    alert("Incorrect username or password! Please check your credentials.");
    document.getElementById("loginPassword").value = "";
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

// Form Submission (Create & Edit)
function handleFormSubmit(e) {
  e.preventDefault();
  
  const date = document.getElementById("formDate").value;
  const typeOfWork = document.getElementById("formTypeOfWork").value;
  const workDoneBy = document.getElementById("formWorkDoneBy").value;
  const workDoneOn = document.getElementById("formWorkDoneOn").value;
  const description = document.getElementById("formDescription").value;

  if (editingEntryId) {
    workEntries = workEntries.map(item => {
      if (item.id === editingEntryId) {
        return { ...item, date, typeOfWork, workDoneBy, workDoneOn, description };
      }
      return item;
    });
    editingEntryId = null;
    document.getElementById("formTitleText").textContent = "New Work Entry";
    document.getElementById("submitBtnText").textContent = "Save Entry";
    alert("Work entry updated successfully!");
  } else {
    const newEntry = {
      id: Date.now().toString(),
      date,
      typeOfWork,
      workDoneBy,
      workDoneOn,
      description,
      timestamp: new Date().toISOString()
    };
    workEntries.unshift(newEntry);
    alert("Work entry saved successfully!");
  }

  saveEntries();

  document.getElementById("formTypeOfWork").value = "";
  document.getElementById("formWorkDoneOn").value = "";
  document.getElementById("formDescription").value = "";
  document.getElementById("formWorkDoneBy").value = currentUser.username;

  switchTab("report");
}

function editEntry(id) {
  const entry = workEntries.find(e => e.id === id);
  if (!entry) return;

  if (currentUser.role === 'Operator' && entry.workDoneBy !== currentUser.username) {
    alert("Permission Denied: Operators can only edit their own work logs.");
    return;
  }

  editingEntryId = entry.id;
  document.getElementById("formDate").value = entry.date;
  document.getElementById("formTypeOfWork").value = entry.typeOfWork;
  document.getElementById("formWorkDoneBy").value = entry.workDoneBy;
  document.getElementById("formWorkDoneOn").value = entry.workDoneOn;
  document.getElementById("formDescription").value = entry.description;

  document.getElementById("formTitleText").textContent = "Edit Work Entry (#" + entry.id.slice(-4) + ")";
  document.getElementById("submitBtnText").textContent = "Update Entry";

  switchTab("entry");
}

function deleteEntry(id) {
  const entry = workEntries.find(e => e.id === id);
  if (!entry) return;

  if (currentUser.role === 'Operator' && entry.workDoneBy !== currentUser.username) {
    alert("Permission Denied: Operators can only delete their own work logs.");
    return;
  }

  if (confirm("Are you sure you want to delete this entry?")) {
    workEntries = workEntries.filter(e => e.id !== id);
    saveEntries();
    renderReports();
  }
}

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

function renderReports() {
  const startDate = document.getElementById("filterStartDate").value;
  const endDate = document.getElementById("filterEndDate").value;
  const container = document.getElementById("reportContainer");

  let filtered = workEntries.filter(entry => {
    if (startDate && entry.date < startDate) return false;
    if (endDate && entry.date > endDate) return false;
    return true;
  });

  document.getElementById("statTotalEntries").textContent = filtered.length;
  document.getElementById("statUniqueStaff").textContent = new Set(filtered.map(e => e.workDoneBy)).size;
  document.getElementById("statCategories").textContent = new Set(filtered.map(e => e.typeOfWork)).size;

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

  const grouped = {};
  filtered.forEach(entry => {
    if (!grouped[entry.date]) grouped[entry.date] = [];
    grouped[entry.date].push(entry);
  });

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
      <div class="day-group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
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
            <div class="p-6 hover:bg-gray-50/50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div class="space-y-2 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                    ${item.typeOfWork}
                  </span>
                  <span class="text-xs text-gray-400">Target: <strong class="text-gray-700">${item.workDoneOn}</strong></span>
                  <span class="text-xs text-gray-500 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    <i class="fa-solid fa-user text-indigo-400 mr-1"></i>${item.workDoneBy}
                  </span>
                </div>
                <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-line">${item.description}</p>
              </div>

              <div class="flex items-center space-x-2 shrink-0">
                <button onclick="editEntry('${item.id}')" class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-medium transition flex items-center space-x-1">
                  <i class="fa-solid fa-pen-to-square"></i>
                  <span>Edit</span>
                </button>
                <button onclick="deleteEntry('${item.id}')" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition flex items-center space-x-1">
                  <i class="fa-solid fa-trash"></i>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

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
