from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    TeamMemberViewSet,
    TeamViewSet,
)


router = DefaultRouter()

router.register(
    "",
    TeamViewSet,
    basename="teams",
)

router.register(
    "members",
    TeamMemberViewSet,
    basename="team-members",
)


urlpatterns = [

    path(
        "",
        include(router.urls),
    ),

]