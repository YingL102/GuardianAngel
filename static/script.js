console.log("Script loaded, current page path:", window.location.pathname);

// ======================================================================
// GLOBAL UTILITIES AND SHARED FUNCTIONALITY
// ======================================================================

// ======== LOADING SCREEN ANIMATION ========

window.addEventListener('load', function() {  
    const loadingScreen = document.getElementById('loading-screen');  
    if (!loadingScreen) {
        return;  
    }
  
    // Fade out loading screen after 1 second
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {     
            loadingScreen.style.display = 'none';
        }, 500); // Additional delay for fade transition
    }, 1000);
});

// ======== NAVIGATION FUNCTIONALITY ========

let sidebarOpen = false;

/**
 * Toggles sidebar menu
 */
function toggleNav() {
  const sidebar = document.getElementById("sidebar");
  const main = document.getElementById("main");
  const tocButton = document.querySelector(".toc-button");
  const overlay = document.querySelector(".overlay");
  sidebarOpen = !sidebarOpen;
  if (sidebarOpen) {
    // Open sidebar
    sidebar.style.width = "250px";
    main.style.marginLeft = "250px";
    tocButton.classList.add("open");
    overlay.style.display = "block";
  } else {
    // Close sidebar
    sidebar.style.width = "0";
    main.style.marginLeft = "0";
    tocButton.classList.remove("open");
    overlay.style.display = "none";
  }
};

// Close sidebar when clicking outside
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const tocButton = document.querySelector('.toc-button');
    const overlay = document.querySelector('.overlay');

    // Check if sidebar is open and click is outside sidebar and not on toggle button
    if (sidebarOpen &&
        sidebar && !sidebar.contains(event.target) &&
        tocButton && event.target !== tocButton &&
        tocButton && !tocButton.contains(event.target)) {
      toggleNav();
    }
  });

// ======== COMMON EVENT HANDLERS (FOR MULTIPLE PAGES) ========

document.addEventListener('DOMContentLoaded', function() {
    // Logout Button Handler - Used on all authenticated pages
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            const confirmLogout = confirm("Are you sure you want to log out?");
            if (confirmLogout) {
                // Redirect to server logout route
                window.location.href = "/logout";
            }
        });
    }
});

// ======================================================================
// LOGIN AND REGISTRATION PAGE FUNCTIONALITY
// ======================================================================

document.addEventListener('DOMContentLoaded', function() {

    // ======== LOGIN FORM HANDLER ========

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            console.log("Login attempt with:", email);

            // Send login request to server
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => response.json())
            .then(data => {
                console.log("Login response:", data);
                if (data.success) {
                    console.log("Redirecting to:", data.redirect);
                    window.location.href = data.redirect;
                } else {
                    alert("Invalid email or password. Please try again.");
                }
            })
            .catch(e => {
                console.error('Error:', e);
                alert("An error occurred. Please try again.");
            });
        });  
    }
});

// ======================================================================
// PROFILE PAGE FUNCTIONALITY
// ======================================================================

// Load user data on profile page
if (window.location.pathname.includes('/profile')) {
    fetch('/api/user')
        .then(response => response.json())
        .then(userData => {
            // Fill profile form with user data
            document.getElementById('name').value = userData.name;
            document.getElementById('email').value = userData.email;
            document.getElementById('phone').value = userData.phone || '';
        })
        .catch(e => {
            console.error('Error fetching user data:', e);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    // ---- Profile Edit Buttons ----
    const editButtons = document.querySelectorAll('.edit-button');
    if (editButtons.length > 0) {
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const fieldId = button.getAttribute('data-field');
                const field = document.getElementById(fieldId);
                if (field) {
                    // Toggle field edit state
                    if (field.hasAttribute('readonly') || field.hasAttribute('disabled')) {
                        // Enable editing
                        field.removeAttribute('readonly');
                        field.removeAttribute('disabled');
                        field.classList.add('editing');
                        field.focus();
                        button.innerHTML = '<i class="fas fa-check"></i>';
                    } else {
                        // Disable editing
                        field.setAttribute('readonly', true);
                        field.setAttribute('disabled', true);
                        field.classList.remove('editing');
                        button.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                    }
                }
            });
        })
    }

    // ---- Profile Save Button ----
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            saveButton.disabled = true; // Prevent double submission
        
            // Collect form data
            const passwordValue = document.getElementById('password').value.trim();
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value
            };

            // Only include password if it's not empty
            if (passwordValue !== "") {
                formData.password = passwordValue;
            }
        
            // Send AJAX request to update profile
            fetch('/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Profile updated successfully!');
                
                    // Disable all fields after successful update
                    document.querySelectorAll('#profileForm input, #profileForm textarea').forEach(field => {
                        field.setAttribute('readonly', true);
                        field.setAttribute('disabled', true);
                        field.classList.remove('editing');            
                    });
                    // Reset all buttons to pencil icon
                    document.querySelectorAll('.edit-button').forEach(button => {
                        button.innerHTML = '<i class="fas fa-pencil-alt"></i>';                
                    });
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(e => {
                console.error('Error:', e);
                alert('An error occurred while updating your profile.');
            })
            .finally(() => {    
                saveButton.disabled = false; // Re-enable button
            });
        });  
    } 
});

// ======================================================================
// SECURITY MONITORING SYSTEM (SMS) PAGE FUNCTIONALITY
// ======================================================================

// Initialize video stream when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    createMotionAlertElement();
    // Check if we're on the SMS page with video functionality
    if (document.getElementById('videoStream')) {
        initVideoStream();
    }
});

/**
 * Initializes HLS video stream for security camera feed
 */
function initVideoStream() {
    // Only run on the SMS page with the videoStream element
    const videoElement = document.getElementById('videoStream');
    if (!videoElement) return;
    
    const videoSrc = 'http://10.3.236.228:8080/hls/stream.m3u8';
    
    // Check if HLS.js is supported
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
        const hls = new Hls({
            debug: false,
            maxBufferLength: 30,
            maxMaxBufferLength: 60
        });
        
        hls.loadSource(videoSrc);
        hls.attachMedia(videoElement);
        
        // Play video when manifest is parsed
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            console.log('Video stream manifest parsed, attempting to play');
            
            // Attempt to play with autoplay handling
            const playPromise = videoElement.play();
            
            // Handle autoplay restrictions
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Video playback started successfully');
                }).catch(e => {
                    console.warn('Autoplay prevented:', e);
                    // Create a play button overlay for user interaction
                    createPlayButton(videoElement);
                });
            }
        });
        
        // Error handling for HLS streaming
        hls.on(Hls.Events.ERROR, function(event, data) {
            if (data.fatal) {
                console.error('Fatal HLS error:', data.type, data.details);
                
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    // Try to recover from network errors
                    console.log('Trying to recover from network error...');
                    hls.startLoad();
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    // Try to recover from media errors
                    console.log('Trying to recover from media error...');
                    hls.recoverMediaError();
                } else {
                    // Cannot recover, show error message
                    showStreamError(videoElement, 'Stream temporarily unavailable. Please try again later.');
                }
            }
        });
    }
    // Native HLS support (Safari)
    else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = videoSrc;
        
        videoElement.addEventListener('loadedmetadata', function() {
            videoElement.play();
        });
        
        videoElement.addEventListener('error', function() {
            showStreamError(videoElement, 'Error loading video stream.');
        });
    } 
    // No HLS support
    else {
        showStreamError(videoElement, 'Your browser does not support video streaming. Please try a different browser.');
    }
}

/**
 * Creates a play button overlay for mobile/autoplay restricted environments
 * @param {HTMLVideoElement} videoElement - The video element to attach the play button to
 */
function createPlayButton(videoElement) {
    // Create play button container
    const playButtonContainer = document.createElement('div');
    playButtonContainer.className = 'play-button-container';
    playButtonContainer.innerHTML = '<div class="play-button"><i class="fas fa-play"></i></div>';
    
    // Insert after video element
    videoElement.parentNode.insertBefore(playButtonContainer, videoElement.nextSibling);
    
    // Add click event to play video
    playButtonContainer.addEventListener('click', function() {
        videoElement.play()
            .then(() => {
                // Remove play button when video starts playing
                playButtonContainer.style.display = 'none';
            })
            .catch(e => {
                console.error('Play attempt failed:', e);
            });
    });
}

/**
 * Shows an error message for stream issues
 * @param {HTMLVideoElement} videoElement - The video element to associate the error with
 * @param {string} message - The error message to display
 */
function showStreamError(videoElement, message) {
    console.error(message);
    
    // Create error message element
    const errorMessage = document.createElement('p');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    
    // Insert after video element
    videoElement.parentNode.insertBefore(errorMessage, videoElement.nextSibling);
    
    // Style the video to show it's not working
    videoElement.style.opacity = '0.5';
}


// ======================================================================
// ENVIRONMENTAL MONITORING & CONTROL SYSTEM (EMCS) PAGE FUNCTIONALITY
// ======================================================================

// Initialize sensors on EMCS page
document.addEventListener('DOMContentLoaded', function() {

    createMotionAlertElement();

    // Check if we're on the EMCS page
    if (window.location.pathname.includes('/EMCS')) {
        console.log('EMCS page detected, initializing sensor data');
        initThingsBoard();
    }
});

function initThingsBoard() {
    // ---- CONFIGURATION ----
    const username = "group12@cardiff.ac.uk";
    const password = "group122025";
    const deviceId = "15448500-2695-11f0-94f0-adae81786882";
    const loginUrl = "https://thingsboard.cs.cf.ac.uk/api/auth/login";
    const telemetryUrl = `https://thingsboard.cs.cf.ac.uk/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=temperature,humidity,light,lux,illuminance,lightLevel,motion`;
    const refreshUrl = "https://thingsboard.cs.cf.ac.uk/api/auth/token";

    const POLLING_INTERVAL = 500;

    // ---- STATE MANAGEMENT ----
    let jwtToken = null;
    let refreshToken = null;
    let socket = null;
    let refreshHandle = null;
    let pollingHandle = null;
    let wsConnectionAttempts = 0;
    const MAX_WS_ATTEMPTS = 5;


    // ---- CHART VARIABLES ----
    let temperatureChart = null;
    let humidityChart = null;
    let temperatureData = [];
    let humidityData = [];
    const MAX_TIME_WINDOW = 24 * 60 * 60 * 1000; 
    const MAX_DATA_POINTS = 100;

    // ======== UTILITY FUNCTIONS ========
    /**
     * Updates the "last updated" timestamp for a specific sensor
     * @param {string} sensorType - The type of sensor (temperature, humidity, light)
     */
    function updateLastUpdated(sensorType) {
        const now = new Date();
        const formattedTime = now.toLocaleTimeString();
        const element = document.getElementById(`${sensorType}-lastUpdated`);
        if (element) {
            element.textContent = formattedTime;
        }
    }

    /**
     * Trims data arrays to prevent them from growing too large
     * @param {Array} dataArray - The data array to trim
     * @returns {Array} - The trimmed array
     */
    function trimDataArray(dataArray) {
        if (dataArray.length > MAX_DATA_POINTS) {
            return dataArray.slice(-MAX_DATA_POINTS);
        }
        return dataArray;
    }

    // ======== API FUNCTIONS ========
    /**
     * Saves a sensor reading to the backend
     * @param {string} sensorType - The type of sensor (temperature, humidity, light, motion)
     * @param {number|boolean} value - The sensor value to save
     * @returns {Promise} - Promise that resolves when data is saved
     */
    async function saveSensorReading(sensorType, value) {
        try {
            // For boolean values (motion), convert to 0/1
            const numericValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
            
            const response = await fetch('/api/sensor-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sensor_type: sensorType,
                    value: parseFloat(numericValue)
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to save ${sensorType} data: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`Saved ${sensorType} reading to backend:`, result);
            return result;
        } catch (e) {
            console.error(`Error saving ${sensorType} data:`, e);
        }
    }
    
    /**
     * Fetches sensor readings from the backend
     */
    async function fetchSensorData(sensorType, hours = 24) {
        try {
            const response = await fetch(`/api/sensor-data/${sensorType}?hours=${hours}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${sensorType} data: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`Fetched ${result.data.length} ${sensorType} readings from backend`);
            
            // Transform the data for chart display
            return result.data.map(item => ({
                x: new Date(item.timestamp),
                y: item.value
            }));
        } catch (e) {
            console.error(`Error fetching ${sensorType} data:`, e);
            return [];
        }
    }

    // ---- CHART FUNCTIONS ----

    /**
     * Initializes chart displays on the EMCS page
     * @returns {Promise<Object>} - Promise that resolves with chart objects
     */
    async function initializeCharts() {
        const tempCtx = document.getElementById('temperatureChart');
        const humidityCtx = document.getElementById('humidityChart');
        
        if (!tempCtx || !humidityCtx) {
            console.log("Chart canvas elements not found");
            return { temperatureChart: null, humidity: null };
        }

        console.log("Initializing charts...");

        temperatureData = await fetchSensorData('temperature');
        humidityData = await fetchSensorData('humidity');

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - MAX_TIME_WINDOW);
        
        // Temperature Chart
        temperatureChart = new Chart(tempCtx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temperatureData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 300
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm'
                            },
                            tooltipFormat: 'HH:mm'
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        min: twentyFourHoursAgo,
                        max: now,
                        ticks: {
                            source: 'auto',
                            maxRotation: 0,
                            autoSkip: true
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display:false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });

        // Humidity Chart
        humidityChart = new Chart(humidityCtx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Humidity (%)',
                    data: humidityData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm'
                            },
                            tooltipFormat: 'HH:mm'
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        },
                        min: twentyFourHoursAgo,
                        max: now,
                        ticks: {
                            source: 'auto',
                            maxRotation: 0,
                            autoSkip: true
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Humidity (%)'
                        },
                        min: 0,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });

        console.log("Charts intialized successfully");
        return {temperatureChart, humidityChart};
    }

    /**
     * Updates sensor display and chart with new data
     * @param {string} type - Sensor type (temperature, humidity, light)
     * @param {*} value - Sensor value
     */
    async function updateSensorDisplay(type, value) {
        console.log(`Updating ${type} display with value:`, value);
        
        if (type === 'temperature' && value !== null && value !== undefined && !isNaN(parseFloat(value))) {
            // Update the current temperature display
            const temperatureElement = document.getElementById("temperature").textContent = value;
            if (temperatureElement) {
                temperatureElement.textContent = value;
                updateLastUpdated('temperature');
            }            
            
            // Save to backend
            await saveSensorReading('temperature', value);

            // Add new data point for chart
            const now = new Date();
            temperatureData.push({
                x: now,
                y: parseFloat(value)
            });
            
            // Trim data to prevent array from growing too large
            temperatureData = trimDataArray(temperatureData);
            
            // Update chart if it exists
            if (temperatureChart) {
                temperatureChart.data.datasets[0].data = temperatureData;
                
                // Update time window
                const twentyFourHoursAgo = new Date(now.getTime() - MAX_TIME_WINDOW);
                temperatureChart.options.scales.x.min = twentyFourHoursAgo;
                temperatureChart.options.scales.x.max = now;
                
                temperatureChart.update();
            }
        } else if (type === 'humidity' && value !== null && value !== undefined && !isNaN(parseFloat(value))) {
            // Update humidity display
            const humidityElement = document.getElementById("humidity");
            if (humidityElement) {
                humidityElement.textContent = value;
                updateLastUpdated('humidity');
            }
            
            // Save to backend
            await saveSensorReading('humidity', value);
            
            // Add new data point for chart
            const now = new Date();
            humidityData.push({
                x: now,
                y: parseFloat(value)
            });
            
            // Trim data to prevent array from growing too large
            humidityData = trimDataArray(humidityData);
            
            // Update chart if it exists
            if (humidityChart) {
                humidityChart.data.datasets[0].data = humidityData;
                
                // Update time window
                const twentyFourHoursAgo = new Date(now.getTime() - MAX_TIME_WINDOW);
                humidityChart.options.scales.x.min = twentyFourHoursAgo;
                humidityChart.options.scales.x.max = now;
                
                humidityChart.update();
            }
        } else if (type === 'light' && value !== null && value !== undefined) {
            // Handle light data which might be numeric or string
            const lightElement = document.getElementById("light");
            if (lightElement) {
                let lightStatus = value;
                if (!isNaN(parseFloat(value))) {
                    // Convert numeric light value to status
                    lightStatus = parseFloat(value) < 500 ? "Dark" : "Bright";
                    // Save numeric light data to backend
                    await saveSensorReading('light', value);
                }
                
                lightElement.textContent = lightStatus;
                updateLastUpdated('light');
            }
        } else if (type === 'motion' && value !== null && value !== undefined) {
            // Handle motion data
            console.log(`Motion detected: ${value}`);
            
            // Save motion data to backend
            await saveSensorReading('motion', value);
            
            // Update any motion displays if they exist
            const motionElement = document.getElementById("motion-status");
            if (motionElement) {
                motionElement.textContent = value ? "Detected" : "No Motion";
                updateLastUpdated('motion');
            }

            // Show or hide motion alert based on value
            if (value === true || value === "true" || value === 1 || value === "1") {
                showMotionAlert({
                    message: "Motion detected in your home!"
                });
            } else {
                hideMotionAlert();
            }
        }
    }

    // Initialize charts when page loads
    setTimeout(async () => {
        await initializeCharts();
    }, 500);
    

    // ======== LOGIN + INITIAL FETCH ========
    /**
     * Authenticates with ThingsBoard and retrieves JWT token
     */
    async function login() {
        try { 
            console.log("Logging in to ThingsBoard...");
            const resp = await fetch(loginUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (!resp.ok){
                throw new Error("Login failed: " + resp.status);
            }

            const data = await resp.json();
            jwtToken = data.token;
            refreshToken = data.refreshToken;
            
            console.log("Login successful, JWT token obtained");

            // Once login is successful, start continuous data fetching
            await fetchInitial();     // Get initial sensor values
            startContinuousUpdates(); // Start continuous updates
            scheduleRefresh();        // Schedule token refresh
        } catch (e) {
            console.error("Login error:", e);
            // Show error in UI
            updateErrorState("Error connecting to sensors. Please try again later.");
            
            // Try again after delay
            setTimeout(login, 30000);
        }
    }

    /**
     * Updates UI to show error state
     * @param {string} message - Error message to display
     */
    function updateErrorState(message) {
        const elements = ["temperature", "humidity", "light"];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = "Error";
            }
        });
        
        console.error(message);
    }

    /**
     * Fetches initial sensor values from ThingsBoard
     */
    async function fetchInitial() {
        try {
            console.log("Fetching initial sensor data...");
            const r = await fetch(telemetryUrl, {
                headers: { "X-Authorization": "Bearer " + jwtToken }
            });

            if (!r.ok) { 
                throw new Error("Fetch failed: " + r.status);
            }

            const p = await r.json();
            console.log("Initial telemetry data received:", p);
            
            // Process all sensor data
            await processSensorData(p);
            
        } catch (e) {
            console.error("Initial fetch error:", e);
            updateErrorState("Error fetching sensor data");
        }
    }

     /**
     * Processes raw sensor data from ThingsBoard
     * @param {Object} data - Raw sensor data from ThingsBoard
     * @returns {Promise<void>} - Promise that resolves when processing is complete
     */
     async function processSensorData(data) {
        // Process temperature data
        const temperature = data.temperature?.[0];
        if (temperature != null) {
            const tempValue = extractSensorValue(temperature);
            await updateSensorDisplay('temperature', tempValue);
        }
        
        // Process humidity data
        const humidity = data.humidity?.[0];
        if (humidity != null) {
            const humidityValue = extractSensorValue(humidity);
            await updateSensorDisplay('humidity', humidityValue);
        }
        
        // Process light - check multiple possible keys
        const lightData = data.light?.[0] || data.lux?.[0] || data.illuminance?.[0] || data.lightLevel?.[0];
        if (lightData != null) {
            const lightValue = extractSensorValue(lightData);
            await updateSensorDisplay('light', lightValue);
        }
        
        // Process motion data
        const motion = data.motion?.[0];
        if (motion != null) {
            const motionValue = extractSensorValue(motion);
            // Convert to boolean
            const motionDetected = motionValue === true || 
                                  motionValue === "true" || 
                                  motionValue === 1 || 
                                  motionValue === "1";
            await updateSensorDisplay('motion', motionDetected);
        }
    }
    
    /**
     * Extracts value from different possible sensor data formats
     * @param {*} sensorData - Raw sensor data in various formats
     * @returns {*} - Extracted sensor value
     */
    function extractSensorValue(sensorData) {
        if (Array.isArray(sensorData)) {
            return sensorData[1];
        } else if (sensorData != null && typeof sensorData === 'object' && "value" in sensorData) {
            return sensorData.value;
        } else {
            return sensorData;
        }
    }

    /**
     * Performs a polling fetch of sensor data when WebSocket is not available
     * @returns {Promise<void>} - Promise that resolves when polling is complete
     */
    async function pollSensorData() {
        try {
            console.log("Polling for sensor updates...");
            const r = await fetch(telemetryUrl, {
                headers: { "X-Authorization": "Bearer " + jwtToken }
            });

            if (!r.ok) { 
                throw new Error("Polling fetch failed: " + r.status);
            }

            const data = await r.json();
            await processSensorData(data);
            
        } catch (e) {
            console.error("Polling error:", e);
        }
    }

    // ---- CONTINUOUS UPDATES STRATEGY ----
    /**
     * Starts continuous updates using the best available method
     */
    function startContinuousUpdates() {
        // Try WebSocket first
        startWebSocket();
        
        // Also start polling as a fallback
        // This ensures we get updates even if WebSocket fails
        startPolling();
    }
    
    /**
     * Starts polling for sensor data at regular intervals
     */
    function startPolling() {
        // Clear any existing polling interval
        if (pollingHandle) {
            clearInterval(pollingHandle);
        }
        
        // Set up polling interval
        pollingHandle = setInterval(pollSensorData, POLLING_INTERVAL);
        console.log(`Started polling for sensor data every ${POLLING_INTERVAL / 1000} seconds`);
    }


    // ---- JWT TOKEN REFRESH ----
    /**
     * Refreshes the JWT token before it expires
     */    
    async function refreshJwt() {
        console.log("Refreshing JWT…");
        try { 
            const r = await fetch(refreshUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken })
        });

        if (!r.ok) {
            console.error("Refresh failed, re-login");
            return login();
        }

        const d = await r.json();
        jwtToken = d.token;

        startWebSocket();  // Reconnect WS with new token

        } catch (e) {
            console.error("JWT refresh error:", e);
            return login();
        }
    }

    /**
     * Schedules periodic JWT refresh to maintain authentication
     */
    function scheduleRefresh() {
        clearInterval(refreshHandle);
        refreshHandle = setInterval(refreshJwt, 55 * 60 * 1000); // Refreshes every 55 mins
    }

    // ---- WEBSOCKET LIVE UPDATES ----
    /**
     * Establishes WebSocket connection for real-time sensor updates
     */
    function startWebSocket() {
        if (socket) {
            socket.close();
        }

        wsConnectionAttempts++;

        // Give up on WebSocket after too many attempts and rely on polling
        if (wsConnectionAttempts > MAX_WS_ATTEMPTS) {
            console.warn(`Failed to establish WebSocket connection after ${MAX_WS_ATTEMPTS} attempts. Falling back to polling.`);
            return;
        }
        
        socket = new WebSocket(
            `wss://thingsboard.cs.cf.ac.uk/api/ws/plugins/telemetry?token=${jwtToken}`
        );

        socket.onopen = () => {
            console.log("WebSocket connected");
            wsConnectionAttempts = 0;

            const sub = {
                tsSubCmds: [{
                    entityType: "DEVICE",
                    entityId:   deviceId,
                    scope:      "LATEST_TELEMETRY",
                    cmdId:      1,
                    keys:       ["temperature", "humidity", "light", "lux", "illuminance", "lightLevel", "motion"]
                }],
                attrSubCmds: [],
                historyCmds: []
            };
            console.log("Subscribing with:", sub);
            socket.send(JSON.stringify(sub));
        };

        socket.onmessage = async ({ data }) => {
            console.log("🔔 got a WS frame");
            try {
                const msg = JSON.parse(data);
                console.log("WS message:", msg);

                if (msg.subscriptionId === 1 && msg.data) {
                    // Process temperature updates
                    if (msg.data.temperature) {
                        const tempArr = msg.data.temperature;
                        if (Array.isArray(tempArr) && tempArr.length) {
                            const tempValue = extractSensorValue(tempArr[0]);
                            if (tempValue != null) {
                                await updateSensorDisplay('temperature', tempValue);
                            }
                        }
                    }
                    
                    // Process humidity updates
                    if (msg.data.humidity) {
                        const humidityArr = msg.data.humidity;
                        if (Array.isArray(humidityArr) && humidityArr.length) {
                            const humidityValue = extractSensorValue(humidityArr[0]);
                            if (humidityValue != null) {
                                await updateSensorDisplay('humidity', humidityValue);
                            }
                        }
                    } 
            
                    
                    // Process light - check multiple possible keys
                    const lightData = msg.data.light || msg.data.lux || msg.data.illuminance || msg.data.lightLevel;
                    if (lightData) {
                        const lightArr = lightData;
                        if (Array.isArray(lightArr) && lightArr.length) {
                            const lightValue = extractSensorValue(lightArr[0]);
                            if (lightValue != null) {
                                await updateSensorDisplay('light', lightValue);
                            }
                        }
                    }

                    // Handle motion detection data
                    if (msg.data.motion) {
                        const motionArr = msg.data.motion;
                        if (Array.isArray(motionArr) && motionArr.length) {
                            const motionValue = extractSensorValue(motionArr[0]);
                            if (motionValue != null) {
                                // Convert to boolean
                                const motionDetected = motionValue === true || 
                                                      motionValue === "true" || 
                                                      motionValue === 1 || 
                                                      motionValue === "1";
                                await updateSensorDisplay('motion', motionDetected);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("WS parse error:", e);
            }
        };

        socket.onclose = (event) => {
            console.warn(`WebSocket closed (code: ${event.code}, reason: ${event.reason}), reconnecting in 3s...`);
            setTimeout(startWebSocket, 3000);
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            // WebSocket failed, we'll rely on polling
        };
    }

    // ---- PAGE VISIBILITY HANDLING ----
    /**
     * Handles page visibility changes to optimize updates
     */
    function setupVisibilityChangeHandler() {
        document.addEventListener('visibilitychange', async function() {
            if (document.visibilityState === 'visible') {
                console.log("Page became visible, refreshing data");
                
                // Refresh data immediately when page becomes visible
                await fetchInitial();
                
                // Restart WebSocket connection if needed
                if (!socket || socket.readyState !== WebSocket.OPEN) {
                    startWebSocket();
                }
            }
        });
    }
    
    // ---- INITIALIZATION ----
    /**
     * Initializes the system with charts and data
     */
    async function initialize() {
        // Initialize charts if on EMCS page
        if (document.getElementById('temperatureChart') && document.getElementById('humidityChart')) {
            setTimeout(async () => {
                await initializeCharts();
            }, 500);
        }
        
        // Set up visibility change handler
        setupVisibilityChangeHandler();
        
        // Start the login and data fetch process
        login().catch(e => {
            console.error("Startup error:", e);
            updateErrorState("Connection error. Please refresh the page.");
        });
    }

    // ---- INITIALIZATION TRIGGER ----
    // Call initialize to start the system
    initialize();
    
    // Set default values if data is not available after timeout
    setTimeout(() => {
        if (document.getElementById("humidity") && document.getElementById("humidity").textContent === "Loading...") {
            document.getElementById("humidity").textContent = "N/A";
            console.log("Humidity data not available - setting to N/A");
        }
        if (document.getElementById("light") && document.getElementById("light").textContent === "Loading...") {
            document.getElementById("light").textContent = "N/A";
            console.log("Light data not available - setting to N/A");
        }
    }, 5000);  // Wait 5 seconds before showing N/A
}

// ======================================================================
// DEVICE MANAGEMENT FUNCTIONALITY 
// ======================================================================

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements for modals
    const addDeviceModal = document.getElementById('add-device-modal');
    const configureDeviceModal = document.getElementById('configure-device-modal');
    const disconnectDeviceModal = document.getElementById('disconnect-device-modal');
    
    // ---- Add Device Card Click Handlers ----
    const addSmsDevice = document.getElementById('add-sms-device');
    const addEmcsDevice = document.getElementById('add-emcs-device');
    
    if (addSmsDevice) {
        addSmsDevice.addEventListener('click', function() {
            openAddDeviceModal('sms');
        });
    }
    
    if (addEmcsDevice) {
        addEmcsDevice.addEventListener('click', function() {
            openAddDeviceModal('emcs');
        });
    }
    
    // ---- Device Action Button Handlers ----
    // Configure button handlers
    const configureButtons = document.querySelectorAll('.configure-button');
    configureButtons.forEach(button => {
        button.addEventListener('click', function() {
            const deviceId = this.getAttribute('data-device-id');
            openConfigureDeviceModal(deviceId);
        });
    });
    
    // Disconnect button handlers
    const disconnectButtons = document.querySelectorAll('.disconnect-button');
    disconnectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const deviceId = this.getAttribute('data-device-id');
            openDisconnectDeviceModal(deviceId);
        });
    });
    
    // Connect button handlers
    const connectButtons = document.querySelectorAll('.connect-button');
    connectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const deviceId = this.getAttribute('data-device-id');
            connectDevice(deviceId);
        });
    });
    
    // ---- Modal Control Handlers ----
    // Close modal buttons
    const closeModalButtons = document.querySelectorAll('.close-modal-button');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Cancel Buttons
    const cancelAddButton = document.getElementById('cancel-add');
    if (cancelAddButton) {
        cancelAddButton.addEventListener('click', closeAllModals);
    }

    const cancelConfigButton = document.getElementById('cancel-config');
    if (cancelConfigButton) {
        cancelConfigButton.addEventListener('click', closeAllModals);
    }
    
    const cancelDisconnectButton = document.getElementById('cancel-disconnect');
    if (cancelDisconnectButton) {
        cancelDisconnectButton.addEventListener('click', closeAllModals);
    }
    
    // Confirm/Save Buttons
    document.getElementById('confirm-add').addEventListener('click', addDevice);
    document.getElementById('save-config').addEventListener('click', saveDeviceConfig);
    document.getElementById('confirm-disconnect').addEventListener('click', disconnectDevice);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === addDeviceModal || 
            event.target === configureDeviceModal || 
            event.target === disconnectDeviceModal) {
            closeAllModals();
        }
    });

    // Load devices when page loads
    if (window.location.pathname.includes('/devices')) {
        loadDevices();
    }

    // Function to load devices from the server
    function loadDevices() {
        fetch('/api/devices')
            .then(response => response.json())
            .then(devices => {
                // Clear existing devices
                const smsDevices = document.getElementById('sms-devices');
                const emcsDevices = document.getElementById('emcs-devices');
                const disconnectedDevices = document.getElementById('disconnected-devices');
                
                // Clear all device containers except the add buttons
                clearDeviceContainers();
                
                // Add devices to appropriate sections
                devices.forEach(device => {
                    const deviceCard = createDeviceCard(device);
                    
                    if (device.status === 'disconnected') {
                        disconnectedDevices.insertBefore(deviceCard, disconnectedDevices.lastElementChild);
                    } else if (device.subsystem === 'sms') {
                        smsDevices.insertBefore(deviceCard, smsDevices.lastElementChild);
                    } else if (device.subsystem === 'emcs') {
                        emcsDevices.insertBefore(deviceCard, emcsDevices.lastElementChild);
                    }
                });
            })
            .catch(e => {
                console.error('Error loading devices:', e);
            });
    }

    // Function to create a device card
    function createDeviceCard(device) {
        const card = document.createElement('div');
        card.className = `device-card ${device.status === 'disconnected' ? 'disconnected-card' : ''}`;
        card.dataset.deviceId = device.id;
        
        // Set icon based on device type
        let icon = 'fa-microchip';
        if (device.device_type === 'camera') icon = 'fa-video';
        else if (device.device_type === 'temp-sensor') icon = 'fa-thermometer-half';
        else if (device.device_type === 'motion-sensor') icon = 'fa-running';
        
        card.innerHTML = `
            <div class="device-header ${device.subsystem}-header ${device.status === 'disconnected' ? 'disconnected-header' : ''}">
                <div class="device-icon ${device.subsystem}-icon ${device.status === 'disconnected' ? 'disconnected-icon' : ''}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="device-info-container">
                    <h3 class="device-name">${device.device_name}</h3>
                    <span class="device-status">${device.status.charAt(0).toUpperCase() + device.status.slice(1)}</span>
                </div>
            </div>
            
            <div class="device-details">
                ${device.device_ip ? `
                    <div class="detail-row">
                        <span class="detail-label">IP Address:</span>
                        <span class="detail-value">${device.device_ip}</span>
                    </div>
                ` : ''}
                ${device.device_model ? `
                    <div class="detail-row">
                        <span class="detail-label">Model:</span>
                        <span class="detail-value">${device.device_model}</span>
                    </div>
                ` : ''}
                ${device.device_pin ? `
                    <div class="detail-row">
                        <span class="detail-label">GPIO Pin:</span>
                        <span class="detail-value">${device.device_pin}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="device-actions">
                <button class="configure-button" data-device-id="${device.id}">
                    <i class="fas fa-cog"></i> Configure
                </button>
                ${device.status === 'disconnected' ? `
                    <button class="connect-button" data-device-id="${device.id}">
                        <i class="fas fa-link"></i> Connect
                    </button>
                ` : `
                    <button class="disconnect-button" data-device-id="${device.id}">
                        <i class="fas fa-unlink"></i> Disconnect
                    </button>
                `}
            </div>
        `;
        
        // Add event listeners to the buttons
        const configureBtn = card.querySelector('.configure-button');
        configureBtn.addEventListener('click', () => openConfigureDeviceModal(device.id));
        
        if (device.status === 'disconnected') {
            const connectBtn = card.querySelector('.connect-button');
            connectBtn.addEventListener('click', () => connectDevice(device.id));
        } else {
            const disconnectBtn = card.querySelector('.disconnect-button');
            disconnectBtn.addEventListener('click', () => openDisconnectDeviceModal(device.id));
        }
        
        return card;
    }

    // Function to clear device containers
    function clearDeviceContainers() {
        const containers = ['sms-devices', 'emcs-devices', 'disconnected-devices'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            const addButton = container.querySelector('.add-device-card');
            
            // Remove all children except the add button
            while (container.firstChild && container.firstChild !== addButton) {
                container.removeChild(container.firstChild);
            }
        });
    }
    
    // ---- Modal Functions ----
    
    /**
     * Opens the add device modal with pre-selected subsystem
     * @param {string} subsystemType - The subsystem type (sms or emcs)
     */
    function openAddDeviceModal(subsystemType) {
        // Pre-select the subsystem in the dropdown
        const subsystemSelect = document.getElementById('device-subsystem');
        subsystemSelect.value = subsystemType;
        
        // Reset the form
        document.getElementById('add-device-form').reset();
        
        // Display the modal
        addDeviceModal.style.display = 'block';
    }
    
    /**
     * Opens the configure device modal with device details
     * @param {string} deviceId - The ID of the device to configure
     */
    function openConfigureDeviceModal(deviceId) {
        // UPDATED: Fetch device data from server
        fetch('/api/devices')
            .then(response => response.json())
            .then(devices => {
                const device = devices.find(d => d.id === parseInt(deviceId));
                if (device) {
                    // Populate the form
                    document.getElementById('config-device-name').value = device.device_name;
                    document.getElementById('config-device-ip').value = device.device_ip || '';
                    document.getElementById('config-device-model').value = device.device_model || '';
                    document.getElementById('config-device-pin').value = device.device_pin || '';
                    document.getElementById('config-device-id').value = device.id;
                    
                    // Display the modal
                    configureDeviceModal.style.display = 'block';
                }
            })
            .catch(e => {
                console.error('Error fetching device data:', e);
                alert('An error occurred while loading device data.');
            });
    }
    
    /**
     * Opens the disconnect device confirmation modal
     * @param {string} deviceId - The ID of the device to disconnect
     */
    function openDisconnectDeviceModal(deviceId) {
        // Store the deviceId for the disconnect confirmation
        document.getElementById('disconnect-device-id').value = deviceId;
        
        // Display the modal
        disconnectDeviceModal.style.display = 'block';
    }
    
    /**
     * Closes all open modals
     */
    function closeAllModals() {
        addDeviceModal.style.display = 'none';
        configureDeviceModal.style.display = 'none';
        disconnectDeviceModal.style.display = 'none';
    }
    
    // ---- Device Management Functions ----
    
    /**
     * Adds a new device to the system
     */
    function addDevice() {
        // UPDATED: Send data to server
        const deviceData = {
            device_type: document.getElementById('device-type').value,
            device_name: document.getElementById('device-name').value,
            device_ip: document.getElementById('device-ip').value,
            device_model: document.getElementById('device-model').value,
            device_pin: '', // Add this field to your form if needed
            subsystem: document.getElementById('device-subsystem').value
        };
        
        // Validate form
        if (!deviceData.device_type || !deviceData.device_name || !deviceData.subsystem) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Send data to server
        fetch('/api/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(deviceData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Device added successfully!');
                closeAllModals();
                loadDevices(); // Reload devices to show the new one
            } else {
                alert('Error adding device: ' + data.message);
            }
        })
        .catch(e => {
            console.error('Error:', e);
            alert('An error occurred while adding the device.');
        });
    }
    
    /**
    * Saves device configuration changes
    */
    function saveDeviceConfig() {
        // UPDATED: Send data to server
        const deviceId = document.getElementById('config-device-id').value;
        const deviceData = {
            device_name: document.getElementById('config-device-name').value,
            device_ip: document.getElementById('config-device-ip').value,
            device_model: document.getElementById('config-device-model').value,
            device_pin: document.getElementById('config-device-pin').value
        };
        
        // Validate form
        if (!deviceData.device_name) {
            alert('Please enter a device name.');
            return;
        }
        
        // Send data to server
        fetch(`/api/devices/${deviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(deviceData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Device configuration saved!');
                closeAllModals();
                loadDevices(); // Reload devices to show the updates
            } else {
                alert('Error saving configuration: ' + data.message);
            }
        })
        .catch(e => {
            console.error('Error:', e);
            alert('An error occurred while saving the configuration.');
        });
    }
    
    /**
    * Disconnects a device from the system
    */
    function disconnectDevice() {
        // UPDATED: Send request to server
        const deviceId = document.getElementById('disconnect-device-id').value;
        
        // Send request to server
        fetch(`/api/devices/${deviceId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'disconnected' })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Device disconnected!');
                closeAllModals();
                loadDevices(); // Reload devices to show the updates
            } else {
                alert('Error disconnecting device: ' + data.message);
            }
        })
        .catch(e => {
            console.error('Error:', e);
            alert('An error occurred while disconnecting the device.');
        });
    }
    
    /**
    * Connects a disconnected device to the system
    * @param {string} deviceId - The ID of the device to connect
    */
    function connectDevice(deviceId) {
        // UPDATED: Send request to server
        fetch(`/api/devices/${deviceId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'connected' })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Device connected!');
                loadDevices(); // Reload devices to show the updates
            } else {
                alert('Error connecting device: ' + data.message);
            }
        })
        .catch(e => {
            console.error('Error:', e);
            alert('An error occurred while connecting the device.');
        });
    }
});

// ======================================================================
// RECORDINGS PAGE FUNCTIONALITY
// ======================================================================

/**
 * Initializes the recordings page functionality
 */
function initRecordingsPage() {
    const recordingList = document.getElementById('recording-list');
    const videoPlayer = document.getElementById('recording-player');
    
    if (!recordingList || !videoPlayer) return;
    
    console.log("Initializing recordings page...");
    
    // Fetch list of recordings
    fetchRecordings()
        .then(recordings => {
            displayRecordings(recordings);
        })
        .catch(e => {
            console.error('Error fetching recordings:', e);
            showError(recordingList, 'Failed to load recordings. Please try again later.');
        });
}

/**
 * Fetches the list of available recordings from the server
 * @returns {Promise<Array>} Promise that resolves with the list of recordings
 */
function fetchRecordings() {
    return fetch('http://<ipaddress>:8080/recordings/') // Replace <ipaddress> with ip address
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch recordings');
            }
            return response.text();
        })
        .then(html => {
            // Parse the HTML response to extract recording files
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            const recordings = [];
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.flv')) {
                    recordings.push({
                        filename: href,
                        url: 'http://<ipaddress>:8080/recordings/' + href, // Replace <ipaddress> with ip address
                        timestamp: extractTimestampFromFilename(href)
                    });
                }
            });
            
            return recordings;
        });
}

/**
 * Extracts timestamp from recording filename
 * @param {string} filename - The recording filename
 * @returns {Date|null} Extracted date or null if no timestamp found
 */
function extractTimestampFromFilename(filename) {
    // Assuming filename format includes timestamp, e.g., recording_20231215_143000.flv
    const timestampMatch = filename.match(/(\d{8}_\d{6})/);
    if (timestampMatch) {
        const timestamp = timestampMatch[1];
        const year = timestamp.substr(0, 4);
        const month = timestamp.substr(4, 2);
        const day = timestamp.substr(6, 2);
        const hour = timestamp.substr(9, 2);
        const minute = timestamp.substr(11, 2);
        const second = timestamp.substr(13, 2);
        
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }
    return null;
}

/**
 * Displays the list of recordings
 * @param {Array} recordings - Array of recording objects
 */
function displayRecordings(recordings) {
    const recordingList = document.getElementById('recording-list');
    
    if (recordings.length === 0) {
        recordingList.innerHTML = '<li class="no-recordings">No recordings available</li>';
        return;
    }
    
    recordingList.innerHTML = '';
    
    // Sort recordings by timestamp (newest first)
    recordings.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
            return b.timestamp - a.timestamp;
        }
        return 0;
    });
    
    recordings.forEach(recording => {
        const li = document.createElement('li');
        li.className = 'recording-item';
        
        const link = document.createElement('a');
        link.href = recording.url;
        link.className = 'recording-link';
        
        // Format the display text
        if (recording.timestamp) {
            const formattedDate = recording.timestamp.toLocaleString();
            link.textContent = `Recording - ${formattedDate}`;
        } else {
            link.textContent = recording.filename;
        }
        
        // Add click handler to play the recording
        link.addEventListener('click', function(e) {
            e.preventDefault();
            playRecording(recording.url);
            
            // Highlight selected recording
            document.querySelectorAll('.recording-item').forEach(item => {
                item.classList.remove('selected');
            });
            li.classList.add('selected');
        });
        
        li.appendChild(link);
        recordingList.appendChild(li);
    });
}

/**
 * Plays a recording using FLV.js
 * @param {string} url - URL of the recording to play
 */
function playRecording(url) {
    const videoPlayer = document.getElementById('recording-player');
    
    if (!flvjs.isSupported()) {
        alert('FLV playback is not supported in this browser.');
        return;
    }
    
    // Clean up existing player if any
    if (videoPlayer.flvPlayer) {
        videoPlayer.flvPlayer.destroy();
    }
    
    // Create and initialize FLV player
    const flvPlayer = flvjs.createPlayer({
        type: 'flv',
        url: url
    });
    
    flvPlayer.attachMediaElement(videoPlayer);
    flvPlayer.load();
    flvPlayer.play();
    
    // Store player instance for cleanup
    videoPlayer.flvPlayer = flvPlayer;
    
    // Handle errors
    flvPlayer.on(flvjs.Events.ERROR, (errorType, errorDetail) => {
        console.error('FLV Player Error:', errorType, errorDetail);
        alert('Error playing recording. Please try again.');
    });
}

/**
 * Shows an error message in the recording list
 * @param {HTMLElement} container - Container element for the error message
 * @param {string} message - Error message to display
 */
function showError(container, message) {
    container.innerHTML = `<li class="error-message">${message}</li>`;
}

// Initialize recordings page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the recordings page
    if (window.location.pathname.includes('/recordings')) {
        initRecordingsPage();
    }
});

// ======================================================================
// MOTION DETECTION ALERT FUNCTIONALITY
// ======================================================================

/**
 * Creates and injects the motion alert element into the DOM
 * This will be called once on page load to prepare the alert UI
 */
function createMotionAlertElement() {
    // Check if the alert element already exists to avoid duplicates
    if (document.getElementById('motion-alert')) {
        return;
    }
    
    // Create the alert container
    const alertContainer = document.createElement('div');
    alertContainer.id = 'motion-alert';
    alertContainer.className = 'motion-alert';
    alertContainer.style.display = 'none';
    
    // Create alert content
    alertContainer.innerHTML = `
        <div class="motion-alert-content">
            <div class="alert-icon">
                <i class="fas fa-running"></i>
            </div>
            <div class="alert-message">
                <h3>Motion Detected!</h3>
                <p id="motion-alert-details">Security system has detected motion.</p>
                <p class="motion-timestamp">Detected at <span id="motion-timestamp"></span></p>
            </div>
            <div class="alert-actions">
                <button id="view-camera-btn" class="alert-view-button">
                    <i class="fas fa-video"></i> View Camera
                </button>
                <button id="dismiss-alert-btn" class="alert-dismiss-button">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add styles for the alert
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .motion-alert {
            position: fixed;
            top: 80px;
            right: 20px;
            background-color: #e74c3c;
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            width: 320px;
            z-index: 9999;
            animation: slideIn 0.5s ease-out forwards;
            transition: all 0.3s ease;
        }
        
        .motion-alert.hiding {
            animation: slideOut 0.5s ease-in forwards;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .motion-alert-content {
            padding: 15px;
            position: relative;
        }
        
        .alert-icon {
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .alert-message h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
        }
        
        .alert-message p {
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
        }
        
        .motion-timestamp {
            font-size: 12px !important;
            opacity: 0.7 !important;
            margin-top: 5px !important;
        }
        
        .alert-actions {
            display: flex;
            margin-top: 15px;
            justify-content: space-between;
        }
        
        .alert-view-button {
            background-color: white;
            color: #e74c3c;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
            transition: all 0.2s;
        }
        
        .alert-view-button i {
            margin-right: 5px;
        }
        
        .alert-view-button:hover {
            background-color: #f8f8f8;
            transform: translateY(-2px);
        }
        
        .alert-dismiss-button {
            background-color: rgba(0, 0, 0, 0.2);
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .alert-dismiss-button:hover {
            background-color: rgba(0, 0, 0, 0.3);
        }
    `;
    
    // Add elements to the document
    document.head.appendChild(styleElement);
    document.body.appendChild(alertContainer);
    
    // Add event listeners
    document.getElementById('view-camera-btn').addEventListener('click', function() {
        window.location.href = '/SMS';
    });
    
    document.getElementById('dismiss-alert-btn').addEventListener('click', function() {
        hideMotionAlert();
    });
}

/**
 * Shows the motion alert with current timestamp
 * @param {Object} options - Optional configuration for the alert
 */
function showMotionAlert(options = {}) {
    const alertElement = document.getElementById('motion-alert');
    if (!alertElement) {
        createMotionAlertElement();
    }
    
    // Update timestamp
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    document.getElementById('motion-timestamp').textContent = timestamp;
    
    // Update custom message if provided
    if (options.message) {
        document.getElementById('motion-alert-details').textContent = options.message;
    }
    
    // Show the alert
    alertElement.style.display = 'block';
    alertElement.classList.remove('hiding');
    
    // Play alert sound if available
    playAlertSound();
}

/**
 * Hides the motion alert with animation
 */
function hideMotionAlert() {
    const alertElement = document.getElementById('motion-alert');
    if (!alertElement) return;
    
    // Add hiding animation class
    alertElement.classList.add('hiding');
    
    // Hide element after animation completes
    setTimeout(() => {
        alertElement.style.display = 'none';
    }, 500);
}

/**
 * Plays a sound when motion is detected
 */
function playAlertSound() {
    // Check if we have an audio element already
    let alertSound = document.getElementById('motion-alert-sound');
    
    // Create audio element if it doesn't exist
    if (!alertSound) {
        alertSound = document.createElement('audio');
        alertSound.id = 'motion-alert-sound';
        alertSound.src = '/static/sounds/alert.mp3'; // Make sure this file exists
        document.body.appendChild(alertSound);
    }
    
    // Try to play the sound (may fail due to browser autoplay restrictions)
    try {
        alertSound.currentTime = 0;
        const playPromise = alertSound.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('Browser prevented audio autoplay:', error);
            });
        }
    } catch (e) {
        console.warn('Error playing alert sound:', e);
    }
}

// Initialize the motion alert element when page loads
document.addEventListener('DOMContentLoaded', function() {
    createMotionAlertElement();
});

function testMotionAlert(motionDetected = true) {
    if (motionDetected) {
        showMotionAlert({
            message: "Test motion detected - triggered manually"
        });
        console.log("Motion alert shown (test)");
    } else {
        hideMotionAlert();
        console.log("Motion alert hidden (test)");
    }
}