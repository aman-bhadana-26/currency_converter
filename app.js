const BASE_URL = "https://api.exchangerate-api.com/v4/latest";

const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg");

// ========== Navigation Menu Toggle & Interactive Pill Sliding ==========

const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".nav-link");
const indicatorPill = document.getElementById("navIndicatorPill");
let lastActiveIndex = -1;
let isHoveringNav = false;

// Function to dynamically update the indicator pill position
const updateIndicator = (targetLink) => {
  if (!indicatorPill || !targetLink || !navMenu) return;
  
  const menuRect = navMenu.getBoundingClientRect();
  const linkRect = targetLink.getBoundingClientRect();
  
  // Calculate relative positions
  const left = linkRect.left - menuRect.left;
  const top = linkRect.top - menuRect.top;
  const width = linkRect.width;
  const height = linkRect.height;
  
  // Determine direction for elastic stretch animation
  const allLinksArray = Array.from(navLinks);
  const targetIndex = allLinksArray.indexOf(targetLink);
  
  if (lastActiveIndex !== -1 && targetIndex !== lastActiveIndex) {
    if (targetIndex > lastActiveIndex) {
      indicatorPill.classList.add("moving-right");
      indicatorPill.classList.remove("moving-left");
    } else {
      indicatorPill.classList.add("moving-left");
      indicatorPill.classList.remove("moving-right");
    }
  }
  
  lastActiveIndex = targetIndex;
  
  // Apply position styles
  indicatorPill.style.left = `${left}px`;
  indicatorPill.style.top = `${top}px`;
  indicatorPill.style.width = `${width}px`;
  indicatorPill.style.height = `${height}px`;
  indicatorPill.style.opacity = "1";
  
  // Remove elastic classes after transition completes
  setTimeout(() => {
    indicatorPill.classList.remove("moving-right", "moving-left");
  }, 400);
};

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
  if (navMenu && hamburger && !navMenu.contains(e.target) && !hamburger.contains(e.target)) {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  }
});

// Align indicator on hover & leave, and trigger click ripple
navLinks.forEach(link => {
  link.addEventListener("mouseenter", (e) => {
    isHoveringNav = true;
    updateIndicator(e.currentTarget);
  });
  
  link.addEventListener("mouseleave", () => {
    isHoveringNav = false;
    const activeLink = navMenu.querySelector(".nav-link.active");
    if (activeLink) {
      updateIndicator(activeLink);
    } else {
      if (indicatorPill) indicatorPill.style.opacity = "0";
    }
  });

  // Ripple effect on click for nav links
  link.addEventListener("click", function(e) {
    // Remove any existing ripples inside this link
    const existingRipples = this.querySelectorAll(".nav-ripple");
    existingRipples.forEach(r => r.remove());

    const ripple = document.createElement("span");
    ripple.classList.add("nav-ripple");
    
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    
    this.appendChild(ripple);
    
    // Remove after animation completes
    setTimeout(() => {
      ripple.remove();
    }, 500);
  });
});

// Window resize handler to reposition indicator instantly
window.addEventListener("resize", () => {
  const activeLink = navMenu ? navMenu.querySelector(".nav-link.active") : null;
  if (activeLink && indicatorPill) {
    indicatorPill.style.transition = "none";
    updateIndicator(activeLink);
    // force reflow
    indicatorPill.offsetHeight;
    indicatorPill.style.transition = "";
  }
});

// Run initial alignment on load
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const activeLink = navMenu ? (navMenu.querySelector(".nav-link.active") || navLinks[0]) : null;
    if (activeLink) {
      updateIndicator(activeLink);
    }
  }, 300);
});

let lastScrollY = window.scrollY;

// Add active state to nav links based on scroll position and trigger floating navbar scroll effects
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  const currentScrollY = window.scrollY;

  if (navbar) {
    if (currentScrollY > 30) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }

    // Scroll-direction aware hide/show navbar (disabled if mobile hamburger menu is open)
    const isMobileMenuOpen = hamburger && hamburger.classList.contains("active");
    if (currentScrollY > lastScrollY && currentScrollY > 120 && !isMobileMenuOpen) {
      navbar.classList.add("navbar-hidden");
    } else {
      navbar.classList.remove("navbar-hidden");
    }
  }

  lastScrollY = currentScrollY;

  const sections = document.querySelectorAll(".section, .footer");
  const currentNavLinks = document.querySelectorAll(".nav-link");

  let current = "";
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    if (window.pageYOffset >= sectionTop - 150) {
      current = section.getAttribute("id");
    }
  });

  let activeLink = null;
  currentNavLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
      activeLink = link;
    }
  });

  if (activeLink && !isHoveringNav) {
    updateIndicator(activeLink);
  }
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

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const fetchExchangeRates = async (baseCurrency) => {
  const cacheKey = `rates_cache_${baseCurrency}`;
  const cachedDataStr = localStorage.getItem(cacheKey);

  if (cachedDataStr) {
    try {
      const cached = JSON.parse(cachedDataStr);
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_DURATION) {
        return { data: cached.data, isCached: true, timestamp: cached.timestamp };
      }
    } catch (e) {
      console.warn("Error parsing rates cache, refetching...", e);
    }
  }

  const URL = `${BASE_URL}/${baseCurrency}`;
  const response = await fetch(URL);
  const data = await response.json();

  const cacheObj = {
    timestamp: Date.now(),
    data: data
  };
  localStorage.setItem(cacheKey, JSON.stringify(cacheObj));

  return { data, isCached: false, timestamp: cacheObj.timestamp };
};

const updateRateStatusBadge = (isCached, timestamp) => {
  const statusEl = document.getElementById("rateStatus");
  if (!statusEl) return;

  if (isCached) {
    statusEl.className = "rate-status cached";
    const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    statusEl.innerHTML = `<i class="fa-solid fa-clock"></i> Cached (at ${timeStr})`;
  } else {
    statusEl.className = "rate-status live";
    statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Live Rates`;
  }
};

const updateExchangeRate = async () => {
  let amount = document.querySelector(".amount input");
  let amtVal = amount.value;
  if (amtVal === "" || amtVal < 1) {
    amtVal = 1;
    amount.value = "1";
  }

  try {
    const { data, isCached, timestamp } = await fetchExchangeRates(fromCurr.value);
    let rate = data.rates[toCurr.value];

    let finalAmount = (amtVal * rate).toFixed(2);
    msg.innerText = `${amtVal} ${fromCurr.value} = ${finalAmount} ${toCurr.value}`;

    updateRateStatusBadge(isCached, timestamp);

    // Save the conversion to local storage history list
    saveConversionToHistory(fromCurr.value, toCurr.value, amtVal, finalAmount);

    // Update the interactive rate trend chart
    updateTrendChart(fromCurr.value, toCurr.value, rate);
  } catch (error) {
    console.error("Error updating exchange rate:", error);
    msg.innerText = "Error fetching rates.";
    const statusEl = document.getElementById("rateStatus");
    if (statusEl) {
      statusEl.className = "rate-status";
      statusEl.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color: #ef4444;"></i> Fetch Error`;
    }
  }
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
  themeToggle.classList.add("toggling");

  // Mid-point of the animation (225ms) to swap icons when scale is 0
  setTimeout(() => {
    body.classList.toggle("dark-theme");
    const isDark = body.classList.contains("dark-theme");

    if (isDark) {
      themeIcon.className = "fa-solid fa-sun";
      localStorage.setItem("theme", "dark");
    } else {
      themeIcon.className = "fa-solid fa-moon";
      localStorage.setItem("theme", "light");
    }

    // Shift 3D canvas rendering colors
    update3DColors(isDark);
  }, 225);

  // Remove toggling class after animation finishes
  setTimeout(() => {
    themeToggle.classList.remove("toggling");
  }, 450);
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
    const { data } = await fetchExchangeRates(baseCurrency);

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

// ========== Footer Navigation ==========

const scrollToTopBtn = document.getElementById("scrollToTop");

if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ========== Interactive 3D WebGL Background (Three.js) ==========

let scene, camera, renderer, starGeo, stars, lineGeo, linesMesh;
let mouseX = 0, mouseY = 0;
let mouse3D = new THREE.Vector3(0, 0, -1);
let mouseScenePos = new THREE.Vector3(0, 0, 0);

const particleCount = 120;
const velocities = [];
const maxLines = 450;
const linePositions = new Float32Array(maxLines * 2 * 3);
const lineColors = new Float32Array(maxLines * 2 * 3);

let isDarkTheme = document.body.classList.contains("dark-theme");
let baseLineColor = new THREE.Color(isDarkTheme ? 0x818cf8 : 0x6366f1);
let particleColorVal = isDarkTheme ? 0xc084fc : 0x4f46e5;

function init3D() {
  const canvas = document.getElementById("webgl-bg");
  if (!canvas) return;

  // Scene setup
  scene = new THREE.Scene();

  // Camera setup
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 250;

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  isDarkTheme = document.body.classList.contains("dark-theme");
  baseLineColor = new THREE.Color(isDarkTheme ? 0x818cf8 : 0x6366f1);
  particleColorVal = isDarkTheme ? 0xc084fc : 0x4f46e5;

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

  // Generate constellation nodes
  const starPositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 450;
    const y = (Math.random() - 0.5) * 450;
    const z = (Math.random() - 0.5) * 300;

    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;

    velocities.push({
      x: (Math.random() - 0.5) * 0.25,
      y: (Math.random() - 0.5) * 0.25,
      z: (Math.random() - 0.5) * 0.15
    });
  }

  starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const starMat = new THREE.PointsMaterial({
    color: particleColorVal,
    size: 5.5,
    map: particleTexture,
    transparent: true,
    opacity: isDarkTheme ? 0.8 : 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Line segments geometry for connections
  lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: isDarkTheme ? 0.45 : 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  linesMesh = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(linesMesh);

  // Interaction and resize listeners
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("touchmove", onTouchMove);
  window.addEventListener("resize", onWindowResize);

  // Start loop
  animate();
}

function onMouseMove(e) {
  mouseX = (e.clientX - window.innerWidth / 2) * 0.4;
  mouseY = (e.clientY - window.innerHeight / 2) * 0.4;

  mouse3D.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse3D.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onTouchMove(e) {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    mouseX = (touch.clientX - window.innerWidth / 2) * 0.3;
    mouseY = (touch.clientY - window.innerHeight / 2) * 0.3;

    mouse3D.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse3D.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  }
}

function update3DColors(isDark) {
  if (!scene) return;

  isDarkTheme = isDark;
  baseLineColor.setHex(isDark ? 0x818cf8 : 0x6366f1);
  particleColorVal = isDark ? 0xc084fc : 0x4f46e5;

  if (stars && stars.material) {
    stars.material.color.setHex(particleColorVal);
    stars.material.opacity = isDark ? 0.8 : 0.45;
  }

  if (linesMesh && linesMesh.material) {
    linesMesh.material.opacity = isDark ? 0.45 : 0.25;
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

  if (!scene || !camera || !renderer) return;

  // Calculate mouse scene position in 3D (z = 0 plane)
  const tempV = new THREE.Vector3(mouse3D.x, mouse3D.y, 0.5);
  tempV.unproject(camera);
  const dir = tempV.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  mouseScenePos.copy(camera.position).add(dir.multiplyScalar(distance));

  // Update nodes positions & repulsion forces
  const positions = starGeo.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    let x = positions[i * 3];
    let y = positions[i * 3 + 1];
    let z = positions[i * 3 + 2];

    x += velocities[i].x;
    y += velocities[i].y;
    z += velocities[i].z;

    // Mouse repulsion force
    const dx = x - mouseScenePos.x;
    const dy = y - mouseScenePos.y;
    const dz = z - mouseScenePos.z;
    const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distToMouse < 120) {
      const force = (120 - distToMouse) / 120 * 0.65;
      x += (dx / distToMouse) * force;
      y += (dy / distToMouse) * force;
    }

    // Wrap around boundaries
    const limitX = 260;
    const limitY = 260;
    const limitZ = 200;

    if (x > limitX) x = -limitX;
    else if (x < -limitX) x = limitX;

    if (y > limitY) y = -limitY;
    else if (y < -limitY) y = limitY;

    if (z > limitZ) z = -limitZ;
    else if (z < -limitZ) z = limitZ;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  starGeo.attributes.position.needsUpdate = true;

  // Connect nearby nodes
  let lineCount = 0;
  const lPos = lineGeo.attributes.position.array;
  const lCol = lineGeo.attributes.color.array;
  const minDistance = 85;

  for (let i = 0; i < particleCount; i++) {
    const x1 = positions[i * 3];
    const y1 = positions[i * 3 + 1];
    const z1 = positions[i * 3 + 2];

    for (let j = i + 1; j < particleCount; j++) {
      if (lineCount >= maxLines) break;

      const x2 = positions[j * 3];
      const y2 = positions[j * 3 + 1];
      const z2 = positions[j * 3 + 2];

      const dx = x1 - x2;
      const dy = y1 - y2;
      const dz = z1 - z2;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < minDistance) {
        const idx = lineCount * 6;

        lPos[idx] = x1;
        lPos[idx + 1] = y1;
        lPos[idx + 2] = z1;

        lPos[idx + 3] = x2;
        lPos[idx + 4] = y2;
        lPos[idx + 5] = z2;

        const alpha = 1 - (dist / minDistance);

        lCol[idx] = baseLineColor.r * alpha;
        lCol[idx + 1] = baseLineColor.g * alpha;
        lCol[idx + 2] = baseLineColor.b * alpha;

        lCol[idx + 3] = baseLineColor.r * alpha;
        lCol[idx + 4] = baseLineColor.g * alpha;
        lCol[idx + 5] = baseLineColor.b * alpha;

        lineCount++;
      }
    }
  }

  lineGeo.setDrawRange(0, lineCount * 2);
  lineGeo.attributes.position.needsUpdate = true;
  lineGeo.attributes.color.needsUpdate = true;

  // Soft camera follow lerping
  const targetX = mouseX * 0.05;
  const targetY = -mouseY * 0.05;
  camera.position.x += (targetX - camera.position.x) * 0.03;
  camera.position.y += (targetY - camera.position.y) * 0.03;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

// ========== Scroll Progress Bar & Scroll Reveal Observation ==========
function initScrollEffects() {
  // 1. Scroll Progress Bar
  const progressBar = document.getElementById("scrollProgress");
  window.addEventListener("scroll", () => {
    if (!progressBar) return;
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressBar.style.width = scrolled + "%";
  });

  // 2. Scroll Reveal Observer
  const revealElements = document.querySelectorAll(".reveal");
  const observerOptions = {
    threshold: 0.08,
    rootMargin: "0px 0px -40px 0px"
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });
}

// Initializing the system on window load
window.addEventListener("load", () => {
  init3D();
  setupTrendChartBindings();
  initCustomSelects();
  fetchTickerRates();
  initNavIndicator();
  initScrollEffects();
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

const downsampleData = (dataPoints, targetCount = 30) => {
  if (dataPoints.length <= targetCount) return dataPoints;
  const step = dataPoints.length / (targetCount - 1);
  const result = [];
  for (let i = 0; i < targetCount - 1; i++) {
    const index = Math.round(i * step);
    result.push(dataPoints[index]);
  }
  result.push(dataPoints[dataPoints.length - 1]);
  return result;
};

async function updateTrendChart(from, to, currentRate) {
  activeFromCurrency = from;
  activeToCurrency = to;
  activeLiveRate = currentRate;

  const wrapper = document.querySelector(".chart-wrapper");
  if (wrapper) wrapper.classList.add("loading");

  let days = 7;
  if (trendTimeframe === "30D") days = 30;
  else if (trendTimeframe === "90D") days = 90;
  else if (trendTimeframe === "1Y") days = 365;

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

  const sampledPoints = downsampleData(dataPoints, 30);
  drawTrendChart(from, to, sampledPoints);
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
    
    let highlightedIndex = -1;
    
    const getVisibleOptions = () => {
      return Array.from(optionsWrapper.querySelectorAll(".custom-option")).filter(
        opt => opt.style.display !== "none"
      );
    };

    const setHighlightedOption = (index) => {
      const visibleOpts = getVisibleOptions();
      optionsWrapper.querySelectorAll(".custom-option").forEach(opt => {
        opt.classList.remove("highlighted");
      });

      if (index < 0 || visibleOpts.length === 0) {
        highlightedIndex = -1;
        return;
      }

      if (index >= visibleOpts.length) {
        index = visibleOpts.length - 1;
      }
      highlightedIndex = index;
      
      const targetOpt = visibleOpts[highlightedIndex];
      targetOpt.classList.add("highlighted");
      
      // Scroll option into view within optionsWrapper
      const wrapperHeight = optionsWrapper.clientHeight;
      const optionTop = targetOpt.offsetTop;
      const optionHeight = targetOpt.offsetHeight;
      const scrollPos = optionsWrapper.scrollTop;

      if (optionTop < scrollPos) {
        optionsWrapper.scrollTop = optionTop;
      } else if (optionTop + optionHeight > scrollPos + wrapperHeight) {
        optionsWrapper.scrollTop = optionTop + optionHeight - wrapperHeight;
      }
    };
    
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
        
        const visible = getVisibleOptions();
        const selectedIdx = visible.findIndex(o => o.classList.contains("selected"));
        setHighlightedOption(selectedIdx >= 0 ? selectedIdx : 0);
        
        // Smooth focus transition
        setTimeout(() => searchInput.focus(), 60);
      }
    });
    
    // Prevent menu clicks from closing dropdown
    menu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    
    // Keyboard navigation in searchable options
    searchInput.addEventListener("keydown", (e) => {
      const visibleOpts = getVisibleOptions();
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        let nextIdx = highlightedIndex + 1;
        if (nextIdx >= visibleOpts.length) nextIdx = 0;
        setHighlightedOption(nextIdx);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        let prevIdx = highlightedIndex - 1;
        if (prevIdx < 0) prevIdx = visibleOpts.length - 1;
        setHighlightedOption(prevIdx);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < visibleOpts.length) {
          visibleOpts[highlightedIndex].click();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        container.classList.remove("active");
        trigger.focus();
      }
    });
    
    // Filter options on typing
    searchInput.addEventListener("input", (e) => {
      filterList(e.target.value);
      setHighlightedOption(0);
    });
    
    const highlightMatch = (text, term) => {
      if (!term) return text;
      const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    };
    
    const filterList = (query) => {
      const term = query.toLowerCase().trim();
      const options = optionsWrapper.querySelectorAll(".custom-option");
      options.forEach(opt => {
        const codeSpan = opt.querySelector(".option-code");
        const nameSpan = opt.querySelector(".option-name");
        
        if (!opt.hasAttribute("data-original-code")) {
          opt.setAttribute("data-original-code", codeSpan.textContent);
        }
        if (!opt.hasAttribute("data-original-name")) {
          opt.setAttribute("data-original-name", nameSpan.textContent);
        }
        
        const originalCode = opt.getAttribute("data-original-code");
        const originalName = opt.getAttribute("data-original-name");
        
        const matchesCode = originalCode.toLowerCase().includes(term);
        const matchesName = originalName.toLowerCase().includes(term);
        
        if (matchesCode || matchesName) {
          opt.style.display = "flex";
          if (term !== "") {
            codeSpan.innerHTML = highlightMatch(originalCode, term);
            nameSpan.innerHTML = highlightMatch(originalName, term);
          } else {
            codeSpan.textContent = originalCode;
            nameSpan.textContent = originalName;
          }
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
  
  let lastLeft = 0;
  let clearClassTimeout = null;

  function updatePillPosition(link) {
    pill.style.opacity = "1";
    const newLeft = link.offsetLeft;
    
    // Clear any previous timeouts
    if (clearClassTimeout) clearTimeout(clearClassTimeout);
    
    // Detect movement direction for stretchy/elastic effect
    if (newLeft > lastLeft) {
      pill.classList.remove("moving-left");
      pill.classList.add("moving-right");
    } else if (newLeft < lastLeft) {
      pill.classList.remove("moving-right");
      pill.classList.add("moving-left");
    }
    lastLeft = newLeft;
    
    pill.style.left = `${newLeft}px`;
    pill.style.top = `${link.offsetTop}px`;
    pill.style.width = `${link.offsetWidth}px`;
    pill.style.height = `${link.offsetHeight}px`;
    
    // Remove movement classes after transition finishes
    clearClassTimeout = setTimeout(() => {
      pill.classList.remove("moving-left", "moving-right");
    }, 450);
  }
  
  function resetToActive() {
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
    
    // Premium click ripple effect
    link.addEventListener("click", function(e) {
      const ripple = document.createElement("span");
      ripple.className = "nav-ripple";
      
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 550);
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


