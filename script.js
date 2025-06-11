let currentChart = null; // Store the current chart instance
let parsedData = null; // Store parsed data
let globalNumericColumns = [];
let globalCategoricalColumns = [];
let globalChartType = "";

// Function to trigger the brief disappear-reappear effect
function triggerErrorEffect(errorElement, message) {
  errorElement.style.opacity = "0"; // Hide briefly
  setTimeout(() => {
    errorElement.textContent = message;
    errorElement.style.opacity = "1"; // Show again
  }, 100); // Short delay for effect
}

// Function to trigger the brief disappear-reappear effect
function showErrorMessage(errorElement, message, otherErrorElement) {
  otherErrorElement.textContent = "";
  errorElement.style.opacity = "0"; // Hide briefly
  setTimeout(() => {
    errorElement.textContent = message;
    errorElement.style.opacity = "1"; // Show again
  }, 100); // Short delay for effect
}

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
}

// Add an event listener for the file input change
document
  .getElementById("file-input")
  .addEventListener("change", function (event) {
    const file = event.target.files[0]; // Get the first selected file
    const fileInfo = document.getElementById("file-info"); // The div where it will show file info

    if (file) {
      const fileName = file.name;
      const fileType = file.type;

      fileInfo.querySelector(
        ".file-name"
      ).textContent = `File selected: ${fileName}`;
      fileInfo.querySelector(
        ".file-type"
      ).textContent = `File type: ${fileType}`;
    } else {
      fileInfo.querySelector(".file-name").textContent = "No file selected";
      fileInfo.querySelector(".file-type").textContent = "";
    }
  });

document
  .getElementById("copy-email-btn")
  .addEventListener("click", function () {
    const email = "rishabhdhall02@gmail.com";
    navigator.clipboard
      .writeText(email)
      .then(() => {
        const msg = document.getElementById("copy-email-msg");

        // Reset the animation by hiding the message briefly
        msg.style.display = "none";

        setTimeout(() => {
          msg.style.display = "inline"; // Show it again after a brief delay

          // Hide the message after 5 seconds
          setTimeout(() => {
            msg.style.display = "none";
          }, 5000);
        }, 100); // 100ms blink effect
      })
      .catch((err) => {
        console.error("Failed to copy email: ", err);
      });
  });

// Function to calculate mean
function calculateMean(data) {
  const sum = data.reduce((acc, value) => acc + value, 0);
  return sum / data.length;
}

// Function to calculate median
function calculateMedian(data) {
  data.sort((a, b) => a - b);
  const mid = Math.floor(data.length / 2);
  return data.length % 2 !== 0 ? data[mid] : (data[mid - 1] + data[mid]) / 2;
}

// Function to calculate mode
function calculateMode(data) {
  const frequency = {};
  let maxFreq = 0;
  let modes = [];
  data.forEach((value) => {
    frequency[value] = (frequency[value] || 0) + 1;
    if (frequency[value] > maxFreq) {
      maxFreq = frequency[value];
    }
  });

  for (let value in frequency) {
    if (frequency[value] === maxFreq) {
      modes.push(value);
    }
  }

  return modes;
}

// Function to calculate outliers using IQR
function calculateOutliers(data) {
  data.sort((a, b) => a - b);
  const Q1 = calculateMedian(data.slice(0, Math.floor(data.length / 2)));
  const Q3 = calculateMedian(data.slice(Math.ceil(data.length / 2)));
  const IQR = Q3 - Q1;
  const lowerLimit = Q1 - 1.5 * IQR;
  const upperLimit = Q3 + 1.5 * IQR;
  const outliers = data.filter(
    (value) => value < lowerLimit || value > upperLimit
  );
  return outliers;
}

function parseCSV(content) {
  console.log("Parsing CSV content...");
  Papa.parse(content, {
    header: true,
    complete: function (results) {
      console.log("CSV parsed successfully: ", results);

      if (results.data.length === 0) {
        alert("The CSV file is empty or does not contain valid data.");
        return;
      }

      parsedData = results.data; // Save parsed data globally
      displaySummary(parsedData); // Display the dataset summary
      displaySummaryStats(parsedData); // Display the calculated stats
      displayPreview(parsedData); // Display dataset preview
      generateChart(parsedData); // Generate chart immediately after file upload
      generateDatasetDescription(parsedData); // Generate dataset's description
    },
    error: function (error) {
      console.error("Error parsing CSV: ", error); // Log errors if any
    },
  });
}

function displaySummary(data) {
  const summaryDiv = document.getElementById("summary");
  const numRows = data.length;
  const numColumns = data[0] ? Object.keys(data[0]).length : 0; // Count keys to get number of columns
  summaryDiv.innerHTML = `<p>Rows: ${numRows}, Columns: ${numColumns}</p>`;
}

const statisticCheckboxes = document.querySelectorAll(
  'input[name="statistic"]'
);
statisticCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", function () {
    if (parsedData) {
      displaySummaryStats(parsedData); // Regenerate the stats based on selected checkboxes
    }
  });
});

function displaySummaryStats(data) {
  const numericColumns = getNumericColumns(data);

  // Get all selected statistics
  const selectedStatistics = Array.from(
    document.querySelectorAll('input[name="statistic"]:checked')
  ).map((checkbox) => checkbox.value);

  // Get the summary-stats div
  const statsDiv = document.getElementById("summary-stats");

  // If there are no numeric columns, hide the div and return early
  if (numericColumns.length === 0) {
    statsDiv.classList.remove("visible");
    return;
  }

  // Otherwise, show the div by adding the 'visible' class
  statsDiv.classList.add("visible");

  // Clear previous stats before displaying new ones
  statsDiv.innerHTML = "";

  numericColumns.forEach((col) => {
    const columnData = data
      .map((row) => parseFloat(row[col]))
      .filter((value) => !isNaN(value));

    let columnStats = "";

    // For each selected statistic, calculate and display it
    selectedStatistics.forEach((statistic) => {
      let statisticValue = "";

      switch (statistic) {
        case "mean":
          statisticValue = `Mean: ${calculateMean(columnData)}`;
          break;
        case "median":
          statisticValue = `Median: ${calculateMedian(columnData)}`;
          break;
        case "mode":
          statisticValue = `Mode: ${calculateMode(columnData).join(", ")}`;
          break;
        case "outlier":
          statisticValue = `Outliers: ${calculateOutliers(columnData).join(
            ", "
          )}`;
          break;
        default:
          statisticValue = "No valid statistic selected.";
      }

      columnStats += `<p>${statisticValue}</p>`;
    });

    // Display all the stats for the column
    statsDiv.innerHTML += `
      <h3>Column: ${col}</h3>
      ${columnStats}
      <hr>
    `;
  });
}

function generateDatasetDescription(parsedData) {
  if (!parsedData || parsedData.length === 0) {
    document.getElementById("dataset-description").textContent =
      "No data available.";
    return;
  }

  const numRows = parsedData.length;
  const numCols = Object.keys(parsedData[0]).length;
  let categoricalColumns = globalCategoricalColumns;
  let numericalColumns = globalNumericColumns;

  // Get the dataset-description div
  const dataDiv = document.getElementById("dataset-description");

  // If there are no numeric columns, hide the div and return early
  if (numericalColumns.length === 0) {
    dataDiv.classList.remove("visible");
    return;
  }

  // Otherwise, show the div by adding the 'visible' class
  dataDiv.classList.add("visible");

  let description = `This dataset contains <strong>${numRows} rows</strong> and <strong>${numCols} columns</strong>. `;

  // Categorical column details
  if (categoricalColumns.length > 0) {
    description += `The categorical columns are <strong>${categoricalColumns.join(
      ", "
    )}</strong>. `;
  }

  // Numerical column details
  if (numericalColumns.length > 0) {
    description += `The numerical columns are <strong>${numericalColumns.join(
      ", "
    )}</strong>. `;

    let trendDescriptions = [];
    let columnTrends = {};
    let comparisonTrends = [];

    // Group columns by trends (increasing, decreasing, fluctuating)
    let trendGroups = {
      increasing: [],
      decreasing: [],
      fluctuating: [],
    };

    numericalColumns.forEach((col) => {
      let values = parsedData
        .map((row) => parseFloat(row[col]))
        .filter((val) => !isNaN(val));

      let min = Math.min(...values);
      let max = Math.max(...values);
      let avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);

      // Determine the trend in values
      let increasing = values.every((v, i, arr) => i === 0 || v >= arr[i - 1]);
      let decreasing = values.every((v, i, arr) => i === 0 || v <= arr[i - 1]);

      let trend = "fluctuating";
      if (increasing) trend = "increasing";
      if (decreasing) trend = "decreasing";

      columnTrends[col] = trend;

      // Detect outliers (biggest jump)
      let maxJump = 0;
      let jumpIndex = -1;
      for (let i = 1; i < values.length; i++) {
        let diff = Math.abs(values[i] - values[i - 1]);
        if (diff > maxJump) {
          maxJump = diff;
          jumpIndex = i;
        }
      }

      let outlierMsg =
        maxJump > (max - min) * 0.4 // If jump is 40%+ of range, count as outlier
          ? `A significant jump occurs between row <strong>${
              jumpIndex + 1
            }</strong> and <strong>${jumpIndex + 2}</strong>.`
          : "";

      // Add the column to the appropriate trend group
      trendGroups[trend].push(col);

      // Fix article for grammar (a or an)
      let article = ["a", "e", "i", "o", "u"].includes(trend[0].toLowerCase())
        ? "an"
        : "a";

      trendDescriptions.push(
        `For <strong>${col}</strong>, the values show ${article} <strong>${trend} trend</strong>. The minimum is <strong>${min}</strong>, maximum is <strong>${max}</strong>, and the average is <strong>${avg}</strong>. ${outlierMsg}`
      );
    });

    // Group similar trends together in one sentence
    Object.keys(trendGroups).forEach((trend) => {
      if (trendGroups[trend].length > 0) {
        let trendColumns = trendGroups[trend].join(", ");
        // Fix article for grammar (a or an)
        let article = ["a", "e", "i", "o", "u"].includes(trend[0].toLowerCase())
          ? "an"
          : "a";
        trendDescriptions.push(
          `The following columns show ${article} <strong>${trend}</strong> trend: <strong>${trendColumns}</strong>.`
        );
      }
    });

    // Append to description
    description += trendDescriptions.join(" ") + " ";
    if (comparisonTrends.length > 0) {
      description += comparisonTrends.join(" ");
    }
  }

  document.getElementById("dataset-description").innerHTML = description;
}

function getNumericColumns(data) {
  // Get column names and filter for numeric columns
  const columnNames = Object.keys(data[0]);
  return columnNames.filter((col) => {
    return data.some((row) => !isNaN(parseFloat(row[col])));
  });
}

function displayPreview(data) {
  const table = document.getElementById("preview-table");
  table.innerHTML = ""; // Clear previous table content

  // Create table header
  const headerRow = document.createElement("tr");
  Object.keys(data[0]).forEach((key) => {
    const th = document.createElement("th");
    th.innerText = key;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Limit the preview to the first 10 rows
  const maxRows = 10;
  data.slice(0, maxRows).forEach((row) => {
    const tr = document.createElement("tr");
    Object.values(row).forEach((value) => {
      const td = document.createElement("td");
      td.innerText = value;
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
}

// Function to convert data to CSV format
function convertToCSV(data) {
  const header = ["Label", "Value"]; // Define headers for CSV
  const rows = data.labels.map((label, index) => {
    return [label, data.datasets[0].data[index]]; // Map labels and corresponding values
  });

  // Combine headers and rows into one array
  const csvRows = [header, ...rows];

  // Convert the array into a CSV string
  const csvString = csvRows.map((row) => row.join(",")).join("\n");

  return csvString;
}

// Function to export the chart data as CSV
function exportChartAsCSV() {
  if (!currentChart) {
    alert("No chart to export.");
    return;
  }

  // Get the labels and data from the current chart
  const labels = currentChart.data.labels;
  const datasets = currentChart.data.datasets;

  // Create a CSV string
  let csvContent =
    "Label," + datasets.map((dataset) => dataset.label).join(",") + "\n"; // CSV header

  // Iterate through the data and format it into CSV rows
  const rows = labels.map((label, index) => {
    const rowData = [label];
    datasets.forEach((dataset) => {
      rowData.push(dataset.data[index]);
    });
    return rowData.join(",");
  });

  // Add the rows to the CSV string
  csvContent += rows.join("\n");

  // Create a Blob from the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a temporary link element to trigger the download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = "chart-data.csv"; // Set the file name for the downloaded CSV

  // Trigger the download by simulating a click event
  link.click();

  // Clean up the URL object after the download
  URL.revokeObjectURL(url);
}

// Event listener for the export CSV button
document
  .getElementById("export-csv-btn")
  .addEventListener("click", exportChartAsCSV);

// Function to export the chart as an image (JPEG)
function exportChartAsImage() {
  if (!currentChart) {
    alert("No chart to export.");
    return;
  }

  // Create a new canvas element
  const exportCanvas = document.createElement("canvas");
  const exportCtx = exportCanvas.getContext("2d");

  // Set the dimensions of the new canvas to match the chart's canvas
  exportCanvas.width = currentChart.canvas.width;
  exportCanvas.height = currentChart.canvas.height;

  // Set the background color to white
  exportCtx.fillStyle = "white";
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // Now render the current chart to the new canvas
  exportCtx.drawImage(currentChart.canvas, 0, 0);

  // Convert the canvas to an image (JPEG format)
  const imageUrl = exportCanvas.toDataURL("image/jpeg", 1.0);

  // Create a temporary link element to trigger the download
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = "chart-image.jpeg"; // Set the file name for the downloaded image

  // Trigger the download by simulating a click event
  link.click();
}

// Event listener for the export image button
document
  .getElementById("export-image-btn")
  .addEventListener("click", exportChartAsImage);

let isManualOverride = false; // Flag to track if the user has manually overridden the chart type

// Function to detect chart type automatically based on data
function autoDetectChartType(data) {
  if (!data || data.length === 0) return "bar"; // Default if no data

  const columnNames = Object.keys(data[0]); // Extract column names

  // Detect numeric columns
  const numericColumns = columnNames.filter((col) =>
    data.some((row) => row[col] && !isNaN(parseFloat(row[col])))
  );

  // Detect categorical columns
  const categoricalColumns = columnNames.filter((col) =>
    data.some((row) => row[col] && isNaN(parseFloat(row[col])))
  );

  // Scatter Plot: Exactly 2 numeric columns
  if (numericColumns.length === 2 && categoricalColumns.length === 0) {
    return "scatter";
  }

  // Bar Chart: 1 categorical + 3 or more numeric columns (no clear trend)
  if (numericColumns.length >= 3 && categoricalColumns.length === 1) {
    return "bar";
  }

  // Line Chart: Multiple numeric columns + 1 categorical column (like a timeline)
  if (numericColumns.length > 1 && categoricalColumns.length === 1) {
    return "line";
  }

  // Pie Chart: 1 numeric column + at least 1 categorical column
  if (numericColumns.length === 1 && categoricalColumns.length > 0) {
    return "pie";
  }

  return "bar"; // Default fallback if conditions don't match
}

let chartTitle = "My Chart"; // Default title

// Add event listener to the "Enter" button
document.getElementById("set-title-btn").addEventListener("click", function () {
  const userInput = document.getElementById("chartTitle").value.trim();
  const errorText = document.getElementById("chart-title-error");
  if (userInput) {
    chartTitle = userInput; // Store the entered title
    if (currentChart) {
      currentChart.destroy();
      generateChart(parsedData);
    }
    errorText.textContent = ""; // Clear error if valid
  } else {
    triggerErrorEffect(errorText, "Invalid input, try again.");
    return;
  }
});

let xAxisTitle = null; // Default X-Axis title
let yAxisTitle = null; // Default Y-Axis title

// Add event listener to the "Enter" button for X-Axis
document.getElementById("set-x-title").addEventListener("click", function () {
  const userInputX = document.getElementById("x-axis-title").value.trim();
  const errorText = document.getElementById("x-title-error");
  if (userInputX) {
    xAxisTitle = userInputX; // Store the entered X-Axis title
    if (currentChart) {
      currentChart.destroy();
      generateChart(parsedData); // Re-generate chart with updated axis titles
    }
    errorText.textContent = ""; // Clear error if valid
  } else {
    triggerErrorEffect(errorText, "Invalid input, try again.");
    return;
  }
});

// Add event listener to the "Enter" button for Y-Axis
document.getElementById("set-y-title").addEventListener("click", function () {
  const userInputY = document.getElementById("y-axis-title").value.trim();
  const errorText = document.getElementById("y-title-error");
  if (userInputY) {
    yAxisTitle = userInputY; // Store the entered Y-Axis title
    if (currentChart) {
      currentChart.destroy();
      generateChart(parsedData); // Re-generate chart with updated axis titles
    }
    errorText.textContent = ""; // Clear error if valid
  } else {
    triggerErrorEffect(errorText, "Invalid input, try again.");
    return;
  }
});

// Reset buttons
document
  .getElementById("reset-title-btn")
  .addEventListener("click", function () {
    document.getElementById("chartTitle").value = "";
    chartTitle = "My Chart";
    if (currentChart) {
      currentChart.destroy();
      generateChart(parsedData); // Re-generate chart with updated axis titles
    }
  });

document.getElementById("reset-x-title").addEventListener("click", function () {
  document.getElementById("x-axis-title").value = "";
  let xAxisTitleTemp = null;
  // Determine the default X-Axis title from generateChart() logic
  globalChartType = document.getElementById("chart-type").value;
  xAxisTitleTemp =
    globalChartType === "scatter"
      ? globalNumericColumns[0]
      : globalCategoricalColumns[0] || `${globalNumericColumns[0]}`;

  xAxisTitle = xAxisTitleTemp; // Update x-axis title
  if (currentChart) {
    currentChart.destroy();
    generateChart(parsedData); // Re-generate chart
  }
});

document.getElementById("reset-y-title").addEventListener("click", function () {
  document.getElementById("y-axis-title").value = "";
  let yAxisTitleTemp = null;
  // Determine the default Y-Axis title from generateChart() logic
  globalChartType = document.getElementById("chart-type").value;
  yAxisTitleTemp =
    globalChartType === "scatter"
      ? globalNumericColumns[1]
      : globalNumericColumns.length === 2 &&
        globalCategoricalColumns.length === 0
      ? globalNumericColumns[1]
      : "Values";

  yAxisTitle = yAxisTitleTemp; // Update y-axis title
  if (currentChart) {
    currentChart.destroy();
    generateChart(parsedData); // Re-generate chart
  }
});

function generateChart(data) {
  const chartType = isManualOverride
    ? document.getElementById("chart-type").value
    : autoDetectChartType(data);

  isManualOverride = false;

  if (!data || data.length === 0) {
    alert("No valid data available for visualization.");
    return;
  }

  // Update the dropdown with the detected chart type
  updateChartTypeDropdown(chartType);

  const columnNames = Object.keys(data[0]);

  // Detect numeric and categorical columns
  const numericColumns = columnNames.filter((col) =>
    data.some((row) => row[col] && !isNaN(parseFloat(row[col])))
  );
  const categoricalColumns = columnNames.filter((col) =>
    data.some((row) => row[col] && isNaN(parseFloat(row[col])))
  );

  // Store globally for reset functionality
  globalNumericColumns = numericColumns;
  globalCategoricalColumns = categoricalColumns;

  console.log("Numeric Columns: ", numericColumns);
  console.log("Categorical Columns: ", categoricalColumns);

  let labels = [];
  let filteredData = [];

  // Handle pie chart
  if (chartType === "pie") {
    if (categoricalColumns.length !== 1 || numericColumns.length !== 1) {
      alert("Pie charts require exactly 1 categorical and 1 numerical column.");
      return;
    }
  }
  // Handle scatter plot
  else if (chartType === "scatter") {
    if (numericColumns.length !== 2 || categoricalColumns.length > 0) {
      alert(
        "Scatter plots require exactly two numeric columns and no categorical columns."
      );
      return;
    }
  }
  // Handle bar and line charts
  else if (chartType === "bar" || chartType === "line") {
    if (numericColumns.length === 0) {
      alert(
        "Bar/line charts require at least 1 numerical and 1 categorical column."
      );
      return;
    }
  }

  // Process data rows for filtered data
  for (let row of data) {
    const categoryValue = row[categoricalColumns[0]]?.trim();
    const isValidCategory = categoryValue && categoryValue !== "";

    // Ensure all values in numeric columns are valid numbers
    const isValidNumeric = numericColumns.every((col) => {
      const value = row[col];
      // Ensure value exists, is not undefined or null, and is a valid number
      return value !== undefined && value !== null && !isNaN(parseFloat(value));
    });

    // Special handling for scatter plot (requires exactly 2 numeric columns)
    if (chartType === "scatter" && numericColumns.length === 2) {
      // If both numeric columns are valid, add to the data
      const isValidScatter = numericColumns.every((col) => {
        const value = row[col];
        return (
          value !== undefined && value !== null && !isNaN(parseFloat(value))
        );
      });

      // If valid, process the row for the scatter plot
      if (isValidScatter) {
        filteredData.push(row); // Add to filtered data for scatter
      }
    }

    // Handling for Pie/Bar/Line charts (categorical + numeric validation)
    else if (
      (chartType === "pie" && isValidCategory) || // For Pie chart, valid category title
      (chartType !== "pie" && isValidNumeric) // For other charts, valid numeric data
    ) {
      // Process for Pie/Bar/Line charts
      const processedRow = {};

      Object.keys(row).forEach((key) => {
        if (key === categoricalColumns[0] && !isValidCategory) {
          processedRow[key] = "N/A"; // Replace empty category with 'N/A'
        } else {
          processedRow[key] =
            row[key] === undefined || row[key] === null ? "N/A" : row[key];
        }
      });

      // Add to filtered data for Pie/Bar/Line charts
      labels.push(processedRow[categoricalColumns[0]] || "N/A");
      filteredData.push(processedRow);
    }
  }

  const datasets = [];

  // Pie chart setup
  if (chartType === "pie") {
    datasets.push({
      label: categoricalColumns[0],
      data: filteredData.map((row) => parseFloat(row[numericColumns[0]]) || 0),
      backgroundColor: filteredData.map(() => getRandomColor()),
    });
  }
  // Scatter plot setup
  else if (chartType === "scatter") {
    datasets.push({
      label: `Numeric Variable Comparison`,
      data: filteredData.map((row) => ({
        x: parseFloat(row[numericColumns[0]]),
        y: parseFloat(row[numericColumns[1]]),
      })),
      backgroundColor: getRandomColor(),
      borderWidth: 1,
      fill: false,
    });

    labels = filteredData.map((row) => row[numericColumns[0]]);
  }
  // Bar/Line chart setup
  else if (chartType === "bar" || chartType === "line") {
    if (numericColumns.length === 2 && categoricalColumns.length === 0) {
      // Handle case for 2 numeric columns only
      datasets.push({
        label: `Numeric Variable Comparison`,
        data: filteredData.map((row) => ({
          x: parseFloat(row[numericColumns[0]]),
          y: parseFloat(row[numericColumns[1]]),
        })),
        backgroundColor: chartType === "bar" ? getRandomColor() : "transparent",
        borderColor: chartType === "line" ? getRandomColor() : "transparent",
        borderWidth: chartType === "line" ? 2 : 1,
        fill: false,
        tension: chartType === "line" ? 0.1 : 0,
      });

      labels = filteredData.map((row) => row[numericColumns[0]]);
    } else {
      // Handle multiple numeric columns for bar/line charts
      numericColumns.forEach((numCol) => {
        datasets.push({
          label: numCol,
          data: filteredData.map((row) => parseFloat(row[numCol]) || 0),
          backgroundColor:
            chartType === "bar" ? getRandomColor() : "transparent",
          borderColor: chartType === "line" ? getRandomColor() : "transparent",
          borderWidth: chartType === "line" ? 2 : 1,
          fill: false,
          tension: chartType === "line" ? 0.1 : 0,
        });
      });

      labels = filteredData.map((row) => row[categoricalColumns[0]]);
    }
  }

  if (currentChart) {
    currentChart.destroy();
  }

  try {
    const chartContext = document
      .getElementById("chart-container")
      .getContext("2d");

    currentChart = new Chart(chartContext, {
      type: chartType,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales:
          chartType !== "pie"
            ? {
                x: {
                  ticks: {
                    color: "black",
                    font: {
                      size: 12,
                      family: "Barlow Regular",
                    },
                  },
                  display: true,
                  title: {
                    display: true,
                    text:
                      xAxisTitle ||
                      (chartType === "scatter"
                        ? numericColumns[0]
                        : categoricalColumns[0] || `${numericColumns[0]}`),
                    font: {
                      size: 12,
                      family: "Alata",
                    },
                  },
                },
                y: {
                  ticks: {
                    color: "black",
                    font: {
                      size: 12,
                      family: "Barlow Regular",
                    },
                  },
                  title: {
                    display: true,
                    text:
                      yAxisTitle ||
                      (chartType === "scatter"
                        ? numericColumns[1]
                        : numericColumns.length === 2 &&
                          categoricalColumns.length === 0
                        ? numericColumns[1]
                        : "Values"),
                    font: {
                      size: 12,
                      family: "Alata",
                    },
                  },
                },
              }
            : {},
        plugins: {
          title: {
            display: true, // Enable the title
            text: chartTitle, // Use the stored chart title
            font: {
              size: 20,
              weight: "bold",
              family: "Alata",
            },
          },
          legend: {
            position: "top",
            labels: {
              color: "black",
              font: {
                size: 12,
                family: "Barlow Regular",
              },
            },
          },
          tooltip: {
            bodyFont: { size: 12, family: "Barlow" }, // Tooltip text font
            titleFont: { size: 14, family: "Barlow", weight: "bold" }, // Tooltip title font
            callbacks: {
              label: function (tooltipItem) {
                return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to create chart:", error);
  }
}

function updateChartTypeDropdown(chartType) {
  const dropdown = document.getElementById("chart-type");
  // Set the dropdown value to the detected chart type
  dropdown.value = chartType;
}

// Listen for changes to the chart type and regenerate the chart accordingly
document.getElementById("chart-type").addEventListener("change", function () {
  isManualOverride = true;
  if (parsedData) {
    generateChart(parsedData); // Generate a new chart with the selected type
  }
});

// Function to generate a random color
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
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
