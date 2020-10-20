import os

from flask import Flask
from flask import redirect, url_for, render_template, request, flash, session,jsonify
from flask_bootstrap import Bootstrap
from flask_login import login_user, login_required, logout_user, current_user, LoginManager
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import OperationalError, IntegrityError
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, IntegerField, BooleanField
from wtforms.validators import InputRequired, Email, Length, Optional, ValidationError
from flask_login import login_user, login_required, logout_user, current_user, LoginManager
from flask_bootstrap import Bootstrap
import json
import os
import traceback
import random

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
    first_name = db.Column('first_name', db.Text)
    last_name = db.Column('last_name', db.Text)
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
    confirm_password = PasswordField('Confirm Password', validators=[InputRequired(), Length(min=8)])


class LoginForm(FlaskForm):
    username = StringField('username or email', validators=[InputRequired()])
    password = PasswordField('password', validators=[InputRequired()])


@app.route('/register', methods=['GET', 'POST'])
def register():
    registration_form = RegistrationForm()

    if registration_form.validate_on_submit():
        # verify the user first before adding to db
        # referral_code=''.join(random.choices(string.ascii_letters + string.digits, k=6))

        # check whether user's 2 keyed passwords are the same
        pw1 = registration_form.password.data
        pw2 = registration_form.confirm_password.data

        if pw1 != pw2:
            flash('Your passwords do not match. Please try again.')
            return redirect(url_for('register'))

        new_user = User(
            username=registration_form.username.data,
            first_name=registration_form.first_name.data,
            last_name=registration_form.last_name.data,
            email=registration_form.email.data,
            # Give some starting points
            points=500
        )

        new_user_credentials = UserCredentials(
            username=registration_form.username.data,
            password=registration_form.password.data
        )

        try:
            db.session.add(new_user)
            db.session.add(new_user_credentials)
            db.session.commit()
        except IntegrityError as e:
            db.session.rollback()
            flash('Username taken, please choose a new one')
            return redirect(url_for('register'))
        except OperationalError:
            db.session.rollback()
            flash('Database server is down. Please contact the system administrator.')
        except Exception as e:
            db.session.rollback()
            flash(str(e) + ". Please contact the system administrator.")

        login_user(new_user)
        flash('Thank you for signing up! Please login')
        return redirect(url_for('login'))

    return render_template("register.html", registrationform=registration_form)


@app.route('/', methods=['GET', 'POST'])
def login():
    registration_form = RegistrationForm()
    login_form = LoginForm()

    if login_form.validate_on_submit():
        user_login = login_form.username.data
        user=User.query.filter_by(username=user_login).first()
        user_password = UserCredentials.query.filter_by(username=user_login).first().password

        if user_password == login_form.password.data:
            login_user(user)
            session.permanent = True
            print(user)
            print("redirecting")
            return redirect(url_for('home'))
        else:
            print("Please try again")
        username = login_form.username.data
        user = User.query.get(username)
        user_credentials = UserCredentials.query.get(username)
        if user_credentials is not None:
            if user_credentials.password == login_form.password.data:
                login_user(user)
                session.permanent = True
                print(user)
                print("redirecting")
                return redirect(url_for('home'))
            else:
                print('some shit happened')

    return render_template("login.html", registration_form=registration_form, loginform=login_form)


@app.route('/home', methods = ['GET', 'POST'])
@login_required
def home():
    segment_chosen = random.randint(1, 8)
    print(segment_chosen)
        
    return render_template("Home.html", segment_chosen=segment_chosen)


@app.route('/claim_prize', methods = ['POST'])
@login_required
def claim_prize():
    # Call Visa API to get offer based on the segment that the pointer points at on the wheel
    if current_user.points - 15 <= 0:
        flash("You have insufficient points")
        return redirect(url_for('home'))
    
    segment_chosen = request.form['segment']
    points_left = current_user.points - 15
    current_user.points = points_left
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        flash('Something went wrong. Please try again.')
        return redirect(url_for('home'))
    
    
    if (int(segment_chosen)==4 or int(segment_chosen)==8):
        flash('Too bad! Try again')
    else:
        flash('You got segment ' + segment_chosen + '. You have ' + str(points_left) + ' points left.')
    return redirect(url_for('home'))


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
