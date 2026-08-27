from rest_framework import permissions, viewsets

from .models import Team
from .serializers import TeamSerializer


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Team.objects.filter(
            members__user=self.request.user,
            members__is_active=True,
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)