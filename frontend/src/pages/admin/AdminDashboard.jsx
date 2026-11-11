import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  Clock3,
  FolderKanban,
  UserRound,
  Users,
} from "lucide-react";

import api from "../../services/api";


function AdminDashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState({

    users: 0,
    teams: 0,
    projects: 0,
    tasks: 0,

  });

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==================================================
  // CHARGER LES STATISTIQUES
  // ==================================================

  useEffect(() => {

    const fetchStats = async () => {

      try {

        setLoading(true);
        setError("");

        const [statsResponse, projectsResponse, tasksResponse] = await Promise.all([
          api.get("/users/admin/dashboard/stats/"),
          api.get("/projects/"),
          api.get("/tasks/"),
        ]);

        setStats(statsResponse.data);
        setProjects(projectsResponse.data);
        setTasks(tasksResponse.data);

      } catch (error) {

        console.error(
          "Erreur statistiques admin :",
          error
        );

        setError(
          "Impossible de charger les données du tableau de bord."
        );

      } finally {

        setLoading(false);

      }

    };

    fetchStats();

  }, []);


  const statCards = [

    {
      label: "Utilisateurs",
      value: stats.users,
      icon: UserRound,
    },

    {
      label: "Équipes",
      value: stats.teams,
      icon: Users,
    },

    {
      label: "Projets",
      value: stats.projects,
      icon: FolderKanban,
    },

    {
      label: "Tâches",
      value: stats.tasks,
      icon: CheckSquare,
    },

  ];

  const recentProjects = projects.slice(0, 5);
  const tasksToHandle = tasks
    .filter((task) => task.status !== "DONE")
    .slice(0, 5);


  return (

    <div>

      {/* HEADER */}

      <div>

        <p className="mb-2 text-sm font-medium text-[#B6FF00]">
          Administration
        </p>

        <h1 className="text-3xl font-semibold text-[#F1F5F2]">
          Vue d'ensemble
        </h1>

        <p className="mt-2 text-[#94A3A6]">
          Gérez les utilisateurs, équipes et projets de la plateforme.
        </p>

      </div>


      {/* ERROR */}

      {error && (

        <div className="mt-6 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3">

          <p className="text-sm text-red-400">
            {error}
          </p>

        </div>

      )}


      {/* STATS */}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {statCards.map((stat) => {

          const Icon = stat.icon;

          return (

            <div
              key={stat.label}
              className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5"
            >

              <div className="flex items-center justify-between">

                <p className="text-sm text-[#647276]">
                  {stat.label}
                </p>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#152400]">

                  <Icon
                    size={18}
                    className="text-[#B6FF00]"
                  />

                </div>

              </div>


              <p className="mt-4 text-3xl font-semibold text-[#F1F5F2]">

                {loading
                  ? "..."
                  : stat.value}

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
                Les derniers projets créés.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/projects")}
              className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#B6FF00] hover:text-[#C4FF33]"
            >
              Voir tout
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="py-4 text-sm text-[#647276]">Chargement des projets...</p>
            ) : recentProjects.length === 0 ? (
              <p className="py-4 text-sm text-[#647276]">Aucun projet récent.</p>
            ) : (
              recentProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate("/admin/projects")}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#1C292D] bg-[#10191C] p-2 text-left transition hover:border-[#304800]"
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
                Les tâches qui ne sont pas encore terminées.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/tasks")}
              className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#B6FF00] hover:text-[#C4FF33]"
            >
              Voir tout
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="py-4 text-sm text-[#647276]">Chargement des tâches...</p>
            ) : tasksToHandle.length === 0 ? (
              <p className="py-4 text-sm text-[#647276]">Aucune tâche à traiter.</p>
            ) : (
              tasksToHandle.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => navigate("/admin/tasks")}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#1C292D] bg-[#10191C] p-2 text-left transition hover:border-[#304800]"
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


export default AdminDashboard;
