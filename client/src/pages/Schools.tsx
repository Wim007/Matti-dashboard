import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Check, Copy, Pencil, Plus, Trash2, X } from "lucide-react";

/**
 * Scholenbeheer — hier beheren schooldirecteuren/-medewerkers de canonieke
 * schoolnaam. Leerlingen kiezen in de Matti-onboarding uit precies deze
 * lijst, dus wat hier staat komt altijd overeen met de leerlingdata.
 * Hernoemen voegt bestaande events onder de nieuwe naam samen.
 */
export default function Schools() {
  const utils = trpc.useUtils();
  const { data: registered, isLoading } = trpc.schools.listRegistered.useQuery();
  const { data: allLabels } = trpc.schools.listAll.useQuery();

  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const invalidate = () => {
    utils.schools.listRegistered.invalidate();
    utils.schools.listAll.invalidate();
    utils.analytics.getSchools.invalidate();
  };

  const create = trpc.schools.create.useMutation({
    onSuccess: () => {
      setNewName("");
      setError("");
      invalidate();
    },
    onError: (e) => setError(e.message),
  });
  const rename = trpc.schools.rename.useMutation({
    onSuccess: () => {
      setEditing(null);
      setError("");
      invalidate();
    },
    onError: (e) => setError(e.message),
  });
  const remove = trpc.schools.remove.useMutation({
    onSuccess: invalidate,
    onError: (e) => setError(e.message),
  });

  // Labels die wél in events voorkomen maar niet in het register staan
  // (bijv. vrij ingetypt vóór registratie) — kandidaten om samen te voegen
  const unregistered = (allLabels ?? []).filter((l) => !(registered ?? []).includes(l));

  const dashboardLink = (school: string) =>
    `${window.location.origin}/?school=${encodeURIComponent(school)}`;

  const copyLink = async (school: string) => {
    try {
      await navigator.clipboard.writeText(dashboardLink(school));
      setCopied(school);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // klembord geweigerd — link staat ook in de title-tooltip
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Scholen</h1>
          <p className="text-muted-foreground">
            Beheer de schoolnamen. Leerlingen kiezen hun school uit precies deze lijst in de
            Matti-app, zodat de naam altijd overeenkomt met de data. Alle cijfers blijven
            anoniem: alleen thema&apos;s en aantallen, nooit wie.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>School toevoegen</CardTitle>
            <CardDescription>De naam zoals leerlingen hem te zien krijgen</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (newName.trim().length >= 2) create.mutate({ name: newName.trim() });
              }}
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Bijv. Da Vinci College"
                maxLength={120}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={newName.trim().length < 2 || create.isPending}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Toevoegen
              </button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geregistreerde scholen</CardTitle>
            <CardDescription>
              Hernoemen werkt ook alle bestaande statistieken bij. De dashboard-link opent het
              dashboard direct gefilterd op die school — handig om met de directeur te delen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Laden...</p>
            ) : (registered ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen scholen geregistreerd.</p>
            ) : (
              <div className="divide-y divide-border">
                {(registered ?? []).map((school) => (
                  <div key={school} className="py-3 flex items-center gap-2">
                    {editing === school ? (
                      <>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          maxLength={120}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() =>
                            editValue.trim().length >= 2 &&
                            rename.mutate({ oldName: school, newName: editValue.trim() })
                          }
                          disabled={rename.isPending}
                          title="Opslaan"
                          className="p-2 rounded-lg text-green-600 hover:bg-muted"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          title="Annuleren"
                          className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 font-medium text-foreground">{school}</span>
                        <button
                          onClick={() => copyLink(school)}
                          title={dashboardLink(school)}
                          className="px-2 py-1.5 rounded-lg text-muted-foreground hover:bg-muted flex items-center gap-1 text-xs"
                        >
                          {copied === school ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied === school ? "Gekopieerd" : "Dashboard-link"}
                        </button>
                        <button
                          onClick={() => {
                            setEditing(school);
                            setEditValue(school);
                          }}
                          title="Naam aanpassen"
                          className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`"${school}" uit het register verwijderen? Bestaande statistieken blijven bewaard.`)) {
                              remove.mutate({ name: school });
                            }
                          }}
                          title="Verwijderen"
                          className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {unregistered.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Niet-geregistreerde namen in de data</CardTitle>
              <CardDescription>
                Deze namen zijn door leerlingen ingevuld maar staan niet in het register.
                Hernoem ze naar de juiste school om ze samen te voegen, of neem ze op in het register.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {unregistered.map((label) => (
                  <div key={label} className="py-3 flex items-center gap-2">
                    <span className="flex-1 text-foreground">{label}</span>
                    <button
                      onClick={() => {
                        const to = window.prompt(`"${label}" samenvoegen met / hernoemen naar:`, label);
                        if (to && to.trim().length >= 2) rename.mutate({ oldName: label, newName: to.trim() });
                      }}
                      className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted"
                    >
                      Samenvoegen / hernoemen
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
