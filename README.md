# Guardian Angel

Guardian Angel is a Flask-based web application that serves as a home security and monitoring system. It provides user authentication, device management, live security monitoring with video streams and recordings, as well as environmental monitoring with sensor data charts and motion alerts.

## Features

- **User Authentication**  
  - Register, login, and update your profile  
  - Templates: [templates/register.html](templates/register.html) and [templates/index.html](templates/index.html)

- **Device Management**  
  - Add, update, and delete hardware devices  
  - Separate sections for Security Monitoring (SMS) and Environmental Monitoring (EMCS)  
  - API routes defined in [app.py](app.py) (e.g., `/api/devices`, `/api/devices/<device_id>`)

- **Security Monitoring (SMS)**  
  - Live video streaming with HLS.js for the security camera feed  
  - Review past recordings  
  - Templates: [templates/SMS.html](templates/SMS.html) and [templates/recordings.html](templates/recordings.html)

- **Environmental Monitoring (EMCS)**  
  - View current temperature, humidity, and light status  
  - Visualize trends using Chart.js  
  - Template: [templates/EMCS.html](templates/EMCS.html)

- **Motion Alerts**  
  - Real-time motion detection alerts with sound and user notifications  
  - Implemented in [static/script.js](static/script.js)

## Project Structure
```
Guardian Angel/
├── app.py
├── requirements.txt
├── static/
│   ├── script.js
│   ├── stylesheet.css
│   └── icons/
│       └── logo.png
├── templates/
│   ├── index.html
│   ├── register.html
│   ├── homepage.html
│   ├── profile.html
│   ├── devices.html
│   ├── SMS.html
│   ├── EMCS.html
│   └── recordings.html
```

## Setup

1. **Clone the Repository:**

    ```sh
    git clone <repository_url>
    cd Guardian-Angel
    ```

2. **Create a Virtual Environment and Install Dependencies:**

    ```sh
    python3 -m venv venv
    source venv/bin/activate   # On Windows use: venv\Scripts\activate
    pip install -r requirements.txt
    ```

3. **Run the Application:**

    ```sh
    python app.py
    ```

    The app will start on [http://127.0.0.1:5000/](http://127.0.0.1:5000/)

## Database

- Uses SQLite for local development.
- The `guardian_angel.db` file is created automatically on first run.
- Models are defined in [app.py](http://_vscodecontentref_/12) (see the [User](http://_vscodecontentref_/13), [Device](http://_vscodecontentref_/14), and [SensorData](http://_vscodecontentref_/15) classes).

## API Endpoints

The application provides several API endpoints for AJAX interactions:

- **User:**
  - `GET /api/user` – Retrieves current user information.

- **Devices:**  
  - `GET /api/devices` – List all devices for the logged-in user.
  - `POST /api/devices` – Add a new device.
  - `PUT /api/devices/<device_id>` – Update an existing device.
  - `PUT /api/devices/<device_id>/status` – Update the connection status (connected/disconnected).
  - `DELETE /api/devices/<device_id>` – Delete a device.

- **Sensor Data:**  
  - `POST /api/sensor-data` – Save a new sensor reading.
  - `GET /api/sensor-data/<sensor_type>?hours=xx` – Retrieve sensor data from the past ‘xx’ hours.

## Frontend

- **Templates:**  
  HTML files in the templates folder render the pages.
- **Styles:**  
  Styling is defined in [stylesheet.css](http://_vscodecontentref_/16)
- **JavaScript:**  
  Shared functionality is provided by [script.js](http://_vscodecontentref_/17) including navigation, AJAX calls, and sensor data updates.
- **Icons:**  
  Font Awesome is loaded via CDN for iconography and [logo.png](http://_vscodecontentref_/18) is used for branding.

## Testing & Deployment

- Run the app in debug mode locally using [python app.py](http://_vscodecontentref_/19).  
- For production, disable debug mode and consider deploying with a production-ready server (e.g., Gunicorn or uWSGI).

## License

This project is for educational purposes. Modify and use as needed.
