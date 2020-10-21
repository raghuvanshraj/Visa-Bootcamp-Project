import requests
import os

MAX_OFFERS = 6
MERCHANT_API_URL = f'https://sandbox.api.visa.com/vmorc/offers/v1/all?&&max_offers={MAX_OFFERS}'


def get_merchant_offers(country_code):
    url = MERCHANT_API_URL + f'&&redemption_country={country_code}'

    print(f'sending api request to {url}')

    headers = {
        'Authorization': 'Basic RkdKSURLRFpGSFFDQ0VTSTJCQTUyMTV1T19qYnlXU3k1RHFRd2JjbVFVNmR0dTQzbzpCQjJTa0tyM09jNHU=',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    curr_dir = os.path.dirname(os.path.abspath(__file__))
    certs = (
        str(curr_dir) + '/certs/cert.pem',
        str(curr_dir) + '/certs/key_b391edad-e45c-4f85-8025-9ed6ed358427.pem'
    )

    response = requests.get(url, headers=headers, cert=certs)

    return response
