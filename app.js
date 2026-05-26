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
};

const updateFlag = (element) => {
  let currCode = element.value;
  let countryCode = countryList[currCode];
  let newSrc = `https://flagsapi.com/${countryCode}/flat/64.png`;
  let img = element.parentElement.querySelector("img");
  img.src = newSrc;
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
window.addEventListener("load", () => {
  setTimeout(() => {
    compareRates();
  }, 500);
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
});
