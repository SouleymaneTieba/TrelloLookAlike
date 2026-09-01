from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import MessageViewSet


router = DefaultRouter()

router.register(
    "messages",
    MessageViewSet,
    basename="chat-message",
)


urlpatterns = [

    path(
        "",
        include(router.urls),
    ),

]