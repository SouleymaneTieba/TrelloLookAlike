"""
URL configuration for config project.

The `urlpatterns` list routes URLs for the project.
"""

from django.contrib import admin
from django.urls import include, path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [

    # ==================================================
    # DJANGO ADMIN
    # ==================================================

    path(
        "admin/",
        admin.site.urls,
    ),

    # ==================================================
    # AUTHENTICATION
    # ==================================================

    path(
        "api/auth/login/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # ==================================================
    # USERS
    # ==================================================

    path(
        "api/users/",
        include("apps.users.urls"),
    ),

    # ==================================================
    # TEAMS
    # ==================================================

    path(
        "api/teams/",
        include("apps.teams.urls"),
    ),

    # ==================================================
    # PROJECTS
    # ==================================================

    path(
        "api/projects/",
        include("apps.projects.urls"),
    ),

    # ==================================================
    # TASKS
    # ==================================================

    path(
        "api/",
        include("apps.tasks.urls"),
    ),

    # ==================================================
    # CHAT
    # ==================================================

    path(
        "api/chat/",
        include("apps.chat.urls"),
    ),

    # ==================================================
    # NOTIFICATIONS
    # ==================================================

    path(
        "api/notifications/",
        include("apps.notifications.urls"),
    ),
    path(
        "api/git/",
        include("apps.git_integration.urls"),
    ),

]