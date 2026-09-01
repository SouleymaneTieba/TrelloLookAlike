import { useEffect, useState } from "react";

import {
  BriefcaseBusiness,
  CheckCircle2,
  UserRound,
  Users,
} from "lucide-react";

import api from "../services/api";


function Teams() {

  const [teams, setTeams] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================
  // CHARGER LES ÉQUIPES
  // ==========================================

  const fetchTeams = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/teams/"
        );

      setTeams(
        response.data
      );

    } catch (error) {

      console.error(error);

      setError(
        "Impossible de récupérer les équipes."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchTeams();

  }, []);


  // ==========================================
  // NOM COMPLET
  // ==========================================

  const getFullName = (
    member
  ) => {

    const name = [
      member.first_name,
      member.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      name ||
      member.username
    );

  };


  // ==========================================
  // AVATAR
  // ==========================================

  const getInitial = (
    member
  ) => {

    return (
      member.first_name ||
      member.username ||
      "?"
    )
      .charAt(0)
      .toUpperCase();

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="flex min-h-[400px] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1C292D] border-t-[#B6FF00]" />

          <p className="mt-4 text-sm text-[#647276]">
            Chargement des équipes...
          </p>

        </div>

      </div>

    );

  }


  return (

    <div>


      {/* ======================================
          HEADER
      ======================================= */}

      <div>

        <p className="mb-2 text-sm font-medium text-[#B6FF00]">
          Espace de travail
        </p>

        <h1 className="text-3xl font-semibold text-[#F1F5F2]">
          Mes équipes
        </h1>

        <p className="mt-2 text-[#94A3A6]">
          Retrouvez les équipes auxquelles vous appartenez et leurs membres.
        </p>

      </div>


      {/* ======================================
          ERROR
      ======================================= */}

      {error && (

        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

          {error}

        </div>

      )}


      {/* ======================================
          STATS
      ======================================= */}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">


        {/* TEAMS */}

        <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5">

          <div className="flex items-center justify-between">

            <p className="text-sm text-[#647276]">
              Mes équipes
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#152400]">

              <Users
                size={19}
                className="text-[#B6FF00]"
              />

            </div>

          </div>

          <p className="mt-3 text-3xl font-bold text-[#F1F5F2]">
            {teams.length}
          </p>

        </div>


        {/* MEMBERS */}

        <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5">

          <div className="flex items-center justify-between">

            <p className="text-sm text-[#647276]">
              Membres
            </p>

            <Users
              size={20}
              className="text-[#B6FF00]"
            />

          </div>

          <p className="mt-3 text-3xl font-bold text-[#B6FF00]">

            {
              teams.reduce(
                (
                  total,
                  team
                ) =>
                  total +
                  (
                    team.member_count ||
                    0
                  ),
                0
              )
            }

          </p>

        </div>

      </div>


      {/* ======================================
          TEAMS
      ======================================= */}

      <div className="mt-8">

        <div className="mb-4 flex items-center justify-between">

          <h2 className="font-semibold text-[#F1F5F2]">
            Équipes
          </h2>

          <span className="text-sm text-[#647276]">
            {teams.length} équipe
            {teams.length > 1
              ? "s"
              : ""}
          </span>

        </div>


        {teams.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-[#1C292D] bg-[#0B1215] px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#152400]">

              <Users
                size={25}
                className="text-[#B6FF00]"
              />

            </div>

            <h2 className="mt-5 font-semibold text-[#F1F5F2]">
              Aucune équipe
            </h2>

            <p className="mt-2 text-sm text-[#647276]">
              Vous n'appartenez actuellement à aucune équipe.
            </p>

          </div>

        ) : (

          <div className="space-y-6">

            {teams.map(
              (team) => (

                <div
                  key={team.id}
                  className="rounded-2xl border border-[#1C292D] bg-[#0B1215] overflow-hidden"
                >


                  {/* TEAM HEADER */}

                  <div className="border-b border-[#1C292D] p-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#152400]">

                          <Users
                            size={21}
                            className="text-[#B6FF00]"
                          />

                        </div>


                        <div>

                          <h3 className="text-xl font-semibold text-[#F1F5F2]">
                            {team.name}
                          </h3>

                          <p className="mt-1 max-w-2xl text-sm text-[#647276]">

                            {team.description ||
                              "Aucune description."}

                          </p>

                        </div>

                      </div>


                      <div className="flex items-center gap-2 rounded-xl bg-[#10191C] px-3 py-2 text-sm text-[#94A3A6]">

                        <Users size={16} />

                        {team.member_count || 0}
                        {" "}
                        membre
                        {(team.member_count || 0) > 1
                          ? "s"
                          : ""}

                      </div>

                    </div>

                  </div>


                  {/* MEMBERS */}

                  <div className="p-6">

                    <div className="mb-4 flex items-center gap-2">

                      <UserRound
                        size={17}
                        className="text-[#B6FF00]"
                      />

                      <h4 className="font-medium text-[#F1F5F2]">
                        Membres de l'équipe
                      </h4>

                    </div>


                    <div className="grid gap-3 md:grid-cols-2">

                      {team.members
                        ?.filter(
                          (member) =>
                            member.is_active
                        )
                        .map(
                          (member) => (

                            <div
                              key={member.id}
                              className="flex items-center gap-3 rounded-xl border border-[#1C292D] bg-[#10191C] p-4"
                            >


                              {/* AVATAR */}

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#152400] font-semibold text-[#B6FF00]">

                                {member.avatar ? (

                                  <img
                                    src={
                                      member.avatar
                                    }
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />

                                ) : (

                                  getInitial(
                                    member
                                  )

                                )}

                              </div>


                              {/* USER */}

                              <div className="min-w-0 flex-1">

                                <p className="truncate text-sm font-medium text-[#F1F5F2]">

                                  {getFullName(
                                    member
                                  )}

                                </p>

                                <p className="truncate text-xs text-[#647276]">

                                  {member.job_title ||
                                    member.username}

                                </p>

                              </div>


                              {/* ROLE */}

                              <span className="shrink-0 rounded-lg border border-[#304800] bg-[#152400] px-2.5 py-1 text-xs font-medium text-[#B6FF00]">

                                {member.role_label ||
                                  member.role}

                              </span>


                              {/* ACTIVE */}

                              <CheckCircle2
                                size={15}
                                className="shrink-0 text-emerald-400"
                              />

                            </div>

                          )
                        )}

                    </div>


                    {/* NO ACTIVE MEMBERS */}

                    {(!team.members ||
                      team.members.filter(
                        (member) =>
                          member.is_active
                      ).length === 0) && (

                      <div className="rounded-xl bg-[#10191C] p-6 text-center">

                        <p className="text-sm text-[#647276]">
                          Aucun membre actif dans cette équipe.
                        </p>

                      </div>

                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>

  );

}


export default Teams;