# QuickViz - WebApp (Ongoing)

QuickViz is a lightweight data visualization tool that enables users to drag and drop or upload CSV sales-related datasets and automatically generates interactive charts with insights.

---

## Features

- **Automated Chart Generation**  
  Creates multiple visualizations based on the data:
  - **Line chart**: Monthly aggregated "Sales Over Time"
  - **Bar chart**: Sales by top-level category (e.g., Product Category, Region)
  - **Pie chart**: Distribution of sales across top categories

- **Dynamic Data Profiling**
  - Auto-detects column types: date, numeric, categorical, or text
  - Filters out identifier-like columns (e.g., `Order ID`, names) to avoid clutter

- **Monthly Data Aggregation**
  - Automatically groups date-based data into month+year bins for smoother line charts

- **Insights Engine**
  - Generates key insights for each chart:
    - Peak and low points, trends, averages
    - Outliers and stability commentary
    - Pie-chart specifics: dominant segments, minor groups, balance

- **Responsive UI**
  - Three-part layout:  
    1. Upload interface  
    2. Interactive chart slideshow with navigation  
    3. Export panel (currently being worked on)

---

## How to Use

1. Download and unzip the Favicon, HTML, CSS, JS and font files
2. On the landing page, drag-and-drop or upload your CSV dataset (the tool expects valid UTF-8 CSV with headers on the first row)
3. The site will display a few visualizations and key insights which you can navigate through
4. You can also re-upload the file or upload a different one instead.

---

## Future Plans

- **Improved CSV Data Handling and Parsing**
- **Further UI Enhancements**
- **Adding a loading screen for larger datasets**

---

## Technologies Used

- HTML, CSS, JavaScript for frontend
- Libraries: Chart.js, PapaParse (for CSV parsing), xlsx (for Excel parsing), PptxGenJS (for exporting PPT files), jsPDF (for exporting PDF files)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

For questions or feedback, please contact [Rishabh Dhall](mailto:rishabhdhall02@gmail.com).

