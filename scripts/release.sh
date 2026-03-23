#!/bin/bash
# scripts/release.sh -- Commands to run on every Heroku release

set -euo pipefail

python manage.py migrate --noinput
python manage.py createcachetable && python manage.py clear_cache

# Automatic initial data loading if the database is empty.
if [ $(python manage.py shell -c "from map.models import CommunityArea; print(CommunityArea.objects.count())") -eq "0" ]; then
    python manage.py loaddata map/fixtures/restaurant_permits.json map/fixtures/community_areas.json
fi
