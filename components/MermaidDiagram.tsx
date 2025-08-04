import { ReactSvgPanZoomLoader } from "react-svg-pan-zoom-loader";
import React from "react";
// import { UncontrolledReactSVGPanZoom } from "react-svg-pan-zoom";

type MermaidDiagramProps = {
  svg: string; // The full SVG string from mermaid.render()
};

const MermaidDiagram = ({ svg }: MermaidDiagramProps) => {
  const svgLoaderElement = (
    <div className="mermaid-diagram not-prose">
      {/* Using ReactSvgPanZoomLoader to handle SVG rendering and pan/zoom */}
      <ReactSvgPanZoomLoader
        svgXML={svg}
        render={(content: React.ReactNode) => (
          <svg width={830} height={500}>
            {content}
          </svg>
        )}
      />
    </div>
  );
  return svgLoaderElement;
};

export default MermaidDiagram;
