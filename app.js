// ==========================================
// SYSTEM USERS & ROLES CONFIGURATION
// ==========================================

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw98200Yl-PycO5yNL8JjnIm5OSWd8VlalOAEotA3mwWGr0wGS52B3IQ0PU45u2D_Bd/exec";

const SYSTEM_USERS = [
  { username: "TA", role: "Operator" },
  { username: "JE2", role: "Operator" },
  { username: "AETNMS", role: "Supervisor" },
  { username: "admin", role: "Manager" },
  { username: "AEETNMS", role: "Manager" }
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
  
  select.innerHTML = '<option value="">-- Select Username --</option>' + 
    SYSTEM_USERS.map(u => `<option value="${u.username}|${u.role}">${u.username}</option>`).join('');
}

// Load data directly from Google Sheet (with localStorage fallback)
function loadStoredData() {
  fetch(WEB_APP_URL)
    .then(response => response.json())
    .then(data => {
      workEntries = data || [];
      localStorage.setItem("work_portal_entries", JSON.stringify(workEntries));
      renderReports();
    })
    .catch(error => {
      console.error("Error loading from cloud:", error);
      const localData = localStorage.getItem("work_portal_entries");
      if (localData) {
        try {
          workEntries = JSON.parse(localData);
        } catch (e) {
          workEntries = [];
        }
      }
      renderReports();
    });
}

// Save entry to Google Sheet via URL Parameters
function saveEntryToCloud(entryObj) {
  const params = new URLSearchParams();
  params.append("action", "save");
  params.append("id", entryObj.id || "");
  params.append("date", entryObj.date || "");
  params.append("typeOfWork", entryObj.typeOfWork || "");
  params.append("workDoneBy", entryObj.workDoneBy || "");
  params.append("workDoneOn", entryObj.workDoneOn || "");
  params.append("description", entryObj.description || "");
  params.append("timestamp", entryObj.timestamp || "");

  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    body: params
  }).then(() => {
    setTimeout(loadStoredData, 1500);
  }).catch(err => console.error("Cloud save failed:", err));
}

// Delete entry from Google Sheet via URL Parameters
function deleteEntryFromCloud(id) {
  const params = new URLSearchParams();
  params.append("action", "delete");
  params.append("id", id);

  fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    body: params
  }).then(() => {
    setTimeout(loadStoredData, 1500);
  }).catch(err => console.error("Cloud delete failed:", err));
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

function handleLogin(e) {
  e.preventDefault();
  const val = document.getElementById("loginUserSelect").value;
  if (!val) return;

  const [username, role] = val.split("|");
  currentUser = { username, role };
  
  localStorage.setItem("work_portal_user", JSON.stringify(currentUser));
  document.getElementById("authScreen").classList.add("hidden");
  updateUserUI();
  renderReports();
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
  
  const initials = currentUser.username.slice(0, 2).toUpperCase();
  document.getElementById("userAvatar").textContent = initials;
}

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

function handleFormSubmit(e) {
  e.preventDefault();
  
  const date = document.getElementById("formDate").value;
  const typeOfWork = document.getElementById("formTypeOfWork").value;
  const workDoneBy = currentUser.username;
  const workDoneOn = document.getElementById("formWorkDoneOn").value; // Sub Category
  const description = document.getElementById("formDescription").value;

  if (editingEntryId) {
    const updatedEntry = {
      id: editingEntryId,
      date,
      typeOfWork,
      workDoneBy,
      workDoneOn,
      description,
      timestamp: new Date().toISOString()
    };
    
    workEntries = workEntries.map(item => item.id === editingEntryId ? updatedEntry : item);
    saveEntryToCloud(updatedEntry);

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
    saveEntryToCloud(newEntry);
    alert("Work entry saved and synced to Google Drive!"+newEntry);
  }

  localStorage.setItem("work_portal_entries", JSON.stringify(workEntries));

  document.getElementById("formTypeOfWork").value = "";
  document.getElementById("formWorkDoneOn").value = "";
  document.getElementById("formDescription").value = "";

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
    localStorage.setItem("work_portal_entries", JSON.stringify(workEntries));
    deleteEntryFromCloud(id);
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

function copyWhatsAppReport() {
  const startDate = document.getElementById("filterStartDate").value;
  const endDate = document.getElementById("filterEndDate").value;

  if (!startDate || startDate !== endDate) {
    alert("Please select a single specific date using the Filter Date Range (Start Date and End Date set to the same day) to generate the WhatsApp report.");
    return;
  }

  let filtered = workEntries.filter(entry => entry.date === startDate);

  if (filtered.length === 0) {
    alert("No work entries found for " + startDate);
    return;
  }

  const [year, month, day] = startDate.split("-");
  const formattedDateStr = `${day}/${month}/${year}`;

  let reportText = `Good Morning, Sir \n\nAEE/TNMS Sub-Division – ${formattedDateStr} Work Report (TNMS & P&C Lab):\n\n`;

  filtered.forEach((item, index) => {
    reportText += `${index + 1}. ${item.description}\n`;
  });

  reportText += `\nThank you, Sir`;

  navigator.clipboard.writeText(reportText).then(() => {
    alert("WhatsApp report for " + formattedDateStr + " copied to clipboard! You can now paste it directly into WhatsApp.");
  }).catch(err => {
    alert("Failed to copy. Please check browser clipboard permissions.");
  });
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
                  <span class="text-xs text-gray-400">Sub Category: <strong class="text-gray-700">${item.workDoneOn}</strong></span>
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

  const headers = ["ID", "Date", "Type of Work", "Work Done By", "Sub Category", "Description"];
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
