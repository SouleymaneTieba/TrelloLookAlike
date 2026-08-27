from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    TaskAvailabilityReportViewSet,
    TaskViewSet,
)


router = DefaultRouter()

router.register("tasks", TaskViewSet, basename="task")
router.register(
    "availability",
    TaskAvailabilityReportViewSet,
    basename="availability",
)


urlpatterns = [
    path("", include(router.urls)),
]