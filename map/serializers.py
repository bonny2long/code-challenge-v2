from rest_framework import serializers

from map.models import CommunityArea, RestaurantPermit


class CommunityAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityArea
        fields = ["name", "area_id", "num_permits"]

    num_permits = serializers.SerializerMethodField()

    def get_num_permits(self, obj):
        """
        Calculates the total number of restaurant permits for this community area
        within the year specified in the serializer context.
        
        Args:
            obj: The CommunityArea instance being serialized.
            
        Returns:
            int: The count of matched RestaurantPermit records.
        """
        year = self.context.get("year")

        filters = {"community_area_id": str(obj.area_id)}
        if year:
            try:
                filters["issue_date__year"] = int(year)
            except (ValueError, TypeError):
                pass

        return RestaurantPermit.objects.filter(**filters).count()
