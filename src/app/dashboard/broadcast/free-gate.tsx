"use client";

import { useEffect } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { useUpgradeModal } from "../shell";

// Story 17.4 AC2: Free founders landing on /dashboard/broadcast directly get
// the upgrade path — the same modal + trigger ("broadcast") as the sidebar
// lock path — instead of a silent redirect. Display copy reuses existing
// strings only ("Broadcast Email" H1, "Upgrade to Pro" CTA); no new copy.
export default function BroadcastFreeGate() {
  const openUpgradeModal = useUpgradeModal();

  useEffect(() => {
    openUpgradeModal("broadcast");
  }, [openUpgradeModal]);

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-h2 text-foreground mb-6">Broadcast Email</h1>
      <Card>
        <CardContent className="pt-6 text-center">
          <Button onClick={() => openUpgradeModal("broadcast")}>
            Upgrade to Pro
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
