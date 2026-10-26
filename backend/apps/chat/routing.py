from django.urls import path

from .consumers import ChatConsumer


websocket_urlpatterns = [

    path(
        "ws/projects/<int:project_id>/chat/",
        ChatConsumer.as_asgi(),
    ),

]
