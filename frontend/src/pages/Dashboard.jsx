import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          tasksResponse,
          projectsResponse,
        ] = await Promise.all([
          api.get("/tasks/"),
          api.get("/projects/"),
        ]);

        setTasks(tasksResponse.data);
        setProjects(projectsResponse.data);

      } catch (error) {
        console.error(error);

        setError(
          "Impossible de récupérer les données."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const personalTasks = tasks.filter(
    (task) =>
      task.assigned_to === user?.id ||
      task.created_by === user?.id
  );

  const inProgressTasks = personalTasks.filter(
    (task) =>
      task.status === "IN_PROGRESS"
  ).length;

  const completedTasks = personalTasks.filter(
    (task) =>
      task.status === "DONE"
  ).length;

  const tasksToHandle = personalTasks
    .filter((task) => task.status !== "DONE")
    .slice(0, 5);
  const recentProjects = projects.slice(0, 5);

  const stats = [
    {
      label: "Mes tâches",
      value: personalTasks.length,
      icon: ListTodo,
    },
    {
      label: "En cours",
      value: inProgressTasks,
      icon: Clock3,
    },
    {
      label: "Terminées",
      value: completedTasks,
      icon: CheckCircle2,
    },
    {
      label: "Mes projets",
      value: projects.length,
      icon: FolderKanban,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1C292D] border-t-[#B6FF00]" />

          <p className="mt-4 text-sm text-[#647276]">
            Chargement du dashboard...
          </p>

        </div>
      </div>
    );
  }

  return (
    <div>

      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

        <div>

          <p className="mb-2 text-sm font-medium text-[#B6FF00]">
            Mon espace
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-[#F1F5F2]">
            Bonjour{" "}
            {user?.first_name ||
              user?.username}{" "}
            👋
          </h1>

          <p className="mt-2 text-[#94A3A6]">
            Voici ce qui se passe sur vos
            projets aujourd'hui.
          </p>

        </div>

        <div className="rounded-xl border border-[#1C292D] bg-[#0B1215] px-4 py-3">

          <p className="text-xs text-[#647276]">
            Aujourd'hui
          </p>

          <p className="mt-1 text-sm font-medium text-[#F1F5F2]">
            {new Date().toLocaleDateString(
              "fr-FR",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
              }
            )}
          </p>

        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5 transition hover:border-[#304038]"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#152400]">

                  <Icon
                    size={22}
                    className="text-[#B6FF00]"
                  />

                </div>

              </div>

              <p className="mt-5 text-sm text-[#94A3A6]">
                {stat.label}
              </p>

              <div className="mt-1 flex items-end justify-between">

                <p className="text-3xl font-semibold text-[#F1F5F2]">
                  {stat.value}
                </p>

                <span className="flex items-center gap-1 text-sm font-medium text-[#B6FF00]">
                  {stat.change}
                </span>

              </div>

              <p className="mt-2 text-xs text-[#647276]">
                depuis la semaine dernière
              </p>

            </div>
          );
        })}

      </div>

      {/* PROJETS RÉCENTS ET TÂCHES À TRAITER */}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">

        <section className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#F1F5F2]">
                Projets récents
              </h2>
              <p className="mt-1 text-sm text-[#647276]">
                Vos projets les plus récents.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#B6FF00] hover:text-[#C4FF33]"
            >
              Voir tout
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {recentProjects.length === 0 ? (
              <p className="py-4 text-sm text-[#647276]">
                Vous n'avez aucun projet récent.
              </p>
            ) : (
              recentProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate("/projects")}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#1C292D] bg-[#10191C] p-4 text-left transition hover:border-[#304800]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <FolderKanban size={18} className="shrink-0 text-[#B6FF00]" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-[#F1F5F2]">
                        {project.name}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-xs text-[#647276]">
                        <CalendarDays size={13} />
                        {new Date(project.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300">
                    {project.status_label}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#F1F5F2]">
                Tâches à traiter
              </h2>
              <p className="mt-1 text-sm text-[#647276]">
                Vos tâches assignées ou créées qui restent à terminer.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/tasks")}
              className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#B6FF00] hover:text-[#C4FF33]"
            >
              Voir tout
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {tasksToHandle.length === 0 ? (
              <p className="py-4 text-sm text-[#647276]">
                Vous n'avez aucune tâche à traiter.
              </p>
            ) : (
              tasksToHandle.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => navigate("/tasks")}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#1C292D] bg-[#10191C] p-4 text-left transition hover:border-[#304800]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Clock3 size={18} className="shrink-0 text-[#B6FF00]" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-[#F1F5F2]">
                        {task.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-[#647276]">
                        {task.project_name} · {task.priority_label}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300">
                    {task.status_label}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

      </div>

    </div>
  );
}

export default Dashboard;
