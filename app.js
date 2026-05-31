// ==========================================================================
// STATE MANAGEMENT & LOCAL STORAGE DB
// ==========================================================================

const DEFAULT_BOUNTIES = [
  {
    id: "B-8831",
    area: "Indiranagar",
    budget: 14000,
    deposit: 2,
    roomType: "Single Room",
    preferences: ["wifi", "food", "washroom"],
    notes: "Please check if the PG Mess has north-Indian food options, and run speed test near the window.",
    status: "visiting", // pending, visiting, submitted, completed
    seekerName: "Amit R.",
    dudeName: "Rahul K.",
    escrowState: "secured", // secured, released, disputed
    createdAt: "2026-05-30T10:30:00Z",
    chat: [
      { sender: "dude", text: "Hi Amit, I've accepted your bounty. Heading to the Indiranagar double-story PG near Metro Station now.", time: "10:35 AM" },
      { sender: "seeker", text: "Thanks Rahul! Please pay extra attention to the room ventilation.", time: "10:38 AM" },
      { sender: "dude", text: "Got it, just reached the PG. Entering the single room on the second floor.", time: "10:55 AM" }
    ],
    report: null
  },
  {
    id: "B-2144",
    area: "Koramangala",
    budget: 12000,
    deposit: 2,
    roomType: "Double Sharing",
    preferences: ["wifi", "washroom"],
    notes: "Must be walking distance to St. John's Hospital. Power backup is critical.",
    status: "pending",
    seekerName: "Neha S.",
    dudeName: null,
    escrowState: "secured",
    createdAt: "2026-05-30T11:45:00Z",
    chat: [],
    report: null
  },
  {
    id: "B-9982",
    area: "HSR Layout",
    budget: 18000,
    deposit: 3,
    roomType: "Single Room",
    preferences: ["wifi", "food", "washroom", "restriction"],
    notes: "Looking for premium space in Sector 2. Need food quality check.",
    status: "submitted",
    seekerName: "Vikram M.",
    dudeName: "Priya L.",
    escrowState: "secured",
    createdAt: "2026-05-30T09:15:00Z",
    chat: [
      { sender: "dude", text: "Hey Vikram, done with the detailed walk. Sending the verification report now.", time: "09:40 AM" },
      { sender: "dude", text: "The food is surprisingly good. Daily menu includes paneer, dal, and standard roti.", time: "09:42 AM" }
    ],
    report: {
      wifiSpeed: 105,
      foodRating: "5",
      photo: "room_premium.jpg",
      location: "https://maps.google.com/?q=Sector+2+HSR+Layout+Bengaluru"
    }
  },
  {
    id: "B-1024",
    area: "Whitefield",
    budget: 16000,
    deposit: 1,
    roomType: "Single Room",
    preferences: ["wifi"],
    notes: "Check if the flatmates are quiet, and verify mobile reception inside the room.",
    status: "completed",
    seekerName: "Rohan D.",
    dudeName: "Rahul K.",
    escrowState: "released",
    createdAt: "2026-05-29T14:20:00Z",
    chat: [
      { sender: "dude", text: "Mobile signal is full 5G (Airtel and Jio).", time: "02:35 PM" },
      { sender: "seeker", text: "Awesome! Looks perfect. Releasing payment now.", time: "02:40 PM" }
    ],
    report: {
      wifiSpeed: 180,
      foodRating: "4",
      photo: "room_double.jpg",
      location: "https://maps.google.com/?q=Whitefield+Bengaluru"
    }
  }
];

// Initialize DB
function getDB() {
  const data = localStorage.getItem("tab_db");
  if (!data) {
    localStorage.setItem("tab_db", JSON.stringify(DEFAULT_BOUNTIES));
    return DEFAULT_BOUNTIES;
  }
  return JSON.parse(data);
}

function saveDB(db) {
  localStorage.setItem("tab_db", JSON.stringify(db));
}

// Current User State (Simulated)
let currentRole = "visitor"; // visitor, seeker, dude, admin
let selectedBountyId = null;

// ==========================================================================
// LANDING PAGE INTERACTIVE SIMULATOR CHAT ENGINE
// ==========================================================================
const SIM_CHAT_MESSAGES = [
  { sender: "dude", text: "Hey! Just reached the Indiranagar PG. Sending my live coordinates.", delay: 1000 },
  { sender: "dude", type: "loc", text: "📍 Location: Indiranagar 100 Feet Rd PG", delay: 1800 },
  { sender: "seeker", text: "Awesome, please check the room on the 3rd floor. How is the bathroom condition?", delay: 2000 },
  { sender: "dude", text: "Checking. Ventilation is good, geyser is working. Here is a photo of the single room layout.", delay: 2500 },
  { sender: "dude", type: "img", src: "room_premium.jpg", delay: 1500 },
  { sender: "seeker", text: "Looks clean! Did you run a speed test on the Wi-Fi?", delay: 1800 },
  { sender: "dude", type: "speed", text: "📶 Wi-Fi Speed Test Completed:", speed: "94 Mbps", delay: 2000 },
  { sender: "seeker", text: "Perfect, 90+ Mbps is plenty for my remote job. Releasing the bounty payout now! Thank you!", delay: 2500 },
  { sender: "dude", text: "Bounty payout received! Thank you for using TAB (Take A Breath). Have a safe move to Bengaluru! 🙌", delay: 2000 }
];

let simChatIndex = 0;
let simChatTimeout = null;

function runChatSimulation() {
  const chatBox = document.getElementById("sim-chat-box");
  if (!chatBox) return;

  if (simChatIndex === 0) {
    chatBox.innerHTML = "";
  }

  if (simChatIndex < SIM_CHAT_MESSAGES.length) {
    const msg = SIM_CHAT_MESSAGES[simChatIndex];
    simChatTimeout = setTimeout(() => {
      appendSimMessage(msg);
      simChatIndex++;
      runChatSimulation();
    }, msg.delay);
  } else {
    // Restart simulation after 8 seconds
    simChatTimeout = setTimeout(() => {
      simChatIndex = 0;
      runChatSimulation();
    }, 8000);
  }
}

function appendSimMessage(msg) {
  const chatBox = document.getElementById("sim-chat-box");
  if (!chatBox) return;

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${msg.sender}`;

  if (msg.type === "loc") {
    bubble.innerHTML = `<strong>${msg.text}</strong>`;
  } else if (msg.type === "img") {
    bubble.innerHTML = `Single Room View:<br><img src="${msg.src}" class="chat-img-attachment" alt="PG Room">`;
  } else if (msg.type === "speed") {
    bubble.innerHTML = `${msg.text}<div class="chat-speed-metric">⚡ Speed: <strong>${msg.speed}</strong></div>`;
  } else {
    bubble.innerText = msg.text;
  }

  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ==========================================================================
// MAIN APP ROUTING & ROLE SWITCHER
// ==========================================================================

function setRole(role) {
  currentRole = role;
  
  // Update Simulator Nav Buttons
  document.querySelectorAll(".role-btn").forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.role === role) btn.classList.add("active");
  });

  // Switch DOM view
  document.querySelectorAll(".app-view").forEach(view => {
    view.classList.remove("active");
  });

  if (role === "visitor") {
    document.getElementById("view-landing").classList.add("active");
    simChatIndex = 0;
    clearTimeout(simChatTimeout);
    runChatSimulation();
  } else if (role === "seeker") {
    document.getElementById("view-seeker").classList.add("active");
    renderSeekerBounties();
  } else if (role === "dude") {
    document.getElementById("view-dude").classList.add("active");
    renderDudeBoard();
  } else if (role === "admin") {
    document.getElementById("view-admin").classList.add("active");
    renderAdminPanel();
  }

  showToast(`Switched view to ${role.toUpperCase()} mode`);
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `🔔 <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==========================================================================
// LANDING PAGE BOUNTIES FEED & INTERACTIVE MAP
// ==========================================================================

function renderLandingBounties() {
  const listEl = document.getElementById("landing-bounties-list");
  if (!listEl) return;

  const db = getDB();
  listEl.innerHTML = "";

  db.forEach(b => {
    const item = document.createElement("div");
    item.className = "bounty-feed-item";
    
    // Status text details
    let statusClass = "status-pending";
    let statusText = "Open Bounty";
    if (b.status === "visiting") {
      statusClass = "status-visiting";
      statusText = "Dude visiting";
    } else if (b.status === "submitted") {
      statusClass = "status-completed";
      statusText = "Report ready";
    } else if (b.status === "completed") {
      statusClass = "status-verified";
      statusText = "Verified";
    }

    item.innerHTML = `
      <div class="bounty-info-block">
        <span class="bounty-loc-badge">
          📍 ${b.area} 
          <span class="bounty-loc-tag">${b.roomType}</span>
        </span>
        <span class="bounty-specs">Budget: ₹${b.budget.toLocaleString()} | Seeker: ${b.seekerName}</span>
      </div>
      <div class="bounty-price-block">
        <span class="bounty-amount">₹499 Bounty</span>
        <span class="bounty-status-label ${statusClass}">${statusText}</span>
      </div>
    `;

    // Click on a bounty feed card redirects to seeker view
    item.addEventListener("click", () => {
      selectedBountyId = b.id;
      setRole("seeker");
      openSeekerChat(b.id);
    });

    listEl.appendChild(item);
  });

  document.getElementById("live-bounty-count").innerText = `${db.filter(b => b.status !== "completed").length} Active`;
}

// Setup Map interaction
function setupInteractiveMap() {
  const nodes = document.querySelectorAll(".map-node");
  const areaSelect = document.getElementById("bounty-area");

  nodes.forEach(node => {
    node.addEventListener("click", () => {
      const area = node.dataset.area;
      showToast(`Selected area: ${area}`);
      if (areaSelect) {
        areaSelect.value = area;
      }
      // Route to seeker dashboard to complete post
      setRole("seeker");
    });
  });
}

// ==========================================================================
// SEEKER FLOWS (POST BOUNTY, LOGS, LIVE CHAT, ESCROW RELEASE)
// ==========================================================================

function renderSeekerBounties() {
  const gridEl = document.getElementById("seeker-bounties-list");
  if (!gridEl) return;

  const db = getDB();
  gridEl.innerHTML = "";

  const seekerBounties = db; // In full MVP, filter by current seeker session

  seekerBounties.forEach(b => {
    const card = document.createElement("div");
    card.className = `bounty-card-item ${selectedBountyId === b.id ? "active" : ""}`;
    
    let statusClass = "status-pending";
    let statusText = "Waiting for Dude";
    if (b.status === "visiting") {
      statusClass = "status-visiting";
      statusText = "Dude visiting";
    } else if (b.status === "submitted") {
      statusClass = "status-completed";
      statusText = "Verification submitted";
    } else if (b.status === "completed") {
      statusClass = "status-verified";
      statusText = "Completed";
    }

    card.innerHTML = `
      <div class="bounty-card-header">
        <div>
          <h4>📍 ${b.area}</h4>
          <span class="bounty-specs">${b.roomType} | Budget: ₹${b.budget.toLocaleString()}</span>
        </div>
        <span class="bounty-status-label ${statusClass}">${statusText}</span>
      </div>
      <div class="bounty-card-footer" style="font-size: 11px; color: var(--text-secondary); margin-top: auto; display:flex; justify-content:space-between;">
        <span>ID: ${b.id}</span>
        <span>${b.dudeName ? "Dude: " + b.dudeName : "No Dude assigned"}</span>
      </div>
    `;

    card.addEventListener("click", () => {
      selectedBountyId = b.id;
      // Re-render list to highlight active
      document.querySelectorAll(".bounty-card-item").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      openSeekerChat(b.id);
    });

    gridEl.appendChild(card);
  });

  document.getElementById("seeker-active-count").innerText = `${seekerBounties.length} Total`;
}

function openSeekerChat(bountyId) {
  const hub = document.getElementById("seeker-chat-hub");
  if (!hub) return;

  const db = getDB();
  const bounty = db.find(b => b.id === bountyId);
  if (!bounty) return;

  hub.style.display = "flex";
  
  // Header details
  document.getElementById("chat-dude-name").innerText = bounty.dudeName || "Dude System";
  document.getElementById("chat-bounty-details").innerText = `${bounty.area} PG Bounty - Budget ₹${bounty.budget.toLocaleString()}`;
  
  const statusBadge = document.getElementById("chat-status-badge");
  statusBadge.className = "hub-status-badge";
  if (bounty.status === "pending") {
    statusBadge.classList.add("status-pending");
    statusBadge.innerText = "Pending Dude Assignment";
  } else if (bounty.status === "visiting") {
    statusBadge.classList.add("status-visiting");
    statusBadge.innerText = "Dude Visiting Active";
  } else if (bounty.status === "submitted" || bounty.status === "completed") {
    statusBadge.classList.add("status-verified");
    statusBadge.innerText = bounty.status === "completed" ? "Verification Approved" : "Verification Report Ready";
  }

  // Visual Escrow progress
  const vis = document.getElementById("escrow-visualization");
  vis.style.display = "block";
  
  const payStep = document.getElementById("step-pay");
  const inspectStep = document.getElementById("step-inspect");
  const releaseStep = document.getElementById("step-release");

  payStep.className = "escrow-step completed";
  inspectStep.className = "escrow-step";
  releaseStep.className = "escrow-step";

  if (bounty.status === "visiting" || bounty.status === "submitted") {
    inspectStep.classList.add("active");
  } else if (bounty.status === "completed") {
    inspectStep.classList.add("completed");
    releaseStep.classList.add("completed");
  }

  // Report panel toggle
  const reportBox = document.getElementById("seeker-report-box");
  if (bounty.status === "submitted" || bounty.status === "completed") {
    reportBox.style.display = "block";
    document.getElementById("report-wifi-val").innerText = `${bounty.report.wifiSpeed} Mbps`;
    document.getElementById("report-food-val").innerText = `${bounty.report.foodRating}/5 - Veg Meal verified`;
    document.getElementById("report-map-link").href = bounty.report.location;
    
    const media = document.getElementById("report-media-gallery");
    media.innerHTML = `<img src="${bounty.report.photo}" class="report-img" alt="Verified Room View">`;

    // Disable button if already released
    const releaseBtn = document.getElementById("btn-release-funds");
    if (bounty.status === "completed") {
      releaseBtn.disabled = true;
      releaseBtn.innerText = "Funds Released Successfully";
      document.getElementById("btn-raise-dispute").style.display = "none";
    } else {
      releaseBtn.disabled = false;
      releaseBtn.innerText = "Release Funds & Accept PG";
      document.getElementById("btn-raise-dispute").style.display = "inline-flex";
    }
  } else {
    reportBox.style.display = "none";
  }

  // Load chat messages
  renderChatHistory(bounty.chat, "seeker-chat-messages", "seeker");
}

function renderChatHistory(chatArray, elementId, viewerRole) {
  const container = document.getElementById(elementId);
  if (!container) return;

  container.innerHTML = "";

  if (chatArray.length === 0) {
    container.innerHTML = `<div class="chat-placeholder-text" style="color: rgba(255, 255, 255, 0.6); text-align:center; padding: 40px 0;">No messages yet. Ask your Dude questions once they are active on-ground.</div>`;
    return;
  }

  chatArray.forEach(msg => {
    const bubble = document.createElement("div");
    // Set appropriate bubble side
    let side = "dude"; // default
    if (viewerRole === "seeker") {
      side = msg.sender === "seeker" ? "seeker" : "dude";
    } else if (viewerRole === "dude") {
      side = msg.sender === "dude" ? "seeker" : "dude"; // from dude perspective, seeker is the opposing side
    }

    bubble.className = `chat-bubble ${side}`;
    bubble.innerHTML = `
      <div>${msg.text}</div>
      <span style="font-size: 9px; opacity: 0.7; float: right; margin-top:4px;">${msg.time}</span>
      <div style="clear:both;"></div>
    `;
    container.appendChild(bubble);
  });

  container.scrollTop = container.scrollHeight;
}

// Post Bounty form submit
document.getElementById("post-bounty-form").addEventListener("submit", (e) => {
  e.preventDefault();
  
  const area = document.getElementById("bounty-area").value;
  const budget = parseInt(document.getElementById("bounty-budget").value);
  const deposit = parseInt(document.getElementById("bounty-deposit").value);
  const roomType = document.getElementById("bounty-room-type").value;
  const notes = document.getElementById("bounty-notes").value;
  
  const wifi = document.getElementById("pref-wifi").checked;
  const food = document.getElementById("pref-food").checked;
  const washroom = document.getElementById("pref-washroom").checked;
  const restriction = document.getElementById("pref-restriction").checked;

  const preferences = [];
  if (wifi) preferences.push("wifi");
  if (food) preferences.push("food");
  if (washroom) preferences.push("washroom");
  if (restriction) preferences.push("restriction");

  const newBounty = {
    id: `B-${Math.floor(1000 + Math.random() * 9000)}`,
    area,
    budget,
    deposit,
    roomType,
    preferences,
    notes,
    status: "pending",
    seekerName: "Amit R.", // Simulated Session Seeker
    dudeName: null,
    escrowState: "secured",
    createdAt: new Date().toISOString(),
    chat: [],
    report: null
  };

  const db = getDB();
  db.push(newBounty);
  saveDB(db);

  showToast(`Bounty ${newBounty.id} posted. ₹499 locked in Escrow.`);
  
  // Clear Form
  document.getElementById("post-bounty-form").reset();
  
  // Reset Wizard Steps
  document.getElementById("wizard-step-3").classList.remove("active");
  document.getElementById("wizard-step-1").classList.add("active");
  document.getElementById("wizard-dot-2").classList.remove("active");
  document.getElementById("wizard-dot-3").classList.remove("active");

  // Update views
  renderSeekerBounties();
  renderLandingBounties();
});

// Seeker chat send message
document.getElementById("seeker-chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!selectedBountyId) return;

  const input = document.getElementById("seeker-chat-input");
  const text = input.value.trim();
  if (!text) return;

  const db = getDB();
  const bounty = db.find(b => b.id === selectedBountyId);
  if (!bounty) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  bounty.chat.push({ sender: "seeker", text, time: timeStr });
  saveDB(db);

  input.value = "";
  openSeekerChat(selectedBountyId);
});

// Seeker releases funds (Escrow Release transaction)
document.getElementById("btn-release-funds").addEventListener("click", () => {
  if (!selectedBountyId) return;

  const db = getDB();
  const bounty = db.find(b => b.id === selectedBountyId);
  if (!bounty || bounty.status !== "submitted") return;

  // Perform split-payment simulation
  bounty.status = "completed";
  bounty.escrowState = "released";
  
  // Add payout to dude pending wallet (dude Rahul or Priya depending on bounty)
  // Save DB
  saveDB(db);

  showToast("Escrow Funds Disbursed: ₹400 routed to Dude, ₹99 Platform fee.");
  
  // Reload visual views
  openSeekerChat(selectedBountyId);
  renderSeekerBounties();
  renderLandingBounties();
});

// Seeker raises dispute
document.getElementById("btn-raise-dispute").addEventListener("click", () => {
  if (!selectedBountyId) return;
  const db = getDB();
  const bounty = db.find(b => b.id === selectedBountyId);
  if (!bounty) return;

  bounty.escrowState = "disputed";
  saveDB(db);

  showToast("Dispute registered. Our Admin will inspect the chat logs and verify ground details.");
  openSeekerChat(selectedBountyId);
});


// ==========================================================================
// DUDE DASHBOARD FLOWS (BOUNTY BOARD, ACTIVE JOBS, COMMUNICATOR, AUDIT SUBMIT)
// ==========================================================================

function renderDudeBoard() {
  const gridEl = document.getElementById("dude-open-bounties");
  if (!gridEl) return;

  const db = getDB();
  gridEl.innerHTML = "";

  // Render open bounties (status === 'pending')
  const openJobs = db.filter(b => b.status === "pending");

  if (openJobs.length === 0) {
    gridEl.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px 0; color: var(--text-secondary);">No open jobs at the moment. New seekers post bounties daily.</div>`;
  }

  openJobs.forEach(b => {
    const card = document.createElement("div");
    card.className = "bounty-card-item";
    card.style.height = "auto";
    card.style.gap = "12px";

    card.innerHTML = `
      <div class="bounty-card-header" style="width:100%;">
        <div>
          <h4>📍 ${b.area}</h4>
          <span class="bounty-specs">${b.roomType} | Budget: ₹${b.budget.toLocaleString()}</span>
        </div>
        <span class="dude-bounty-payout">Payout: ₹400</span>
      </div>
      <div style="font-size: 12px; color: var(--text-secondary); background: var(--surface-container-low); padding: 8px; border-radius: 6px;">
        <strong>Seeker Notes:</strong> "${b.notes || "None"}"
      </div>
      <button class="btn btn-secondary btn-block accept-job-btn" data-id="${b.id}">Accept Verification Task</button>
    `;

    card.querySelector(".accept-job-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      acceptDudeTask(b.id);
    });

    gridEl.appendChild(card);
  });

  document.getElementById("dude-open-count").innerText = `${openJobs.length} Available`;

  // Render active accepted job if any
  // Let's see if this dude has an active job (Rahul K is our simulated dude name)
  const activeJob = db.find(b => b.status === "visiting" && b.dudeName === "Rahul K.");
  const activeHub = document.getElementById("dude-active-job-hub");

  if (activeJob) {
    activeHub.style.display = "flex";
    selectedBountyId = activeJob.id;
    document.getElementById("active-job-title").innerText = `Active Job: ${activeJob.area} PG Verification`;
    document.getElementById("active-job-budget").innerText = `Seeker: ${activeJob.seekerName} | Budget: ₹${activeJob.budget.toLocaleString()} | Deposit: ${activeJob.deposit} Months`;
    
    // Load chat messages (dude perspective)
    renderChatHistory(activeJob.chat, "dude-chat-messages", "dude");
  } else {
    activeHub.style.display = "none";
  }

  // Wallet stats
  // Let's compute earnings: completed bounties by dude Rahul K.
  const completedBounties = db.filter(b => b.dudeName === "Rahul K." && b.status === "completed");
  const pendingBounties = db.filter(b => b.dudeName === "Rahul K." && b.status === "submitted");
  
  document.getElementById("dude-wallet-pending").innerText = `₹${pendingBounties.length * 400}`;
  document.getElementById("dude-wallet-withdrawn").innerText = `₹${completedBounties.length * 400}`;
  document.getElementById("dude-stat-completed").innerText = completedBounties.length + pendingBounties.length;
}

function acceptDudeTask(bountyId) {
  const db = getDB();
  const bounty = db.find(b => b.id === bountyId);
  if (!bounty) return;

  bounty.status = "visiting";
  bounty.dudeName = "Rahul K."; // Assign to our current session dude
  bounty.chat.push({
    sender: "dude",
    text: "Hello! I've accepted your PG verification bounty. Heading over to inspect coordinates now. Let me know if you want me to look for anything specific.",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  saveDB(db);
  showToast(`Accepted bounty task ${bountyId}. Heading to ground location.`);
  
  // Trigger Map Scooter Animation
  animateDudeTravel(bounty.area);

  // Simulate Dude arrival after 3 seconds
  setTimeout(() => {
    const updatedDb = getDB();
    const updatedBounty = updatedDb.find(b => b.id === bountyId);
    if (updatedBounty && updatedBounty.status === "visiting") {
      updatedBounty.chat.push({
        sender: "dude",
        text: "🛵 Just arrived at the building gate. Heading inside now to run diagnostics.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      saveDB(updatedDb);
      
      // Update UI if viewing seeker/dude chat
      if (currentRole === "seeker" && selectedBountyId === bountyId) {
        openSeekerChat(bountyId);
      } else if (currentRole === "dude" && selectedBountyId === bountyId) {
        renderDudeBoard();
      }
      showToast("🕵️‍♂️ Dude arrived at PG location");
    }
  }, 3000);

  renderDudeBoard();
  renderLandingBounties();
}

// Dude submits report details
document.getElementById("dude-report-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!selectedBountyId) return;

  const wifi = parseInt(document.getElementById("dude-report-wifi").value);
  const food = document.getElementById("dude-report-food").value;
  const photo = document.getElementById("dude-report-photo").value;
  const location = document.getElementById("dude-report-location").value;

  const db = getDB();
  const bounty = db.find(b => b.id === selectedBountyId);
  if (!bounty || bounty.status !== "visiting") return;

  bounty.status = "submitted";
  bounty.report = {
    wifiSpeed: wifi,
    foodRating: food,
    photo: photo,
    location: location
  };
  bounty.chat.push({
    sender: "dude",
    text: `📋 Physical Verification Audit Uploaded! Wifi Speed: ${wifi} Mbps, Mess Rating: ${food}/5. Seeker can now inspect files and release the bounty payout.`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  saveDB(db);
  showToast("Verification report submitted successfully. Waiting for seeker approval.");
  
  // Reload
  renderDudeBoard();
  renderLandingBounties();
});

// Dude chat send message
document.getElementById("dude-chat-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!selectedBountyId) return;

  const input = document.getElementById("dude-chat-input");
  const text = input.value.trim();
  if (!text) return;

  const db = getDB();
  const bounty = db.find(b => b.id === selectedBountyId);
  if (!bounty) return;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  bounty.chat.push({ sender: "dude", text, time: timeStr });
  saveDB(db);

  input.value = "";
  renderDudeBoard();
});


// ==========================================================================
// ADMIN DASHBOARD PANELS (TABLE, METRICS, ESCROW HOLDINGS LOG)
// ==========================================================================

function renderAdminPanel() {
  const tbody = document.getElementById("admin-bounties-tbody");
  if (!tbody) return;

  const db = getDB();
  tbody.innerHTML = "";

  let totalEscrow = 0;
  let platformRevenue = 0;

  db.forEach(b => {
    // Math logic
    if (b.status !== "completed") {
      totalEscrow += 499;
    } else {
      platformRevenue += 99;
    }

    const tr = document.createElement("tr");
    
    let statusText = "Pending Assignment";
    let statusClass = "status-pending";
    if (b.status === "visiting") {
      statusText = "Dude visiting";
      statusClass = "status-visiting";
    } else if (b.status === "submitted") {
      statusText = "Report ready";
      statusClass = "status-completed";
    } else if (b.status === "completed") {
      statusText = "Completed";
      statusClass = "status-verified";
    }

    let escrowText = "₹499 Locked";
    if (b.escrowState === "released") {
      escrowText = "₹400 Sent / ₹99 Rev";
    } else if (b.escrowState === "disputed") {
      escrowText = "⚠️ Disputed hold";
    }

    tr.innerHTML = `
      <td><strong>${b.id}</strong></td>
      <td>📍 ${b.area}</td>
      <td>₹${b.budget.toLocaleString()}</td>
      <td>${b.seekerName}</td>
      <td>${b.dudeName || '<span style="color:var(--text-muted);">None</span>'}</td>
      <td><span class="bounty-status-label ${statusClass}">${statusText}</span></td>
      <td><span style="font-weight:600;">${escrowText}</span></td>
      <td>
        <button class="btn btn-secondary admin-action-btn" data-id="${b.id}" style="padding: 4px 8px; font-size:11px;">Inspect Logs</button>
      </td>
    `;

    tr.querySelector(".admin-action-btn").addEventListener("click", () => {
      selectedBountyId = b.id;
      setRole("seeker");
      openSeekerChat(b.id);
    });

    tbody.appendChild(tr);
  });

  // Update Admin panel stats
  document.getElementById("admin-total-bounties").innerText = db.length;
  document.getElementById("admin-escrow-funds").innerText = `₹${totalEscrow.toLocaleString()}`;
  document.getElementById("admin-platform-revenue").innerText = `₹${platformRevenue.toLocaleString()}`;
}

// ==========================================================================
// BOUNTY NAVIGATION & EVENT REGISTER
// ==========================================================================

// Setup simulator role toggle button handlers
document.querySelectorAll(".role-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const role = btn.dataset.role;
    setRole(role);
  });
});

// App initialization
window.addEventListener("DOMContentLoaded", () => {
  // Clear any hung simulations
  clearTimeout(simChatTimeout);

  // Setup area click
  setupInteractiveMap();

  // Load Bounties feed
  renderLandingBounties();

  // Load simulator chat
  runChatSimulation();

  // Set default view
  setRole("visitor");

  // Links Routing
  document.getElementById("btn-header-bounty").addEventListener("click", () => {
    setRole("seeker");
  });

  document.getElementById("btn-header-dude").addEventListener("click", () => {
    setRole("dude");
  });

  document.getElementById("logo-home").addEventListener("click", (e) => {
    e.preventDefault();
    setRole("visitor");
  });

  document.getElementById("hero-cta-post").addEventListener("click", () => {
    setRole("seeker");
  });

  document.getElementById("hero-cta-dude").addEventListener("click", () => {
    setRole("dude");
  });

  // Setup Seeker Bounty Wizard
  setupBountyWizard();
});

// ==========================================================================
// INTERACTIVE MULTI-STEP BOUNTY WIZARD & SCOOTER TRAVEL TIMELINE ANIMATOR
// ==========================================================================

function setupBountyWizard() {
  const next1 = document.getElementById("btn-wizard-next-1");
  const next2 = document.getElementById("btn-wizard-next-2");
  const prev2 = document.getElementById("btn-wizard-prev-2");
  const prev3 = document.getElementById("btn-wizard-prev-3");

  const step1 = document.getElementById("wizard-step-1");
  const step2 = document.getElementById("wizard-step-2");
  const step3 = document.getElementById("wizard-step-3");

  const dot1 = document.getElementById("wizard-dot-1");
  const dot2 = document.getElementById("wizard-dot-2");
  const dot3 = document.getElementById("wizard-dot-3");

  next1.addEventListener("click", () => {
    // Validate Step 1 Inputs
    const area = document.getElementById("bounty-area").value;
    const budget = document.getElementById("bounty-budget").value;
    const deposit = document.getElementById("bounty-deposit").value;

    if (!area || !budget || !deposit) {
      showToast("⚠️ Please fill in the target area, budget, and deposit.");
      return;
    }

    step1.classList.remove("active");
    step2.classList.add("active");
    dot2.classList.add("active");
  });

  next2.addEventListener("click", () => {
    step2.classList.remove("active");
    step3.classList.add("active");
    dot3.classList.add("active");
  });

  prev2.addEventListener("click", () => {
    step2.classList.remove("active");
    step1.classList.add("active");
    dot2.classList.remove("active");
  });

  prev3.addEventListener("click", () => {
    step3.classList.remove("active");
    step2.classList.add("active");
    dot3.classList.remove("active");
  });
}

function animateDudeTravel(areaName) {
  const svg = document.getElementById("bglr-svg-map");
  if (!svg) return;

  // Find target node coordinates
  const coordsMap = {
    "Indiranagar": { cx: 450, cy: 200 },
    "Koramangala": { cx: 420, cy: 380 },
    "HSR Layout": { cx: 580, cy: 450 },
    "Whitefield": { cx: 700, cy: 220 },
    "Hebbal": { cx: 250, cy: 120 },
    "Yeshwanthpur": { cx: 160, cy: 280 }
  };

  const target = coordsMap[areaName];
  if (!target) return;

  const start = { cx: 400, cy: 300 }; // central hub

  // Remove existing traveler if any
  const oldTraveler = document.getElementById("map-dude-traveler");
  if (oldTraveler) oldTraveler.remove();

  // Create SVG group for scooter traveler
  const traveler = document.createElementNS("http://www.w3.org/2000/svg", "g");
  traveler.setAttribute("id", "map-dude-traveler");

  // Scooter Circle
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", start.cx);
  circle.setAttribute("cy", start.cy);
  circle.setAttribute("r", "14");
  circle.setAttribute("fill", "#cc5a37"); // terracotta orange
  circle.setAttribute("stroke", "#ffffff");
  circle.setAttribute("stroke-width", "2");

  // Pulse effect around the traveler
  const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  pulse.setAttribute("cx", start.cx);
  pulse.setAttribute("cy", start.cy);
  pulse.setAttribute("r", "20");
  pulse.setAttribute("fill", "none");
  pulse.setAttribute("stroke", "#cc5a37"); // terracotta orange
  pulse.setAttribute("stroke-width", "1.5");
  pulse.setAttribute("opacity", "0.6");
  
  // Text label "Scooter Dude"
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", start.cx);
  text.setAttribute("y", start.cy - 20);
  text.setAttribute("fill", "#ffffff");
  text.setAttribute("font-size", "10px");
  text.setAttribute("font-family", "Plus Jakarta Sans");
  text.setAttribute("font-weight", "bold");
  text.setAttribute("text-anchor", "middle");
  text.textContent = "🛵 Dude En Route...";

  traveler.appendChild(pulse);
  traveler.appendChild(circle);
  traveler.appendChild(text);
  svg.appendChild(traveler);

  // Animate using requestAnimationFrame over 2.5 seconds
  let startTime = null;
  const duration = 2500;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const t = Math.min(progress / duration, 1);

    // Ease-in-out quadratic interpolation
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const currentX = start.cx + (target.cx - start.cx) * easeT;
    const currentY = start.cy + (target.cy - start.cy) * easeT;

    circle.setAttribute("cx", currentX);
    circle.setAttribute("cy", currentY);
    pulse.setAttribute("cx", currentX);
    pulse.setAttribute("cy", currentY);
    text.setAttribute("x", currentX);
    text.setAttribute("y", currentY - 20);

    // Pulse radius animation
    const pulseRadius = 14 + (Math.sin(progress / 100) + 1) * 4;
    pulse.setAttribute("r", pulseRadius);

    if (progress < duration) {
      requestAnimationFrame(step);
    } else {
      text.textContent = "📍 Arrived at PG";
      text.setAttribute("fill", "#ffffff");
      circle.setAttribute("fill", "#ffffff");
      pulse.setAttribute("stroke", "#ffffff");

      // Clean up after 4 seconds
      setTimeout(() => {
        if (traveler.parentNode) traveler.remove();
      }, 4000);
    }
  }

  requestAnimationFrame(step);
}
