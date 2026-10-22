from django.db import migrations


def restore_prototype_tables(apps, schema_editor):
    """Restore the prototype task tables if a prior microservice schema remains."""
    connection = schema_editor.connection
    Task = apps.get_model("tasks", "Task")
    AvailabilityReport = apps.get_model("tasks", "TaskAvailabilityReport")

    tables = set(connection.introspection.table_names())
    task_table = Task._meta.db_table

    if task_table in tables:
        with connection.cursor() as cursor:
            columns = {
                column.name
                for column in connection.introspection.get_table_description(cursor, task_table)
            }
        if "project_id" not in columns:
            # These tables belong to the removed microservice task model and
            # reference its task table. The project cleanup already removed
            # their data; discard them before recreating the prototype table.
            obsolete_tables = (
                "tasks_submission",
                "tasks_taskassignmentlog",
                "tasks_taskassignment",
                AvailabilityReport._meta.db_table,
                task_table,
            )
            suffix = " CASCADE" if connection.vendor == "postgresql" else ""
            quote = connection.ops.quote_name
            with connection.cursor() as cursor:
                for table in obsolete_tables:
                    if table in tables:
                        cursor.execute(f"DROP TABLE {quote(table)}{suffix}")
            schema_editor.create_model(Task)
            tables.discard(task_table)
            tables.discard(AvailabilityReport._meta.db_table)

    if AvailabilityReport._meta.db_table not in tables:
        schema_editor.create_model(AvailabilityReport)


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0002_taskavailabilityreport"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[migrations.RunPython(restore_prototype_tables)],
            state_operations=[],
        ),
    ]
