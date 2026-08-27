from rest_framework import permissions, viewsets

from .models import Project
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(
            team__members__user=self.request.user,
            team__members__is_active=True,
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)