import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Copy, Key, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ApiKeys() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyApp, setNewKeyApp] = useState<"matti" | "opvoedmaatje">("matti");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: apiKeys, isLoading } = trpc.apiKeys.list.useQuery();

  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setGeneratedKey(data.key);
      setNewKeyName("");
      setNewKeyApp("matti");
      utils.apiKeys.list.invalidate();
      toast.success("API-sleutel succesvol aangemaakt");
    },
    onError: (error) => {
      toast.error(error.message || "Aanmaken API-sleutel mislukt");
    },
  });

  const toggleMutation = trpc.apiKeys.toggle.useMutation({
    onSuccess: () => {
      utils.apiKeys.list.invalidate();
      toast.success("API-sleutel status bijgewerkt");
    },
    onError: (error) => {
      toast.error(error.message || "Bijwerken API-sleutel mislukt");
    },
  });

  const handleCreate = () => {
    if (!newKeyName.trim()) {
      toast.error("Voer een sleutelnaam in");
      return;
    }
    createMutation.mutate({ name: newKeyName, appName: newKeyApp });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API-sleutel gekopieerd naar klembord");
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setGeneratedKey(null);
    setNewKeyName("");
    setNewKeyApp("matti");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API-sleutels</h1>
            <p className="text-muted-foreground mt-2">
              Beheer authenticatiesleutels voor Matti en Opvoedmaatje apps
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                API-sleutel Aanmaken
              </Button>
            </DialogTrigger>
            <DialogContent>
              {generatedKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>API-sleutel Aangemaakt</DialogTitle>
                    <DialogDescription>
                      Kopieer deze sleutel nu. U kunt deze niet meer zien.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                      <code className="flex-1">{generatedKey}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyKey(generatedKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCloseCreateDialog}>Klaar</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Nieuwe API-sleutel Aanmaken</DialogTitle>
                    <DialogDescription>
                      Genereer een nieuwe authenticatiesleutel voor app-integratie
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName">Sleutelnaam</Label>
                      <Input
                        id="keyName"
                        placeholder="bijv., Productie Matti Sleutel"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appName">App Naam</Label>
                      <Select value={newKeyApp} onValueChange={(v) => setNewKeyApp(v as "matti" | "opvoedmaatje")}>
                        <SelectTrigger id="appName">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="matti">Matti</SelectItem>
                          <SelectItem value="opvoedmaatje">Opvoedmaatje</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseCreateDialog}>
                      Annuleren
                    </Button>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Aanmaken..." : "Sleutel Aanmaken"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actieve API-sleutels</CardTitle>
            <CardDescription>
              Beheer authenticatiesleutels voor externe app-integratie
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : apiKeys && apiKeys.length > 0 ? (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{apiKey.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-muted-foreground capitalize">
                            {apiKey.appName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Aangemaakt {new Date(apiKey.createdAt).toLocaleDateString("nl-NL")}
                          </span>
                          {apiKey.lastUsedAt && (
                            <span className="text-xs text-muted-foreground">
                              Laatst gebruikt {new Date(apiKey.lastUsedAt).toLocaleDateString("nl-NL")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`toggle-${apiKey.id}`} className="text-sm">
                          {apiKey.isActive ? "Actief" : "Inactief"}
                        </Label>
                        <Switch
                          id={`toggle-${apiKey.id}`}
                          checked={apiKey.isActive}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ keyId: apiKey.id, isActive: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nog geen API-sleutels aangemaakt</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Maak uw eerste API-sleutel aan om analytics-gegevens te ontvangen
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
