from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .admin_views import AdminDashboardStatsView

from .views import (
    CurrentUserView,
    RegisterView,
    UserViewSet,
)


router = DefaultRouter()

router.register(
    "",
    UserViewSet,
    basename="users",
)


urlpatterns = [

    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "me/",
        CurrentUserView.as_view(),
        name="current-user",
    ),

    path(
        "",
        include(router.urls),
    ),
    path(
        "admin/dashboard/stats/",
        AdminDashboardStatsView.as_view(),
        name="admin-dashboard-stats",
    ),

]