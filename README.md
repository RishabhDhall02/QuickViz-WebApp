# QuickViz - WebApp (Ongoing)

A dynamic web application that automatically generates the most suitable data visualization chart from your uploaded datasets (CSV, JSON, XLSX). It provides insightful summaries including mean, median, mode, and outlier detection to help users quickly understand their data. You can customize your chart's title and axis titles, switch between chart types, and export your data and charts with ease.

---

## Features

- Auto-detects the best chart type based on your dataset's columns
- Supports CSV, JSON and XLSX file formats
- Displays summary statistics: Mean, Median, Mode, Outliers
- Allows customization of chart title and axis labels
- Switch between line, bar, pie, and scatter charts
- Export dataset as CSV and charts as JPEG images
- User-friendly interface with planned features for drag-and-drop uploads and annotations

---

## How to Use

1. Upload your dataset (CSV, JSON or XLSX)
2. The website automatically generates the most suitable chart
3. View dataset description and summary statistics
4. Customize chart title and axis labels if desired
5. Switch chart types to explore your data differently
6. Export your dataset or chart for sharing or reporting

---

## Supported Chart Restrictions

- **Bar Chart:** 1 categorical column + 1 or more numeric columns. Best for comparisons.
- **Line Chart:** 1 categorical column + 1 or more numeric columns. Best for trends.
- **Scatter Plot:** 2 numeric columns. Best for relationships/distribution.
- **Pie Chart:** 1 categorical column + 1 numeric column. Limited to first 10 categories to avoid cluster.

---

## Future Plans

- Drag-and-drop file upload
- Annotation tools for charts
- Selective data display
- UI improvements for enhanced usability
- Predictive analytics for forecasting trends

---

## Technologies Used

- HTML, CSS, JavaScript for frontend
- Libraries: Chart.js, PapaParse (for CSV parsing), XLSX.js (for Excel)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

For questions or feedback, please contact [Rishabh Dhall](mailto:rishabhdhall02@gmail.com).

