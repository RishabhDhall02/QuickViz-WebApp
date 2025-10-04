let parsedData = null; // Store parsed data
let lastUsedConfigs = [];
let lastUsedData = [];
let currentSlideIndex = 0;
let currentChartInstance = null;

// Function to trigger the brief disappear-reappear effect
function showErrorMessage(errorElement, message, otherErrorElement) {
  otherErrorElement.textContent = "";
  errorElement.style.opacity = "0"; // Hide briefly
  setTimeout(() => {
    errorElement.textContent = message;
    errorElement.style.opacity = "1"; // Show again
  }, 100); // Short delay for effect
}

// Drag-n-drop listener
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  const dropZone = document.getElementById("drop-zone");

  if (fileInput) {
    fileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      const fileInfo = document.getElementById("file-info");

      if (file && fileInfo) {
        fileInfo.querySelector(
          ".file-name"
        ).textContent = `File selected: ${file.name}`;
        fileInfo.querySelector(
          ".file-type"
        ).textContent = `File type: ${file.type}`;
      } else if (fileInfo) {
        fileInfo.querySelector(".file-name").textContent = "No file selected";
        fileInfo.querySelector(".file-type").textContent = "";
      }
    });
  }

  if (dropZone && fileInput) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");

      const file = e.dataTransfer.files[0];
      if (
        file &&
        (file.name.endsWith(".csv") ||
          file.name.endsWith(".json") ||
          file.name.endsWith(".xlsx"))
      ) {
        fileInput.files = e.dataTransfer.files;
        const reader = new FileReader();
        reader.onload = (e) => {
          parseCSV(e.target.result);
        };
        reader.readAsText(file);
      } else {
        showFileError("Please drop a valid .csv, .json, or .xlsx file.");
      }
    });
  }
});

// Function to upload the file and parse it
function uploadFile() {
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];
  const errorText1 = document.getElementById("file-upload-error");
  const errorText2 = document.getElementById("invalid-file-error");

  // No file selected
  if (!file) {
    showErrorMessage(errorText1, "Please select a file to upload.", errorText2);
    return;
  } else {
    errorText1.textContent = ""; // Clear error if valid
  }

  // Check for supported file formats (CSV, JSON, XLSX)
  const fileExtension = file.name.split(".").pop().toLowerCase();
  const supportedFormats = ["csv", "json", "xlsx"];

  if (!supportedFormats.includes(fileExtension)) {
    showErrorMessage(
      errorText2,
      "Unsupported file format. Please upload a CSV, JSON, or XLSX file.",
      errorText1
    );
    return;
  } else {
    errorText2.textContent = ""; // Clear error if valid
  }

  // Log the selected file name and type
  console.log("File selected: ", file.name, file.type);

  const fileReader = new FileReader();

  // Handle errors in file reading (corrupt/unreadable)
  fileReader.onerror = function (error) {
    alert("Error reading the file. Please try again.");
    console.error("File reading error:", error);
  };

  fileReader.onload = function (e) {
    const content = e.target.result;
    console.log("File content loaded:", content);
    parseCSV(content);
  };

  fileReader.readAsText(file);
  showSection("part-2");
}

document.getElementById("file-input").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    document.querySelector(".file-name").textContent = file.name;
    document.querySelector(".file-type").textContent = file.type;
  }
});

function showSection(idToShow) {
  const sections = ["part-1", "part-2"];
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (id === idToShow) {
      el.style.display = "flex"; // Restore flex layout for centering
    } else {
      el.style.display = "none";
    }
  });
}

document.getElementById("to-part-1").addEventListener("click", () => {
  showSection("part-1");
});

// Example: after successful upload
document.getElementById("upload-btn").addEventListener("click", function () {
  uploadFile();
});

function captureChartImage(callback) {
  requestAnimationFrame(() => {
    const canvas = document.getElementById("slide-canvas");
    try {
      const imgData = canvas.toDataURL("image/png");
      if (!imgData.startsWith("data:image/png;base64,")) {
        console.error("Invalid image data format");
        callback(null);
        return;
      }
      callback(imgData);
    } catch (err) {
      console.error("Error capturing chart image:", err);
      callback(null);
    }
  });
}

/* -------------------------
   Helper: isSalesDataset
   - Accepts dataset (rows array)
   - Returns true when there's at least one sales-like numeric column
   ------------------------- */
function isSalesDataset(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  const headers = Object.keys(rows[0] || {}).map((h) =>
    (h || "").toString().trim().toLowerCase()
  );
  const salesKeywords = [
    "sale",
    "sales",
    "revenue",
    "profit",
    "amount",
    "total",
    "qty",
    "quantity",
    "units",
    "price",
  ];
  // If any header contains a sales keyword -> accept
  if (headers.some((h) => salesKeywords.some((k) => h.includes(k))))
    return true;

  // fallback: if any column is numeric in >50% rows, treat as numeric/sales-ish
  for (const h of headers) {
    let numericCount = 0,
      checked = 0;
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      // sample up to 30 rows
      const v = (rows[i] || {})[h];
      if (v === null || v === undefined || v === "") continue;
      checked++;
      if (!isNaN(Number(String(v).replace(/,/g, "")))) numericCount++;
    }
    if (checked > 0 && numericCount / checked >= 0.6) return true;
  }

  return false;
}

/* -------------------------
   parseCSV (replace your existing)
   - Uses isSalesDataset (rows), creates profile -> selectCharts(profile, rows)
   - Ensures small sample accepted; shows message when no charts generated
   ------------------------- */
function parseCSV(content) {
  console.log("Parsing CSV content...");

  Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      console.log("CSV parsed successfully: ", results);

      if (results.data.length === 0) {
        alert("The CSV file is empty or invalid.");
        return;
      }

      parsedData = results.data; // Save parsed data globally

      const profile = profileData(parsedData);
      console.log("Data profile:", profile);

      if (shouldAggregate(parsedData)) {
        lastUsedConfigs = selectChartsAggregated(profile, parsedData);
        console.log("Using aggregated charts");
        lastUsedData = parsedData;
        currentSlideIndex = 0;
        renderAggregatedSlideChart(currentSlideIndex);
      } else {
        lastUsedConfigs = selectChartsSimple(profile, parsedData);
        console.log("Using simple charts");
        lastUsedData = parsedData;
        currentSlideIndex = 0;
        renderSimpleSlideChart(currentSlideIndex);
      }
    },
    error: function (error) {
      console.error("Error parsing CSV: ", error); // Log errors if any
    },
  });
}

function shouldAggregate(data) {
  const dateCol = findLikelyDateColumn(data);
  if (!dateCol) return false;
  const dates = data
    .map((row) => parseDateLabel(row[dateCol]))
    .filter((d) => d !== null);
  if (dates.length === 0) return false;
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  // Aggregate only if multiple months/years are spanned
  return (
    minDate.getMonth() !== maxDate.getMonth() ||
    minDate.getFullYear() !== maxDate.getFullYear()
  );
}

document.getElementById("prev-slide").addEventListener("click", () => {
  if (currentSlideIndex > 0) {
    console.log("Prev slide clicked, now:", currentSlideIndex);
    currentSlideIndex--;
    renderSlideChart(currentSlideIndex);
  }
});

document.getElementById("next-slide").addEventListener("click", () => {
  if (currentSlideIndex < lastUsedConfigs.length - 1) {
    console.log("Next slide clicked, now:", currentSlideIndex);
    currentSlideIndex++;
    renderSlideChart(currentSlideIndex);
  }
});

function profileData(data) {
  const columns = Object.keys(data[0]); // Get column names from first row
  const profile = {};

  console.log("Columns detected for profiling:", columns);

  for (const col of columns) {
    const values = data.map((row) => row[col]);
    const nonEmpty = values.filter(
      (v) => v !== "" && v !== null && v !== undefined
    );

    const numericVals = nonEmpty
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));

    console.log(
      `Column "${col}" - sample non-empty values:`,
      nonEmpty.slice(0, 5)
    );

    const uniqueVals = [...new Set(nonEmpty)];
    const missingCount = values.length - nonEmpty.length;

    let type = "unknown";

    // First, check if all valid dates
    const allValidDates = nonEmpty.every((v) => parseDateLabel(v) !== null);

    if (allValidDates) {
      type = "date";
      console.log(`Type decided: date (all values are valid dates)`);
    } else {
      // Then check if all numeric
      if (nonEmpty.every((v) => !isNaN(parseFloat(v)))) {
        type = "numeric";
        console.log(`Type decided: numeric (all values parse to numbers)`);
      } else if (uniqueVals.length < values.length * 0.3) {
        type = "categorical";
        console.log(
          `Type decided: categorical (unique vals less than 30% of total)`
        );
      } else {
        type = "text";
        console.log(`Type decided: text (default fallback)`);
      }
    }

    profile[col] = {
      type,
      uniqueCount: uniqueVals.length,
      missingCount,
      sampleValues: uniqueVals.slice(0, 5),
    };

    if (type === "numeric") {
      const sum = numericVals.reduce((a, b) => a + b, 0);
      const mean = sum / numericVals.length;
      const min = Math.min(...numericVals);
      const max = Math.max(...numericVals);

      profile[col].stats = { sum, mean, min, max };
    }
  }

  return profile;
}

function findLikelyCategoryColumn(categoricalCols) {
  // Skip anything that looks like an ID
  const idPatterns = ["id", "code", "number"];
  return (
    categoricalCols.find(
      (col) => !idPatterns.some((p) => col.toLowerCase().includes(p))
    ) || categoricalCols[0]
  );
}

function findLikelySalesColumn(numericCols) {
  // Prioritize column names that likely represent sales/revenue
  const salesKeywords = ["sales", "revenue", "amount", "total"];
  for (const col of numericCols) {
    const lower = col.toLowerCase();
    if (salesKeywords.some((keyword) => lower.includes(keyword))) {
      return col;
    }
  }

  // Default to first numeric column if no match found
  return numericCols[0];
}

function isIdentifierColumn(name) {
  const lower = name.toLowerCase();
  return (
    lower.includes("id") || lower.includes("name") || lower.includes("code")
  );
}

function findLikelyDateColumn(data) {
  const sampleRow = data[0];
  if (!sampleRow) return null;

  for (const key of Object.keys(sampleRow)) {
    if (key.toLowerCase().includes("date")) return key;
  }
  return null;
}

function selectChartsAggregated(profile, data) {
  const charts = [];
  if (!Array.isArray(data) || data.length === 0) return charts;

  // compute useful cols correctly from profile
  const numericCols = Object.keys(profile).filter(
    (k) => profile[k].type === "numeric"
  );
  const categoricalCols = Object.keys(profile).filter((k) =>
    ["categorical", "text"].includes(profile[k].type)
  );

  const dateCol = findLikelyDateColumn(data);
  const salesCol = findLikelySalesColumn(numericCols || []);
  const categoryCol = findLikelyCategoryColumn(categoricalCols || []);

  // 1) Sales over time (grouped by Month-Year)
  if (dateCol && salesCol) {
    const monthMap = {}; // YYYY-MM -> { label: 'Jan 2023', total }
    data.forEach((r) => {
      const d = parseDateLabel(r[dateCol]);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const label = `${d.toLocaleString("default", {
        month: "short",
      })} ${d.getFullYear()}`;
      const val = parseFloat(String(r[salesCol] || "0").replace(/,/g, "")) || 0;
      if (!monthMap[key]) monthMap[key] = { label, total: 0, dateObj: d };
      monthMap[key].total += val;
    });

    const keys = Object.keys(monthMap).sort(); // chronological
    const labels = keys.map((k) => monthMap[k].label);
    const values = keys.map((k) => monthMap[k].total);

    if (labels.length > 0) {
      charts.push({
        type: "line",
        title: "Sales Over Time (Monthly)",
        x: labels,
        y: values,
        preaggregated: true,
        insight: "Sales trend across months/years",
      });
    }
  }

  // 2) Sales by product/category (pre-aggregate)
  if (categoryCol && salesCol) {
    const agg = aggregateDataByCategory(data, categoryCol, salesCol);
    if (agg.labels.length) {
      charts.push({
        type: "bar",
        title: "Sales by Product Category",
        x: agg.labels,
        y: agg.values,
        preaggregated: true,
        insight: "Category-wise contribution to overall sales",
      });

      // Also push a pie for distribution (preaggregated)
      charts.push({
        type: "pie",
        title: `Sales Distribution by ${categoryCol}`,
        x: agg.labels,
        y: agg.values,
        preaggregated: true,
      });
    }
  }

  // 3) optional: profit vs sales (if Profit numeric)
  if (salesCol && numericCols.includes("Profit")) {
    // if you want scatter removed, comment this block out. I'll convert to a simple bar of profit by category instead:
    const profitAgg = aggregateDataByCategory(
      data,
      categoryCol || "Category",
      "Profit"
    );
    if (profitAgg.labels.length) {
      charts.push({
        type: "bar",
        title: "Profit by Category",
        x: profitAgg.labels,
        y: profitAgg.values,
        preaggregated: true,
        insight: "Profit contribution by category",
      });
    }
  }

  return charts;
}

function selectChartsSimple(profile) {
  const chartsToRender = [];

  const columnNames = Object.keys(profile);

  const numericCols = columnNames.filter(
    (col) => profile[col].type === "numeric"
  );
  const categoricalCols = columnNames.filter((col) =>
    ["categorical", "text"].includes(profile[col].type)
  );
  const dateCols = columnNames.filter((col) => profile[col].type === "date");

  console.log("Profile inside selectCharts:", profile);

  const likelySalesCol = findLikelySalesColumn(numericCols);
  console.log("Likely sales column:", likelySalesCol);

  // 1. Line chart: sales over time (if date + numeric exist)
  if (
    dateCols.length &&
    numericCols.length &&
    profile[dateCols[0]].sampleValues.every((v) => isValidDate(v))
  ) {
    chartsToRender.push({
      type: "line",
      x: dateCols[0],
      y: likelySalesCol,
      title: "Sales Over Time",
    });
  }

  // 2. Bar chart: sales by category (e.g., by region/product)
  if (categoricalCols.length && numericCols.length) {
    chartsToRender.push({
      type: "bar",
      x: categoricalCols[0],
      y: likelySalesCol,
      title: `Sales by ${categoricalCols[0]}`,
    });
  }

  // 3. Horizontal Bar chart: for long labels or many categories
  for (const col of categoricalCols) {
    const uniqueVals = profile[col].uniqueCount || 0;
    const maxLabelLength = Math.max(
      ...profile[col].sampleValues.map((val) => val.length)
    );

    if ((uniqueVals >= 6 && uniqueVals <= 15) || maxLabelLength > 12) {
      chartsToRender.push({
        type: "bar",
        x: likelySalesCol,
        y: col,
        title: `Sales by ${col} (Horizontal)`,
        horizontal: true, // custom flag
      });
      break;
    }
  }

  // 4. Pie chart: sales share by top category
  if (categoricalCols.length && numericCols.length) {
    chartsToRender.push({
      type: "pie",
      labels: categoricalCols[0],
      values: likelySalesCol,
      title: `Sales Distribution by ${categoricalCols[0]}`,
    });
  }

  console.log("Charts to render:", chartsToRender);
  return chartsToRender;
}

/* -------------------------
   Helper: aggregateDataByCategory
   - Aggregates rows by categoryCol summing valueCol
   - Returns { labels:[], values:[] } ordered by value desc
   ------------------------- */
function aggregateDataByCategory(rows, categoryCol, valueCol) {
  const agg = {};
  if (!Array.isArray(rows)) return { labels: [], values: [] };
  rows.forEach((r) => {
    const cat =
      r[categoryCol] !== undefined && r[categoryCol] !== null
        ? String(r[categoryCol])
        : "(blank)";
    const val = parseFloat(String(r[valueCol] || "0").replace(/,/g, "")) || 0;
    agg[cat] = (agg[cat] || 0) + val;
  });
  const entries = Object.entries(agg).sort((a, b) => b[1] - a[1]);
  return { labels: entries.map((e) => e[0]), values: entries.map((e) => e[1]) };
}

const backgroundColors = [
  "rgba(75, 192, 192, 0.6)",
  "rgba(255, 99, 132, 0.6)",
  "rgba(255, 206, 86, 0.6)",
  "rgba(153, 102, 255, 0.6)",
  "rgba(54, 162, 235, 0.6)",
  "rgba(255, 159, 64, 0.6)",
  "rgba(199, 199, 199, 0.6)",
  "rgba(255, 205, 86, 0.6)",
  "rgba(201, 203, 207, 0.6)",
];

const borderColors = backgroundColors.map((c) => c.replace("0.6", "1"));

function getChartLabels(config, data) {
  if (config.type === "bar" || config.type === "pie") {
    if (config.horizontal) {
      return aggregateDataByCategory(data, config.y, config.x).labels;
    } else {
      return aggregateDataByCategory(
        data,
        config.x || config.labels,
        config.y || config.values
      ).labels;
    }
  } else if (config.type === "line") {
    return data.map((row) => row[config.x]);
  }
  return [];
}

function getChartValues(config, data) {
  if (config.type === "bar" || config.type === "pie") {
    if (config.horizontal) {
      return aggregateDataByCategory(data, config.y, config.x).values;
    } else {
      return aggregateDataByCategory(
        data,
        config.x || config.labels,
        config.y || config.values
      ).values;
    }
  } else if (config.type === "line") {
    return data.map((row) => parseFloat(row[config.y]) || 0);
  }
  return [];
}

// Unified wrapper used by navigation and resize - delegates to the right renderer
function renderSlideChart(index, onCompleteCallback) {
  if (!Array.isArray(lastUsedConfigs) || lastUsedConfigs.length === 0) {
    console.warn("No charts available to render.");
    return;
  }
  if (
    typeof index !== "number" ||
    index < 0 ||
    index >= lastUsedConfigs.length
  ) {
    index = 0;
  }

  const config = lastUsedConfigs[index];
  if (!config) {
    console.error("Missing config at index", index, lastUsedConfigs);
    return;
  }

  // delegate based on whether this config was pre-aggregated
  if (config.preaggregated) {
    // aggregated renderer accepts (index, onCompleteCallback)
    renderAggregatedSlideChart(index, onCompleteCallback);
  } else {
    // simple renderer (index) — keep signature compatible
    renderSimpleSlideChart(index);
    if (typeof onCompleteCallback === "function") {
      // call back after paint
      requestAnimationFrame(() => onCompleteCallback());
    }
  }
}

let chartInstance = [];

// Replace your previous simple renderer with this exact function:
function renderSimpleSlideChart(index) {
  console.log("Rendering slide", index, lastUsedConfigs[index]);
  const config = lastUsedConfigs[index];
  const canvas = document.getElementById("slide-canvas");
  const ctx = canvas.getContext("2d");

  // Destroy previous chart if it exists
  if (currentChartInstance) {
    console.log("Destroying chart of type:", currentChartInstance.config.type);
    currentChartInstance.destroy();
    console.log("Destroyed previous chart instance");
  }

  // Get labels & values safely
  let labels = getChartLabels(config, lastUsedData) || [];
  let values = getChartValues(config, lastUsedData) || [];

  if (!Array.isArray(labels)) labels = Array.from(labels);
  if (!Array.isArray(values)) {
    if (values && typeof values === "object") {
      values = Object.values(values);
    } else {
      values = Array.from(values || []);
    }
  }

  if (!labels.length || !values.length) {
    console.warn("No data to render for config:", config);
    document.getElementById("slide-title").textContent =
      config.title || `Chart ${index + 1}`;
    document.getElementById("slide-insights").innerHTML =
      "<h3>Insights</h3><ul><li>No data available.</li></ul>";
    document.getElementById("slide-counter").textContent = `${index + 1} / ${
      lastUsedConfigs.length
    }`;
    return;
  }

  // Ensure numeric conversion of values
  const numericValues = values.map((v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const cleaned = v.replace(/,/g, "").trim();
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    }
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: config.y || config.values || config.title,
        data: numericValues,
        backgroundColor:
          config.type === "pie"
            ? backgroundColors
            : getColor(currentSlideIndex),
        borderColor:
          config.type === "pie"
            ? borderColors
            : getColor(currentSlideIndex, true),
        borderWidth: 1,
        fill: false,
      },
    ],
  };

  console.log("Creating new chart of type:", config.type);

  // Use horizontal bar if flagged
  const chartType = config.horizontal ? "bar" : config.type;

  currentChartInstance = new Chart(ctx, {
    type: chartType,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 800,
        easing: "easeOutQuart",
        onComplete: () => {
          console.log("Chart animation completed");
        },
      },
      indexAxis: config.horizontal ? "y" : "x",
      scales:
        chartType === "bar" || chartType === "line"
          ? {
              x: { ticks: { autoSkip: true, maxTicksLimit: 20 } },
              y: config.horizontal
                ? { ticks: { autoSkip: false } }
                : { beginAtZero: true },
            }
          : {},
    },
  });

  // Generate insights
  const insights = generateInsights(config, lastUsedData);
  document.getElementById("slide-insights").innerHTML = `
    <h3>Insights</h3>
    <ul>${insights.map((item) => `<li>${item}</li>`).join("")}</ul>
  `;

  // Title & counter
  document.getElementById("slide-title").textContent =
    config.title || `Chart ${index + 1}`;
  document.getElementById("slide-counter").textContent = `${index + 1} / ${
    lastUsedConfigs.length
  }`;

  console.log("New chart rendered:", config.title || `Chart ${index + 1}`);
}

function renderAggregatedSlideChart(index, onCompleteCallback) {
  console.log("Rendering aggregated slide", index, lastUsedConfigs[index]);
  const config = lastUsedConfigs[index];
  const canvas = document.getElementById("slide-canvas");
  const ctx = canvas.getContext("2d");

  // Destroy previous chart
  if (currentChartInstance) {
    try {
      currentChartInstance.destroy();
      console.log("Destroyed previous chart instance");
    } catch (e) {
      console.warn("Error destroying previous chart instance:", e);
    }
  }

  let labels = config.x || [];
  let values = config.y || [];

  // Convert values into clean numbers
  const numericValues = values.map((v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const cleaned = v.replace(/,/g, "").trim();
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    }
    return Number(v) || 0;
  });

  // Support pie for aggregated
  const datasetConfig = {
    label: config.y || config.values || config.title,
    data: numericValues,
    backgroundColor: config.type === "pie" ? backgroundColors : getColor(index),
    borderColor: config.type === "pie" ? borderColors : getColor(index, true),
    borderWidth: 1,
    fill: false,
  };

  console.log("Creating aggregated chart of type:", config.type);

  // Scatter removed: default to bar if scatter appears
  const chartType =
    config.type === "scatter" ? "bar" : config.horizontal ? "bar" : config.type;

  currentChartInstance = new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets: [datasetConfig],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 800,
        easing: "easeOutQuart",
        onComplete: () => {
          if (typeof onCompleteCallback === "function") {
            requestAnimationFrame(() => onCompleteCallback());
          }
        },
      },
      indexAxis: config.horizontal ? "y" : "x",
      scales:
        chartType === "bar" || chartType === "line"
          ? {
              x: { ticks: { autoSkip: true, maxTicksLimit: 20 } },
              y: config.horizontal
                ? { ticks: { autoSkip: false } }
                : { beginAtZero: true },
            }
          : {},
      plugins: {
        legend: {
          display: true,
          position: config.type === "pie" ? "right" : "top",
        },
      },
    },
  });

  // Build insights + UI
  const insights = generateInsights(config, lastUsedData);
  document.getElementById("slide-insights").innerHTML = `
    <h3>Insights</h3>
    <ul>${insights.map((item) => `<li>${item}</li>`).join("")}</ul>
  `;

  document.getElementById("slide-title").textContent =
    config.title || `Chart ${index + 1}`;
  document.getElementById("slide-counter").textContent = `${index + 1} / ${
    lastUsedConfigs.length
  }`;

  console.log(
    "Aggregated chart rendered:",
    config.title || `Chart ${index + 1}`
  );
}

// Helper functions
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function monthName(index) {
  return new Date(2020, index, 1).toLocaleString("en-US", { month: "long" });
}

// Parses a label into a date
function parseDateLabel(label, { defaultMMDD = true } = {}) {
  if (!label && label !== 0) return null;
  if (label instanceof Date)
    return new Date(label.getFullYear(), label.getMonth(), label.getDate());
  const s = String(label).trim();

  // 1) YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (take first Y-M-D chunk)
  let m = s.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
  if (m) {
    const y = +m[1],
      mo = +m[2],
      d = +m[3];
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return new Date(y, mo - 1, d);
  }

  // 2) D/M/Y or M/D/Y (numeric, separators - / .)
  m = s.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})$/);
  if (m) {
    let a = +m[1],
      b = +m[2],
      c = +m[3];
    if (c < 100) c += c < 50 ? 2000 : 1900;
    if (a > 31 || b > 31) return null;
    if (a > 12 && b <= 12) {
      // a is day -> DD/MM/YYYY
      return new Date(c, b - 1, a);
    } else if (b > 12 && a <= 12) {
      // b is day -> MM/DD/YYYY
      return new Date(c, a - 1, b);
    } else {
      // ambiguous - use defaultMMDD flag
      if (defaultMMDD) return new Date(c, a - 1, b);
      else return new Date(c, b - 1, a);
    }
  }

  // 3) Month name formats (e.g. "Aug 9 2023", "9 Aug 2023", "September 01, 2023")
  m = s.match(/([A-Za-z]+)\s+(\d{1,2})(?:[,\s]+(\d{4}))?/); // "Aug 9 2023"
  if (m) {
    const monthStr = m[1].slice(0, 3).toLowerCase();
    const months = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    if (months.hasOwnProperty(monthStr)) {
      const day = +m[2],
        year = m[3] ? +m[3] : new Date().getFullYear();
      return new Date(year, months[monthStr], day);
    }
  }

  m = s.match(/^(\d{1,2})\s+([A-Za-z]+)(?:[,\s]+(\d{4}))?$/);
  if (m) {
    const day = +m[1],
      monthStr = m[2].slice(0, 3).toLowerCase(),
      year = m[3] ? +m[3] : new Date().getFullYear();
    const months = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    if (months.hasOwnProperty(monthStr))
      return new Date(year, months[monthStr], day);
  }

  // 4) fallback to Date.parse, then normalize to local y/m/d
  const parsed = Date.parse(s);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return null;
}

function isLikelyPlaceLabel(label) {
  if (!label) return false;
  const s = String(label).trim();

  // Comma-separated (City, ST or City, Country)
  if (/,/.test(s)) return true;

  // Common place words
  if (
    /\b(city|state|province|county|district|region|island|town|village|municipality|borough|shire)\b/i.test(
      s
    )
  ) {
    return true;
  }

  // Compass directions (standalone or followed by place words)
  if (/^(north|south|east|west)$/i.test(s)) return true;
  if (/^(north|south|east|west)\s+(region|district|side|area|zone)$/i.test(s))
    return true;

  // Trailing two-letter state/province code
  if (/[A-Za-z\s]+[,\s]+[A-Z]{2}$/.test(s)) return true;

  return false;
}

/* -------------------------
   Utility: formatDateLabel (day+suffix + month + year)
   ------------------------- */
function formatDateLabel(label) {
  if (label === undefined || label === null) return String(label);
  const d = parseDateLabel(label);
  if (d) {
    const day = d.getDate();
    const monthName = d.toLocaleString("en-US", { month: "long" });
    const year = d.getFullYear();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";
    return `${day}${suffix} ${monthName} ${year}`;
  }
  // try Month Year like "Jan 2023" or ISO "2023-01"
  const s = String(label).trim();
  const my = s.match(/^([A-Za-z]{3,})\s+(\d{4})$/);
  if (my) return `${my[1]} ${my[2]}`;
  const iso = s.match(/^(\d{4})-(\d{2})$/);
  if (iso) {
    const year = +iso[1],
      monthIndex = +iso[2] - 1;
    return `${new Date(year, monthIndex, 1).toLocaleString("en-US", {
      month: "short",
    })} ${year}`;
  }
  return s;
}

/* -------------------------
   Grammar: getLabelPreamble
   - date => "on 9th August 2023" (uses parseDateLabel/formatDateLabel)
   - month-year (e.g., "Jan 2023" or "2023-01") => "in Jan 2023"
   - place => "in X"
   - compass => "in X"
   - otherwise => "for X"
   ------------------------- */
function getLabelPreamble(label) {
  if (label === undefined || label === null) return "";
  const s = String(label).trim();

  // exact date
  if (parseDateLabel(s) !== null) {
    return "on " + formatDateLabel(s);
  }

  // Month Year (like "Jan 2023") or ISO month "YYYY-MM"
  if (/^[A-Za-z]{3,}\s+\d{4}$/.test(s) || /^\d{4}-\d{2}$/.test(s)) {
    return "in " + s;
  }

  // Place-like
  if (isLikelyPlaceLabel(s)) return "in " + s;

  // Compass alone
  if (/^(north|south|east|west)$/i.test(s)) return "in " + s;

  // fallback => object / product
  return "for " + s;
}

function generateInsights(config, data) {
  const insights = [];

  // Resolve labels & values:
  let labels = [];
  let values = [];

  if (
    config &&
    config.preaggregated &&
    Array.isArray(config.x) &&
    Array.isArray(config.y)
  ) {
    labels = config.x.slice();
    values = config.y.slice();
  } else {
    // Prefer custom helpers if they exist
    if (
      typeof getChartLabels === "function" &&
      typeof getChartValues === "function"
    ) {
      labels = getChartLabels(config, data) || [];
      values = getChartValues(config, data) || [];
    } else {
      // fallback: if config.x & config.y are column names and data present, aggregate where appropriate
      if (
        config &&
        typeof config.x === "string" &&
        typeof config.y === "string" &&
        Array.isArray(data)
      ) {
        if (config.type === "pie" || config.type === "bar") {
          const agg = aggregateDataByCategory(data, config.x, config.y);
          labels = agg.labels;
          values = agg.values;
        } else {
          // line/scatter: simple map
          labels = data.map((r) => r[config.x]);
          values = data.map(
            (r) => parseFloat(String(r[config.y] || "0").replace(/,/g, "")) || 0
          );
        }
      }
    }
  }

  if (!labels || !values || labels.length === 0 || values.length === 0)
    return insights;

  // ensure numeric values
  const numericValues = values.map((v) => {
    if (typeof v === "number") return v;
    const cleaned = String(v).replace(/,/g, "").trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  });

  // PIE
  if (config.type === "pie") {
    const total = numericValues.reduce((s, v) => s + v, 0);
    if (total === 0) return insights;
    const percentages = numericValues.map((v) => (v / total) * 100);

    const max = Math.max(...numericValues);
    const maxIndex = numericValues.indexOf(max);
    insights.push(
      `🏆 <strong>${
        labels[maxIndex]
      }</strong> is the largest contributor at <strong>${percentages[
        maxIndex
      ].toFixed(1)}%</strong>.`
    );

    // balance
    const dominantThreshold = 30;
    if (percentages[maxIndex] > dominantThreshold) {
      insights.push(
        `⚖️ The distribution is skewed heavily towards <strong>${labels[maxIndex]}</strong>.`
      );
    } else {
      insights.push(
        `⚖️ The pie chart shows a fairly balanced distribution across categories.`
      );
    }

    // three smallest segments conditionally
    const segs = labels
      .map((lab, i) => ({ lab, pct: percentages[i] }))
      .sort((a, b) => a.pct - b.pct);
    const smallestThree = segs.slice(0, 3);
    const smallestSum = smallestThree.reduce((s, x) => s + x.pct, 0);
    if (smallestSum < 15) {
      insights.push(
        `🔍 The three smallest segments (${smallestThree
          .map((s) => `<strong>${s.lab}</strong>`)
          .join(", ")}) together contribute only <strong>${smallestSum.toFixed(
          1
        )}%</strong>.`
      );
    }

    const minor = segs.filter((s) => s.pct < 5);
    if (minor.length > 0) {
      insights.push(
        `⚠️ There are <strong>${minor.length}</strong> minor segments (${minor
          .map((m) => `<strong>${m.lab}</strong>`)
          .join(", ")}) below 5% that might be grouped.`
      );
    }

    return insights;
  }

  // BAR / LINE
  const max = Math.max(...numericValues);
  const min = Math.min(...numericValues);
  const avg = numericValues.reduce((s, v) => s + v, 0) / numericValues.length;
  const maxIndex = numericValues.indexOf(max);
  const minIndex = numericValues.indexOf(min);

  insights.push(
    `📈 Sales peaked ${getLabelPreamble(
      labels[maxIndex]
    )}, reaching <strong>${max.toFixed(2)}</strong>.`
  );
  insights.push(
    `📉 Sales dipped ${getLabelPreamble(
      labels[minIndex]
    )}, down to <strong>${min.toFixed(2)}</strong>.`
  );
  insights.push(`📊 Sales averaged about <strong>${avg.toFixed(2)}</strong>.`);

  // trend detection (simple)
  let inc = 0,
    dec = 0;
  for (let i = 1; i < numericValues.length; i++) {
    if (numericValues[i] > numericValues[i - 1]) inc++;
    else if (numericValues[i] < numericValues[i - 1]) dec++;
  }
  if (inc === numericValues.length - 1)
    insights.push("📈 Sales increased steadily over the period.");
  else if (dec === numericValues.length - 1)
    insights.push("📉 Sales decreased steadily over the period.");
  else if (inc > dec)
    insights.push(
      "📈 Overall, sales showed an upward trend with some fluctuations."
    );
  else if (dec > inc)
    insights.push(
      "📉 Overall, sales showed a downward trend with some fluctuations."
    );
  else
    insights.push(
      "⚖️ Sales fluctuated throughout the period without a clear trend."
    );

  // outlier detection (IQR)
  if (numericValues.length >= 4) {
    const sorted = [...numericValues].sort((a, b) => a - b);
    const q1 = sorted[Math.floor((sorted.length - 1) / 4)];
    const q3 = sorted[Math.ceil(((sorted.length - 1) * 3) / 4)];
    const iqr = q3 - q1;
    const lo = q1 - 1.5 * iqr;
    const hi = q3 + 1.5 * iqr;
    const outIdx = numericValues
      .map((v, i) => (v < lo || v > hi ? i : -1))
      .filter((i) => i !== -1);
    if (outIdx.length) {
      insights.push(
        `⚠️ Outliers detected at ${outIdx
          .map((i) => `<strong>${formatDateLabel(labels[i])}</strong>`)
          .join(", ")}.`
      );
    }
  }

  return insights;
}

function getColor(index, border = false) {
  const colors = [
    "rgba(75, 192, 192, 0.6)",
    "rgba(255, 99, 132, 0.6)",
    "rgba(255, 206, 86, 0.6)",
    "rgba(153, 102, 255, 0.6)",
  ];
  const borders = [
    "rgba(75, 192, 192, 1)",
    "rgba(255, 99, 132, 1)",
    "rgba(255, 206, 86, 1)",
    "rgba(153, 102, 255, 1)",
  ];
  return border
    ? borders[index % borders.length]
    : colors[index % colors.length];
}

// Get modal element and the help button
var modal = document.getElementById("help-modal");
var helpBtn = document.getElementById("help-btn");
var closeBtn = document.getElementsByClassName("close-btn")[0];

// When the user clicks the help button, show the modal
helpBtn.onclick = function () {
  modal.style.display = "block";
};

// When the user clicks the close button, close the modal
closeBtn.onclick = function () {
  modal.style.display = "none";
};

// When the user clicks outside the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

window.addEventListener("resize", () => {
  if (lastUsedConfigs.length && lastUsedData.length) {
    renderSlideChart(currentSlideIndex);
  }
});
