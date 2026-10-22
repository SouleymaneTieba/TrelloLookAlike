import { useEffect, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Mail,
  UserRound,
  Users,
  X,
} from "lucide-react";

import api from "../services/api";


function Teams() {

  const [teams, setTeams] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedTeam, setSelectedTeam] =
    useState(null);

  const [loadingTeamDetails, setLoadingTeamDetails] =
    useState(false);

  const [teamDetailsError, setTeamDetailsError] =
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

  useEffect(() => {
    if (!selectedTeam) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") setSelectedTeam(null);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedTeam]);

  const openTeamDetails = async (team) => {
    setSelectedTeam(team);
    setTeamDetailsError("");
    setLoadingTeamDetails(true);

    try {
      const response = await api.get(`/teams/${team.id}/`);
      setSelectedTeam(response.data);
    } catch (requestError) {
      console.error(requestError);
      setTeamDetailsError("Impossible de charger tous les détails de cette équipe.");
    } finally {
      setLoadingTeamDetails(false);
    }
  };


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
                  total + (team.members?.filter((member) => member.is_active).length || 0),
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

          <div className="grid gap-5 md:grid-cols-2">

            {teams.map(
              (team) => (

                <button
                  type="button"
                  key={team.id}
                  onClick={() => openTeamDetails(team)}
                  aria-haspopup="dialog"
                  className="group w-full rounded-2xl border border-[#1C292D] bg-[#0B1215] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#304800] focus:outline-none focus:ring-2 focus:ring-[#B6FF00]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#152400]">
                        <Users size={21} className="text-[#B6FF00]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[#F1F5F2]">{team.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-[#647276]">{team.description || "Aucune description."}</p>
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-2 rounded-xl bg-[#10191C] px-3 py-2 text-sm text-[#94A3A6]">
                      <Users size={16} />
                      {team.members?.filter((member) => member.is_active).length || 0}
                    </span>
                  </div>
                  <p className="mt-5 flex items-center gap-2 border-t border-[#1C292D] pt-4 text-sm font-medium text-[#B6FF00]">
                    <UserRound size={16} /> Voir les détails et les membres <span aria-hidden="true">→</span>
                  </p>
                </button>

              )
            )}

          </div>

        )}

      </div>

      {selectedTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setSelectedTeam(null)}
        >
          <section
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#1C292D] bg-[#0B1215] p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#152400]"><Users size={21} className="text-[#B6FF00]" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B6FF00]">Détails du groupe</p>
                  <h2 id="team-details-title" className="mt-1 text-2xl font-semibold text-[#F1F5F2]">{selectedTeam.name}</h2>
                </div>
              </div>
              <button type="button" aria-label="Fermer les détails du groupe" onClick={() => setSelectedTeam(null)} className="rounded-lg p-2 text-[#647276] hover:bg-[#10191C] hover:text-white"><X size={20} /></button>
            </div>

            {teamDetailsError && <p className="mt-5 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">{teamDetailsError}</p>}
            {loadingTeamDetails ? (
              <div className="py-12 text-center text-sm text-[#94A3A6]">Chargement des détails…</div>
            ) : (
              <>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[#94A3A6]">{selectedTeam.description || "Aucune description."}</p>
                <div className="mt-5 grid gap-3 border-y border-[#1C292D] py-4 text-sm sm:grid-cols-2">
                  <p className="flex items-center gap-2 text-[#94A3A6]"><Users size={16} className="text-[#647276]" />{selectedTeam.members?.filter((member) => member.is_active).length || 0} membre(s) actif(s)</p>
                  <p className="flex items-center gap-2 text-[#94A3A6]"><CalendarDays size={16} className="text-[#647276]" />Créée le {selectedTeam.created_at ? new Date(selectedTeam.created_at).toLocaleDateString("fr-FR") : "date inconnue"}</p>
                  <p className="flex items-center gap-2 text-[#94A3A6]"><CalendarDays size={16} className="text-[#647276]" />Modifiée le {selectedTeam.updated_at ? new Date(selectedTeam.updated_at).toLocaleDateString("fr-FR") : "date inconnue"}</p>
                </div>
                <h3 className="mt-5 flex items-center gap-2 font-semibold text-[#F1F5F2]"><UserRound size={17} className="text-[#B6FF00]" /> Membres</h3>
                <div className="mt-3 space-y-3">
                  {selectedTeam.members?.map((member) => (
                    <article key={member.id} className="flex flex-col gap-3 rounded-xl border border-[#1C292D] bg-[#10191C] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-[#F1F5F2]">{getFullName(member)}</p>
                        <p className="mt-1 text-xs text-[#647276]">@{member.username}{member.job_title ? ` · ${member.job_title}` : ""}</p>
                        {member.email && <p className="mt-1 flex items-center gap-1.5 break-all text-xs text-[#94A3A6]"><Mail size={13} />{member.email}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-lg border border-[#304800] bg-[#152400] px-2.5 py-1 text-xs font-medium text-[#B6FF00]">{member.role_label || member.role}</span>
                        <span className={`inline-flex items-center gap-1 text-xs ${member.is_active ? "text-emerald-400" : "text-[#647276]"}`}>
                          <CheckCircle2 size={14} />{member.is_active ? "Actif" : "Inactif"}
                        </span>
                      </div>
                      <p className="shrink-0 text-xs text-[#647276]">Rejoint le {member.joined_at ? new Date(member.joined_at).toLocaleDateString("fr-FR") : "—"}</p>
                    </article>
                  ))}
                  {!selectedTeam.members?.length && <p className="rounded-xl bg-[#10191C] p-6 text-center text-sm text-[#647276]">Aucun membre dans ce groupe.</p>}
                </div>
              </>
            )}
          </section>
        </div>
      )}

    </div>

  );

}


export default Teams;
