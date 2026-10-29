import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  FadeIn,
  StaggerGroup,
  StaggerItem,
} from "../../../components/marketing/animations";

describe("marketing animations", () => {
  it("keeps server-rendered marketing content visible before hydration", () => {
    const markup = renderToStaticMarkup(
      <>
        <FadeIn>
          <h1>Homepage headline</h1>
        </FadeIn>
        <StaggerGroup>
          <StaggerItem>
            <p>Feature details</p>
          </StaggerItem>
        </StaggerGroup>
      </>
    );

    expect(markup).toContain("Homepage headline");
    expect(markup).toContain("Feature details");
    expect(markup).not.toContain("opacity:0");
  });
});
