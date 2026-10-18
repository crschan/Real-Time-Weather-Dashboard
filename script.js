// API configuration
const GEO_API_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

// Default Location (London)
let currentLat = 51.5085;
let currentLon = -0.1257;
let currentLocationName = "London, United Kingdom";
let isCelsius = true;
let currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// DOM Elements
const searchInput = document.getElementById('city-search');
const searchResults = document.getElementById('search-results');
const locationNameEl = document.getElementById('location-name');

const mainIcon = document.getElementById('main-icon');
const mainTemp = document.getElementById('main-temp');
const mainCondition = document.getElementById('main-condition');
const currentDay = document.getElementById('current-day');
const currentTime = document.getElementById('current-time');
const highTemp = document.getElementById('high-temp');
const lowTemp = document.getElementById('low-temp');

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

const hourlyForecastContainer = document.getElementById('hourly-forecast');
const hourlyDayLabel = document.getElementById('hourly-day-label');
const aiSummaryText = document.getElementById('ai-summary-text');
const outfitRecommendation = document.getElementById('outfit-recommendation');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const dailyForecastContainer = document.getElementById('daily-forecast');
let currentWeatherContext = null;
let chatHistory = [];
let selectedForecastDate = null;

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
    
    try {
        // Day and Date formatting
        const optionsDate = { weekday: 'long', day: 'numeric', month: 'short', timeZone: currentTimezone };
        currentDay.textContent = now.toLocaleDateString('en-US', optionsDate);
        
        // Time formatting
        const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: currentTimezone };
        currentTime.textContent = now.toLocaleTimeString('en-US', optionsTime);

        // Setting Greeting based on target time
        const hourFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: currentTimezone });
        const hourNum = parseInt(hourFormatter.format(now), 10);
        
        if (hourNum >= 5 && hourNum < 12) greetingEl.textContent = "Good Morning";
        else if (hourNum >= 12 && hourNum < 18) greetingEl.textContent = "Good Afternoon";
        else greetingEl.textContent = "Good Evening";
    } catch(e) {
        // Fallback gracefully
        const optionsDate = { weekday: 'long', day: 'numeric', month: 'short' };
        currentDay.textContent = now.toLocaleDateString('en-US', optionsDate);
        const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
        currentTime.textContent = now.toLocaleTimeString('en-US', optionsTime);
    }
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
            selectedForecastDate = null;
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
    const timePart = isoString.split('T')[1];
    let [hours, minutes] = timePart.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    return `${h}:${minutes} ${ampm}`;
}

function getDayName(isoString) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dateStr = isoString.split('T')[0];
    const parts = dateStr.split('-');
    const date = new Date(parts[0], parts[1]-1, parts[2]); // Construct at local midnight
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
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,is_day',
            hourly: 'temperature_2m,weather_code,precipitation_probability,wind_speed_10m',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max',
            timezone: 'auto'
        });

        const response = await fetch(`${WEATHER_API_URL}?${params.toString()}`);
        const data = await response.json();
        
        updateDashboard(data);
    } catch (err) {
        console.error("Failed to fetch weather data", err);
    }
}

function getHourlyLabel(timeString, index, isCurrentHour) {
    const [, timePart] = timeString.split('T');
    const [hourString] = timePart.split(':');
    const hour = Number(hourString);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const converted = hour % 12 || 12;

    if (index === 0 && isCurrentHour) return 'Now';
    return `${converted}${ampm}`;
}

function renderHourlyForecast(hourlyData, currentTimeValue, selectedDate = null) {
    if (!hourlyData || !hourlyData.time) {
        hourlyForecastContainer.innerHTML = '';
        return;
    }

    const currentIndex = hourlyData.time.findIndex((time) => time === currentTimeValue || time.startsWith(currentTimeValue.slice(0, 13)));
    const currentDate = currentTimeValue.slice(0, 10);
    const targetDate = selectedDate || currentDate;
    const dayStartIndex = hourlyData.time.findIndex((time) => time.startsWith(targetDate));
    const startIndex = selectedDate && selectedDate !== currentDate
        ? dayStartIndex
        : currentIndex >= 0 ? currentIndex : Math.max(dayStartIndex, 0);

    hourlyDayLabel.textContent = selectedDate
        ? selectedDate === currentDate ? 'Today' : `${getDayName(`${selectedDate}T12:00`)} - ${selectedDate}`
        : 'Next 12 hours';

    hourlyForecastContainer.innerHTML = '';
    if (startIndex < 0) return;

    const hoursToShow = selectedDate ? 24 : 12;
    for (let i = 0; i < hoursToShow; i++) {
        const index = startIndex + i;
        if (index >= hourlyData.time.length) break;

        const time = hourlyData.time[index];
        if (!time.startsWith(targetDate)) break;
        const temp = hourlyData.temperature_2m[index];
        const code = hourlyData.weather_code[index];
        const rainChance = hourlyData.precipitation_probability?.[index] ?? 0;
        const weather = weatherCodeMap[code] || weatherCodeMap[0];

        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.innerHTML = `
            <span class="hourly-time">${getHourlyLabel(time, i, !selectedDate || selectedDate === currentDate)}</span>
            <div class="hourly-icon"><i class="fa-solid ${weather.icon}" style="color: ${weather.color}"></i></div>
            <div class="hourly-temp">${isCelsius ? Math.round(temp) + '°' : Math.round((temp * 9/5) + 32) + '°'}</div>
            <div class="hourly-pop">${rainChance}% rain</div>
        `;

        hourlyForecastContainer.appendChild(card);
    }
}

function buildWeatherContext(data) {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    const weather = weatherCodeMap[current.weather_code] || weatherCodeMap[0];
    const displayTemperature = (value) => Math.round(isCelsius ? value : value * 9 / 5 + 32);
    return {
        location: currentLocationName,
        temperature: displayTemperature(current.temperature_2m),
        feelsLike: displayTemperature(current.apparent_temperature),
        units: isCelsius ? 'Celsius' : 'Fahrenheit',
        condition: weather.desc,
        humidity: current.relative_humidity_2m,
        windSpeedKmh: current.wind_speed_10m,
        uvIndex: daily.uv_index_max[0] || 0,
        daily: daily.time.map((date, index) => ({
            date,
            day: index === 0 ? 'Today' : getDayName(`${date}T12:00`),
            condition: (weatherCodeMap[daily.weather_code[index]] || weatherCodeMap[0]).desc,
            high: displayTemperature(daily.temperature_2m_max[index]),
            low: displayTemperature(daily.temperature_2m_min[index]),
            precipitationChance: daily.precipitation_probability_max?.[index] ?? null
        })),
        hourly: hourly.time.slice(0, 12).map((time, index) => ({
            time,
            temperature: displayTemperature(hourly.temperature_2m[index]),
            condition: (weatherCodeMap[hourly.weather_code[index]] || weatherCodeMap[0]).desc,
            precipitationChance: hourly.precipitation_probability?.[index] ?? 0
        }))
    };
}

function getLocalInsight(context) {
    const peakRain = Math.max(...context.hourly.slice(0, 6).map((hour) => hour.precipitationChance));
    const temperature = `${context.temperature}°${isCelsius ? 'C' : 'F'}`;
    let advice = `It is ${context.condition.toLowerCase()} and ${temperature} in ${context.location}. `;
    advice += context.windSpeedKmh > 25 ? 'Winds are strong, so secure loose items outdoors. ' : 'Winds are fairly calm. ';
    advice += peakRain > 60 ? 'Rain is likely in the next few hours; bring an umbrella.' : context.uvIndex >= 8 ? 'UV is very high; use sun protection outdoors.' : 'No major weather changes are expected soon.';
    return advice;
}

function getLocalOutfit(context) {
    const peakRain = Math.max(...context.hourly.slice(0, 6).map((hour) => hour.precipitationChance));
    const temperatureCelsius = isCelsius ? context.temperature : (context.temperature - 32) * 5 / 9;
    const layers = temperatureCelsius < 5 ? 'a warm coat, sweater, and closed-toe shoes' : temperatureCelsius < 15 ? 'a light-to-medium jacket and comfortable layers' : temperatureCelsius < 25 ? 'a light top and trousers' : 'breathable, lightweight clothing';
    const weatherAdvice = peakRain > 50 ? ' Bring a waterproof layer or umbrella.' : context.uvIndex >= 6 ? ' Add sunglasses and sunscreen.' : '';
    return `Try ${layers}.${weatherAdvice}`;
}

async function requestCoach(task, message = '') {
    const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, message, history: chatHistory.slice(-8), weather: currentWeatherContext })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The AI service is unavailable.');
    return result.reply.replace(/\*\*(.*?)\*\*/g, '$1').trim();
}

function appendChatMessage(role, text) {
    const message = document.createElement('p');
    message.className = `chat-message ${role === 'user' ? 'user-message' : 'assistant-message'}`;
    message.textContent = text;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message || !currentWeatherContext) return;

    appendChatMessage('user', message);
    chatHistory.push({ role: 'user', content: message });
    chatInput.value = '';
    chatInput.disabled = true;
    chatForm.querySelector('button').disabled = true;

    try {
        const reply = await requestCoach('chat', message);
        appendChatMessage('assistant', reply);
        chatHistory.push({ role: 'assistant', content: reply });
        chatHistory = chatHistory.slice(-8);
    } catch (error) {
        appendChatMessage('assistant', error.message);
    } finally {
        chatInput.disabled = false;
        chatForm.querySelector('button').disabled = false;
        chatInput.focus();
    }
});

function updateDashboard(data) {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    
    currentTimezone = data.timezone;
    
    // Time of day & Weather Effects Logic
    const nowMs = new Date(current.time + "Z").getTime();
    const sunriseMs = new Date(daily.sunrise[0] + "Z").getTime();
    const sunsetMs = new Date(daily.sunset[0] + "Z").getTime();
    
    const sunsetDiff = Math.abs(nowMs - sunsetMs) / (1000 * 60);
    const sunriseDiff = Math.abs(nowMs - sunriseMs) / (1000 * 60);

    let timeClass = 'time-day';
    if (sunsetDiff <= 45 || sunriseDiff <= 45) {
        timeClass = 'time-sunset';
    } else if (current.is_day !== undefined) {
        timeClass = current.is_day === 0 ? 'time-night' : 'time-day';
    } else {
        timeClass = (nowMs < sunriseMs || nowMs > sunsetMs) ? 'time-night' : 'time-day';
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
    highTemp.textContent = convertTemp(daily.temperature_2m_max[0]).replace(/[CF]$/, '');
    lowTemp.textContent = convertTemp(daily.temperature_2m_min[0]).replace(/[CF]$/, '');
    
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
    
    renderHourlyForecast(hourly, current.time, selectedForecastDate);
    currentWeatherContext = buildWeatherContext(data);
    aiSummaryText.textContent = getLocalInsight(currentWeatherContext);
    outfitRecommendation.textContent = getLocalOutfit(currentWeatherContext);
    Promise.all([
        requestCoach('insight')
            .then((reply) => { aiSummaryText.textContent = reply; })
            .catch((error) => { aiSummaryText.textContent = `${getLocalInsight(currentWeatherContext)} AI unavailable: ${error.message}`; }),
        requestCoach('outfit')
            .then((reply) => { outfitRecommendation.textContent = reply; })
            .catch((error) => { outfitRecommendation.textContent = `${getLocalOutfit(currentWeatherContext)} AI unavailable: ${error.message}`; })
    ]);

    // 7-Day Forecast
    dailyForecastContainer.innerHTML = '';
    const weekLow = Math.min(...daily.temperature_2m_min.slice(0, 7));
    const weekHigh = Math.max(...daily.temperature_2m_max.slice(0, 7));
    const weekRange = weekHigh - weekLow || 1;
    
    for (let i = 0; i < 7; i++) {
        const itemCode = daily.weather_code[i];
        const itemWeather = weatherCodeMap[itemCode] || weatherCodeMap[0];
        
        const dayName = i === 0 ? "Today" : getDayName(daily.time[i]);
        const lowOffset = ((daily.temperature_2m_min[i] - weekLow) / weekRange) * 100;
        const tempWidth = Math.max(((daily.temperature_2m_max[i] - daily.temperature_2m_min[i]) / weekRange) * 100, 8);
        const rainChance = daily.precipitation_probability_max?.[i] ?? 0;
        
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `forecast-item${selectedForecastDate === daily.time[i] ? ' selected' : ''}`;
        button.setAttribute('aria-pressed', String(selectedForecastDate === daily.time[i]));
        button.setAttribute('aria-label', `${dayName}: ${itemWeather.desc}, high ${convertTemp(daily.temperature_2m_max[i])}, low ${convertTemp(daily.temperature_2m_min[i])}. Show hourly forecast`);
        button.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <div class="forecast-icon">
                <i class="fa-solid ${itemWeather.icon}" style="color: ${itemWeather.color}"></i>
            </div>
            <span class="forecast-rain">${rainChance ? `${rainChance}%` : ''}</span>
            <div class="temp-range"><span class="temp-range-fill" style="left: ${lowOffset}%; width: ${tempWidth}%"></span></div>
            <div class="forecast-temp">
                <span class="temp-min">${convertTemp(daily.temperature_2m_min[i])}</span>
                <span class="temp-max">${convertTemp(daily.temperature_2m_max[i])}</span>
            </div>
        `;
        button.addEventListener('click', () => {
            selectedForecastDate = daily.time[i];
            dailyForecastContainer.querySelectorAll('.forecast-item').forEach((item) => {
                const isSelected = item === button;
                item.classList.toggle('selected', isSelected);
                item.setAttribute('aria-pressed', String(isSelected));
            });
            renderHourlyForecast(hourly, current.time, selectedForecastDate);
            document.getElementById('hourly-forecast').closest('.forecast-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        dailyForecastContainer.appendChild(button);
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

function initGeolocation() {
    fetchWeather();

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;
                try {
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${currentLat}&longitude=${currentLon}&localityLanguage=en`);
                    const data = await res.json();
                    
                    if (data.city || data.locality) {
                        currentLocationName = `${data.city || data.locality}${data.countryName ? ", " + data.countryName : ""}`;
                    } else {
                        currentLocationName = "Current Location";
                    }
                } catch(err) {
                    currentLocationName = "Current Location";
                }
                fetchWeather();
            },
            () => {},
            { timeout: 8000, maximumAge: 300000 }
        );
    }
}

// Initial Fetch
initGeolocation();
