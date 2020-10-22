import json

import requests
import os

MAX_OFFERS = 100
MERCHANT_API_URL = f'https://sandbox.api.visa.com/vmorc/offers/v1/all?&&max_offers={MAX_OFFERS}'


def get_merchant_offers_by_country(country_code):
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

    r = requests.get(url, headers=headers, cert=certs)
    r_dict = r.json()
    response = []
    for offer in r_dict['Offers']:
        merchant_list = [{
            'merchantId': merchant['merchantId'],
            'merchant': merchant['merchant']
        } for merchant in offer['merchantList']]

        curr = {
            'offerId': offer['offerId'],
            'offerShortDescription': offer['offerShortDescription']['text'],
            'offerTitle': offer['offerTitle'],
            'visaTerms': offer['visaTerms']['text'],
            'redemptionChannelList': offer['redemptionChannelList'],
            'merchantList': merchant_list,
            'redemptionUrl': offer['redemptionUrl']
        }
        response.append(curr)

    return response


def get_merchant_offers_by_offerid(offer_id):
    url = MERCHANT_API_URL + f'&&offerid={offer_id}'
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

    r = requests.get(url, headers=headers, cert=certs)
    r_dict = r.json()
    response = []
    for offer in r_dict['Offers']:
        merchant_list = [{
            'merchantId': merchant['merchantId'],
            'merchant': merchant['merchant']
        } for merchant in offer['merchantList']]

        curr = {
            'offerId': offer['offerId'],
            'offerShortDescription': offer['offerShortDescription']['text'],
            'offerTitle': offer['offerTitle'],
            'visaTerms': offer['visaTerms']['text'],
            'redemptionChannelList': offer['redemptionChannelList'],
            'merchantList': merchant_list,
            'redemptionUrl': offer['redemptionUrl']
        }
        response.append(curr)

    return response
