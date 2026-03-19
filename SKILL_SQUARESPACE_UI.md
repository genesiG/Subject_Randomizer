# Skill: Squarespace Single-File React Deployment

## Architecture Constraints
* **Format:** The final output MUST be a single `.html` file containing `<style>`, `<body>`, and `<script>` tags. No external build steps (Webpack/Vite) can be required.
* **Libraries:** Use CDN links for React, ReactDOM, Babel (for in-browser JSX compilation), and Tailwind CSS via script tag.
* **DOM Target:** Mount the React app to `<div id="randomizer-root"></div>`.

## UI Requirements
* Include a toggle for user-defined columns to flag them as "Continuous" or "Categorical".
* Include a "Download CSV" function so lab records are not lost upon page refresh.
* Include a "NOTE: download your output data before closing this window" message.
* Include instructions to let the user know how to flag variables as "Countinuous" or "Categorical".
* Include instructions to let the user know how to upload their own spreadsheet or paste their own data.