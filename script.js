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
  const sections = ["part-1", "part-2", "part-3"];
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

document.getElementById("to-part-3").addEventListener("click", () => {
  showSection("part-3");
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

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  let index = 0;

  function processNextChart() {
    if (index >= lastUsedConfigs.length) {
      pdf.save("charts.pdf");
      return;
    }

    renderSlideChart(index);

    // Wait for chart render and capture
    captureChartImage((imgData) => {
      if (!imgData) {
        console.warn("Skipping chart due to capture error.");
        index++;
        processNextChart();
        return;
      }

      if (index > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, 10, 180, 100);

      const insights = generateInsights(lastUsedConfigs[index], lastUsedData);
      pdf.setFontSize(12);
      pdf.text("Insights:", 10, 120);
      insights.forEach((line, i) => {
        pdf.text(`- ${line}`, 10, 130 + i * 8);
      });

      index++;
      processNextChart();
    });
  }

  processNextChart();
}

function exportPPT() {
  const pptx = new PptxGenJS();
  let index = 0;

  function processNextChart() {
    if (index >= lastUsedConfigs.length) {
      pptx.writeFile("charts.pptx");
      return;
    }

    renderSlideChart(index);

    captureChartImage((imgData) => {
      if (!imgData) {
        console.warn("Skipping chart due to capture error.");
        index++;
        processNextChart();
        return;
      }

      const slide = pptx.addSlide();
      slide.addImage({ data: imgData, x: 0.5, y: 0.5, w: 8, h: 4.5 });

      const insights = generateInsights(lastUsedConfigs[index], lastUsedData);
      slide.addText("Insights:", { x: 0.5, y: 5.2, fontSize: 14, bold: true });
      slide.addText(insights.map((i) => `• ${i}`).join("\n"), {
        x: 0.5,
        y: 5.5,
        fontSize: 12,
        color: "363636",
      });

      index++;
      processNextChart();
    });
  }

  processNextChart();
}

// Export to PDF
document.getElementById("export-pdf").addEventListener("click", exportPDF);

// Export to PPT
document.getElementById("export-ppt").addEventListener("click", exportPPT);

// Helper: Checks if dataset is sales-related
function isSalesDataset(headers) {
  const salesKeywords = [
    "sales",
    "revenue",
    "profit",
    "quantity",
    "amount",
    "units",
  ];
  return headers.some((header) =>
    salesKeywords.some((keyword) => header.toLowerCase().includes(keyword))
  );
}

// Parses the CSV
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

      const headers = Object.keys(results.data[0]);
      if (!isSalesDataset(headers)) {
        alert(
          "This file does not appear to contain sales-related data. Please upload a sales dataset."
        );
        return;
      }

      parsedData = results.data; // Save parsed data globally

      const profile = profileData(parsedData);
      console.log("Data profile:", profile);

      const chartConfigs = selectCharts(profile, parsedData);
      console.log(
        "Likely sales column:",
        findLikelySalesColumn(Object.keys(profile))
      );

      lastUsedConfigs = chartConfigs;
      lastUsedData = parsedData;
      currentSlideIndex = 0;

      if (!document.getElementById("slide-canvas")) {
        console.error("slide-canvas element not found in DOM");
      }
      if (!document.getElementById("slide-title")) {
        console.error("slide-title element not found in DOM");
      }

      renderSlideChart(currentSlideIndex);
    },
    error: function (error) {
      console.error("Error parsing CSV: ", error);
    },
  });
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

function renderChartsWrapper(configs, data) {
  lastUsedConfigs = configs;
  lastUsedData = data;
  console.log("Rendering charts wrapper with configs:", configs);
  renderCharts(configs, data);
}

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

function selectCharts(profile, data = lastUsedData) {
  const chartsToRender = [];
  const columnNames = Object.keys(profile);

  const numericCols = columnNames.filter(
    (col) => profile[col].type === "numeric"
  );
  let categoricalCols = columnNames.filter((col) =>
    ["categorical", "text"].includes(profile[col].type)
  );
  categoricalCols = categoricalCols.filter((c) => !isIdentifierColumn(c));

  const likelySalesCol = findLikelySalesColumn(numericCols);
  console.log("Likely sales column:", likelySalesCol);

  const categoryCol = findLikelyCategoryColumn(categoricalCols);

  const dateCols = columnNames.filter((col) => profile[col].type === "date");
  console.log("Profile inside selectCharts:", profile);

  // 1. Line chart: sales over time (month+year grouping)
  if (
    dateCols.length &&
    numericCols.length &&
    likelySalesCol &&
    profile[dateCols[0]].sampleValues.every((v) => parseDateLabel(v) !== null)
  ) {
    const dateCol = dateCols[0];
    const salesCol = likelySalesCol;
    const monthYearMap = {}; // key = "YYYY-MM" -> { label: "Jan 2024", total: N }

    (data || []).forEach((row) => {
      const raw = row[dateCol];
      const dateObj = parseDateLabel(raw);
      if (!dateObj) return;

      const key = `${dateObj.getFullYear()}-${String(
        dateObj.getMonth() + 1
      ).padStart(2, "0")}`;
      const label = `${dateObj.toLocaleString("default", {
        month: "short",
      })} ${dateObj.getFullYear()}`;
      const salesVal = parseFloat(row[salesCol]) || 0;

      if (!monthYearMap[key]) monthYearMap[key] = { label, total: 0 };
      monthYearMap[key].total += salesVal;
    });

    // Sort keys chronologically
    const sortedKeys = Object.keys(monthYearMap).sort();
    const groupedDates = sortedKeys.map((k) => monthYearMap[k].label);
    const groupedValues = sortedKeys.map((k) => monthYearMap[k].total);

    if (groupedDates.length > 0) {
      chartsToRender.push({
        type: "line",
        x: groupedDates,
        y: groupedValues,
        title: "Sales Over Time (Monthly)",
        preaggregated: true,
      });
    }
  }

  // 2. Bar chart: sales by category
  if (categoryCol && numericCols.length) {
    chartsToRender.push({
      type: "bar",
      x: categoryCol,
      y: likelySalesCol,
      title: `Sales by ${categoryCol}`,
    });
  }

  // 3. Horizontal Bar chart
  for (const col of categoricalCols) {
    const uniqueVals = profile[col].uniqueCount || 0;
    const maxLabelLength = Math.max(
      ...profile[col].sampleValues.map((val) => (val || "").length)
    );
    if ((uniqueVals >= 6 && uniqueVals <= 15) || maxLabelLength > 12) {
      chartsToRender.push({
        type: "bar",
        x: likelySalesCol,
        y: col,
        title: `Sales by ${col} (Horizontal)`,
        horizontal: true,
      });
      break;
    }
  }

  // 4. Pie chart
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

function aggregateDataByCategory(data, categoryCol, valueCol) {
  const aggregation = {};

  data.forEach((row) => {
    const category = row[categoryCol];
    const value = parseFloat(row[valueCol]) || 0;

    if (!aggregation[category]) {
      aggregation[category] = 0;
    }
    aggregation[category] += value;
  });

  // Convert to arrays for Chart.js
  return {
    labels: Object.keys(aggregation),
    values: Object.values(aggregation),
  };
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

function renderSlideChart(index, onCompleteCallback) {
  console.log("Rendering slide", index, lastUsedConfigs[index]);
  const config = lastUsedConfigs[index];
  const canvas = document.getElementById("slide-canvas");
  const ctx = canvas.getContext("2d");

  // Destroy previous chart
  if (currentChartInstance) {
    try {
      console.log(
        "Destroying chart of type:",
        currentChartInstance.config.type
      );
      currentChartInstance.destroy();
      console.log("Destroyed previous chart instance");
    } catch (e) {
      console.warn("Error destroying previous chart instance:", e);
    }
  }

  let labels, values;

  if (config.preaggregated) {
    labels = config.x;
    values = config.y;
  } else {
    labels = getChartLabels(config, lastUsedData);
    values = getChartValues(config, lastUsedData);
  }

  // Ensure numeric conversion for values
  const numericValues = values.map((v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const cleaned = v.replace(/,/g, "").trim();
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    }
    return Number(v) || 0;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: config.y || config.values || config.title,
        data: numericValues,
        backgroundColor:
          config.type === "pie" ? backgroundColors : getColor(index),
        borderColor:
          config.type === "pie" ? borderColors : getColor(index, true),
        borderWidth: 1,
        fill: false,
      },
    ],
  };

  console.log("Creating new chart of type:", config.type);

  currentChartInstance = new Chart(ctx, {
    type: config.horizontal ? "bar" : config.type,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 800,
        easing: "easeOutQuart",
        onComplete: () => {
          console.log("Chart animation completed");
          // call onCompleteCallback if provided (used for exporting)
          if (typeof onCompleteCallback === "function") {
            requestAnimationFrame(() => onCompleteCallback());
          }
        },
      },
      indexAxis: config.horizontal ? "y" : "x",
      scales:
        config.type === "bar" || config.type === "line"
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

  // Build insights and UI
  const insights = generateInsights(config, lastUsedData);
  document.getElementById("slide-insights").innerHTML = `
    <h3>Insights</h3>
    <ul>${insights.map((item) => `<li>${item}</li>`).join("")}</ul>
  `;

  // Set title & counter
  document.getElementById("slide-title").textContent =
    config.title || `Chart ${index + 1}`;
  document.getElementById("slide-counter").textContent = `${index + 1} / ${
    lastUsedConfigs.length
  }`;

  console.log("New chart rendered:", config.title || `Chart ${index + 1}`);
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

function formatDateLabel(label, options = {}) {
  const { defaultMMDD = true } = options;
  const d = parseDateLabel(label, { defaultMMDD });
  if (!d) return label;
  const day = d.getDate();
  const month = monthName(d.getMonth());
  return `${getOrdinal(day)} ${month}`;
}

function getLabelPreamble(label, options = {}) {
  const { defaultMMDD = true } = options;
  if (parseDateLabel(label, { defaultMMDD })) {
    return "on " + formatDateLabel(label, { defaultMMDD });
  }
  if (isLikelyPlaceLabel(label)) {
    return "in " + label;
  }
  // default = product/object/category
  return "for " + label;
}

function generateInsights(config, data) {
  const insights = [];
  let labels, values;

  if (config.preaggregated) {
    labels = config.x;
    values = config.y;
  } else {
    labels = getChartLabels(config, data);
    values = getChartValues(config, data);
  }

  if (!labels || !values || !labels.length || !values.length) return insights;

  // Helper for outlier detection using IQR method
  function findOutliers(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length / 4)];
    const q3 = sorted[Math.floor((sorted.length * 3) / 4)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    return arr
      .map((v, i) => (v < lowerBound || v > upperBound ? i : -1))
      .filter((i) => i !== -1);
  }

  if (config.type === "pie") {
    const total = values.reduce((sum, val) => sum + val, 0);
    const percentages = values.map((val) => (val / total) * 100);

    // Largest contributor
    const max = Math.max(...values);
    const maxIndex = values.indexOf(max);
    insights.push(
      `🏆 <strong>${
        labels[maxIndex]
      }</strong> is the largest contributor at <strong>${percentages[
        maxIndex
      ].toFixed(1)}%</strong>.`
    );

    // Balance / imbalance
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

    // Three smallest segments
    const segmentsWithPct = labels.map((label, i) => ({
      label,
      pct: percentages[i],
    }));
    segmentsWithPct.sort((a, b) => a.pct - b.pct);
    const smallestThree = segmentsWithPct.slice(0, 3);
    const smallestSum = smallestThree.reduce((acc, seg) => acc + seg.pct, 0);

    if (smallestSum < 15) {
      const segmentNames = smallestThree
        .map((seg) => `<strong>${seg.label}</strong>`)
        .join(", ");
      insights.push(
        `🔍 The three smallest segments (${segmentNames}) together contribute only <strong>${smallestSum.toFixed(
          1
        )}%</strong>.`
      );
    }

    // Minor segments (below 5%)
    const minorSegments = segmentsWithPct.filter((seg) => seg.pct < 5);
    if (minorSegments.length > 0) {
      const minorNames = minorSegments
        .map((seg) => `<strong>${seg.label}</strong>`)
        .join(", ");
      insights.push(
        `⚠️ There are <strong>${minorSegments.length}</strong> minor segments (${minorNames}) below 5% that might be grouped.`
      );
    }

    return insights;
  }

  // For bar and line charts
  if (Array.isArray(values)) {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    const maxIndex = values.indexOf(max);
    const minIndex = values.indexOf(min);

    // Existing peaks and lows
    insights.push(
      `📈 Sales peaked ${getLabelPreamble(
        labels[maxIndex]
      )}, reaching an all-time high of <strong>${max}</strong>.`
    );
    insights.push(
      `📉 Sales had a sharp decline ${getLabelPreamble(
        labels[minIndex]
      )}, dropping to <strong>${min}</strong>.`
    );
    insights.push(
      `📊 Sales averaged about <strong>${avg.toFixed(
        2
      )}</strong> over the period.`
    );

    // Trends & Changes
    let increasingCount = 0,
      decreasingCount = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) increasingCount++;
      else if (values[i] < values[i - 1]) decreasingCount++;
    }
    if (increasingCount === values.length - 1) {
      insights.push("📈 Sales increased steadily over the period.");
    } else if (decreasingCount === values.length - 1) {
      insights.push("📉 Sales decreased steadily over the period.");
    } else if (increasingCount > decreasingCount) {
      insights.push(
        "📈 Overall, sales showed an upward trend with some fluctuations."
      );
    } else if (decreasingCount > increasingCount) {
      insights.push(
        "📉 Overall, sales showed a downward trend with some fluctuations."
      );
    } else {
      insights.push(
        "⚖️ Sales fluctuated throughout the period without a clear trend."
      );
    }

    // Outliers detection
    const outlierIndexes = findOutliers(values);
    if (outlierIndexes.length) {
      const outlierLabels = outlierIndexes.map((i) => labels[i]);
      insights.push(`⚠️ Outliers detected at ${outlierLabels.join(", ")}.`);
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
