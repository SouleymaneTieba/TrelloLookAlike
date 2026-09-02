from django.contrib import admin

from .models import Role, Team, TeamMember


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = (
        "label",
        "slug",
        "is_system",
        "unique_per_team",
        "created_at",
    )
    list_filter = ("is_system", "unique_per_team")
    search_fields = ("label", "slug")
    readonly_fields = ("slug", "is_system")


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "created_by", "created_at")
    search_fields = ("name",)
    list_filter = ("created_at",)


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("user", "team", "role", "is_active", "joined_at")
    list_filter = ("role", "is_active", "team")
    search_fields = ("user__username", "team__name")
