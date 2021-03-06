from flask import Flask
from flask import redirect, url_for, render_template, request, flash, session
from flask_bootstrap import Bootstrap
from flask_login import login_user, login_required, logout_user, current_user, LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, PasswordField, IntegerField, BooleanField
from wtforms.validators import InputRequired, Email, Length, Optional, ValidationError
from flask_login import login_user, login_required, logout_user, current_user, LoginManager
from flask_bootstrap import Bootstrap
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import traceback
import random
from sqlalchemy.exc import OperationalError, IntegrityError
from sqlalchemy import ForeignKey

from visa_api import get_merchant_offers_by_country, get_merchant_offers_by_offerid

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://nnxfxopdedshdl:7aa1ba04b58fcd9e92b515b82db39d54be090105d3c74ab14f500a9662b8dad9@ec2-52-21-247-176.compute-1.amazonaws.com:5432/d1q0santvsss6r'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
db = SQLAlchemy(app)
bootstrap = Bootstrap(app)

# Country Codes
COUNTRY_CODES = {
    'Canada': 38,
    'China': 44,
    'Denmark': 58,
    'Peru': 175,
    'United Arab Emirates': 232,
    'United States of America': 234
}

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
    country_code = db.Column('country_code', db.Integer)

    def get_id(self):
        return self.username

    def is_active(self):
        """True, as all users are active."""
        return True

    def is_authenticated(self):
        """Return True if the user is authenticated."""
        return True


class UsersOffers(db.Model):
    __tablename__ = 'users_offers'
    hash_id = db.Column('hash_id', db.BigInteger, primary_key=True)
    username = db.Column('username', db.Text, ForeignKey('user.username'))
    offer_id = db.Column('offer_id', db.Integer)


# Forms
class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[InputRequired()])
    first_name = StringField('First Name', validators=[InputRequired()])
    last_name = StringField('Last Name', validators=[InputRequired()])
    email = StringField('Email', validators=[InputRequired()])
    country = SelectField('Country', choices=list(COUNTRY_CODES.keys()), validators=[InputRequired()])
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
            points=1000,
            country_code=COUNTRY_CODES[registration_form.country.data]
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
        flash('Thank you for signing up!')
        return redirect(url_for('login'))

    return render_template("register.html", registrationform=registration_form)


@app.route('/', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    registration_form = RegistrationForm()
    login_form = LoginForm()
    
    if login_form.validate_on_submit():

        username = login_form.username.data
        user = User.query.get(username)
        user_credentials = UserCredentials.query.get(username)
        if user_credentials is not None:
            if user_credentials.password == login_form.password.data:
                login_user(user)
                session.permanent = True
                # print(user)
                print("redirecting")
                return redirect(url_for('home'))
            else:
                flash('Invalid credentials!')
                print('Invalid credentials!')
        else:
            print("user credentials not found")
            flash("user credentials not found")

    return render_template("login.html", registration_form=registration_form, loginform=login_form)


@app.route('/home', methods=['GET', 'POST'])
@login_required
def home():
    print(current_user.country_code)
    segment_chosen = random.randint(1, 8)
    if current_user.points - 15 <= 0:
        # Assign segment_chosen to be a number outside of the available segments
        segment_chosen = 9
        flash("You have insufficient points")
    
    hashed_segment = generate_password_hash(str(segment_chosen), method='pbkdf2:sha256')
    session['segment'] = hashed_segment
    
    offers = get_merchant_offers_by_country(current_user.country_code)
    data = []
    counter = 1
    for offer in offers:
        hash_id = hash(f'{current_user.username}#{offer["offerId"]}')
        if UsersOffers.query.get(hash_id) is None:
            offer['counter'] = counter
            counter += 1
            data.append(offer)
            if len(data) == 6:
                break

    session['offers'] = data
    return render_template("home.html", segment_chosen=segment_chosen, offers=data)


@app.route('/claim_prize', methods=['POST'])
@login_required
def claim_prize():
    # Call Visa API to get offer based on the segment that the pointer points at on the wheel
    if current_user.points - 15 < 0:
        flash("You have insufficient points")
        return redirect(url_for('home'))

    # Check against HTML injection
    segment_chosen = request.form['segment']
    hashed_segment = session.pop('segment')
    
    if not(check_password_hash(hashed_segment, segment_chosen)):
        segment_chosen = '0'
    
    # User attempted HTML injection
    if segment_chosen == '0':
        flash('You attempted an injection attack. Authorities have been informed.')
        return redirect(url_for('home'))
    
    points_left = current_user.points - 15
    
    try:
        current_user.points = points_left
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(e)
        flash('Something went wrong. Please try again.')
        return redirect(url_for('home'))

    if int(segment_chosen) != 4 and int(segment_chosen) != 8:
        curr_segment = int(segment_chosen)
        print(curr_segment)
        if curr_segment >= 4:
            curr_segment -= 1
        offers = session['offers']
        print(offers)
        offer_id = None
        for offer in offers:
            if offer['counter'] == curr_segment:
                offer_id = offer['offerId']
                break

        new_users_offers = UsersOffers(
            hash_id=hash(f'{current_user.username}#{offer_id}'),
            username=current_user.username,
            offer_id=offer_id
        )

        print(new_users_offers.__dict__)

        try:
            db.session.add(new_users_offers)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            flash('Selected offer is already claimed')
        except OperationalError:
            db.session.rollback()
            flash('Database server not responding, please try later')
        except Exception as e:
            db.session.rollback()
            print(e)
            flash('Something went wrong. Please try again.')
            return redirect(url_for('home'))

    if int(segment_chosen) == 4 or int(segment_chosen) == 8:
        flash('Too bad! Try again')
    else:
        flash('You got Offer ' + segment_chosen + '. You have ' + str(points_left) + ' points left.')
    
    return redirect(url_for('home'))


@app.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    if current_user.is_authenticated:
        logout_user()

    return redirect(url_for('login'))


@app.route('/rewards', methods=['GET'])
@login_required
def rewards():
    data = []
    offers = UsersOffers.query.filter_by(username=current_user.username).all()
    for offer in offers:
        data.append(get_merchant_offers_by_offerid(offer.offer_id))

    if current_user.is_authenticated:
        return render_template("rewards.html", rewards=data)
    else:
        return redirect(url_for('login'))


if __name__ == '__main__':
    # app.debug = True
    app.run()
