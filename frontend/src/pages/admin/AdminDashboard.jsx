import {
  useEffect,
  useState,
} from "react";

import {
  CheckSquare,
  FolderKanban,
  UserRound,
  Users,
} from "lucide-react";

import api from "../../services/api";


function AdminDashboard() {

  const [stats, setStats] = useState({

    users: 0,
    teams: 0,
    projects: 0,
    tasks: 0,

  });

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

        const response = await api.get(
          "/users/admin/dashboard/stats/"
        );

        setStats(
          response.data
        );

      } catch (error) {

        console.error(
          "Erreur statistiques admin :",
          error
        );

        setError(
          "Impossible de charger les statistiques."
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
          Gérez les utilisateurs, équipes, projets et activités de Friday.
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


      {/* QUICK ACTIONS */}

      <div className="mt-8 rounded-2xl border border-[#1C292D] bg-[#0B1215] p-6">

        <h2 className="text-lg font-semibold text-[#F1F5F2]">
          Administration
        </h2>

        <p className="mt-1 text-sm text-[#647276]">
          Gérez les différents éléments de votre espace de travail.
        </p>


        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-xl border border-[#1C292D] bg-[#10191C] p-5">

            <UserRound
              size={20}
              className="text-[#B6FF00]"
            />

            <h3 className="mt-4 font-medium text-[#F1F5F2]">
              Utilisateurs
            </h3>

            <p className="mt-1 text-sm text-[#647276]">
              Gérer les comptes et les rôles.
            </p>

          </div>


          <div className="rounded-xl border border-[#1C292D] bg-[#10191C] p-5">

            <Users
              size={20}
              className="text-[#B6FF00]"
            />

            <h3 className="mt-4 font-medium text-[#F1F5F2]">
              Équipes
            </h3>

            <p className="mt-1 text-sm text-[#647276]">
              Créer les équipes et leurs membres.
            </p>

          </div>


          <div className="rounded-xl border border-[#1C292D] bg-[#10191C] p-5">

            <FolderKanban
              size={20}
              className="text-[#B6FF00]"
            />

            <h3 className="mt-4 font-medium text-[#F1F5F2]">
              Projets
            </h3>

            <p className="mt-1 text-sm text-[#647276]">
              Superviser les projets de l'organisation.
            </p>

          </div>

        </div>

      </div>

    </div>

  );

}


export default AdminDashboard;