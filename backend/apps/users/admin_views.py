from django.contrib.auth import get_user_model

from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.teams.models import Team
from apps.projects.models import Project
from apps.tasks.models import Task


User = get_user_model()


class AdminDashboardStatsView(APIView):

    permission_classes = [
        IsAdminUser
    ]

    def get(self, request):

        return Response({

            "users": User.objects.count(),

            "teams": Team.objects.count(),

            "projects": Project.objects.count(),

            "tasks": Task.objects.count(),

        })