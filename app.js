/**
 * CalorieTrack - Modern Vanilla JavaScript Calorie & Nutrition Tracker
 * Persistent client-side data via browser localStorage.
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEYS = {
    ENTRIES: 'calorietrack_entries_v1',
    GOALS: 'calorietrack_goals_v1'
  };

  const DEFAULT_GOALS = {
    calories: 2000,
    protein: 130,
    carbs: 220,
    fat: 65
  };

  // --- Application State ---
  let selectedDate = getTodayDateString();
  let goals = loadGoals();
  let entries = loadEntries();

  // --- DOM Elements ---
  const dateDisplayLabel = document.getElementById('dateDisplayLabel');
  const datePickerInput = document.getElementById('datePickerInput');
  const btnPrevDay = document.getElementById('btnPrevDay');
  const btnNextDay = document.getElementById('btnNextDay');
  const btnToday = document.getElementById('btnToday');

  // Dashboard Metrics
  const totalConsumedDisplay = document.getElementById('totalConsumedDisplay');
  const targetGoalDisplay = document.getElementById('targetGoalDisplay');
  const remainingCalDisplay = document.getElementById('remainingCalDisplay');
  const remainingOrOverLabel = document.getElementById('remainingOrOverLabel');
  const calorieProgressBar = document.getElementById('calorieProgressBar');
  const progressPercentageText = document.getElementById('progressPercentageText');
  const calorieStatusBadge = document.getElementById('calorieStatusBadge');

  // Macro Metrics
  const proteinAmountText = document.getElementById('proteinAmountText');
  const carbsAmountText = document.getElementById('carbsAmountText');
  const fatAmountText = document.getElementById('fatAmountText');
  const proteinMiniBar = document.getElementById('proteinMiniBar');
  const carbsMiniBar = document.getElementById('carbsMiniBar');
  const fatMiniBar = document.getElementById('fatMiniBar');

  // Form & Inputs
  const addFoodForm = document.getElementById('addFoodForm');
  const foodNameInput = document.getElementById('foodNameInput');
  const mealTypeSelect = document.getElementById('mealTypeSelect');
  const foodCaloriesInput = document.getElementById('foodCaloriesInput');
  const foodProteinInput = document.getElementById('foodProteinInput');
  const foodCarbsInput = document.getElementById('foodCarbsInput');
  const foodFatInput = document.getElementById('foodFatInput');
  const presetChips = document.querySelectorAll('.preset-chip');

  // Meal Lists
  const mealLists = {
    breakfast: document.getElementById('breakfastList'),
    lunch: document.getElementById('lunchList'),
    dinner: document.getElementById('dinnerList'),
    snack: document.getElementById('snackList')
  };

  const mealTotals = {
    breakfast: document.getElementById('breakfastTotalCal'),
    lunch: document.getElementById('lunchTotalCal'),
    dinner: document.getElementById('dinnerTotalCal'),
    snack: document.getElementById('snackTotalCal')
  };

  // Chart Container
  const weeklyChartContainer = document.getElementById('weeklyChartContainer');

  // Modal Elements
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const settingsModal = document.getElementById('settingsModal');
  const goalsSettingsForm = document.getElementById('goalsSettingsForm');
  const goalCaloriesInput = document.getElementById('goalCaloriesInput');
  const goalProteinInput = document.getElementById('goalProteinInput');
  const goalCarbsInput = document.getElementById('goalCarbsInput');
  const goalFatInput = document.getElementById('goalFatInput');
  const btnClearCurrentDay = document.getElementById('btnClearCurrentDay');
  const btnClearAllData = document.getElementById('btnClearAllData');

  // --- Initialization ---
  function init() {
    setupEventListeners();
    updateDateView();
    renderAll();
  }

  // --- Storage Functions ---
  function loadGoals() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (stored) {
        return Object.assign({}, DEFAULT_GOALS, JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading goals from localStorage:', e);
    }
    return Object.assign({}, DEFAULT_GOALS);
  }

  function saveGoals(newGoals) {
    goals = Object.assign({}, newGoals);
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error('Error saving goals:', e);
    }
  }

  function loadEntries() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading entries from localStorage:', e);
    }
    return [];
  }

  function saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Error saving entries:', e);
    }
  }

  // --- Date Helper Functions ---
  function getTodayDateString() {
    const today = new Date();
    return formatDateToString(today);
  }

  function formatDateToString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseDateString(str) {
    const parts = str.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  function shiftDate(dateStr, offsetDays) {
    const d = parseDateString(dateStr);
    d.setDate(d.getDate() + offsetDays);
    return formatDateToString(d);
  }

  function formatDisplayDate(dateStr) {
    const target = parseDateString(dateStr);
    const todayStr = getTodayDateString();

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const dateFormatted = target.toLocaleDateString(undefined, options);

    if (dateStr === todayStr) {
      return `Today (${dateFormatted})`;
    }

    const yesterdayStr = shiftDate(todayStr, -1);
    if (dateStr === yesterdayStr) {
      return `Yesterday (${dateFormatted})`;
    }

    const tomorrowStr = shiftDate(todayStr, 1);
    if (dateStr === tomorrowStr) {
      return `Tomorrow (${dateFormatted})`;
    }

    return `${dateFormatted}, ${target.getFullYear()}`;
  }

  function updateDateView() {
    dateDisplayLabel.textContent = formatDisplayDate(selectedDate);
    datePickerInput.value = selectedDate;
  }

  // --- Entry CRUD ---
  function addEntry(item) {
    const newEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      date: selectedDate,
      meal: item.meal || 'breakfast',
      name: item.name.trim(),
      calories: Math.round(Number(item.calories) || 0),
      protein: Math.round((Number(item.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(item.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(item.fat) || 0) * 10) / 10,
      timestamp: Date.now()
    };

    entries.push(newEntry);
    saveEntries();
    renderAll();
  }

  function deleteEntry(id) {
    entries = entries.filter(entry => entry.id !== id);
    saveEntries();
    renderAll();
  }

  function clearEntriesForCurrentDate() {
    if (confirm(`Remove all food logs for ${formatDisplayDate(selectedDate)}?`)) {
      entries = entries.filter(entry => entry.date !== selectedDate);
      saveEntries();
      renderAll();
      closeModal();
    }
  }

  function clearAllData() {
    if (confirm('Are you sure you want to completely erase ALL history, entries, and custom goals? This cannot be undone.')) {
      entries = [];
      goals = Object.assign({}, DEFAULT_GOALS);
      try {
        localStorage.removeItem(STORAGE_KEYS.ENTRIES);
        localStorage.removeItem(STORAGE_KEYS.GOALS);
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
      renderAll();
      closeModal();
    }
  }

  // --- Calculations ---
  function getEntriesForDate(dateStr) {
    return entries.filter(e => e.date === dateStr);
  }

  function calculateDailyTotals(dateStr) {
    const dayEntries = getEntriesForDate(dateStr);
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    dayEntries.forEach(item => {
      totalCalories += item.calories;
      totalProtein += item.protein;
      totalCarbs += item.carbs;
      totalFat += item.fat;
    });

    return {
      calories: totalCalories,
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    };
  }

  // --- Rendering ---
  function renderAll() {
    renderDashboard();
    renderMealLists();
    renderWeeklyTrend();
  }

  function renderDashboard() {
    const totals = calculateDailyTotals(selectedDate);
    const targetCalories = goals.calories;
    const remaining = targetCalories - totals.calories;
    const percentage = targetCalories > 0 ? Math.round((totals.calories / targetCalories) * 100) : 0;

    // Numbers display
    totalConsumedDisplay.textContent = totals.calories.toLocaleString();
    targetGoalDisplay.textContent = targetCalories.toLocaleString();

    if (remaining >= 0) {
      remainingOrOverLabel.textContent = 'Remaining';
      remainingCalDisplay.textContent = remaining.toLocaleString();
      remainingCalDisplay.className = 'metric-val text-success';
    } else {
      remainingOrOverLabel.textContent = 'Over by';
      remainingCalDisplay.textContent = Math.abs(remaining).toLocaleString();
      remainingCalDisplay.className = 'metric-val text-danger';
    }

    // Status Badge & Bar color
    calorieProgressBar.className = 'progress-bar-fill';
    if (percentage > 100) {
      calorieProgressBar.classList.add('exceeded');
      calorieProgressBar.style.width = '100%';
      calorieStatusBadge.textContent = 'Exceeded';
      calorieStatusBadge.className = 'status-badge badge-red';
    } else if (percentage >= 90) {
      calorieProgressBar.classList.add('warning');
      calorieProgressBar.style.width = percentage + '%';
      calorieStatusBadge.textContent = 'Near Target';
      calorieStatusBadge.className = 'status-badge badge-amber';
    } else {
      calorieProgressBar.style.width = percentage + '%';
      calorieStatusBadge.textContent = 'On Track';
      calorieStatusBadge.className = 'status-badge badge-green';
    }

    progressPercentageText.textContent = `${percentage}% of ${targetCalories.toLocaleString()} kcal goal`;

    // Macros
    proteinAmountText.textContent = `${totals.protein}g / ${goals.protein}g`;
    const proteinPct = Math.min(100, Math.round((totals.protein / (goals.protein || 1)) * 100));
    proteinMiniBar.style.width = `${proteinPct}%`;

    carbsAmountText.textContent = `${totals.carbs}g / ${goals.carbs}g`;
    const carbsPct = Math.min(100, Math.round((totals.carbs / (goals.carbs || 1)) * 100));
    carbsMiniBar.style.width = `${carbsPct}%`;

    fatAmountText.textContent = `${totals.fat}g / ${goals.fat}g`;
    const fatPct = Math.min(100, Math.round((totals.fat / (goals.fat || 1)) * 100));
    fatMiniBar.style.width = `${fatPct}%`;
  }

  function renderMealLists() {
    const dayEntries = getEntriesForDate(selectedDate);

    const categories = ['breakfast', 'lunch', 'dinner', 'snack'];
    const grouped = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };

    dayEntries.forEach(item => {
      const mealKey = categories.includes(item.meal) ? item.meal : 'snack';
      grouped[mealKey].push(item);
    });

    categories.forEach(cat => {
      const listEl = mealLists[cat];
      const totalEl = mealTotals[cat];
      const items = grouped[cat];

      let subtotal = 0;
      listEl.innerHTML = '';

      if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-meal-state';
        empty.textContent = `No items logged yet for ${cat.charAt(0).toUpperCase() + cat.slice(1)}.`;
        listEl.appendChild(empty);
      } else {
        items.forEach(item => {
          subtotal += item.calories;
          const row = document.createElement('div');
          row.className = 'food-item-row';

          const infoDiv = document.createElement('div');
          infoDiv.className = 'food-item-info';

          const nameSpan = document.createElement('span');
          nameSpan.className = 'food-item-name';
          nameSpan.textContent = item.name;

          const macrosSpan = document.createElement('span');
          macrosSpan.className = 'food-item-macros';

          const pTag = `P: ${item.protein}g`;
          const cTag = `C: ${item.carbs}g`;
          const fTag = `F: ${item.fat}g`;
          macrosSpan.innerHTML = `<span class="macro-tag">${pTag}</span> • <span class="macro-tag">${cTag}</span> • <span class="macro-tag">${fTag}</span>`;

          infoDiv.appendChild(nameSpan);
          infoDiv.appendChild(macrosSpan);

          const rightDiv = document.createElement('div');
          rightDiv.className = 'food-item-right';

          const calSpan = document.createElement('span');
          calSpan.className = 'food-item-cal';
          calSpan.textContent = `${item.calories.toLocaleString()} kcal`;

          const delBtn = document.createElement('button');
          delBtn.className = 'food-delete-btn';
          delBtn.setAttribute('type', 'button');
          delBtn.setAttribute('title', 'Delete item');
          delBtn.textContent = '✕';
          delBtn.addEventListener('click', () => deleteEntry(item.id));

          rightDiv.appendChild(calSpan);
          rightDiv.appendChild(delBtn);

          row.appendChild(infoDiv);
          row.appendChild(rightDiv);
          listEl.appendChild(row);
        });
      }

      totalEl.textContent = subtotal.toLocaleString();
    });
  }

  function renderWeeklyTrend() {
    weeklyChartContainer.innerHTML = '';
    const numDays = 7;
    const daysData = [];

    // Calculate dates ending at selectedDate
    const centerDate = parseDateString(selectedDate);
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(centerDate);
      d.setDate(d.getDate() - i);
      const dStr = formatDateToString(d);
      const totals = calculateDailyTotals(dStr);
      daysData.push({
        dateStr: dStr,
        dayName: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        calories: totals.calories,
        isCurrent: dStr === selectedDate
      });
    }

    // Determine highest value for relative scaling
    const maxVal = Math.max(goals.calories * 1.15, ...daysData.map(d => d.calories), 100);

    daysData.forEach(item => {
      const col = document.createElement('div');
      col.className = 'chart-col';
      col.setAttribute('title', `${item.dateStr}: ${item.calories} kcal (Click to view)`);

      const barBg = document.createElement('div');
      barBg.className = 'chart-bar-bg';

      const barFill = document.createElement('div');
      barFill.className = 'chart-bar-fill';

      // Height calculation
      const heightPct = Math.min(100, Math.round((item.calories / maxVal) * 100));
      barFill.style.height = `${Math.max(item.calories > 0 ? 6 : 0, heightPct)}%`;

      if (item.calories > goals.calories) {
        barFill.classList.add('over-goal');
      } else if (item.isCurrent) {
        barFill.classList.add('is-today');
      }

      if (item.calories > 0) {
        const valLabel = document.createElement('span');
        valLabel.className = 'chart-val-label';
        valLabel.textContent = item.calories;
        barBg.appendChild(valLabel);
      }

      barBg.appendChild(barFill);

      const dayLabel = document.createElement('span');
      dayLabel.className = 'chart-day-label';
      dayLabel.textContent = item.dayName;
      if (item.isCurrent) {
        dayLabel.style.color = '#0284c7';
        dayLabel.style.fontWeight = '800';
      }

      col.appendChild(barBg);
      col.appendChild(dayLabel);

      col.addEventListener('click', () => {
        selectedDate = item.dateStr;
        updateDateView();
        renderAll();
      });

      weeklyChartContainer.appendChild(col);
    });
  }

  // --- Modal Helpers ---
  function openModal() {
    goalCaloriesInput.value = goals.calories;
    goalProteinInput.value = goals.protein;
    goalCarbsInput.value = goals.carbs;
    goalFatInput.value = goals.fat;
    settingsModal.classList.add('open');
  }

  function closeModal() {
    settingsModal.classList.remove('open');
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Date Navigation
    btnPrevDay.addEventListener('click', () => {
      selectedDate = shiftDate(selectedDate, -1);
      updateDateView();
      renderAll();
    });

    btnNextDay.addEventListener('click', () => {
      selectedDate = shiftDate(selectedDate, 1);
      updateDateView();
      renderAll();
    });

    btnToday.addEventListener('click', () => {
      selectedDate = getTodayDateString();
      updateDateView();
      renderAll();
    });

    datePickerInput.addEventListener('change', (e) => {
      if (e.target.value) {
        selectedDate = e.target.value;
        updateDateView();
        renderAll();
      }
    });

    // Add Food Form
    addFoodForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = foodNameInput.value.trim();
      const calories = parseFloat(foodCaloriesInput.value);

      if (!name || isNaN(calories) || calories <= 0) {
        alert('Please enter a valid food name and positive calorie amount.');
        return;
      }

      addEntry({
        name: name,
        meal: mealTypeSelect.value,
        calories: calories,
        protein: parseFloat(foodProteinInput.value) || 0,
        carbs: parseFloat(foodCarbsInput.value) || 0,
        fat: parseFloat(foodFatInput.value) || 0
      });

      // Reset inputs & focus name
      foodNameInput.value = '';
      foodCaloriesInput.value = '';
      foodProteinInput.value = '';
      foodCarbsInput.value = '';
      foodFatInput.value = '';
      foodNameInput.focus();
    });

    // Quick Add Presets Chips
    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const name = chip.getAttribute('data-name');
        const cal = parseFloat(chip.getAttribute('data-cal'));
        const p = parseFloat(chip.getAttribute('data-p'));
        const c = parseFloat(chip.getAttribute('data-c'));
        const f = parseFloat(chip.getAttribute('data-f'));
        const defaultMeal = chip.getAttribute('data-meal') || mealTypeSelect.value;

        addEntry({
          name: name,
          meal: defaultMeal,
          calories: cal,
          protein: p,
          carbs: c,
          fat: f
        });
      });
    });

    // Modal Events
    btnOpenSettings.addEventListener('click', openModal);
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && settingsModal.classList.contains('open')) {
        closeModal();
      }
    });

    // Save Goals Form
    goalsSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cal = parseInt(goalCaloriesInput.value, 10);
      const prot = parseInt(goalProteinInput.value, 10);
      const carbs = parseInt(goalCarbsInput.value, 10);
      const fat = parseInt(goalFatInput.value, 10);

      if (cal > 0 && prot >= 0 && carbs >= 0 && fat >= 0) {
        saveGoals({
          calories: cal,
          protein: prot,
          carbs: carbs,
          fat: fat
        });
        closeModal();
        renderAll();
      } else {
        alert('Please enter valid positive target numbers.');
      }
    });

    btnClearCurrentDay.addEventListener('click', clearEntriesForCurrentDate);
    btnClearAllData.addEventListener('click', clearAllData);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

