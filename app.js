const BASE_URL = "https://api.exchangerate-api.com/v4/latest";

const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg");

// ========== Navigation Menu Toggle ==========

const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".nav-link");

// Toggle mobile menu
if (hamburger) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
  });
}

// Close mobile menu when clicking on a nav link
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  });
});

// Close mobile menu when clicking outside
document.addEventListener("click", (e) => {
  if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  }
});

// Add active state to nav links based on scroll position and trigger floating navbar scroll effects
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    if (window.scrollY > 30) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }

  const sections = document.querySelectorAll(".section, .footer");
  const navLinks = document.querySelectorAll(".nav-link");

  let current = "";
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.pageYOffset >= sectionTop - 150) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
    }
  });
});

// ========== Currency Converter ==========


for (let select of dropdowns) {
  for (currCode in countryList) {
    let newOption = document.createElement("option");
    newOption.innerText = currCode;
    newOption.value = currCode;
    if (select.name === "from" && currCode === "USD") {
      newOption.selected = "selected";
    } else if (select.name === "to" && currCode === "INR") {
      newOption.selected = "selected";
    }
    select.append(newOption);
  }

  select.addEventListener("change", (evt) => {
    updateFlag(evt.target);
  });
}

const updateExchangeRate = async () => {
  let amount = document.querySelector(".amount input");
  let amtVal = amount.value;
  if (amtVal === "" || amtVal < 1) {
    amtVal = 1;
    amount.value = "1";
  }
  const URL = `${BASE_URL}/${fromCurr.value}`;
  let response = await fetch(URL);
  let data = await response.json();
  let rate = data.rates[toCurr.value];

  let finalAmount = (amtVal * rate).toFixed(2);
  msg.innerText = `${amtVal} ${fromCurr.value} = ${finalAmount} ${toCurr.value}`;

  // Save the conversion to local storage history list
  saveConversionToHistory(fromCurr.value, toCurr.value, amtVal, finalAmount);

  // Update the interactive rate trend chart
  updateTrendChart(fromCurr.value, toCurr.value, rate);
};

const updateFlag = (element) => {
  let currCode = element.value;
  let countryCode = countryList[currCode];
  let newSrc = `https://flagsapi.com/${countryCode}/flat/64.png`;
  
  // Find img inside parent (works for both custom selects and old selects)
  let img = element.parentElement.querySelector("img");
  if (img) {
    img.style.display = 'block';
    img.src = newSrc;
    let fallback = element.parentElement.querySelector(".flag-fallback");
    if (fallback) fallback.style.display = 'none';
  }
  
  // Also update custom select trigger text if custom select is used
  let triggerText = element.parentElement.querySelector(".selected-text");
  if (triggerText) {
    triggerText.textContent = currCode;
  }
  
  // Highlight selected item in options list
  let options = element.parentElement.querySelectorAll(".custom-option");
  options.forEach(opt => {
    if (opt.getAttribute("data-value") === currCode) {
      opt.classList.add("selected");
    } else {
      opt.classList.remove("selected");
    }
  });
};

btn.addEventListener("click", (evt) => {
  evt.preventDefault();
  updateExchangeRate();
});

// Swapping Currency functionality
const swapBtn = document.getElementById("swapBtn");
if (swapBtn) {
  swapBtn.addEventListener("click", () => {
    const temp = fromCurr.value;
    fromCurr.value = toCurr.value;
    toCurr.value = temp;
    updateFlag(fromCurr);
    updateFlag(toCurr);
    updateExchangeRate();
  });
}

window.addEventListener("load", () => {
  updateExchangeRate();
});

// Theme Toggle Functionality
const themeToggle = document.getElementById("themeToggle");
const body = document.body;
const themeIcon = themeToggle.querySelector("i");

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem("theme") || "light";
if (currentTheme === "dark") {
  body.classList.add("dark-theme");
  themeIcon.classList.remove("fa-moon");
  themeIcon.classList.add("fa-sun");
}

// Toggle theme on button click
themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-theme");
  const isDark = body.classList.contains("dark-theme");

  // Update icon
  if (isDark) {
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
    localStorage.setItem("theme", "dark");
  } else {
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
    localStorage.setItem("theme", "light");
  }

  // Shift 3D canvas rendering colors
  update3DColors(isDark);
});

// ========== Multi-Currency Comparison Feature ==========

const baseCurrencySelect = document.getElementById("baseCurrency");
const baseFlag = document.getElementById("baseFlag");
const comparisonAmount = document.getElementById("comparisonAmount");
const compareBtn = document.getElementById("compareBtn");
const currencyChips = document.getElementById("currencyChips");
const resultsGrid = document.getElementById("resultsGrid");
const comparisonResults = document.getElementById("comparisonResults");

// Popular currencies for quick selection
const popularCurrencies = ["EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "MXN", "BRL", "SGD", "NZD"];

// Selected currencies for comparison
let selectedCurrencies = new Set(["EUR", "GBP", "JPY", "INR", "CAD", "AUD"]);

// Populate base currency dropdown
for (currCode in countryList) {
  let newOption = document.createElement("option");
  newOption.innerText = currCode;
  newOption.value = currCode;
  if (currCode === "USD") {
    newOption.selected = "selected";
  }
  baseCurrencySelect.append(newOption);
}

// Update base currency flag
baseCurrencySelect.addEventListener("change", (evt) => {
  let currCode = evt.target.value;
  let countryCode = countryList[currCode];
  baseFlag.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
});

// Create currency selection chips
function createCurrencyChips() {
  currencyChips.innerHTML = "";

  popularCurrencies.forEach(currency => {
    const chip = document.createElement("div");
    chip.className = `currency-chip ${selectedCurrencies.has(currency) ? "selected" : ""}`;
    chip.innerHTML = `
      <img src="https://flagsapi.com/${countryList[currency]}/flat/64.png" alt="${currency}" />
      <span>${currency}</span>
      <i class="fas fa-check"></i>
    `;

    chip.addEventListener("click", () => {
      if (selectedCurrencies.has(currency)) {
        selectedCurrencies.delete(currency);
        chip.classList.remove("selected");
      } else {
        if (selectedCurrencies.size < 12) {
          selectedCurrencies.add(currency);
          chip.classList.add("selected");
        } else {
          showNotification("Maximum 12 currencies allowed!");
        }
      }
    });

    currencyChips.appendChild(chip);
  });
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

// Fetch and display comparison
async function compareRates() {
  const baseCurrency = baseCurrencySelect.value;
  const amount = parseFloat(comparisonAmount.value) || 100;

  if (selectedCurrencies.size === 0) {
    showNotification("Please select at least one currency to compare!");
    return;
  }

  // Show loading state
  resultsGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading rates...</div>';
  comparisonResults.style.display = "block";

  try {
    const URL = `${BASE_URL}/${baseCurrency}`;
    const response = await fetch(URL);
    const data = await response.json();

    // Create result cards
    resultsGrid.innerHTML = "";

    const sortedCurrencies = Array.from(selectedCurrencies).sort();

    sortedCurrencies.forEach(currency => {
      if (data.rates[currency]) {
        const rate = data.rates[currency];
        const convertedAmount = (amount * rate).toFixed(2);

        const card = document.createElement("div");
        card.className = "comparison-card";
        card.innerHTML = `
          <div class="card-header">
            <img src="https://flagsapi.com/${countryList[currency]}/flat/64.png" alt="${currency}" />
            <h4>${currency}</h4>
          </div>
          <div class="card-body">
            <div class="rate-info">
              <span class="label">Exchange Rate</span>
              <span class="rate">1 ${baseCurrency} = ${rate.toFixed(4)} ${currency}</span>
            </div>
            <div class="amount-info">
              <span class="label">Converted Amount</span>
              <span class="converted">${amount} ${baseCurrency} = ${convertedAmount} ${currency}</span>
            </div>
          </div>
        `;

        resultsGrid.appendChild(card);
      }
    });

  } catch (error) {
    resultsGrid.innerHTML = '<div class="error">Error fetching rates. Please try again.</div>';
    console.error("Error:", error);
  }
}

// Event listeners
compareBtn.addEventListener("click", compareRates);

comparisonAmount.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    compareRates();
  }
});

// Initialize
createCurrencyChips();

// Auto-load comparison on page load
// Auto-load comparison and conversion history on page load
window.addEventListener("load", () => {
  setTimeout(() => {
    compareRates();
    loadHistory();
  }, 500);
});

// ========== Conversion History Feature ==========

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

function saveConversionToHistory(from, to, amount, result) {
  let history = JSON.parse(localStorage.getItem("conversion_history")) || [];

  const newItem = {
    from,
    to,
    amount: parseFloat(amount),
    result: parseFloat(result),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  // Add to front of array
  history.unshift(newItem);

  // Keep only the last 5 conversions
  if (history.length > 5) {
    history.pop();
  }

  localStorage.setItem("conversion_history", JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  if (!historyList) return;

  let history = JSON.parse(localStorage.getItem("conversion_history")) || [];

  if (history.length === 0) {
    historyList.innerHTML = `<p class="no-history">No recent conversions. Make one above!</p>`;
    if (clearHistoryBtn) clearHistoryBtn.style.display = "none";
    return;
  }

  if (clearHistoryBtn) clearHistoryBtn.style.display = "flex";
  historyList.innerHTML = "";

  history.forEach(item => {
    const fromCountry = countryList[item.from];
    const toCountry = countryList[item.to];

    const historyCard = document.createElement("div");
    historyCard.className = "history-item";
    historyCard.innerHTML = `
      <div class="history-content-area">
        <div class="history-details">
          <div class="history-flags">
            <img src="https://flagsapi.com/${fromCountry}/flat/64.png" alt="${item.from}" />
            <img src="https://flagsapi.com/${toCountry}/flat/64.png" alt="${item.to}" />
          </div>
          <div class="history-rate">
            <span>${item.amount} ${item.from} <i class="fa-solid fa-arrow-right-long" style="font-size: 0.8rem; color: var(--text-muted); margin: 0 4px;"></i> ${item.result} ${item.to}</span>
          </div>
        </div>
        <div class="history-time">
          <i class="fa-regular fa-clock"></i> ${item.timestamp}
        </div>
      </div>
      <div class="history-actions">
        <button class="history-action-btn reuse" title="Reuse conversion parameters">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
        <button class="history-action-btn delete-single" title="Delete this item">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;

    // Reuse button click handler
    const reuseBtn = historyCard.querySelector(".history-action-btn.reuse");
    reuseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const amountInput = document.querySelector(".amount input");
      if (amountInput) {
        amountInput.value = item.amount;
      }
      fromCurr.value = item.from;
      toCurr.value = item.to;
      updateFlag(fromCurr);
      updateFlag(toCurr);
      updateExchangeRate();
      const converterSection = document.getElementById("converter");
      if (converterSection) {
        converterSection.scrollIntoView({ behavior: "smooth" });
      }
      showNotification("Restored conversion parameters!");
    });

    // Delete single button handler
    const deleteBtn = historyCard.querySelector(".history-action-btn.delete-single");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteHistoryItem(item);
    });

    historyList.appendChild(historyCard);
  });
}

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem("conversion_history");
    loadHistory();
    showNotification("Conversion history cleared!");
  });
}

// ========== FAQ Accordion ==========

const faqQuestions = document.querySelectorAll(".faq-question");

faqQuestions.forEach(question => {
  question.addEventListener("click", () => {
    const item = question.parentElement;
    const answer = item.querySelector(".faq-answer");

    // Toggle active class on item
    const isActive = item.classList.contains("active");

    // Close other FAQ items first
    document.querySelectorAll(".faq-item").forEach(otherItem => {
      otherItem.classList.remove("active");
      otherItem.querySelector(".faq-answer").style.maxHeight = null;
    });

    if (!isActive) {
      item.classList.add("active");
      answer.style.maxHeight = answer.scrollHeight + "px";
    }
  });
});

// ========== Footer Navigation ==========

const scrollToTopBtn = document.getElementById("scrollToTop");

if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ========== Interactive 3D WebGL Background (Three.js) ==========

let scene, camera, renderer, starGeo, stars, shapesGroup;
let mouseX = 0, mouseY = 0;
const particleCount = 250;
const velocities = [];

function init3D() {
  const canvas = document.getElementById("webgl-bg");
  if (!canvas) return;

  // Scene setup
  scene = new THREE.Scene();

  // Camera setup
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 220;

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Shapes Group
  shapesGroup = new THREE.Group();
  scene.add(shapesGroup);

  // Generate three geometric structures with custom dimensions
  const geometries = [
    new THREE.TorusKnotGeometry(18, 5, 120, 16),
    new THREE.IcosahedronGeometry(20, 1),
    new THREE.TorusGeometry(15, 4, 16, 100)
  ];

  // Starting positions scattered in depth
  const initialPositions = [
    { x: -110, y: 35, z: 20 },
    { x: 110, y: -30, z: 10 },
    { x: -75, y: -70, z: -15 }
  ];

  const isDark = document.body.classList.contains("dark-theme");
  const shapeColors = isDark ? [0x6366f1, 0xc084fc, 0x38bdf8] : [0x818cf8, 0xf472b6, 0x7dd3fc];
  const opacities = isDark ? [0.16, 0.11, 0.13] : [0.07, 0.04, 0.06];

  geometries.forEach((geo, index) => {
    const mat = new THREE.MeshBasicMaterial({
      color: shapeColors[index % shapeColors.length],
      wireframe: true,
      transparent: true,
      opacity: opacities[index % opacities.length]
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(initialPositions[index].x, initialPositions[index].y, initialPositions[index].z);
    shapesGroup.add(mesh);
  });

  // Generate glowing circles canvas texture for particles
  const particleCanvas = document.createElement('canvas');
  particleCanvas.width = 16;
  particleCanvas.height = 16;
  const ctx = particleCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  const particleTexture = new THREE.CanvasTexture(particleCanvas);

  // Generate particle systems (Starfield)
  const starPositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 600;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 600;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 600;

    velocities.push({
      x: (Math.random() - 0.5) * 0.08,
      y: (Math.random() - 0.5) * 0.08,
      z: Math.random() * 0.08 + 0.02
    });
  }

  starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const starMat = new THREE.PointsMaterial({
    color: isDark ? 0x818cf8 : 0x4f46e5,
    size: 4.5,
    map: particleTexture,
    transparent: true,
    opacity: isDark ? 0.55 : 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Mouse move listener for camera tracking
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) * 0.4;
    mouseY = (e.clientY - window.innerHeight / 2) * 0.4;
  });

  // Touch listener support for mobile
  window.addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
      mouseX = (e.touches[0].clientX - window.innerWidth / 2) * 0.3;
      mouseY = (e.touches[0].clientY - window.innerHeight / 2) * 0.3;
    }
  });

  // Resize listener
  window.addEventListener("resize", onWindowResize);

  // Start loop
  animate();
}

function update3DColors(isDark) {
  if (!scene) return;

  const shapeColors = isDark ? [0x6366f1, 0xc084fc, 0x38bdf8] : [0x818cf8, 0xf472b6, 0x7dd3fc];
  const particleColor = isDark ? 0x818cf8 : 0x4f46e5;
  const opacities = isDark ? [0.16, 0.11, 0.13] : [0.07, 0.04, 0.06];

  if (shapesGroup) {
    shapesGroup.children.forEach((mesh, index) => {
      if (mesh.material) {
        mesh.material.color.setHex(shapeColors[index % shapeColors.length]);
        mesh.material.opacity = opacities[index % opacities.length];
      }
    });
  }

  if (stars && stars.material) {
    stars.material.color.setHex(particleColor);
    stars.material.opacity = isDark ? 0.55 : 0.22;
  }
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  // Animate geometries
  if (shapesGroup) {
    shapesGroup.children.forEach((mesh, index) => {
      mesh.rotation.x += 0.0015 * (index % 2 === 0 ? 1 : -1);
      mesh.rotation.y += 0.001 * (index % 2 === 0 ? -1 : 1);
      mesh.position.y += Math.sin(Date.now() * 0.0006 + index) * 0.025;
    });
  }

  // Animate particle cloud
  if (starGeo) {
    const positions = starGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 2] += velocities[i].z;
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y;

      // Wrap-around boundary conditions
      if (positions[i * 3 + 2] > 200) {
        positions[i * 3 + 2] = -400;
      }
      if (Math.abs(positions[i * 3]) > 300) {
        velocities[i].x *= -1;
      }
      if (Math.abs(positions[i * 3 + 1]) > 300) {
        velocities[i].y *= -1;
      }
    }
    starGeo.attributes.position.needsUpdate = true;
  }

  // Soft camera follow lerping
  const targetX = mouseX * 0.05;
  const targetY = -mouseY * 0.05;
  camera.position.x += (targetX - camera.position.x) * 0.035;
  camera.position.y += (targetY - camera.position.y) * 0.035;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

// Initializing the system on window load
window.addEventListener("load", () => {
  init3D();
  setupTrendChartBindings();
  initCustomSelects();
  fetchTickerRates();
  initNavIndicator();
});

// ========== Interactive Trend Chart Feature ==========
let trendTimeframe = "7D"; // Default timeframe
let chartDataPoints = []; // Loaded chart { date, rate, x, y }
let activeFromCurrency = "USD";
let activeToCurrency = "INR";
let activeLiveRate = 83.50;

const frankfurterCurrencies = new Set([
  "AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP",
  "HKD", "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR",
  "NOK", "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR"
]);

async function updateTrendChart(from, to, currentRate) {
  activeFromCurrency = from;
  activeToCurrency = to;
  activeLiveRate = currentRate;

  const wrapper = document.querySelector(".chart-wrapper");
  if (wrapper) wrapper.classList.add("loading");

  const days = trendTimeframe === "7D" ? 7 : 30;
  let dataPoints = [];
  let fetchSuccess = false;
  const isRealDataPossible = frankfurterCurrencies.has(from) && frankfurterCurrencies.has(to) && (from !== to);

  if (isRealDataPossible) {
    try {
      dataPoints = await fetchHistoricalRates(from, to, days);
      if (dataPoints && dataPoints.length > 0) {
        fetchSuccess = true;
      }
    } catch (err) {
      console.warn("Frankfurter API fetch failed, falling back to simulated rates.", err);
    }
  }

  if (!fetchSuccess) {
    dataPoints = generateSimulatedRates(from, to, days, currentRate);
  }

  drawTrendChart(from, to, dataPoints);
  if (wrapper) wrapper.classList.remove("loading");
}

async function fetchHistoricalRates(from, to, days) {
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - days);

  const formatISO = (d) => d.toISOString().split('T')[0];
  const todayStr = formatISO(today);
  const startStr = formatISO(startDate);

  const URL = `https://api.frankfurter.app/${startStr}..${todayStr}?from=${from}&to=${to}`;
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();

  const dates = Object.keys(data.rates).sort();
  return dates.map(date => ({
    date: date,
    rate: data.rates[date][to]
  }));
}

function generateSimulatedRates(from, to, days, currentRate) {
  const dataPoints = [];
  const today = new Date();
  let tempRate = currentRate;

  // We walk backward in time, creating realistic micro-fluctuations.
  // To make it look extremely natural, we combine a sine wave (smooth cycles)
  // with pseudo-random noise.
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    if (i > 0) {
      // Daily percentage fluctuation: between -0.4% and +0.4%
      // A sine term produces gorgeous waves, making the chart look incredibly dynamic
      const sineTerm = Math.sin(i * 0.4) * 0.12;
      const randomTerm = (Math.random() - 0.5) * 0.45;
      const percentChange = (sineTerm + randomTerm) / 100;

      tempRate = tempRate * (1 - percentChange);
    }

    dataPoints.push({
      date: dateStr,
      rate: tempRate
    });
  }

  // Reverse so it is chronological (past to present)
  return dataPoints.reverse();
}

function drawTrendChart(from, to, dataPoints) {
  const svg = document.getElementById("trendChartSvg");
  const chartLine = document.getElementById("chartLine");
  const chartArea = document.getElementById("chartArea");
  const chartGrid = document.getElementById("chartGrid");
  const yAxis = document.getElementById("chartYAxis");
  const xAxis = document.getElementById("chartXAxis");

  if (!svg || !chartLine || !chartArea || !chartGrid) return;

  // Update chart header title
  const trendTitle = document.getElementById("trendTitle");
  if (trendTitle) {
    trendTitle.textContent = `${from} to ${to} Rate Trend`;
  }

  const width = 800;
  const height = 220;
  const paddingLeft = 25;
  const paddingRight = 65;
  const paddingTop = 30;
  const paddingBottom = 40;

  const rates = dataPoints.map(p => p.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);

  // Avoid division by zero
  const rateDiff = maxRate - minRate;
  const rateSpan = rateDiff === 0 ? 1 : rateDiff;
  const yMinAdjusted = minRate - rateSpan * 0.05;
  const yMaxAdjusted = maxRate + rateSpan * 0.05;
  const ySpanAdjusted = yMaxAdjusted - yMinAdjusted;

  // Calculate (x, y) coordinates
  // Calculate (x, y) coordinates
  const N = dataPoints.length;
  chartDataPoints = dataPoints.map((p, i) => {
    const x = paddingLeft + (i / (N - 1)) * (width - paddingLeft - paddingRight);
    const y = height - paddingBottom - ((p.rate - yMinAdjusted) / ySpanAdjusted) * (height - paddingTop - paddingBottom);
    return {
      ...p,
      x,
      y
    };
  });

  // Build curve line SVG path using cubic bezier splines
  const getBezierSplinePath = (points) => {
    if (points.length < 2) return "";
    let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    const tension = 0.15;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const lineD = getBezierSplinePath(chartDataPoints);
  chartLine.setAttribute("d", lineD);

  // Build area fill SVG path
  const lastPoint = chartDataPoints[chartDataPoints.length - 1];
  const firstPoint = chartDataPoints[0];
  const floorY = height - paddingBottom;
  const areaD = `${lineD} L ${lastPoint.x.toFixed(1)},${floorY} L ${firstPoint.x.toFixed(1)},${floorY} Z`;

  chartArea.setAttribute("d", areaD);

  // Dynamic grid lines drawing
  chartGrid.innerHTML = "";
  const gridLevels = [0, 0.5, 1]; // bottom, middle, top gridlines
  gridLevels.forEach(level => {
    const yVal = height - paddingBottom - level * (height - paddingTop - paddingBottom);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", paddingLeft);
    line.setAttribute("y1", yVal);
    line.setAttribute("x2", width - paddingRight);
    line.setAttribute("y2", yVal);
    line.setAttribute("class", "chart-grid-line horizontal");
    chartGrid.appendChild(line);
  });

  // Y Axis Labels
  yAxis.innerHTML = "";
  const yValues = [yMinAdjusted, (yMinAdjusted + yMaxAdjusted) / 2, yMaxAdjusted];
  const yPositions = [height - paddingBottom, height - paddingBottom - 0.5 * (height - paddingTop - paddingBottom), paddingTop];

  yValues.forEach((val, i) => {
    const label = document.createElement("div");
    label.className = "y-axis-label";
    label.style.top = `${(yPositions[i] / height) * 100}%`;
    label.textContent = val.toFixed(4);
    yAxis.appendChild(label);
  });

  // X Axis Labels
  xAxis.innerHTML = "";
  const xIndices = [0, Math.floor(N / 2), N - 1];
  xIndices.forEach(idx => {
    const p = chartDataPoints[idx];
    const label = document.createElement("div");
    label.className = "x-axis-label";
    label.style.left = `${(p.x / width) * 100}%`;

    const dateText = idx === N - 1 ? "Today" : formatDateString(p.date);
    label.textContent = dateText;
    xAxis.appendChild(label);
  });

  // Calculate Summary Stats
  const sum = rates.reduce((a, b) => a + b, 0);
  const avg = sum / N;

  const startRate = rates[0];
  const endRate = rates[rates.length - 1];
  const percentChange = ((endRate - startRate) / startRate) * 100;

  document.getElementById("statHigh").textContent = maxRate.toFixed(4);
  document.getElementById("statLow").textContent = minRate.toFixed(4);
  document.getElementById("statAvg").textContent = avg.toFixed(4);

  const trendStatElement = document.getElementById("statTrend");
  const trendSign = percentChange >= 0 ? "+" : "";
  trendStatElement.textContent = `${trendSign}${percentChange.toFixed(2)}%`;

  if (percentChange >= 0) {
    trendStatElement.style.color = "var(--accent)";
  } else {
    trendStatElement.style.color = "#ef4444";
  }
}

function formatDateString(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function initChartInteractivity() {
  const svg = document.getElementById("trendChartSvg");
  const trackerLine = document.getElementById("chartTrackerLine");
  const trackerDot = document.getElementById("chartTrackerDot");
  const tooltip = document.getElementById("chartTooltip");
  const tooltipDate = tooltip.querySelector(".tooltip-date");
  const tooltipRate = tooltip.querySelector(".tooltip-rate");

  if (!svg || !trackerLine || !trackerDot || !tooltip) return;

  svg.addEventListener("mousemove", (e) => {
    if (chartDataPoints.length === 0) return;

    const rect = svg.getBoundingClientRect();
    const viewBoxWidth = 800;

    // Calculate mouse X inside SVG coordinate system
    const mouseX = ((e.clientX - rect.left) / rect.width) * viewBoxWidth;

    // Find the closest point in the dataPoints array
    let closestPoint = chartDataPoints[0];
    let minDistance = Math.abs(mouseX - closestPoint.x);

    for (let i = 1; i < chartDataPoints.length; i++) {
      const dist = Math.abs(mouseX - chartDataPoints[i].x);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = chartDataPoints[i];
      }
    }

    // Update tracker visual positions
    trackerLine.setAttribute("x1", closestPoint.x);
    trackerLine.setAttribute("x2", closestPoint.x);
    trackerLine.style.opacity = 1;

    trackerDot.setAttribute("cx", closestPoint.x);
    trackerDot.setAttribute("cy", closestPoint.y);
    trackerDot.style.opacity = 1;

    // Calculate tooltip positions
    const tooltipX = (closestPoint.x / viewBoxWidth) * rect.width;
    const tooltipY = (closestPoint.y / 220) * rect.height;

    tooltip.style.left = `${tooltipX}px`;
    tooltip.style.top = `${tooltipY}px`;
    tooltip.classList.add("show");

    tooltipDate.textContent = formatFullDate(closestPoint.date);
    tooltipRate.textContent = `1 ${activeFromCurrency} = ${closestPoint.rate.toFixed(4)} ${activeToCurrency}`;
  });

  svg.addEventListener("mouseleave", () => {
    trackerLine.style.opacity = 0;
    trackerDot.style.opacity = 0;
    tooltip.classList.remove("show");
  });
}

function setupTrendChartBindings() {
  // Timeframe selector buttons
  const timeframeBtns = document.querySelectorAll(".timeframe-btn");
  timeframeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      timeframeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      trendTimeframe = btn.getAttribute("data-timeframe");
      updateTrendChart(activeFromCurrency, activeToCurrency, activeLiveRate);
    });
  });

  // Initial interactivity attachment
  initChartInteractivity();
}

// ========== Single History Item Deletion ==========
function deleteHistoryItem(targetItem) {
  let history = JSON.parse(localStorage.getItem("conversion_history")) || [];
  history = history.filter(item => !(
    item.from === targetItem.from &&
    item.to === targetItem.to &&
    item.amount === targetItem.amount &&
    item.result === targetItem.result &&
    item.timestamp === targetItem.timestamp
  ));
  localStorage.setItem("conversion_history", JSON.stringify(history));
  loadHistory();
  showNotification("Conversion history item deleted!");
}

// ========== Custom Searchable Select Dropdown Logic ==========
function initCustomSelects() {
  const customContainers = document.querySelectorAll(".custom-select-container");
  
  customContainers.forEach(container => {
    const select = container.querySelector("select");
    const trigger = container.querySelector(".custom-select-trigger");
    const menu = container.querySelector(".custom-select-menu");
    const searchInput = container.querySelector(".search-input");
    const optionsWrapper = container.querySelector(".options-wrapper");
    
    if (!select || !trigger || !menu || !searchInput || !optionsWrapper) return;
    
    const buildOptions = () => {
      optionsWrapper.innerHTML = "";
      const selectOptions = select.querySelectorAll("option");
      
      selectOptions.forEach(opt => {
        const currCode = opt.value;
        const countryCode = countryList[currCode] || "US";
        const name = currencyNames[currCode] || currCode;
        
        const customOpt = document.createElement("div");
        customOpt.className = "custom-option";
        if (opt.selected) {
          customOpt.classList.add("selected");
          // Initialize trigger values
          const flagImg = trigger.querySelector("img");
          if (flagImg) {
            flagImg.style.display = 'block';
            flagImg.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
            let fallback = trigger.querySelector(".flag-fallback");
            if (fallback) fallback.style.display = 'none';
          }
          const textEl = trigger.querySelector(".selected-text");
          if (textEl) textEl.textContent = currCode;
        }
        customOpt.setAttribute("data-value", currCode);
        customOpt.innerHTML = `
          <img src="https://flagsapi.com/${countryCode}/flat/64.png" alt="${currCode} flag" onerror="this.style.display='none'" />
          <span class="option-code">${currCode}</span>
          <span class="option-name">${name}</span>
        `;
        
        customOpt.addEventListener("click", () => {
          select.value = currCode;
          container.classList.remove("active");
          
          // Trigger change event to fire updateExchangeRate or compareRates
          const event = new Event("change");
          select.dispatchEvent(event);
          updateFlag(select);
        });
        
        optionsWrapper.appendChild(customOpt);
      });
    };
    
    // Trigger open/close
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isActive = container.classList.contains("active");
      
      // Close all other custom dropdowns
      document.querySelectorAll(".custom-select-container").forEach(c => {
        c.classList.remove("active");
      });
      
      if (!isActive) {
        container.classList.add("active");
        searchInput.value = "";
        filterList("");
        // Smooth focus transition
        setTimeout(() => searchInput.focus(), 60);
      }
    });
    
    // Prevent menu clicks from closing dropdown
    menu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    
    // Filter options on typing
    searchInput.addEventListener("input", (e) => {
      filterList(e.target.value);
    });
    
    const filterList = (query) => {
      const term = query.toLowerCase().trim();
      const options = optionsWrapper.querySelectorAll(".custom-option");
      options.forEach(opt => {
        const code = opt.querySelector(".option-code").textContent.toLowerCase();
        const name = opt.querySelector(".option-name").textContent.toLowerCase();
        if (code.includes(term) || name.includes(term)) {
          opt.style.display = "flex";
        } else {
          opt.style.display = "none";
        }
      });
    };
    
    // Build options initially
    buildOptions();
    
    // Re-build options if options list changes
    const observer = new MutationObserver(() => {
      buildOptions();
    });
    observer.observe(select, { childList: true });
  });
  
  // Close any open dropdowns when clicking anywhere outside
  document.addEventListener("click", () => {
    document.querySelectorAll(".custom-select-container").forEach(c => {
      c.classList.remove("active");
    });
  });
}

// ========== Hero Live Rates Ticker Simulation ==========
const tickerPairs = {
  EURUSD: { from: "EUR", to: "USD", baseVal: 1.0850, currentVal: 1.0850, change: 0.12 },
  GBPUSD: { from: "GBP", to: "USD", baseVal: 1.2680, currentVal: 1.2680, change: -0.05 },
  USDJPY: { from: "USD", to: "JPY", baseVal: 157.45, currentVal: 157.45, change: 0.22 }
};

async function fetchTickerRates() {
  try {
    for (const key in tickerPairs) {
      const pair = tickerPairs[key];
      const res = await fetch(`${BASE_URL}/${pair.from}`);
      if (res.ok) {
        const data = await res.json();
        const rate = data.rates[pair.to];
        if (rate) {
          pair.baseVal = rate;
          pair.currentVal = rate;
        }
      }
    }
  } catch (err) {
    console.warn("Could not fetch ticker live rates, using defaults.", err);
  }
  updateTickerUI();
  startTickerFluctuations();
}

function updateTickerUI() {
  for (const key in tickerPairs) {
    const pair = tickerPairs[key];
    const valueEl = document.getElementById(`ticker-${key}`);
    const changeEl = document.getElementById(`change-${key}`);
    
    if (valueEl && changeEl) {
      valueEl.textContent = pair.currentVal.toFixed(key === "USDJPY" ? 2 : 4);
      
      const changeSign = pair.change >= 0 ? "+" : "";
      
      if (pair.change >= 0) {
        changeEl.className = "ticker-change up";
        changeEl.innerHTML = `<i class="fa-solid fa-caret-up"></i> ${changeSign}${pair.change.toFixed(2)}%`;
      } else {
        changeEl.className = "ticker-change down";
        changeEl.innerHTML = `<i class="fa-solid fa-caret-down"></i> ${pair.change.toFixed(2)}%`;
      }
    }
  }
}

function startTickerFluctuations() {
  // Update every 4 seconds with small simulated deviations
  setInterval(() => {
    for (const key in tickerPairs) {
      const pair = tickerPairs[key];
      // Random change between -0.05% and +0.05%
      const fluctuation = (Math.random() - 0.5) * 0.001; 
      pair.currentVal = pair.currentVal * (1 + fluctuation);
      
      // Calculate net change compared to base value
      pair.change = ((pair.currentVal - pair.baseVal) / pair.baseVal) * 100;
    }
    updateTickerUI();
  }, 4000);
}

// ========== Floating Nav Link Indicator Pill ==========
function initNavIndicator() {
  const navMenu = document.getElementById("navMenu");
  const pill = document.getElementById("navIndicatorPill");
  const links = document.querySelectorAll(".nav-link");
  
  if (!navMenu || !pill || links.length === 0) return;
  
  function updatePillPosition(link) {
    pill.style.opacity = "1";
    pill.style.left = `${link.offsetLeft}px`;
    pill.style.top = `${link.offsetTop}px`;
    pill.style.width = `${link.offsetWidth}px`;
    pill.style.height = `${link.offsetHeight}px`;
  }
  
  function resetToActive() {
    // Only show the pill if the screen size is not too small, or let it work vertically too
    const activeLink = navMenu.querySelector(".nav-link.active");
    if (activeLink) {
      updatePillPosition(activeLink);
    } else {
      pill.style.opacity = "0";
    }
  }
  
  // Track hovers
  links.forEach(link => {
    link.addEventListener("mouseenter", () => {
      updatePillPosition(link);
    });
  });
  
  navMenu.addEventListener("mouseleave", () => {
    resetToActive();
  });
  
  // Initialize position
  resetToActive();
  
  // Update on window resize (since layout positions might shift)
  window.addEventListener("resize", resetToActive);
  
  // Monitor active link change via MutationObserver
  // The scroll listener in app.js toggles ".active" class on links
  const observer = new MutationObserver(() => {
    resetToActive();
  });
  
  links.forEach(link => {
    observer.observe(link, { attributes: true, attributeFilter: ["class"] });
  });
  
  // Small delay on load to ensure fonts and layouts are fully settled
  setTimeout(resetToActive, 150);
}

// ========== Flag Image Loading Fallback Initials Badge ==========
function handleFlagError(img, currencyCode) {
  const countryCode = countryList[currencyCode] || currencyCode.substring(0, 2);
  const rect = img.getBoundingClientRect();
  const width = rect.width || img.clientWidth || 24;
  const height = rect.height || img.clientHeight || 24;
  
  img.style.display = 'none';
  
  let fallback = img.parentElement.querySelector(".flag-fallback");
  if (!fallback) {
    fallback = document.createElement("div");
    fallback.className = "flag-fallback";
    fallback.textContent = countryCode;
    fallback.style.width = `${width}px`;
    fallback.style.height = `${height}px`;
    fallback.style.lineHeight = `${height - 3}px`;
    
    // Choose gradient based on characters in code to keep them consistent
    const hue = (currencyCode.charCodeAt(0) * 15 + currencyCode.charCodeAt(1) * 20) % 360;
    fallback.style.background = `linear-gradient(135deg, hsl(${hue}, 85%, 65%), hsl(${(hue + 45) % 360}, 85%, 50%))`;
    
    img.parentElement.insertBefore(fallback, img);
  } else {
    fallback.style.display = 'inline-flex';
  }
}

// Intercept all flag loading errors on the document
window.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'IMG' && e.target.src && e.target.src.includes('flagsapi.com')) {
    let currencyCode = 'US';
    const parent = e.target.parentElement;
    if (parent) {
      const textEl = parent.querySelector('.selected-text, .option-code, span, h4');
      if (textEl) {
        currencyCode = textEl.textContent.trim().substring(0, 3);
      } else {
        const alt = e.target.getAttribute('alt') || '';
        const match = alt.match(/[A-Z]{3}/);
        if (match) currencyCode = match[0];
      }
    }
    handleFlagError(e.target, currencyCode);
  }
}, true);


