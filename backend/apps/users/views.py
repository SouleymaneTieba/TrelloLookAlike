from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .permissions import IsAdminUser

from .serializers import (
    AdminUserCreateSerializer,
    RegisterSerializer,
    UserSerializer,
)


User = get_user_model()


class RegisterView(APIView):

    permission_classes = [
        AllowAny
    ]

    def post(self, request):

        serializer = RegisterSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class CurrentUserView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        serializer = UserSerializer(
            request.user
        )

        return Response(
            serializer.data
        )


class UserViewSet(ModelViewSet):

    queryset = User.objects.all().order_by(
        "-created_at"
    )

    permission_classes = [
        IsAdminUser
    ]

    serializer_class = UserSerializer

    def get_serializer_class(self):

        if self.action == "create":
            return AdminUserCreateSerializer

        return UserSerializer

    def create(
        self,
        request,
        *args,
        **kwargs
    ):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        response_serializer = UserSerializer(
            user
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )