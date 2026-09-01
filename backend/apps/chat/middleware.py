from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware

from rest_framework_simplejwt.exceptions import (
    InvalidToken,
    TokenError,
)
from rest_framework_simplejwt.tokens import AccessToken

from django.contrib.auth import get_user_model


User = get_user_model()


class JWTAuthMiddleware(BaseMiddleware):

    async def __call__(
        self,
        scope,
        receive,
        send,
    ):

        scope["user"] = await self.get_user(
            scope
        )

        return await super().__call__(
            scope,
            receive,
            send,
        )

    @database_sync_to_async
    def get_user(self, scope):

        # ==========================================
        # RÉCUPÉRER LE TOKEN
        # ==========================================

        query_string = scope.get(
            "query_string",
            b"",
        ).decode()

        query_params = parse_qs(
            query_string
        )

        token = query_params.get(
            "token",
            [None],
        )[0]

        if not token:

            return User.objects.none().first()

        # ==========================================
        # VALIDER LE TOKEN
        # ==========================================

        try:

            access_token = AccessToken(
                token
            )

            user_id = access_token.get(
                "user_id"
            )

            if not user_id:

                return User.objects.none().first()

            return User.objects.get(
                id=user_id
            )

        except (
            InvalidToken,
            TokenError,
            User.DoesNotExist,
        ):

            return User.objects.none().first()