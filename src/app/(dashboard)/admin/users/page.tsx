"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocs } from "firebase/firestore";
import { Search, Users } from "lucide-react";

import { usersCollection } from "@/firebase/collections";
import type { UserDocument } from "@/types/user.types";
import { formatDate } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(usersCollection);
      const allUsers = snapshot.docs.map((docSnap) => ({ ...docSnap.data(), id: docSnap.id })) as UserDocument[];
      setUsers(allUsers);
    } catch { /* Silently fail */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = users.filter((user) => {
    if (roleFilter && user.role !== roleFilter) return false;
    if (statusFilter && user.profileStatus !== statusFilter) return false;
    if (search && !user.email.toLowerCase().includes(search.toLowerCase()) && !user.entityId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusConfig = (status: string) => {
    switch (status) {
      case "approved": return { variant: "default" as const, className: "bg-green-100 text-green-800" };
      case "rejected": return { variant: "destructive" as const, className: "bg-red-100 text-red-800" };
      default: return { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" };
    }
  };

  const roleConfig = (role: string) => {
    switch (role) {
      case "startup": return "bg-blue-100 text-blue-800";
      case "mentor": return "bg-purple-100 text-purple-800";
      case "admin": return "bg-gray-100 text-gray-800";
      default: return "";
    }
  };

  // Summary counts
  const counts = {
    total: users.length,
    startups: users.filter(u => u.role === "startup").length,
    mentors: users.filter(u => u.role === "mentor").length,
    pending: users.filter(u => u.profileStatus === "pending").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">Manage all registered users on the platform.</p>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Total Users", value: counts.total, color: "text-foreground" },
            { label: "Startups", value: counts.startups, color: "text-blue-600" },
            { label: "Mentors", value: counts.mentors, color: "text-purple-600" },
            { label: "Pending", value: counts.pending, color: "text-yellow-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-card px-4 py-3">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="startup">Startup</SelectItem>
            <SelectItem value="mentor">Mentor</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {(roleFilter || statusFilter || search) && (
          <button onClick={() => { setRoleFilter(""); setStatusFilter(""); setSearch(""); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {loading && (
        <div className="rounded-md border">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground">No users found{search || roleFilter || statusFilter ? " matching your filters" : ""}.</p>
                  </TableCell>
                </TableRow>
              )}
              {filteredUsers.map((user) => {
                const sc = statusConfig(user.profileStatus);
                return (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${roleConfig(user.role)}`}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${sc.className}`}>{user.profileStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{user.entityId}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredUsers.length > 0 && (
            <div className="px-4 py-2 border-t text-xs text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          )}
        </div>
      )}
    </div>
  );
}
