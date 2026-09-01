import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  Send,
  Users,
} from "lucide-react";

import api from "../services/api";


function Availability() {

  const [teams, setTeams] =
    useState([]);

  const [reports, setReports] =
    useState([]);

  const [selectedTeam, setSelectedTeam] =
    useState("");

  const [message, setMessage] =
    useState(
      "Je n'ai aucune tâche actuellement."
    );

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================
  // CHARGER LES DONNÉES
  // ==========================================

  const fetchData = async () => {

    try {

      setLoading(true);
      setError("");

      const [
        teamsResponse,
        reportsResponse,
      ] = await Promise.all([

        api.get("/teams/"),

        api.get("/availability/"),

      ]);

      setTeams(
        teamsResponse.data
      );

      setReports(
        reportsResponse.data
      );

    } catch (error) {

      console.error(error);

      setError(
        "Impossible de récupérer les données."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchData();

  }, []);


  // ==========================================
  // ENVOYER SIGNALement
  // ==========================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    if (!selectedTeam) {

      setError(
        "Veuillez sélectionner une équipe."
      );

      return;

    }


    try {

      setSubmitting(true);

      await api.post(
        "/availability/",
        {
          team: Number(
            selectedTeam
          ),
          message,
        }
      );


      setSuccess(
        "Votre disponibilité a bien été signalée."
      );


      setSelectedTeam("");

      setMessage(
        "Je n'ai aucune tâche actuellement."
      );


      await fetchData();

    } catch (error) {

      console.error(error);

      const data =
        error.response?.data;

      if (data?.team) {

        setError(
          Array.isArray(data.team)
            ? data.team[0]
            : data.team
        );

      } else {

        setError(
          "Impossible d'envoyer votre signalement."
        );

      }

    } finally {

      setSubmitting(false);

    }

  };


  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (
    date
  ) => {

    return new Date(
      date
    ).toLocaleString(
      "fr-FR",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
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
            Chargement...
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
          Disponibilité
        </p>

        <h1 className="text-3xl font-semibold text-[#F1F5F2]">
          Ma disponibilité
        </h1>

        <p className="mt-2 text-[#94A3A6]">
          Signalez à votre équipe lorsque vous êtes disponible pour une nouvelle tâche.
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
          SUCCESS
      ======================================= */}

      {success && (

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#304800] bg-[#152400] px-4 py-3 text-sm text-[#B6FF00]">

          <CheckCircle2
            size={17}
          />

          {success}

        </div>

      )}


      {/* ======================================
          FORM
      ======================================= */}

      <div className="mt-8 rounded-2xl border border-[#1C292D] bg-[#0B1215] p-6">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#152400]">

            <Clock3
              size={21}
              className="text-[#B6FF00]"
            />

          </div>

          <div>

            <h2 className="font-semibold text-[#F1F5F2]">
              Signaler ma disponibilité
            </h2>

            <p className="mt-1 text-sm text-[#647276]">
              Informez votre équipe que vous êtes disponible pour travailler sur une nouvelle tâche.
            </p>

          </div>

        </div>


        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >

          {/* TEAM */}

          <div>

            <label
              htmlFor="team"
              className="mb-2 block text-sm font-medium text-[#F1F5F2]"
            >
              Équipe
            </label>

            <select
              id="team"
              value={selectedTeam}
              onChange={(event) =>
                setSelectedTeam(
                  event.target.value
                )
              }
              required
              className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none transition focus:border-[#B6FF00] focus:ring-1 focus:ring-[#B6FF00]/30"
            >

              <option value="">
                Sélectionner une équipe
              </option>

              {teams.map(
                (team) => (

                  <option
                    key={team.id}
                    value={team.id}
                  >
                    {team.name}
                  </option>

                )
              )}

            </select>

          </div>


          {/* MESSAGE */}

          <div>

            <label
              htmlFor="message"
              className="mb-2 block text-sm font-medium text-[#F1F5F2]"
            >
              Message
            </label>

            <textarea
              id="message"
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              rows={4}
              placeholder="Indiquez votre disponibilité..."
              className="w-full resize-none rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none transition placeholder:text-[#647276] focus:border-[#B6FF00] focus:ring-1 focus:ring-[#B6FF00]/30"
            />

          </div>


          {/* SUBMIT */}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C4FF33] disabled:cursor-not-allowed disabled:opacity-60"
          >

            <Send
              size={17}
            />

            {submitting
              ? "Envoi..."
              : "Signaler ma disponibilité"}

          </button>

        </form>

      </div>


      {/* ======================================
          HISTORY
      ======================================= */}

      <div className="mt-8">

        <div className="mb-4 flex items-center justify-between">

          <h2 className="font-semibold text-[#F1F5F2]">
            Mes signalements
          </h2>

          <span className="text-sm text-[#647276]">
            {reports.length}
          </span>

        </div>


        {reports.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-[#1C292D] bg-[#0B1215] px-6 py-14 text-center">

            <Users
              size={28}
              className="mx-auto text-[#647276]"
            />

            <p className="mt-4 font-medium text-[#F1F5F2]">
              Aucun signalement
            </p>

            <p className="mt-1 text-sm text-[#647276]">
              Vous n'avez encore signalé aucune disponibilité.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {reports.map(
              (report) => (

                <div
                  key={report.id}
                  className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <div className="flex items-center gap-2">

                        <Users
                          size={17}
                          className="text-[#B6FF00]"
                        />

                        <h3 className="font-medium text-[#F1F5F2]">
                          {report.team_name}
                        </h3>

                      </div>

                      <p className="mt-2 text-sm text-[#94A3A6]">
                        {report.message}
                      </p>

                      <p className="mt-3 text-xs text-[#647276]">
                        {formatDate(
                          report.created_at
                        )}
                      </p>

                    </div>


                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                        report.status ===
                        "ACTIVE"
                          ? "border-[#304800] bg-[#152400] text-[#B6FF00]"
                          : "border-emerald-900/50 bg-emerald-950/30 text-emerald-400"
                      }`}
                    >

                      {report.status ===
                      "ACTIVE" ? (

                        <Clock3
                          size={13}
                        />

                      ) : (

                        <CheckCircle2
                          size={13}
                        />

                      )}

                      {report.status_label ||
                        report.status}

                    </span>

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


export default Availability;