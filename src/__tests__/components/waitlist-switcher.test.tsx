import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  WaitlistSwitcher,
  STORAGE_KEY,
} from "../../../components/dashboard/waitlist-switcher";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockWaitlists = [
  {
    id: "wl-1",
    subdomain: "acme",
    product_name: "Acme Inc",
    logo_url: null,
    is_archived: false,
  },
  {
    id: "wl-2",
    subdomain: "globex",
    product_name: "Globex Corp",
    logo_url: null,
    is_archived: true,
  },
  {
    id: "wl-3",
    subdomain: "initech",
    product_name: null,
    logo_url: null,
    is_archived: false,
  },
];

const defaultProps = {
  waitlists: mockWaitlists,
  activeWaitlistId: "wl-1",
  onSelect: vi.fn(),
};

describe("WaitlistSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders active waitlist name", () => {
    render(<WaitlistSwitcher {...defaultProps} />);
    expect(screen.getByText("Acme Inc")).toBeDefined();
  });

  it("opens dropdown on button click", async () => {
    const user = userEvent.setup();
    render(<WaitlistSwitcher {...defaultProps} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText("Globex Corp")).toBeDefined();
    expect(screen.getByText("Untitled")).toBeDefined();
  });

  it("shows archived badge for archived waitlists", async () => {
    const user = userEvent.setup();
    render(<WaitlistSwitcher {...defaultProps} />);

    await user.click(screen.getByRole("button"));
    expect(screen.getAllByText("Archived")).toHaveLength(1);
  });

  it("shows untitled for waitlists without product_name", async () => {
    const user = userEvent.setup();
    render(<WaitlistSwitcher {...defaultProps} />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Untitled")).toBeDefined();
  });

  it("calls onSelect and closes when item clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<WaitlistSwitcher {...defaultProps} onSelect={onSelect} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Globex Corp"));

    expect(onSelect).toHaveBeenCalledWith("wl-2");
    expect(screen.queryByText("Globex Corp")).toBeNull();
  });

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    render(<WaitlistSwitcher {...defaultProps} />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Globex Corp")).toBeDefined();

    await user.keyboard("{Escape}");
    expect(screen.queryByText("Globex Corp")).toBeNull();
  });

  it("closes on click outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <span data-testid="outside">Outside</span>
        <WaitlistSwitcher {...defaultProps} />
      </div>
    );

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Globex Corp")).toBeDefined();

    await user.click(screen.getByTestId("outside"));
    expect(screen.queryByText("Globex Corp")).toBeNull();
  });

  it("renders create new waitlist link for pro tier", async () => {
    const user = userEvent.setup();
    render(<WaitlistSwitcher {...defaultProps} tier="pro" />);

    await user.click(screen.getByRole("button"));
    const link = screen.getByText("Add New Waitlist");
    expect(link).toBeDefined();
    expect(link.closest("a")?.getAttribute("href")).toBe("/onboarding/1");
  });

  it("shows upgrade link for free tier", async () => {
    const user = userEvent.setup();
    render(<WaitlistSwitcher {...defaultProps} tier="free" />);

    await user.click(screen.getByRole("button"));
    const upgradeBtn = screen.getByText("Upgrade to add");
    expect(upgradeBtn).toBeDefined();
    expect(upgradeBtn.closest("a")?.getAttribute("href")).toBe(
      "/dashboard/settings/profile?tab=billing"
    );
  });

  it("exports STORAGE_KEY constant", () => {
    expect(STORAGE_KEY).toBe("active_waitlist_id");
  });
});
