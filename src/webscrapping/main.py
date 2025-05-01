# This snippet has been automatically generated and should be regarded as a
# code template only.
# It will require modifications to work:
# - It may require correct/in-range values for request initialization.
# - It may require specifying regional endpoints when creating the service
#   client as shown in:
#   https://googleapis.dev/python/google-api-core/latest/client_options.html
from google.maps import places_v1

response = []

async def sample_get_place():
    # Create a client
    client = places_v1.PlacesAsyncClient()

    # Initialize request argument(s)
    request = places_v1.GetPlaceRequest(
        name="name_value",
    )

    # Make the request
    response = await client.get_place(request=request)

    # Handle the response
    print(response)


await response