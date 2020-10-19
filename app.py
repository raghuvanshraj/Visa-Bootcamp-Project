from flask import Flask
from flask import redirect, url_for, render_template, request, flash, session,jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, IntegerField, BooleanField
from wtforms.validators import InputRequired, Email, Length, Optional, ValidationError
from flask_login import login_user, login_required, logout_user, current_user, LoginManager
from flask_bootstrap import Bootstrap
import json
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://dkaalsgsvycdnw:b12fae3ad33a83367352a4b72ef8e5843703134eeaada07ef5' \
                                        'dc890850b5b74b@ec2-54-160-202-3.compute-1.amazonaws.com:5432/d5ou4mml7frs0o'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
db = SQLAlchemy(app)
bootstrap = Bootstrap(app)

# Secret key for csrf
SECRET_KEY = os.urandom(32)
app.config['SECRET_KEY'] = SECRET_KEY

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.session_protection = "strong"
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(username):
    try:
        return User.query.filter_by(username=username).first()
    except:
        return None


# Tables
class UserCredentials(db.Model):
    __tablename__ = 'user_credentials'
    username = db.Column('username', db.Text, primary_key=True)
    password = db.Column('password', db.Text)


class User(db.Model):
    __tablename__ = 'user'
    username = db.Column('username', db.Text, primary_key=True)
    email = db.Column('email', db.Text)
    fname = db.Column('fname', db.Text)
    lname = db.Column('lname', db.Text)
    points = db.Column('points', db.Integer)
    
    def get_id(self):
        return (self.username)
    
    def is_active(self):
        """True, as all users are active."""
        return True
    
    def is_authenticated(self):
        """Return True if the user is authenticated."""
        return True

# Forms
class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[InputRequired()])
    first_name = StringField('First Name', validators=[InputRequired()])
    last_name = StringField('Last Name', validators=[InputRequired()])
    email = StringField('Email', validators=[InputRequired()])
    password = PasswordField('Password', validators=[InputRequired(), Length(min=8)])
    password2 = PasswordField('Confirm Password', validators=[InputRequired(), Length(min=8)])


class LoginForm(FlaskForm):
    user_login = StringField('username or email', validators=[InputRequired()])
    password = PasswordField('password', validators=[InputRequired()])


'''
@app.route('/login', methods=['GET'])
def login():
    request_body = request.get_json()
    user_credentials = UserCredentials.query.get(request_body['username'])

    response = dict()
    if user_credentials is not None:
        if user_credentials.password == request_body['password']:
            response['status'] = 'SUCCESS'
            user = User.query.filter_by(username=request_body['username']).first()
            login_user(user)
            session.permanent = True
            return redirect(url_for('welcome'))
        else:
            response['status'] = 'INCORRECT_PASSWORD'
    else:
        response['status'] = 'INCORRECT_USERNAME'

    return json.dumps(response)


@app.route('/user', methods=['GET'])
def get_user_details():
    request_body = request.get_json()
    user_details = User.query.get(request_body['username'])
    response = dict()
    if user_details is not None:
        response['status'] = 'SUCCESS'
        user_details_dict = user_details.__dict__
        _ = user_details_dict.pop('_sa_instance_state')
        response['response'] = user_details_dict
    else:
        response['status'] = 'INCORRECT_USERNAME'

    return json.dumps(response)
'''

@app.route('/register', methods=['GET', 'POST'])
def register():
    try:
        registration_form = RegistrationForm()

        if registration_form.validate_on_submit():
            # verify the user first before adding to db
            # referral_code=''.join(random.choices(string.ascii_letters + string.digits, k=6))
            
            #check whether user's 2 keyed passwords are the same
            pw1 = registration_form.password.data
            pw2 = registration_form.password2.data
            
            if pw1 != pw2:
                flash('Your passwords do not match. Please try again.')
                return redirect(url_for('register'))
            
            
            new_user = User(username=registration_form.username.data,
                            fname=registration_form.first_name.data,
                            lname=registration_form.last_name.data,
                            email=registration_form.email.data,
                            password=registration_form.password.data,
                            points=150)

            db.session.add(new_user)
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                flash('Something went wrong. Please try again.')
                return redirect(url_for('register'))

            

            login_user(new_user)
            flash('Thank you for signing up! Please login')
            return redirect(url_for('login'))
    except OperationalError as e:
        flash('Database server is down. Please contact the system administrator.')
    except Exception as e:
        flash(str(e) + ". Please contact the system administrator.")

    return render_template("Register.html", registrationform=registration_form)


@app.route('/', methods = ['GET', 'POST'])
def login():
    registration_form = RegistrationForm()
    login_form = LoginForm()

    if login_form.validate_on_submit():
        user_login = login_form.user_login.data
        user=User.query.filter_by(username=user_login).first()
        user_password = UserCredentials.query.filter_by(username=user_login).first().password

        if user_password == login_form.password.data:
            login_user(user)
            session.permanent = True
            print(user)
            print("redirecting")
            return redirect(url_for('home'))
        else:
            print("some shit happened")

    return render_template("Login.html",  registration_form=registration_form, loginform=login_form)

@app.route('/home')
@login_required
def home():
    return render_template("Home.html")


@app.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    if current_user.is_authenticated:
        logout_user()

    return redirect(url_for('login'))

'''
@app.route('/wheel', methods=['GET'])
def wheel():

    is_submitted = "confirm" in request.form
    
    if is_submitted:
        if current_user.points - 15 < 0:
            flash('You do not have enough points.')
            return redirect(url_for('wheel'))
        
        current_user.points = current_user.points - 15
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            flash('Something went wrong. Please try again.')
            return redirect(url_for('wheel'))
        
        flash('15 points have been deducted from your account')
        return redirect(url_for('spinwheel'))
    
    
    return render_template("wheel.html")
'''


if __name__ == '__main__':
    app.debug = True
    app.run()
