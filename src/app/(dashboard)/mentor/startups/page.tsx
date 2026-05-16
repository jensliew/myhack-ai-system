"use client";

import { useState } from "react";
import { useStartupDiscovery } from "@/hooks/useStartupDiscovery";
import { useMatching } from "@/hooks/useMatching";
import { StartupCard } from "@/components/cards/StartupCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, X } from "lucide-react";

const INDUSTRY_OPTIONS = [
  "FinTech",
  "HealthTech",
  "EdTech",
  "E-Commerce",
  "SaaS",
  "AI/ML",
  "CleanTech",
  "AgriTech",
  "Logistics",
  "Other",
];

const STAGE_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B" },
  { value: "growth", label: "Growth" },
];

const FUNDING_OPTIONS = [
  "Bootstrapped",
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
];

export default function MentorStartupsPage() {
  const {
    startups,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
  } = useStartupDiscovery();

  const { handleExpressInterest, isInterested, isLoading } = useMatching();
  const [confirmStartupId, setConfirmStartupId] = useState<string | null>(null);
  const confirmStartup = startups.find((s) => s.id === confirmStartupId);

  const hasActiveFilters =
    !!filters.industry || !!filters.stage || !!filters.fundingStage || !!searchQuery;

  function clearFilters() {
    setSearchQuery("");
    setFilters({ industry: null, stage: null, fundingStage: null });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Browse Startups</h1>
        <p className="mt-1 text-muted-foreground">
          Search and filter startups to find the right match for your expertise.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.industry ?? ""}
          onValueChange={(value) =>
            setFilters({ ...filters, industry: value || null })
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRY_OPTIONS.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.stage ?? ""}
          onValueChange={(value) =>
            setFilters({ ...filters, stage: value || null })
          }
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            {STAGE_OPTIONS.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.fundingStage ?? ""}
          onValueChange={(value) =>
            setFilters({ ...filters, fundingStage: value || null })
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Funding" />
          </SelectTrigger>
          <SelectContent>
            {FUNDING_OPTIONS.map((funding) => (
              <SelectItem key={funding} value={funding}>
                {funding}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {!loading && !error && startups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No startups found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Check back later for new startups."}
          </p>
        </div>
      )}

      {!loading && !error && startups.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {startups.map((startup) => (
            <StartupCard
              key={startup.id}
              startup={startup}
              onInterested={() => setConfirmStartupId(startup.id)}
              isInterested={isInterested(startup.id)}
              isLoading={isLoading(startup.id)}
            />
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmStartupId} onOpenChange={() => setConfirmStartupId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Express Interest?</DialogTitle>
          </DialogHeader>
          {confirmStartup && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to express mentorship interest in <strong>{confirmStartup.name}</strong>.
              </p>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">What happens next:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The startup will see your profile in their &quot;Mentors Interested&quot; section</li>
                  <li>They can review your expertise and decide to accept or reject</li>
                  <li>If accepted, a mentorship relationship will be created</li>
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStartupId(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (confirmStartupId) {
                  await handleExpressInterest(confirmStartupId);
                  setConfirmStartupId(null);
                }
              }}
            >
              Yes, Express Interest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
