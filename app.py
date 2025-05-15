from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
from datetime import timedelta, datetime

# Initialize Flask application
app = Flask(__name__) 
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_change_in_production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///guardian_angel.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.permanent_session_lifetime = timedelta(days=7)  # Session lasts for 7 days

# Initialize database
db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Device(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    device_type = db.Column(db.String(50), nullable=False)
    device_name = db.Column(db.String(100), nullable=False)
    device_ip = db.Column(db.String(50))
    device_model = db.Column(db.String(100))
    device_pin = db.Column(db.String(50))
    subsystem = db.Column(db.String(20), nullable=False)  # 'sms' or 'emcs'
    status = db.Column(db.String(20), default='connected')  # 'connected' or 'disconnected'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('devices', lazy=True))

class SensorData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sensor_type = db.Column(db.String(50), nullable=False)  # 'temperature', 'humidity', 'light'
    value = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'sensor_type': self.sensor_type,
            'value': self.value,
            'timestamp': self.timestamp.isoformat()
        }

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Handle AJAX request for login
        if request.is_json:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            
            user = User.query.filter_by(email=email).first()
            
            if user and user.check_password(password):
                session.permanent = True
                session['user_id'] = user.id
                session['user_name'] = user.name
                # Return the absolute URL to make sure redirect works properly
                return jsonify({'success': True, 'redirect': '/homepage'})
            else:
                return jsonify({'success': False, 'message': 'Invalid email or password'})
        
        # Handle form submission
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            session.permanent = True
            session['user_id'] = user.id
            session['user_name'] = user.name
            return redirect(url_for('homepage'))
        else:
            flash('Invalid email or password')
            return redirect(url_for('login'))
            
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        phone = request.form.get('phone')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already registered.')
            return redirect(url_for('register'))
        
        # Create and store new user
        new_user = User(name=name, phone=phone, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        flash('Account created successfully. Please login.')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/homepage')
@login_required
def homepage():
    return render_template('homepage.html')

@app.route('/SMS')
@login_required
def sms():
    return render_template('SMS.html')

@app.route('/EMCS')
@login_required
def emcs():
    return render_template('EMCS.html')

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    user = User.query.get(session['user_id'])
    
    if request.method == 'POST':
        # Handle AJAX profile update
        if request.is_json:
            data = request.get_json()
            
            # Update user information
            if 'name' in data:
                user.name = data['name']
            if 'email' in data and data['email'] != user.email:
                # Check if email already exists
                existing_user = User.query.filter_by(email=data['email']).first()
                if existing_user and existing_user.id != user.id:
                    return jsonify({'success': False, 'message': 'Email already in use'})
                user.email = data['email']
            if 'phone' in data:
                user.phone = data['phone']
            if 'password' in data and data['password']:
                user.set_password(data['password'])
            
            db.session.commit()
            return jsonify({'success': True, 'message': 'Profile updated successfully'})
        
        # Handle form submission
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        password = request.form.get('password')
        
        if email != user.email:
            # Check if email already exists
            existing_user = User.query.filter_by(email=email).first()
            if existing_user and existing_user.id != user.id:
                flash('Email already in use')
                return redirect(url_for('profile'))
        
        user.name = name
        user.email = email
        user.phone = phone
        
        if password:
            user.set_password(password)
        
        db.session.commit()
        flash('Profile updated successfully')
        
    return render_template('profile.html', user=user)

@app.route('/devices')
@login_required
def devices():
    user_devices = Device.query.filter_by(user_id=session['user_id']).all()
    return render_template('devices.html', devices=user_devices)

@app.route('/recordings')
@login_required
def recordings():
    return render_template('recordings.html')

# API routes for AJAX requests
@app.route('/api/user', methods=['GET'])
@login_required
def get_user():
    user = User.query.get(session['user_id'])
    return jsonify({
        'name': user.name,
        'email': user.email,
        'phone': user.phone
    })

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    
    # Check if email already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'success': False, 'message': 'Email already registered'})
    
    # Create new user
    new_user = User(
        name=data['name'],
        email=data['email'],
        phone=data.get('phone', '')
    )
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Registration successful'})

# Add API routes for device management
@app.route('/api/devices', methods=['GET'])
@login_required
def get_devices():
    devices = Device.query.filter_by(user_id=session['user_id']).all()
    return jsonify([{
        'id': device.id,
        'device_type': device.device_type,
        'device_name': device.device_name,
        'device_ip': device.device_ip,
        'device_model': device.device_model,
        'device_pin': device.device_pin,
        'subsystem': device.subsystem,
        'status': device.status
    } for device in devices])

@app.route('/api/devices', methods=['POST'])
@login_required
def add_device():
    data = request.get_json()
    
    new_device = Device(
        user_id=session['user_id'],
        device_type=data['device_type'],
        device_name=data['device_name'],
        device_ip=data.get('device_ip', ''),
        device_model=data.get('device_model', ''),
        device_pin=data.get('device_pin', ''),
        subsystem=data['subsystem'],
        status='connected'
    )
    
    db.session.add(new_device)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'device': {
            'id': new_device.id,
            'device_type': new_device.device_type,
            'device_name': new_device.device_name,
            'device_ip': new_device.device_ip,
            'device_model': new_device.device_model,
            'device_pin': new_device.device_pin,
            'subsystem': new_device.subsystem,
            'status': new_device.status
        }
    })

@app.route('/api/devices/<int:device_id>', methods=['PUT'])
@login_required
def update_device(device_id):
    device = Device.query.filter_by(id=device_id, user_id=session['user_id']).first()
    if not device:
        return jsonify({'success': False, 'message': 'Device not found'}), 404
    
    data = request.get_json()
    
    device.device_name = data.get('device_name', device.device_name)
    device.device_ip = data.get('device_ip', device.device_ip)
    device.device_model = data.get('device_model', device.device_model)
    device.device_pin = data.get('device_pin', device.device_pin)
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Device updated successfully'})

@app.route('/api/devices/<int:device_id>/status', methods=['PUT'])
@login_required
def update_device_status(device_id):
    device = Device.query.filter_by(id=device_id, user_id=session['user_id']).first()
    if not device:
        return jsonify({'success': False, 'message': 'Device not found'}), 404
    
    data = request.get_json()
    device.status = data['status']
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Device status updated successfully'})

@app.route('/api/devices/<int:device_id>', methods=['DELETE'])
@login_required
def delete_device(device_id):
    device = Device.query.filter_by(id=device_id, user_id=session['user_id']).first()
    if not device:
        return jsonify({'success': False, 'message': 'Device not found'}), 404
    
    db.session.delete(device)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Device deleted successfully'})

@app.route('/api/sensor-data', methods=['POST'])
@login_required
def save_sensor_data():
    data = request.get_json()
    
    if not data or 'sensor_type' not in data or 'value' not in data:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    try:
        value = float(data['value'])

        # Create new sensor data record
        new_reading = SensorData(
            sensor_type=data['sensor_type'],
            value=data['value']
        )
    
        db.session.add(new_reading)
        db.session.commit()
    
        return jsonify({'success': True, 'data': new_reading.to_dict()})
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid value format'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/sensor-data/<sensor_type>', methods=['GET'])
@login_required
def get_sensor_data(sensor_type):
    
    hours = request.args.get('hours', 24, type=int)
    
    # Calculate the cutoff time
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    
    try:
        # Query data
        data = SensorData.query.filter(
            SensorData.sensor_type == sensor_type,
            SensorData.timestamp >= cutoff_time
        ).order_by(SensorData.timestamp.asc()).all()
        
        return jsonify({
            'success': True,
            'data': [item.to_dict() for item in data]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Create database tables
def create_tables():
    with app.app_context():
        db.create_all()
        
        # Create default user if no users exist
        if User.query.count() == 0:
            default_user = User(
                name="Example User",
                email="example@email.com",
                phone="+44 1234567890"
            )
            default_user.set_password("password")
            db.session.add(default_user)
            db.session.commit()

if __name__ == '__main__':
    create_tables()  # Create tables and default user
    app.run(debug=True)