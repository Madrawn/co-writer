import React from "react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";

type PanzoomProps = React.PropsWithChildren<{}>;

const PanzoomComponent: React.FC<PanzoomProps> = ({ children }) => {
  const Controls = () => {
    const { zoomIn, zoomOut, setTransform, resetTransform } = useControls();

    React.useEffect(() => {
      // pan and zoom on mount
      setTransform(10, 10, 2, 600, "easeOut");
    }, []);
    const buttonClass =
      "bg-gray-800 hover:bg-blue-700 rounded-lg shadow-md text-white font-bold py-2 px-4 ";
    return (
      <div className="tools space-x-2 p-2  ">
        <button onClick={() => zoomIn()} className={buttonClass}>
          Zoom In
        </button>
        <button onClick={() => zoomOut()} className={buttonClass}>
          Zoom Out
        </button>
        <button onClick={() => resetTransform()} className={buttonClass}>
          Reset
        </button>
      </div>
    );
  };

  return (
    <div className="panzoom-component not-prose bg-gray-900 text-gray-200 rounded-lg shadow-lg overflow-hidden stroke-[hsl(0180 0% 80% / 1)]">
      <TransformWrapper
        maxScale={5}
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
      >
        {({ zoomIn, zoomOut, setTransform, ...rest }) => (
          <React.Fragment>
            <Controls />
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "500px",
              }}
              contentStyle={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {children}
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
    </div>
  );
};

export default PanzoomComponent;
