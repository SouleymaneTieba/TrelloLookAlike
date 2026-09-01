import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Clock3,
  MessageSquareText,
  UserRound,
  Users,
} from "lucide-react";

import api from "../../services/api";


function Availability() {

  const [reports, setReports] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [processingId, setProcessingId] =
    useState(null);


  // ==========================================
  // CHARGER LES DISPONIBILITÉS
  // ==========================================

  const fetchReports = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await api.get(
          "/tasks/availability/"
        );

      setReports(
        response.data
      );

    } catch (error) {

      console.error(error);

      setError(
        "Impossible de récupérer les disponibilités."
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchReports();

  }, []);


  // ==========================================
  // RÉSOUDRE
  // ==========================================

  const handleResolve = async (
    report
  ) => {

    try {

      setProcessingId(
        report.id
      );


      const response =
        await api.patch(
          `/availability/${report.id}/`,
          {
            status: "RESOLVED",
          }
        );


      setReports((previous) =>
        previous.map((item) =>
          item.id === report.id
            ? response.data
            : item
        )
      );


    } catch (error) {

      console.error(error);

      setError(
        "Impossible de résoudre ce signalement."
      );

    } finally {

      setProcessingId(null);

    }

  };


  // ==========================================
  // REACTIVER
  // ==========================================

  const handleReactivate = async (
    report
  ) => {

    try {

      setProcessingId(
        report.id
      );


      const response =
        await api.patch(
          `/availability/${report.id}/`,
          {
            status: "ACTIVE",
          }
        );


      setReports((previous) =>
        previous.map((item) =>
          item.id === report.id
            ? response.data
            : item
        )
      );


    } catch (error) {

      console.error(error);

      setError(
        "Impossible de réactiver ce signalement."
      );

    } finally {

      setProcessingId(null);

    }

  };


  // ==========================================
  // STATS
  // ==========================================

  const activeReports =
    reports.filter(
      (report) =>
        report.status === "ACTIVE"
    ).length;


  const resolvedReports =
    reports.filter(
      (report) =>
        report.status === "RESOLVED"
    ).length;


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="flex min-h-[400px] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1C292D] border-t-[#B6FF00]" />

          <p className="mt-4 text-sm text-[#647276]">
            Chargement des disponibilités...
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
          Administration
        </p>

        <h1 className="text-3xl font-semibold text-[#F1F5F2]">
          Disponibilités
        </h1>

        <p className="mt-2 text-[#94A3A6]">
          Consultez les membres disponibles
          pour de nouvelles tâches.
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


        {/* ACTIVE */}

        <div className="rounded-2xl border border-[#304800] bg-[#0B1215] p-5">

          <div className="flex items-center justify-between">

            <p className="text-sm text-[#94A3A6]">
              Disponibilités actives
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#152400]">

              <Clock3
                size={19}
                className="text-[#B6FF00]"
              />

            </div>

          </div>

          <p className="mt-3 text-3xl font-bold text-[#B6FF00]">
            {activeReports}
          </p>

        </div>


        {/* RESOLVED */}

        <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5">

          <div className="flex items-center justify-between">

            <p className="text-sm text-[#94A3A6]">
              Signalements résolus
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10191C]">

              <CheckCircle2
                size={19}
                className="text-emerald-400"
              />

            </div>

          </div>

          <p className="mt-3 text-3xl font-bold text-[#F1F5F2]">
            {resolvedReports}
          </p>

        </div>

      </div>


      {/* ======================================
          REPORTS
      ======================================= */}

      <div className="mt-8">

        <div className="mb-4 flex items-center justify-between">

          <h2 className="font-semibold text-[#F1F5F2]">
            Signalements
          </h2>

          <span className="text-sm text-[#647276]">
            {reports.length} signalement(s)
          </span>

        </div>


        {reports.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-[#1C292D] bg-[#0B1215] px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#152400]">

              <Users
                size={25}
                className="text-[#B6FF00]"
              />

            </div>

            <h2 className="mt-5 font-semibold text-[#F1F5F2]">
              Aucun signalement
            </h2>

            <p className="mt-2 text-sm text-[#647276]">
              Aucun membre n'a signalé sa disponibilité.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {reports.map(
              (report) => (

                <div
                  key={report.id}
                  className="rounded-2xl border border-[#1C292D] bg-[#0B1215] p-5"
                >


                  {/* TOP */}

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">


                    {/* USER */}

                    <div className="flex items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#152400] font-semibold text-[#B6FF00]">

                        {report.username
                          ?.charAt(0)
                          .toUpperCase()}

                      </div>


                      <div>

                        <p className="font-semibold text-[#F1F5F2]">

                          {report.first_name ||
                          report.last_name
                            ? `${report.first_name || ""} ${report.last_name || ""}`
                            : report.username}

                        </p>


                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#647276]">

                          <span className="flex items-center gap-1.5">

                            <UserRound size={13} />

                            @{report.username}

                          </span>


                          <span className="flex items-center gap-1.5">

                            <Users size={13} />

                            {report.team_name}

                          </span>

                        </div>

                      </div>

                    </div>


                    {/* STATUS */}

                    <span
                      className={
                        report.status === "ACTIVE"
                          ? "inline-flex w-fit rounded-full border border-[#304800] bg-[#152400] px-3 py-1 text-xs font-medium text-[#B6FF00]"
                          : "inline-flex w-fit rounded-full border border-emerald-900/50 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-400"
                      }
                    >

                      {report.status_label ||
                        report.status}

                    </span>

                  </div>


                  {/* MESSAGE */}

                  <div className="mt-5 rounded-xl border border-[#1C292D] bg-[#10191C] p-4">

                    <div className="flex gap-3">

                      <MessageSquareText
                        size={18}
                        className="mt-0.5 shrink-0 text-[#647276]"
                      />

                      <p className="text-sm leading-6 text-[#94A3A6]">

                        {report.message ||
                          "Aucun message."}

                      </p>

                    </div>

                  </div>


                  {/* FOOTER */}

                  <div className="mt-5 flex flex-col gap-4 border-t border-[#1C292D] pt-4 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-xs text-[#47565A]">

                      Signalé le{" "}

                      <span className="text-[#647276]">

                        {new Date(
                          report.created_at
                        ).toLocaleString(
                          "fr-FR"
                        )}

                      </span>

                    </p>


                    {report.status ===
                    "ACTIVE" ? (

                      <button
                        onClick={() =>
                          handleResolve(
                            report
                          )
                        }
                        disabled={
                          processingId ===
                          report.id
                        }
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#C4FF33] disabled:cursor-not-allowed disabled:opacity-60"
                      >

                        <CheckCircle2
                          size={16}
                        />

                        {processingId ===
                        report.id
                          ? "Traitement..."
                          : "Marquer comme résolu"}

                      </button>

                    ) : (

                      <button
                        onClick={() =>
                          handleReactivate(
                            report
                          )
                        }
                        disabled={
                          processingId ===
                          report.id
                        }
                        className="rounded-xl border border-[#1C292D] px-4 py-2.5 text-sm font-medium text-[#94A3A6] hover:bg-[#10191C] hover:text-white disabled:opacity-50"
                      >

                        Réactiver

                      </button>

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


export default Availability;