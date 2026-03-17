// API configuration
const GEO_API_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

// Default Location (London)
let currentLat = 51.5085;
let currentLon = -0.1257;
let currentLocationName = "London, United Kingdom";
let isCelsius = true;

// DOM Elements
const searchInput = document.getElementById('city-search');
const searchResults = document.getElementById('search-results');
const locationNameEl = document.getElementById('location-name');

const mainIcon = document.getElementById('main-icon');
const mainTemp = document.getElementById('main-temp');
const mainCondition = document.getElementById('main-condition');
const currentDay = document.getElementById('current-day');
const currentTime = document.getElementById('current-time');

const cloudCoverEl = document.getElementById('cloud-cover');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');

const greetingEl = document.getElementById('greeting');
const btnC = document.getElementById('btn-c');
const btnF = document.getElementById('btn-f');

const uvValue = document.getElementById('uv-value');
const uvDesc = document.getElementById('uv-desc');
const uvGauge = document.getElementById('uv-gauge');

const windStatusSpeed = document.getElementById('wind-status-speed');
const windDirIcon = document.getElementById('wind-dir-icon');
const windDirText = document.getElementById('wind-direction-text');

const sunriseTime = document.getElementById('sunrise-time');
const sunsetTime = document.getElementById('sunset-time');
const pressureValue = document.getElementById('pressure-value');

const dailyForecastContainer = document.getElementById('daily-forecast');

// Mapping WMO Weather codes to FontAwesome Icons and Descriptions
const weatherCodeMap = {
    0: { desc: "Clear sky", icon: "fa-sun", color: "#facc15" },
    1: { desc: "Mainly clear", icon: "fa-cloud-sun", color: "#fcd34d" },
    2: { desc: "Partly cloudy", icon: "fa-cloud", color: "#cbd5e1" },
    3: { desc: "Overcast", icon: "fa-cloud", color: "#94a3b8" },
    45: { desc: "Fog", icon: "fa-smog", color: "#cbd5e1" },
    48: { desc: "Depositing rime fog", icon: "fa-smog", color: "#cbd5e1" },
    51: { desc: "Light Drizzle", icon: "fa-cloud-rain", color: "#38bdf8" },
    53: { desc: "Moderate Drizzle", icon: "fa-cloud-rain", color: "#0ea5e9" },
    55: { desc: "Dense Drizzle", icon: "fa-cloud-showers-heavy", color: "#0284c7" },
    56: { desc: "Light Freezing Drizzle", icon: "fa-icicles", color: "#7dd3fc" },
    57: { desc: "Dense Freezing Drizzle", icon: "fa-icicles", color: "#38bdf8" },
    61: { desc: "Slight Rain", icon: "fa-cloud-rain", color: "#38bdf8" },
    63: { desc: "Moderate Rain", icon: "fa-cloud-rain", color: "#0ea5e9" },
    65: { desc: "Heavy Rain", icon: "fa-cloud-showers-heavy", color: "#0284c7" },
    66: { desc: "Light Freezing Rain", icon: "fa-cloud-meatball", color: "#7dd3fc" },
    67: { desc: "Heavy Freezing Rain", icon: "fa-cloud-meatball", color: "#38bdf8" },
    71: { desc: "Slight Snow fall", icon: "fa-snowflake", color: "#e0f2fe" },
    73: { desc: "Moderate Snow fall", icon: "fa-snowflake", color: "#bae6fd" },
    75: { desc: "Heavy Snow fall", icon: "fa-snowflake", color: "#7dd3fc" },
    77: { desc: "Snow grains", icon: "fa-snowflake", color: "#e0f2fe" },
    80: { desc: "Slight Rain showers", icon: "fa-cloud-sun-rain", color: "#38bdf8" },
    81: { desc: "Moderate Rain showers", icon: "fa-cloud-rain", color: "#0ea5e9" },
    82: { desc: "Violent Rain showers", icon: "fa-cloud-showers-heavy", color: "#0284c7" },
    85: { desc: "Slight Snow showers", icon: "fa-snowflake", color: "#e0f2fe" },
    86: { desc: "Heavy Snow showers", icon: "fa-snowflake", color: "#bae6fd" },
    95: { desc: "Thunderstorm", icon: "fa-cloud-bolt", color: "#fbbf24" },
    96: { desc: "Thunderstorm with light hail", icon: "fa-cloud-bolt", color: "#fbbf24" },
    99: { desc: "Thunderstorm with heavy hail", icon: "fa-cloud-bolt", color: "#f59e0b" }
};

// Update Date and Time continuously
function updateDateTime() {
    const now = new Date();
    
    // Day and Date formatting
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    currentDay.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
    
    // Time formatting
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Setting Greeting based on time
    if (hours >= 5 && hours < 12) greetingEl.textContent = "Good Morning";
    else if (hours >= 12 && hours < 18) greetingEl.textContent = "Good Afternoon";
    else greetingEl.textContent = "Good Evening";
    
    hours = hours % 12;
    hours = hours ? hours : 12; 
    currentTime.textContent = `${hours}:${minutes} ${ampm}`;
}

setInterval(updateDateTime, 1000);
updateDateTime();

// Toggle Units
btnC.addEventListener('click', () => {
    if(!isCelsius) {
        isCelsius = true;
        btnC.classList.add('active');
        btnF.classList.remove('active');
        fetchWeather();
    }
});

btnF.addEventListener('click', () => {
    if(isCelsius) {
        isCelsius = false;
        btnF.classList.add('active');
        btnC.classList.remove('active');
        fetchWeather();
    }
});

// Search functionality
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        searchResults.classList.add('hidden');
        return;
    }

    searchTimeout = setTimeout(() => {
        fetch(`${GEO_API_URL}?name=${query}&count=5&language=en&format=json`)
            .then(res => res.json())
            .then(data => {
                displaySearchResults(data.results);
            })
            .catch(err => console.error(err));
    }, 500);
});

function displaySearchResults(results) {
    searchResults.innerHTML = '';
    
    if (!results || results.length === 0) {
        searchResults.classList.add('hidden');
        return;
    }

    results.forEach(result => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        const country = result.country ? ", " + result.country : "";
        const admin1 = result.admin1 ? ", " + result.admin1 : "";
        div.textContent = `${result.name}${admin1}${country}`;
        
        div.addEventListener('click', () => {
            currentLat = result.latitude;
            currentLon = result.longitude;
            currentLocationName = `${result.name}${country}`;
            searchInput.value = '';
            searchResults.classList.add('hidden');
            fetchWeather();
        });
        
        searchResults.appendChild(div);
    });
    
    searchResults.classList.remove('hidden');
}

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if(!e.target.closest('.search-container')) {
        searchResults.classList.add('hidden');
    }
});

function getWindDirection(degree) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const val = Math.floor((degree / 22.5) + 0.5);
    return directions[(val % 16)];
}

function formatTime(isoString) {
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${hours}:${minutes} ${ampm}`;
}

function getDayName(isoString) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date(isoString);
    return days[date.getDay()];
}

function convertTemp(celsius) {
    if (isCelsius) return `${Math.round(celsius)}°C`;
    return `${Math.round((celsius * 9/5) + 32)}°F`;
}

// Fetch Weather Data
async function fetchWeather() {
    try {
        locationNameEl.textContent = currentLocationName;
        
        const params = new URLSearchParams({
            latitude: currentLat,
            longitude: currentLon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max',
            timezone: 'auto'
        });

        const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`);
        const data = await response.json();
        
        updateDashboard(data);
    } catch (err) {
        console.error("Failed to fetch weather data", err);
    }
}

function updateDashboard(data) {
    const current = data.current;
    const daily = data.daily;
    
    // Time of day & Weather Effects Logic
    const currentLocalTime = new Date(current.time);
    const sunrise = new Date(daily.sunrise[0]);
    const sunset = new Date(daily.sunset[0]);
    
    const nowMs = currentLocalTime.getTime();
    const sunriseMs = sunrise.getTime();
    const sunsetMs = sunset.getTime();
    
    const sunsetDiff = Math.abs(nowMs - sunsetMs) / (1000 * 60);
    const sunriseDiff = Math.abs(nowMs - sunriseMs) / (1000 * 60);

    let timeClass = 'time-day';
    if (sunsetDiff <= 45) {
        timeClass = 'time-sunset';
    } else if (sunriseDiff <= 45) {
        timeClass = 'time-sunset';
    } else if (nowMs < sunriseMs || nowMs > sunsetMs) {
        timeClass = 'time-night';
    } else {
        timeClass = 'time-day';
    }
    
    const code = current.weather_code;
    let conditionClass = 'condition-clear';
    
    if (code === 2 || code === 3 || code === 45 || code === 48) {
        conditionClass = 'condition-cloudy';
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) {
        conditionClass = 'condition-rain';
    } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        conditionClass = 'condition-snow';
    }
    
    document.body.className = `${timeClass} ${conditionClass}`;
    
    // Update Main Weather
    const weatherInfo = weatherCodeMap[current.weather_code] || weatherCodeMap[0];
    mainIcon.innerHTML = `<i class="fa-solid ${weatherInfo.icon}" style="color: ${weatherInfo.color}"></i>`;
    mainTemp.textContent = isCelsius ? `${Math.round(current.temperature_2m)}°` : `${Math.round((current.temperature_2m * 9/5) + 32)}°`;
    mainCondition.textContent = weatherInfo.desc;
    
    // Update Sidebar Summaries
    cloudCoverEl.textContent = `${current.cloud_cover}%`;
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windSpeedEl.textContent = `${current.wind_speed_10m} km/h`;
    
    // Update Highlights
    // UV Index
    const uvMax = daily.uv_index_max[0];
    uvValue.textContent = uvMax;
    
    let uvCategory = "Low";
    if(uvMax >= 3 && uvMax < 6) uvCategory = "Moderate";
    else if(uvMax >= 6 && uvMax < 8) uvCategory = "High";
    else if(uvMax >= 8 && uvMax < 11) uvCategory = "Very High";
    else if(uvMax >= 11) uvCategory = "Extreme";
    uvDesc.textContent = uvCategory;
    
    // Animate UV Gauge
    const gaugePercent = Math.min((uvMax / 12) * 100, 100);
    // stroke-dasharray is 125. stroke-dashoffset goes from 125 (0%) to 0 (100%)
    const offset = 125 - (125 * gaugePercent / 100);
    uvGauge.style.strokeDashoffset = offset;
    
    // Wind
    windStatusSpeed.textContent = current.wind_speed_10m;
    const windDir = current.wind_direction_10m;
    windDirText.textContent = getWindDirection(windDir);
    windDirIcon.style.transform = `rotate(${windDir}deg)`;
    
    // Sunrise & Sunset
    sunriseTime.textContent = formatTime(daily.sunrise[0]);
    sunsetTime.textContent = formatTime(daily.sunset[0]);
    
    // Pressure
    pressureValue.textContent = current.surface_pressure;
    
    // 7-Day Forecast
    dailyForecastContainer.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const itemCode = daily.weather_code[i];
        const itemWeather = weatherCodeMap[itemCode] || weatherCodeMap[0];
        
        const dayName = i === 0 ? "Today" : getDayName(daily.time[i]);
        
        const div = document.createElement('div');
        div.className = 'forecast-item';
        div.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <div class="forecast-icon">
                <i class="fa-solid ${itemWeather.icon}" style="color: ${itemWeather.color}"></i>
            </div>
            <div class="forecast-temp">
                <span class="temp-max">${convertTemp(daily.temperature_2m_max[i])}</span>
                <span class="temp-min">${convertTemp(daily.temperature_2m_min[i])}</span>
            </div>
        `;
        dailyForecastContainer.appendChild(div);
    }
}

// Generate Weather Elements
function createWeatherElements() {
    const starsContainer = document.getElementById('stars');
    const rainContainer = document.getElementById('rain');
    const snowContainer = document.getElementById('snow');

    // Stars
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDuration = (Math.random() * 3 + 1) + 's';
        star.style.animationDelay = (Math.random() * 2) + 's';
        starsContainer.appendChild(star);
    }

    // Rain
    for (let i = 0; i < 100; i++) {
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
        drop.style.animationDelay = (Math.random() * 2) + 's';
        rainContainer.appendChild(drop);
    }

    // Snow
    for (let i = 0; i < 50; i++) {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.style.width = (Math.random() * 5 + 3) + 'px';
        flake.style.height = flake.style.width;
        flake.style.left = Math.random() * 100 + '%';
        flake.style.animationDuration = (Math.random() * 5 + 5) + 's';
        flake.style.animationDelay = (Math.random() * 5) + 's';
        flake.style.opacity = Math.random();
        snowContainer.appendChild(flake);
    }
}

createWeatherElements();

// Initial Fetch
fetchWeather();
