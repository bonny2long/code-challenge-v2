import pytest
from datetime import date

from django.shortcuts import reverse
from rest_framework.test import APIClient

from map.models import CommunityArea, RestaurantPermit


@pytest.mark.django_db
def test_map_data_view():
    # Create some test community areas
    area1 = CommunityArea.objects.create(name="Beverly", area_id="1")
    area2 = CommunityArea.objects.create(name="Lincoln Park", area_id="2")

    # Test permits for Beverly (2 permits in 2021)
    RestaurantPermit.objects.create(
        community_area_id=area1.area_id, issue_date=date(2021, 1, 15)
    )
    RestaurantPermit.objects.create(
        community_area_id=area1.area_id, issue_date=date(2021, 2, 20)
    )

    # Test permits for Lincoln Park (3 permits in 2021)
    RestaurantPermit.objects.create(
        community_area_id=area2.area_id, issue_date=date(2021, 3, 10)
    )
    RestaurantPermit.objects.create(
        community_area_id=area2.area_id, issue_date=date(2021, 2, 14)
    )
    RestaurantPermit.objects.create(
        community_area_id=area2.area_id, issue_date=date(2021, 6, 22)
    )

    # Add a permit in a different year to make sure filtering works
    RestaurantPermit.objects.create(
        community_area_id=area1.area_id, issue_date=date(2020, 5, 10)
    )

    # Query the map data endpoint
    client = APIClient()
    url = reverse("map_data") + "?year=2021"
    response = client.get(url)

    # Assert status code
    assert response.status_code == 200

    # Build a lookup by area name for easy assertions
    data_by_name = {item["name"]: item for item in response.data}

    # Beverly should have 2 permits in 2021
    assert data_by_name["Beverly"]["num_permits"] == 2

    # Lincoln Park should have 3 permits in 2021
    assert data_by_name["Lincoln Park"]["num_permits"] == 3
