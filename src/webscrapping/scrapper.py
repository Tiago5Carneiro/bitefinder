# This snippet has been automatically generated and should be regarded as a
# code template only.
# It will require modifications to work:
# - It may require correct/in-range values for request initialization.
# - It may require specifying regional endpoints when creating the service
#   client as shown in:
#   https://googleapis.dev/python/google-api-core/latest/client_options.html
import os 
from dotenv import load_dotenv

import json

from google.maps import places_v1
from google.api_core.client_options import ClientOptions
from google.type import latlng_pb2

load_dotenv()

def sample_get_place(api_key_string):
    # Create a client
    client_op = ClientOptions(api_key= api_key_string)
    client = places_v1.PlacesClient(client_options=client_op)

    
    # Initialize request argument(s)
    center_coimbra = latlng_pb2.LatLng(latitude=40.2115, longitude=-8.4292 )
    center_porto = latlng_pb2.LatLng(latitude=41.15, longitude=-8.61024 )
    center_lisboa = latlng_pb2.LatLng(latitude=38.7071, longitude=-9.13549 )
    circle = places_v1.Circle(center = center_coimbra, radius = 10000)
    restriction = places_v1.SearchNearbyRequest.LocationRestriction()
    restriction.circle = circle

    places_v1.Place()

    # Initialize request argument(s)
    request = places_v1.SearchNearbyRequest(location_restriction = restriction,included_types=["restaurant"])

    # Make the request
    resp_dic = {}
    response = client.search_nearby(request=request, metadata=[("x-goog-fieldmask", "places.displayName,places.photos,places.priceRange,places.priceLevel,places.rating,places.googleMapsUri,places.primaryType,places.id")])

    place_list = []

    for place in response.places:
        photo_list = []

        for p in place.photos:
            photo_req = places_v1.GetPhotoMediaRequest(name=p.name + "/media",max_height_px = p.height_px)
            photo_resp = client.get_photo_media(request = photo_req)
            photo_list.append(photo_resp.photo_uri)

        resp_dic[place.id] = {"displayName": place.display_name.text,
                              "priceRange": {"start": place.price_range.start_price.units, "end": place.price_range.end_price.units},
                              "priceLevel": place.price_level,
                              "rating": place.rating,
                              "mapsURI": place.google_maps_uri,
                              "photos": photo_list,
                              "primaryType": place.primary_type}

    # Handle the response
    return resp_dic

print(json.dumps(sample_get_place(os.getenv("KEY"))))
