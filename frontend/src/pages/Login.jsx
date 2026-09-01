import { useState } from "react";

import {
  ArrowRight,
  Check,
  FolderKanban,
  LockKeyhole,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function Login() {

  const navigate = useNavigate();

  const {
    user,
    login,
  } = useAuth();


  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");


  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // ==========================================
  // UTILISATEUR DÉJÀ CONNECTÉ
  // ==========================================

  if (user) {

    if (
      user.is_staff ||
      user.is_superuser
    ) {

      return (
        <Navigate
          to="/admin"
          replace
        />
      );

    }

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }


  // ==========================================
  // CONNEXION
  // ==========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setLoading(true);


    try {

      /*
       * login() doit mettre à jour le
       * user dans AuthContext.
       */

      const loggedUser =
        await login(
          username,
          password
        );


      /*
       * Si login() retourne l'utilisateur,
       * on peut déterminer directement
       * où le rediriger.
       */

      if (
        loggedUser?.is_staff ||
        loggedUser?.is_superuser
      ) {

        navigate("/admin");

      } else {

        navigate("/dashboard");

      }


    } catch (error) {

      console.error(error);


      if (error.response?.data) {

        setError(
          "Nom d'utilisateur ou mot de passe incorrect."
        );

      } else {

        setError(
          "Impossible de contacter le serveur."
        );

      }

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0E171A] px-4 py-6 sm:p-8 lg:p-10">


      {/* ======================================
          DECORATIVE GLOW
      ======================================= */}

      <div className="pointer-events-none absolute -left-20 -top-20 h-[440px] w-[440px] rounded-full bg-[#B6FF00]/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-[500px] w-[500px] rounded-full bg-[#B6FF00]/8 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B6FF00]/3 blur-3xl" />


      <main className="relative grid w-full max-w-[1500px] overflow-hidden rounded-3xl border border-[#1C292D] bg-[#0B1215] shadow-2xl lg:min-h-[780px] lg:grid-cols-[minmax(0,0.85fr)_minmax(580px,1.15fr)]">

        <section className="flex flex-col justify-center bg-[#0B1215] p-7 sm:p-10 lg:px-[14%] lg:py-14">


        {/* ======================================
            LOGO
        ======================================= */}

        <div className="mb-10 flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#152400]">

            <span className="text-xl font-bold text-[#B6FF00]">
              F
            </span>

          </div>


          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#B6FF00]">
              Trell
            </h1>

            <p className="text-xs text-[#647276]">
              Project Management
            </p>
          </div>

        </div>


        {/* ======================================
            CARD
        ======================================= */}

        <div>


          {/* HEADER */}

          <div className="mb-7">

            <h2 className="text-2xl font-semibold text-[#F1F5F2]">
              Bienvenue
            </h2>

            <p className="mt-2 text-sm text-[#94A3A6]">
              Connectez-vous à votre espace de travail.
            </p>

          </div>


          {/* ====================================
              ERROR
          ===================================== */}

          {error && (

            <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

              {error}

            </div>

          )}


          {/* ====================================
              FORM
          ===================================== */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >


            {/* USERNAME */}

            <div>

              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-[#F1F5F2]"
              >
                Nom d'utilisateur
              </label>


              <div className="relative">

                <UserRound
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647276]"
                />


                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  placeholder="Votre username"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] py-3 pl-11 pr-4 text-sm text-[#F1F5F2] outline-none transition placeholder:text-[#647276] focus:border-[#B6FF00] focus:ring-1 focus:ring-[#B6FF00]/30"
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#F1F5F2]"
              >
                Mot de passe
              </label>


              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647276]"
                />


                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] py-3 pl-11 pr-4 text-sm text-[#F1F5F2] outline-none transition placeholder:text-[#647276] focus:border-[#B6FF00] focus:ring-1 focus:ring-[#B6FF00]/30"
                />

              </div>

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] py-3 font-semibold text-black transition hover:bg-[#C4FF33] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading
                ? "Connexion..."
                : "Se connecter"}


              {!loading && (

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />

              )}

            </button>

          </form>


          {/* ======================================
              REGISTER
          ======================================= */}

          <div className="mt-7 border-t border-[#1C292D] pt-6">

            <p className="text-sm text-[#647276]">
              Vous n'avez pas encore de compte ?
            </p>


            <Link
              to="/register"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#B6FF00] transition hover:text-[#C4FF33]"
            >

              Créer un compte

              <ArrowRight size={15} />

            </Link>

          </div>

        </div>


        {/* FOOTER */}

        <p className="mt-8 text-xs text-[#47565A]">
          Trell  Project Manager
        </p>

        </section>

        <aside className="relative hidden overflow-hidden border-l border-[#1C292D] bg-[#10191C] p-12 lg:flex lg:flex-col lg:justify-between lg:p-[14%]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#B6FF00]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#B6FF00]/10 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B6FF00]/5 blur-3xl" />

          <div className="relative">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#1C292D] bg-[#152400] px-3 py-1.5 text-xs font-medium text-[#B6FF00]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B6FF00]" />
              Votre espace, toujours synchronise
            </div>

            <h2 className="max-w-sm text-3xl font-semibold leading-tight text-[#F1F5F2]">
              Gardez chaque projet sur la bonne voie.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-6 text-[#94A3A6]">
              Centralisez les priorites, les conversations et l'avancement de votre equipe au meme endroit.
            </p>
          </div>

          <div className="relative mt-12 space-y-3">
            <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215]/90 p-4 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#152400] text-[#B6FF00]">
                  <FolderKanban size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F1F5F2]">Projets organises</p>
                  <p className="mt-1 text-xs leading-5 text-[#647276]">Une vue claire de vos objectifs et de leurs echeances.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1C292D] bg-[#0B1215]/90 p-4 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#152400] text-[#B6FF00]">
                  <UsersRound size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F1F5F2]">Equipe alignee</p>
                  <p className="mt-1 text-xs leading-5 text-[#647276]">Partagez les bonnes informations avec les bonnes personnes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-8 flex items-center gap-2 text-xs text-[#94A3A6]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#152400] text-[#B6FF00]">
              <Check size={13} strokeWidth={3} />
            </span>
            Un espace de travail pense pour avancer ensemble.
          </div>
        </aside>
      </main>

    </div>

  );

}


export default Login;
