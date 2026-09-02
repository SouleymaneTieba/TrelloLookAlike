import { useEffect, useState } from "react";

import {
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import api from "../../services/api";


function Roles() {

  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingRole, setEditingRole] = useState(null);

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    label: "",
    unique_per_team: false,
  });


  const fetchRoles = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await api.get("/teams/roles/");

      setRoles(response.data);

    } catch (err) {

      console.error(err);

      setError("Impossible de récupérer les rôles.");

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchRoles();

  }, []);


  const handleSubmit = async (event) => {

    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {

      const payload = {
        label: form.label,
        unique_per_team: form.unique_per_team,
      };

      const response = editingRole
        ? await api.patch(
            `/teams/roles/${editingRole.id}/`,
            payload
          )
        : await api.post(
            "/teams/roles/",
            payload
          );

      setRoles((previous) => {
        const updated = editingRole
          ? previous.map((role) =>
              role.id === editingRole.id
                ? response.data
                : role
            )
          : [...previous, response.data];

        return updated.sort((left, right) =>
          left.label.localeCompare(right.label)
        );
      });

      setForm({
        label: "",
        unique_per_team: false,
      });

      setEditingRole(null);
      setShowModal(false);

    } catch (err) {

      console.error(err);

      const data = err.response?.data;

      if (data) {

        const messages = Object.values(data)
          .flat()
          .join(" ");

        setFormError(
          messages || "Impossible d'enregistrer le rôle."
        );

      } else {

        setFormError("Impossible de contacter le serveur.");

      }

    } finally {

      setSaving(false);

    }

  };


  const openCreateModal = () => {
    setFormError("");
    setEditingRole(null);
    setForm({
      label: "",
      unique_per_team: false,
    });
    setShowModal(true);
  };


  const openEditModal = (role) => {
    setFormError("");
    setEditingRole(role);
    setForm({
      label: role.label,
      unique_per_team: role.unique_per_team,
    });
    setShowModal(true);
  };


  const handleDelete = async (role) => {

    if (role.is_system) {
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous supprimer le rôle « ${role.label} » ?`
    );

    if (!confirmed) {
      return;
    }

    try {

      await api.delete(`/teams/roles/${role.id}/`);

      setRoles((previous) =>
        previous.filter((item) => item.id !== role.id)
      );

    } catch (err) {

      console.error(err);

      const data = err.response?.data;

      const message = Array.isArray(data)
        ? data.join(" ")
        : data?.detail
          || Object.values(data || {}).flat().join(" ")
          || "Impossible de supprimer ce rôle.";

      setError(message);

    }

  };


  if (loading) {

    return (

      <div className="flex min-h-[400px] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1C292D] border-t-[#B6FF00]" />

          <p className="mt-4 text-sm text-[#647276]">
            Chargement des rôles...
          </p>

        </div>

      </div>

    );

  }


  return (

    <div>


      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <p className="mb-2 text-sm font-medium text-[#B6FF00]">
            Administration
          </p>

          <h1 className="text-3xl font-semibold text-[#F1F5F2]">
            Rôles
          </h1>

          <p className="mt-2 text-[#94A3A6]">
            Créez des rôles et assignez-les ensuite aux membres d'équipe.
          </p>

        </div>

        <button
          onClick={() => {
            openCreateModal();
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#C4FF33]"
        >

          <Plus size={18} />

          Créer un rôle

        </button>

      </div>


      {error && (

        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">

          {error}

        </div>

      )}


      <div className="mt-8 overflow-hidden rounded-2xl border border-[#1C292D] bg-[#0B1215]">

        {roles.length === 0 ? (

          <div className="px-6 py-16 text-center">

            <ShieldCheck
              size={30}
              className="mx-auto text-[#47565A]"
            />

            <p className="mt-4 font-medium text-[#F1F5F2]">
              Aucun rôle
            </p>

            <p className="mt-1 text-sm text-[#647276]">
              Créez votre premier rôle personnalisé.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[700px]">

              <thead>

                <tr className="border-b border-[#1C292D] text-left">

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#647276]">
                    Rôle
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#647276]">
                    Identifiant
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#647276]">
                    Unicité
                  </th>

                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-[#647276]">
                    Type
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-[#647276]">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {roles.map((role) => (

                  <tr
                    key={role.id}
                    className="border-b border-[#1C292D] last:border-b-0 hover:bg-[#10191C]"
                  >

                    <td className="px-6 py-4 font-medium text-[#F1F5F2]">
                      {role.label}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#94A3A6]">
                      {role.slug}
                    </td>

                    <td className="px-6 py-4 text-sm text-[#94A3A6]">

                      {role.unique_per_team
                        ? "Un seul par équipe"
                        : "Plusieurs membres"}

                    </td>

                    <td className="px-6 py-4">

                      {role.is_system ? (

                        <span className="inline-flex rounded-full border border-[#304800] bg-[#152400] px-3 py-1 text-xs font-medium text-[#B6FF00]">
                          Système
                        </span>

                      ) : (

                        <span className="inline-flex rounded-full border border-[#1C292D] bg-[#10191C] px-3 py-1 text-xs font-medium text-[#94A3A6]">
                          Personnalisé
                        </span>

                      )}

                    </td>

                    <td className="px-6 py-4 text-right">

                      <div className="flex items-center justify-end gap-1">

                        <button
                          onClick={() => openEditModal(role)}
                          className="rounded-lg p-2 text-[#647276] transition hover:bg-[#152400] hover:text-[#B6FF00]"
                          title="Modifier"
                        >

                          <Pencil size={17} />

                        </button>

                        {!role.is_system && (

                        <button
                          onClick={() => handleDelete(role)}
                          className="rounded-lg p-2 text-[#647276] transition hover:bg-red-950/40 hover:text-red-400"
                          title="Supprimer"
                        >

                          <Trash2 size={17} />

                        </button>

                        )}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl border border-[#1C292D] bg-[#0B1215] shadow-2xl">

            <div className="flex items-center justify-between border-b border-[#1C292D] px-6 py-5">

              <div>

                <h2 className="font-semibold text-[#F1F5F2]">
                  {editingRole ? "Modifier le rôle" : "Créer un rôle"}
                </h2>

                <p className="mt-1 text-sm text-[#647276]">
                  Ce rôle pourra ensuite être attribué aux membres.
                </p>

              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-[#647276] hover:bg-[#10191C] hover:text-white"
              >

                <X size={20} />

              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {formError && (

                <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                  {formError}
                </div>

              )}

              <div>

                <label className="mb-2 block text-sm font-medium text-[#F1F5F2]">
                  Nom du rôle
                </label>

                <input
                  value={form.label}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      label: event.target.value,
                    })
                  }
                  placeholder="Ex : QA Lead"
                  required
                  className="w-full rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3 text-sm text-[#F1F5F2] outline-none placeholder:text-[#47565A] focus:border-[#B6FF00]"
                />

              </div>

              <label className="flex items-start gap-3 rounded-xl border border-[#1C292D] bg-[#10191C] px-4 py-3">

                <input
                  type="checkbox"
                  checked={form.unique_per_team}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      unique_per_team: event.target.checked,
                    })
                  }
                  className="mt-1"
                />

                <span>

                  <span className="block text-sm font-medium text-[#F1F5F2]">
                    Un seul membre par équipe
                  </span>

                  <span className="mt-1 block text-xs text-[#647276]">
                    Utile pour un rôle unique, comme chef de projet.
                  </span>

                </span>

              </label>

              <div className="flex justify-end gap-3 border-t border-[#1C292D] pt-5">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-[#1C292D] px-4 py-3 text-sm font-medium text-[#94A3A6] hover:bg-[#10191C] hover:text-white"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#B6FF00] px-5 py-3 text-sm font-semibold text-black hover:bg-[#C4FF33] disabled:opacity-60"
                >

                  {saving
                    ? "Enregistrement..."
                    : editingRole
                      ? "Enregistrer les modifications"
                      : "Créer le rôle"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default Roles;
