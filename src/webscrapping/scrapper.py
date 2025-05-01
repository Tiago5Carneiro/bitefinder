# This snippet has been automatically generated and should be regarded as a
# code template only.
# It will require modifications to work:
# - It may require correct/in-range values for request initialization.
# - It may require specifying regional endpoints when creating the service
#   client as shown in:
#   https://googleapis.dev/python/google-api-core/latest/client_options.html
import asyncio

from google.maps import places_v1
from google.api_core.client_options import ClientOptions
from google.type import latlng_pb2

response = []

def sample_get_place(api_key_string):
    # Create a client
    client_op = ClientOptions(api_key= api_key_string)
    client = places_v1.PlacesClient(client_options=client_op)

    
    # Initialize request argument(s)
    center = latlng_pb2.LatLng(latitude=40.2115, longitude=-8.4292 )
    circle = places_v1.Circle(center = center, radius = 10000)
    restriction = places_v1.SearchNearbyRequest.LocationRestriction()
    restriction.circle = circle

    # Initialize request argument(s)
    request = places_v1.SearchNearbyRequest(location_restriction = restriction,included_types=["restaurant"])

    # Make the request
    response = client.search_nearby(request=request, metadata=[("x-goog-fieldmask", "places.displayName,places.photos,places.priceRange,places.priceLevel,places.rating,places.location,places.googleMapsUri")])

    # Handle the response
    return response

#sample_get_place("AIzaSyCFKZFyqSQINfoC-UoYoND9WN2f45HVz1A")
