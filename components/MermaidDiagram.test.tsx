import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MermaidDiagram from "./MermaidDiagram";

// Mock ReactSvgPanZoomLoader to isolate MermaidDiagram logic
vi.mock("react-svg-pan-zoom-loader", () => ({
  ReactSvgPanZoomLoader: ({ svgXML, render }: any) => (
    <div data-testid="svg-pan-zoom-loader">
      {render(<g data-testid="svg-content" />)}
      <span data-testid="svg-xml">{svgXML}</span>
    </div>
  ),
}));

describe("MermaidDiagram", () => {
  const sampleSvg = `<svg><g><rect x="10" y="10" width="100" height="50"/></g></svg>`;

  it("renders the SVG pan/zoom loader with correct props", () => {
    render(<MermaidDiagram svg={sampleSvg} />);
    expect(screen.getByTestId("svg-pan-zoom-loader")).toBeInTheDocument();
    expect(screen.getByTestId("svg-xml")).toHaveTextContent(sampleSvg);
  });

  it("renders the SVG container with correct dimensions", () => {
    render(<MermaidDiagram svg={sampleSvg} />);
    const svg = screen.getByTestId("svg-pan-zoom-loader").querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "830");
    expect(svg).toHaveAttribute("height", "500");
  });

  it("renders the SVG content inside the SVG element", () => {
    render(<MermaidDiagram svg={sampleSvg} />);
    const svg = screen.getByTestId("svg-pan-zoom-loader").querySelector("svg");
    expect(svg?.querySelector('[data-testid="svg-content"]')).toBeInTheDocument();
  });

  it("applies the correct wrapper class names", () => {
    render(<MermaidDiagram svg={sampleSvg} />);
    const wrapper = screen.getByTestId("mermaid-diagram-wrapper");
    expect(wrapper).toHaveClass("mermaid-diagram");
    expect(wrapper).toHaveClass("not-prose");
  });
});
