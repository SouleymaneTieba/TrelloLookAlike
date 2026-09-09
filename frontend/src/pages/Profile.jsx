import { Check, LockKeyhole, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";


const emptyForm = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  job_title: "",
  bio: "",
};


function Profile() {

  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [password, setPassword] = useState({
    new_password: "",
    password_confirm: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        job_title: user.job_title || "",
        bio: user.bio || "",
      });
    }
  }, [user]);


  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };


  const handlePasswordChange = (event) => {
    setPassword((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      password.new_password &&
      password.new_password !== password.password_confirm
    ) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSaving(true);

    try {
      const updatedUser = await updateUser({
        ...form,
        ...(password.new_password ? password : {}),
      });

      setForm((current) => ({
        ...current,
        email: updatedUser.email || "",
      }));
      setPassword({ new_password: "", password_confirm: "" });
      setMessage("Vos informations ont été mises à jour.");
    } catch (requestError) {
      const data = requestError.response?.data;
      setError(
        data?.detail ||
        Object.values(data || {})[0]?.[0] ||
        "La mise à jour a échoué."
      );
    } finally {
      setSaving(false);
    }
  };


  const inputClass =
    "mt-2 w-full rounded-lg border border-[#26363A] bg-[#0B1315] px-3 py-2.5 text-sm text-[#F1F5F2] outline-none transition focus:border-[#B6FF00]";


  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B6FF00]">
          Compte
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#F1F5F2]">Mon profil</h1>
        <p className="mt-2 text-sm text-[#94A3A6]">
          Gérez vos informations personnelles et votre accès.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-[#1C292D] bg-[#10191C] p-6">
          <div className="mb-6 flex items-center gap-3">
            <UserRound className="text-[#B6FF00]" size={21} />
            <div>
              <h2 className="font-semibold text-[#F1F5F2]">Informations personnelles</h2>
              <p className="text-sm text-[#647276]">@{user?.username}</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["first_name", "Prénom", "text"],
              ["last_name", "Nom", "text"],
              ["email", "Adresse email", "email"],
              ["phone", "Téléphone", "tel"],
              ["job_title", "Fonction", "text"],
            ].map(([name, label, type]) => (
              <label key={name} className="text-sm text-[#94A3A6]">
                {label}
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </label>
            ))}

            <label className="text-sm text-[#94A3A6] md:col-span-2">
              Biographie
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[#1C292D] bg-[#10191C] p-6">
          <div className="mb-6 flex items-center gap-3">
            <LockKeyhole className="text-[#B6FF00]" size={21} />
            <div>
              <h2 className="font-semibold text-[#F1F5F2]">Mot de passe</h2>
              <p className="text-sm text-[#647276]">Laissez vide pour le conserver.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm text-[#94A3A6]">
              Nouveau mot de passe
              <input
                name="new_password"
                type="password"
                value={password.new_password}
                onChange={handlePasswordChange}
                className={inputClass}
                minLength={8}
              />
            </label>
            <label className="text-sm text-[#94A3A6]">
              Confirmation
              <input
                name="password_confirm"
                type="password"
                value={password.password_confirm}
                onChange={handlePasswordChange}
                className={inputClass}
                minLength={8}
              />
            </label>
          </div>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && (
          <p className="flex items-center gap-2 text-sm text-[#B6FF00]">
            <Check size={17} /> {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-[#050A0C] transition hover:bg-[#D1FF66] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}


export default Profile;