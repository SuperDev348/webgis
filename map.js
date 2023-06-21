var view, map;
var spatialReference = 3765;
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/GraphicsLayer",
], (
  Map,
  MapView
) => {
  map = new Map({
    basemap: "satellite", //satellite, streets-night-vector
  });
  view = new MapView({
    container: "viewDiv",
    map: map,
    zoom: 5,
    center: [16.202, 44.299]
  });
});

function createGeometry(vertices) {
  require([
    "esri/geometry/Polygon"
  ], (
    Polygon
  ) => {
    return new Polygon({
      rings: vertices,
      spatialReference: spatialReference
    });
  })
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

function setParcel(points) {
  require([
    "esri/Graphic",
    "esri/geometry/Polygon",
    "esri/layers/GraphicsLayer",
  ], (
    Graphic,
    Polygon,
    GraphicsLayer
  ) => {
    console.log(points)
    let validSymbol,
      graphic;
    const graphicsLayer = new GraphicsLayer();
    const polygon = new Polygon({
      rings: points,
      spatialReference: spatialReference
    });
    validSymbol = createSymbol([255, 255, 0, 0.3], "solid", 1, [255, 255, 0]);
    graphic = new Graphic({
      geometry: polygon,
      symbol: validSymbol,
      attributes: {
        newDevelopment: "new store"
      }
    });
    map.removeAll();
    map.add(graphicsLayer);
    graphicsLayer.add(graphic);
  })
}

function changeRange(xmin, ymin, xmax, ymax) {
  require([
    "esri/geometry/Extent"
  ], (
    Extent
  ) => {
    const extent = new Extent({
      xmin: xmin,
      ymin: ymin,
      xmax: xmax,
      ymax: ymax,
      spatialReference: {
        wkid: 3765
      }
    });
    view.goTo(extent)
  })
}