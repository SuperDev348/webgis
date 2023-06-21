require([
  "esri/widgets/Sketch/SketchViewModel",
  "esri/Graphic",
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/geometry/Polygon",
  "esri/geometry/geometryEngine",
  "esri/widgets/Expand"
], (
  SketchViewModel,
  Graphic,
  Map,
  MapView,
  FeatureLayer,
  GraphicsLayer,
  Polygon,
  geometryEngine,
  Expand
) => {
  let sketchViewModel,
    instructionsExpand,
    boundaryPolygon,
    validSymbol,
    invalidSymbol,
    buffers,
    newDevelopmentGraphic;

  let intersects = false;
  let contains = true;


  const graphicsLayer = new GraphicsLayer();
  const boundaryLayer = new GraphicsLayer();

  const map = new Map({
    basemap: "streets-night-vector",
    layers: [
      boundaryLayer,
      graphicsLayer
    ]
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    zoom: 12,
    center: [-117.1708, 34.0574]
  });

  view.when(() => {
    // Query all buffer features from the school buffers featurelayer

    // Add the boundary polygon and new lot polygon graphics
    addGraphics();
  });

  // Add new development polygon graphic and boundary polygon graphics
  function addGraphics() {
    const vertices = [
      [-13040270.324055556, 4040357.7882640623],
      [-13038653.725694647, 4040689.513023534],
      [-13038063.204863824, 4038017.2028549737],
      [-13040097.818223165, 4037990.629044359],
      [-13040270.324055556, 4040357.7882640623]
    ];

    const polygon = createGeometry(vertices);
    validSymbol = createSymbol([0, 170, 255, 0.8], "solid", 2, [255, 255, 255]);
    newDevelopmentGraphic = new Graphic({
      geometry: polygon,
      symbol: validSymbol,
      attributes: {
        newDevelopment: "new store"
      }
    });

    graphicsLayer.addMany([newDevelopmentGraphic]);
    // boundaryLayer.add(boundaryGraphic);
  }

  function createGeometry(vertices) {
    return new Polygon({
      rings: vertices,
      spatialReference: view.spatialReference
    });
  }

  function createSymbol(color, style, width, outlineColor) {
    return {
      type: "simple-fill",
      style: style,
      color: color,
      outline: {
        color: outlineColor,
        width: width
      }
    };
  }
});