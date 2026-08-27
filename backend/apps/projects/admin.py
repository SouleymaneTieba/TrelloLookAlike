from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "team",
        "status",
        "created_by",
        "start_date",
        "end_date",
    )

    list_filter = ("status", "team")
    search_fields = ("name", "description")