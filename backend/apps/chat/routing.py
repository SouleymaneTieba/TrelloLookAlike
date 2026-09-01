from django.urls import path

from .consumers import ChatConsumer


websocket_urlpatterns = [

    path(
        "ws/teams/<int:team_id>/chat/",
        ChatConsumer.as_asgi(),
    ),

]