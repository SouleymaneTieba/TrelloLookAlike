import { useEffect, useState } from "react";

import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ListTodo,
  Users,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          tasksResponse,
          teamsResponse,
        ] = await Promise.all([
          api.get("/tasks/"),
          api.get("/teams/"),
        ]);

        setTasks(tasksResponse.data);
        setTeams(teamsResponse.data);

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

  const totalTasks = tasks.length;

  const inProgressTasks = tasks.filter(
    (task) =>
      task.status === "IN_PROGRESS"
  ).length;

  const completedTasks = tasks.filter(
    (task) =>
      task.status === "DONE"
  ).length;

  const teamMembers = teams.reduce(
    (total, team) =>
      total +
      (team.members?.length || 0),
    0
  );

  const stats = [
    {
      label: "Mes tâches",
      value: totalTasks,
      icon: ListTodo,
      change: "12%",
    },
    {
      label: "En cours",
      value: inProgressTasks,
      icon: Clock3,
      change: "8%",
    },
    {
      label: "Terminées",
      value: completedTasks,
      icon: CheckCircle2,
      change: "15%",
    },
    {
      label: "Membres",
      value: teamMembers,
      icon: Users,
      change: "5%",
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
            Overview
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
                  <ArrowUpRight size={15} />
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

      {/* TASKS */}
      <div className="mt-8 rounded-2xl border border-[#1C292D] bg-[#0B1215]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1C292D] px-6 py-5">

          <div>

            <h2 className="text-lg font-semibold text-[#F1F5F2]">
              Mes tâches
            </h2>

            <p className="mt-1 text-sm text-[#647276]">
              Les dernières tâches de votre équipe.
            </p>

          </div>

          <button className="flex items-center gap-2 text-sm font-medium text-[#B6FF00] hover:text-[#C4FF33]">

            Voir toutes

            <ArrowUpRight size={17} />

          </button>

        </div>

        {/* Tasks */}
        {tasks.length === 0 ? (

          <div className="px-6 py-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#152400]">

              <ListTodo
                size={25}
                className="text-[#B6FF00]"
              />

            </div>

            <p className="mt-4 font-medium text-[#F1F5F2]">
              Aucune tâche
            </p>

            <p className="mt-1 text-sm text-[#647276]">
              Vous n'avez actuellement
              aucune tâche.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-[#1C292D]">

            {tasks
              .slice(0, 5)
              .map((task) => {

                const isDone =
                  task.status === "DONE";

                const isInProgress =
                  task.status ===
                  "IN_PROGRESS";

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-[#0E171A]"
                  >

                    <div className="flex min-w-0 items-center gap-4">

                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                          isDone
                            ? "border-[#B6FF00] text-[#B6FF00]"
                            : "border-[#334348] text-[#647276]"
                        }`}
                      >

                        {isDone ? (
                          <CheckCircle2
                            size={19}
                          />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-current" />
                        )}

                      </div>

                      <div className="min-w-0">

                        <p className="truncate font-medium text-[#F1F5F2]">
                          {task.title}
                        </p>

                        <p className="mt-1 text-xs text-[#647276]">
                          Priorité :{" "}
                          {task.priority}
                        </p>

                      </div>

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        isDone
                          ? "bg-[#152400] text-[#B6FF00]"
                          : isInProgress
                          ? "bg-[#13231A] text-[#9BE600]"
                          : "bg-[#10191C] text-[#94A3A6]"
                      }`}
                    >
                      {isDone
                        ? "Terminé"
                        : isInProgress
                        ? "En cours"
                        : "À faire"}
                    </span>

                  </div>
                );
              })}

          </div>

        )}

        {/* Footer */}
        {tasks.length > 0 && (
          <div className="border-t border-[#1C292D] px-6 py-4 text-center">

            <button className="text-sm font-medium text-[#B6FF00] hover:text-[#C4FF33]">
              Voir toutes les tâches →
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

export default Dashboard;