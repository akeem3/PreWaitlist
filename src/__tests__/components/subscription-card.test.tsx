import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscriptionCard } from "../../../components/billing/subscription-card";

describe("SubscriptionCard — Phase 2 billing states", () => {
  it("shows the scheduled-cancel banner with the effective date", () => {
    render(
      <SubscriptionCard
        tier="pro"
        waitlistCount={2}
        scheduledChange={{
          action: "cancel",
          effective_at: "2026-11-01T00:00:00Z",
        }}
        subscriptionStatus="active"
      />
    );

    expect(
      screen.getByText(
        /Pro until Nov 1, 2026 — your subscription will not renew\./
      )
    ).toBeTruthy();
  });

  it("shows the past-due banner with an Update payment button", async () => {
    const onManageBilling = vi.fn();
    const user = userEvent.setup();
    render(
      <SubscriptionCard
        tier="pro"
        waitlistCount={1}
        subscriptionStatus="past_due"
        onManageBilling={onManageBilling}
      />
    );

    expect(
      screen.getByText(
        /Payment failed\. Update your payment to keep Pro active\./
      )
    ).toBeTruthy();
    const button = screen.getByRole("button", { name: "Update payment" });
    await user.click(button);
    expect(onManageBilling).toHaveBeenCalledTimes(1);
  });

  it("shows the renewal date for an active subscription", () => {
    render(
      <SubscriptionCard
        tier="pro"
        waitlistCount={1}
        subscriptionStatus="active"
        nextBilledAt="2026-11-01T00:00:00Z"
      />
    );

    expect(screen.getByText("Your Pro subscription is active")).toBeTruthy();
    expect(screen.getByText(/Your Pro renews on Nov 1, 2026\./)).toBeTruthy();
  });

  it("shows waitlist usage for Free tier", () => {
    render(<SubscriptionCard tier="free" waitlistCount={1} />);

    expect(screen.getByText("1 of 1 waitlist used")).toBeTruthy();
    expect(screen.queryByText(/Your Pro renews on/)).toBeNull();
  });
});
