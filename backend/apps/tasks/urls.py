from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    TaskAvailabilityReportViewSet,
    TaskViewSet,
)


# ==================================================
# ROUTER
# ==================================================

router = DefaultRouter()

router.register(
    "tasks",
    TaskViewSet,
    basename="task",
)


# ==================================================
# URLS
# ==================================================

urlpatterns = [

    # ----------------------------------------------
    # Disponibilité
    # IMPORTANT : avant les routes dynamiques tasks
    # ----------------------------------------------

    path(
        "tasks/availability/",
        TaskAvailabilityReportViewSet.as_view({
            "get": "list",
            "post": "create",
        }),
        name="task-availability",
    ),

    # ----------------------------------------------
    # Tâches
    # ----------------------------------------------

    path(
        "",
        include(router.urls),
    ),

]