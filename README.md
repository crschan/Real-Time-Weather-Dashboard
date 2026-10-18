# Stratos | Real-Time Weather Dashboard

A premium, interactive real-time weather dashboard featuring a beautiful glassmorphism design and dynamic weather animations. 

## 🌟 Features

- **Real-Time Weather Data**: Get up-to-date weather conditions for any city worldwide.
- **Dynamic Backgrounds & Animations**: The UI reacts to the current weather condition and time of day, displaying dynamic effects such as:
  - Sun and moon celestial bodies based on the time (Day, Night, Sunset).
  - Animated clouds, rain, and snow effects depending on the current weather condition.
  - Twinkling stars at night.
- **7-Day Forecast**: View the expected maximum and minimum temperatures, along with the forecasted weather conditions for the next week.
- **Detailed Weather Highlights**: Provides deeper insights into:
  - **UV Index** with a custom animated SVG gauge.
  - **Wind Status** including speed and a compass displaying wind direction.
  - **Sunrise & Sunset** dynamic time displays.
  - **Atmospheric Pressure**.
- **City Search with Auto-Complete**: Search for cities worldwide with real-time dropdown suggestions.
- **Unit Conversion**: Seamlessly toggle between Celsius (°C) and Fahrenheit (°F).
- **Glassmorphism UI**: Modern frosted-glass panels over an animated, smooth gradient background.
- **Responsive Design**: Fully responsive layout adapting perfectly to desktops, tablets, and mobile devices.

## 🛠 Tech Stack

- **HTML5**: Semantic markup structuring the dashboard.
- **CSS3**: Advanced styling including CSS Variables, Grid, Flexbox, Keyframe Animations, backdrop-filters for the glass effect, and custom scrollbars.
- **Vanilla JavaScript (ES6+)**: Handles API fetching, DOM manipulation, dynamic class toggles, SVG gauge calculations, and time/date logic. No external UI frameworks or libraries were used.
- **FontAwesome**: Used for crisp, scalable weather and UI icons.
- **Google Fonts**: Uses the 'Outfit' font family for modern, clean typography.

## 📡 APIs Used

This project relies on the open-source and free-to-use **Open-Meteo APIs** (no API key required):
1. **[Geocoding API](https://open-meteo.com/en/docs/geocoding-api)**: Used to search for cities, returning precise latitude and longitude coordinates.
2. **[Weather API](https://open-meteo.com/en/docs)**: Used to fetch comprehensive current weather and 7-day daily forecast data based on coordinates.

## 🚀 Getting Started

The dashboard uses a small Node server for the AI endpoint. Node.js 20 or newer is required.

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge).

### Installation
1. Navigate to the project directory:
   ```bash
   cd Weather\ Dashboard
   ```
2. Start the server:
  ```bash
  npm start
  ```
3. Open `http://localhost:3000` in Safari or another browser. Opening `index.html` directly will not enable the AI endpoint.

### Configure AI
Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey), then set `GEMINI_API_KEY` in `.env`. Set `GEMINI_MODEL` to change models; the default is `gemini-3.5-flash-lite`. Restart the server after changing `.env`. The key is read by the server and is never included in browser code. You can also set `PORT` there.

The `/api/ai/coach` endpoint uses Gemini for weather briefings, the Weather Coach chatbot, and outfit recommendations. Without a configured API key, local weather and outfit advice still work; AI chat explains what needs configuration.

## 📁 Project Structure

```text
Weather Dashboard/
│
├── index.html     # The main structural document and UI layout.
├── style.css      # All styling, responsive queries, and dynamic element animations.
└── script.js      # Application logic, API integration, and dynamic DOM updates.
```

## 🧠 How the Dynamic Weather Works

The `script.js` file handles time and weather code parsing. Based on the WMO Weather interpretation codes returned by the Open-Meteo API, the script appends specific CSS classes to the HTML `<body>` tag:
- **Time Classes**: `.time-day`, `.time-sunset`, `.time-night` 
- **Condition Classes**: `.condition-clear`, `.condition-cloudy`, `.condition-rain`, `.condition-snow`

The `style.css` uses these classes to automatically adjust the gradient background (`--clr-bg-start`, `--clr-bg-mid`, `--clr-bg-end`) and reveal/hide specific overlay effects like clouds (`.clouds-container`), rain (`.rain-container`), snow (`.snow-container`), or stars (`.stars-container`).

## 🔮 Future Enhancements
- Save favorite cities to LocalStorage for quick access.
- Add an hourly forecast chart using a library like Chart.js.
- Integrate the browser's Geolocation API to instantly load the local weather on startup.
