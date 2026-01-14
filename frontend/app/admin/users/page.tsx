"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2, Users } from "lucide-react";

type User = {
  id: number;
  email: string;
  username: string;
  workspaces: Array<{
    id: number;
    description: string;
    status: string;
    boards: Array<{ id: number; title: string }>;
  }>;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Échec du chargement des utilisateurs");
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      if (!formData.email || !formData.password) {
        setError("Email et mot de passe requis");
        return;
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Échec de création");
        return;
      }

      setIsCreateDialogOpen(false);
      setFormData({ email: "", username: "", password: "" });
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleUpdateUser() {
    if (!editingUser) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Échec de mise à jour");
        return;
      }

      setIsEditDialogOpen(false);
      setEditingUser(null);
      setFormData({ email: "", username: "", password: "" });
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?"))
      return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Échec de suppression");
        return;
      }

      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function openEditDialog(user: User) {
    setEditingUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      password: "",
    });
    setIsEditDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Chargement...
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Gestion des utilisateurs
            </h1>
            <p className="text-muted-foreground">
              Gérer les comptes utilisateurs de l'application
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setFormData({ email: "", username: "", password: "" });
            setIsCreateDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800 border border-red-200">
          {error}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-2"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nom d'utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Workspaces</TableHead>
              <TableHead>Boards</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-sm">{user.id}</TableCell>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.workspaces.length}</TableCell>
                <TableCell>
                  {user.workspaces.reduce(
                    (total, ws) => total + ws.boards.length,
                    0
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer un nouveau compte utilisateur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="utilisateur@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-username">Nom d'utilisateur</Label>
              <Input
                id="create-username"
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Optionnel - généré depuis l'email si vide"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Mot de passe *</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateUser}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Mettre à jour les informations de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">Nom d'utilisateur</Label>
              <Input
                id="edit-username"
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nouveau mot de passe</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateUser}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
