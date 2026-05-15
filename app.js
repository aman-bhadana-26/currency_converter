const BASE_URL = "https://api.exchangerate-api.com/v4/latest";

const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg");

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
  
  // Update icon
  if (body.classList.contains("dark-theme")) {
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
    localStorage.setItem("theme", "dark");
  } else {
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
    localStorage.setItem("theme", "light");
  }
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
