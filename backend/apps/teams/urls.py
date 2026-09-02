from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    RoleViewSet,
    TeamMemberViewSet,
    TeamViewSet,
)


router = DefaultRouter()

router.register(
    "roles",
    RoleViewSet,
    basename="roles",
)

router.register(
    "members",
    TeamMemberViewSet,
    basename="team-members",
)

router.register(
    "",
    TeamViewSet,
    basename="teams",
)


urlpatterns = [

    path(
        "",
        include(router.urls),
    ),

]
