import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from "../lib/users";

export function UsersSection() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "mitarbeiter">("mitarbeiter");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createUser.mutateAsync({ name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("mitarbeiter");
      setAdding(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Anlegen fehlgeschlagen.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Diesen Benutzer wirklich löschen?")) return;
    try {
      await deleteUser.mutateAsync(id);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Löschen fehlgeschlagen.");
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Benutzer</h3>
        {!adding && (
          <button type="button" className="btn btn-secondary" onClick={() => setAdding(true)}>
            + Benutzer
          </button>
        )}
      </div>

      {isLoading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: adding ? 16 : 0 }}>
          {users?.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div>
                <strong>{u.name}</strong>
                <span style={{ color: "var(--color-text-muted)", marginLeft: 8 }}>{u.email}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={u.role}
                  onChange={(e) => updateUser.mutate({ id: u.id, role: e.target.value as "admin" | "mitarbeiter" })}
                  disabled={updateUser.isPending}
                  style={{ padding: "6px 8px" }}
                >
                  <option value="mitarbeiter">Mitarbeiter</option>
                  <option value="admin">Admin</option>
                </select>
                {u.id !== currentUser?.id && (
                  <button type="button" className="btn btn-secondary" onClick={() => handleDelete(u.id)}>
                    Löschen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="u-name">Name</label>
            <input id="u-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="u-email">E-Mail</label>
            <input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="u-password">Passwort</label>
            <input
              id="u-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="u-role">Rolle</label>
            <select id="u-role" value={role} onChange={(e) => setRole(e.target.value as "admin" | "mitarbeiter")}>
              <option value="mitarbeiter">Mitarbeiter</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setAdding(false)}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary" disabled={createUser.isPending}>
              {createUser.isPending ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
