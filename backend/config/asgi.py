"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named
``application``.
"""

import os

from channels.routing import (
    ProtocolTypeRouter,
    URLRouter,
)

from django.core.asgi import (
    get_asgi_application,
)

from apps.chat.middleware import (
    JWTAuthMiddleware,
)

from apps.chat.routing import (
    websocket_urlpatterns as chat_websocket_urlpatterns,
)

from apps.notifications.routing import (
    websocket_urlpatterns as notification_websocket_urlpatterns,
)


os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)


django_application = get_asgi_application()


# ==========================================
# WEBSOCKET ROUTES
# ==========================================

websocket_urlpatterns = (
    chat_websocket_urlpatterns
    + notification_websocket_urlpatterns
)


application = ProtocolTypeRouter({

    # ==========================================
    # HTTP
    # ==========================================

    "http": django_application,

    # ==========================================
    # WEBSOCKET
    # ==========================================

    "websocket": JWTAuthMiddleware(

        URLRouter(
            websocket_urlpatterns
        )

    ),

})