import { useState } from "react";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      formData.password !==
      formData.password_confirm
    ) {
      setError(
        "Les mots de passe ne correspondent pas."
      );
      return;
    }

    setLoading(true);

    try {
      await api.post(
        "/users/register/",
        formData
      );

      setSuccess(
        "Compte créé avec succès !"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      console.error(error);

      const data = error.response?.data;

      if (data) {
        const messages = Object.values(data)
          .flat()
          .join(" ");

        setError(messages);
      } else {
        setError(
          "Impossible de créer le compte."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0E171A] px-4 py-6 sm:p-8 lg:p-10">

      {/* Decorative glow */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-[440px] w-[440px] rounded-full bg-[#B6FF00]/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-[500px] w-[500px] rounded-full bg-[#B6FF00]/8 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B6FF00]/3 blur-3xl" />

      <main className="relative grid w-full max-w-[1500px] overflow-hidden rounded-3xl border border-[#1C292D] bg-[#0B1215] shadow-2xl lg:min-h-[780px] lg:grid-cols-[minmax(0,0.85fr)_minmax(580px,1.15fr)]">

        <section className="flex flex-col justify-center bg-[#0B1215] p-7 sm:p-10 lg:px-[14%] lg:py-14">

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

          <div>
            <h2 className="text-2xl font-semibold text-[#F1F5F2]">
              Rejoignez votre équipe
            </h2>
            <p className="mt-2 text-sm text-[#94A3A6]">
              Créez votre compte et commencez à organiser votre travail en équipe.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[#0B1215]/90 p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-xl rounded-3xl border border-[#1C292D] bg-[#0B1215] p-8 shadow-2xl">

            <div className="mb-7">
              <h2 className="text-2xl font-semibold text-[#F1F5F2]">
                Créer un compte
              </h2>

              <p className="mt-2 text-sm text-[#94A3A6]">
                Rejoignez votre espace de travail.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl border border-[#304800] bg-[#152400] px-4 py-3 text-sm text-[#B6FF00]">
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

            {/* First / Last name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div>

                <label
                  htmlFor="first_name"
                  className="mb-2 block text-sm font-medium text-[#F1F5F2]"
                >
                  Prénom
                </label>

                <input
                  id="first_name"
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Souleymane"
                  autoComplete="given-name"
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none transition placeholder:text-[#647276] focus:border-[#B6FF00] focus:ring-1 focus:ring-[#B6FF00]/30"
                />

              </div>

              <div>

                <label
                  htmlFor="last_name"
                  className="mb-2 block text-sm font-medium text-[#F1F5F2]"
                >
                  Nom
                </label>

                <input
                  id="last_name"
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Tieba"
                  autoComplete="family-name"
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none transition placeholder:text-[#647276] focus:border-[#B6FF00] focus:ring-1 focus:ring-[#B6FF00]/30"
                />

              </div>

            </div>

            {/* Username */}
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
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="souley123"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] py-3 pl-11 pr-4 text-sm text-[#F1F5F2] outline-none transition placeholder:text-[#647276] focus:border-[#B6FF00] focus:ring-1 focus:ring-[#B6FF00]/30"
                />

              </div>

            </div>

            {/* Email */}
            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#F1F5F2]"
              >
                Adresse email
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647276]"
                />

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="souley@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] py-3 pl-11 pr-4 text-sm text-[#F1F5F2] outline-none transition placeholder:text-[#647276] focus:border-[#B6FF00] focus:ring-1 focus:ring-[#B6FF00]/30"
                />

              </div>

            </div>

            {/* Password */}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 caractères"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] py-3 pl-11 pr-4 text-sm text-[#F1F5F2] outline-none transition placeholder:text-[#647276] focus:border-[#B6FF00] focus:ring-1 focus:ring-[#B6FF00]/30"
                />

              </div>

            </div>

            {/* Confirm password */}
            <div>

              <label
                htmlFor="password_confirm"
                className="mb-2 block text-sm font-medium text-[#F1F5F2]"
              >
                Confirmer le mot de passe
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647276]"
                />

                <input
                  id="password_confirm"
                  type="password"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder="Retapez votre mot de passe"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] py-3 pl-11 pr-4 text-sm text-[#F1F5F2] outline-none transition placeholder:text-[#647276] focus:border-[#B6FF00] focus:ring-1 focus:ring-[#B6FF00]/30"
                />

              </div>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] py-3 font-semibold text-black transition hover:bg-[#C4FF33] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Création du compte..."
                : "Créer mon compte"}

              {!loading && (
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}

            </button>

            </form>

            <div className="mt-7 border-t border-[#1C292D] pt-6 text-center">

              <p className="text-sm text-[#647276]">
                Vous avez déjà un compte ?
              </p>

              <Link
                to="/login"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#B6FF00] transition hover:text-[#C4FF33]"
              >
                Se connecter

                <ArrowRight size={15} />

              </Link>

            </div>

          </div>
        </section>

      </main>

    </div>
  );
}

export default Register;