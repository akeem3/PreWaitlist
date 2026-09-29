"use client";

import { useEffect } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { useUpgradeModal } from "../shell";

// 4.5: same pattern as BroadcastFreeGate — free founders landing on
// /dashboard/updates directly get the upgrade path (modal open, trigger
// "updates") instead of a silent redirect. Display copy reuses existing
// strings only ("Updates" H1, "Upgrade to Pro" CTA); no new copy.
export default function UpdatesFreeGate() {
  const openUpgradeModal = useUpgradeModal();

  useEffect(() => {
    openUpgradeModal("updates");
  }, [openUpgradeModal]);

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-h2 text-foreground mb-6">Updates</h1>
      <Card>
        <CardContent className="pt-6 text-center">
          <Button onClick={() => openUpgradeModal("updates")}>
            Upgrade to Pro
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
