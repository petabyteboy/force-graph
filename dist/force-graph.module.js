import { select } from 'd3-selection';
import { zoomTransform, zoom } from 'd3-zoom';
import { drag } from 'd3-drag';
import { min, max } from 'd3-array';
import throttle from 'lodash.throttle';
import TWEEN from '@tweenjs/tween.js';
import Kapsule from 'kapsule';
import accessorFn from 'accessor-fn';
import ColorTracker from 'canvas-color-tracker';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceRadial } from 'd3-force-3d';
import { Bezier } from 'bezier-js';
import indexBy from 'index-array-by';
import { scaleOrdinal } from 'd3-scale';
import { schemePaired } from 'd3-scale-chromatic';

function styleInject(css, ref) {
  if (ref === void 0) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') {
    return;
  }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".force-graph-container canvas {\n  display: block;\n  user-select: none;\n  outline: none;\n  -webkit-tap-highlight-color: transparent;\n}\n\n.force-graph-container .graph-tooltip {\n  position: absolute;\n  transform: translate(-50%, 25px);\n  font-family: sans-serif;\n  font-size: 16px;\n  padding: 4px;\n  border-radius: 3px;\n  color: #eee;\n  background: rgba(0,0,0,0.65);\n  visibility: hidden; /* by default */\n}\n\n.force-graph-container .grabbable {\n  cursor: move;\n  cursor: grab;\n  cursor: -moz-grab;\n  cursor: -webkit-grab;\n}\n\n.force-graph-container .grabbable:active {\n  cursor: grabbing;\n  cursor: -moz-grabbing;\n  cursor: -webkit-grabbing;\n}\n";
styleInject(css_248z);

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

var autoColorScale = scaleOrdinal(schemePaired); // Autoset attribute colorField by colorByAccessor property
// If an object has already a color, don't set it
// Objects can be nodes or links

function autoColorObjects(objects, colorByAccessor, colorField) {
  if (!colorByAccessor || typeof colorField !== 'string') return;
  objects.filter(function (obj) {
    return !obj[colorField];
  }).forEach(function (obj) {
    obj[colorField] = autoColorScale(colorByAccessor(obj));
  });
}

function getDagDepths (_ref, idAccessor) {
  var nodes = _ref.nodes,
      links = _ref.links;

  var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref2$nodeFilter = _ref2.nodeFilter,
      nodeFilter = _ref2$nodeFilter === void 0 ? function () {
    return true;
  } : _ref2$nodeFilter,
      _ref2$onLoopError = _ref2.onLoopError,
      onLoopError = _ref2$onLoopError === void 0 ? function (loopIds) {
    throw "Invalid DAG structure! Found cycle in node path: ".concat(loopIds.join(' -> '), ".");
  } : _ref2$onLoopError;

  // linked graph
  var graph = {};
  nodes.forEach(function (node) {
    return graph[idAccessor(node)] = {
      data: node,
      out: [],
      depth: -1,
      skip: !nodeFilter(node)
    };
  });
  links.forEach(function (_ref3) {
    var source = _ref3.source,
        target = _ref3.target;
    var sourceId = getNodeId(source);
    var targetId = getNodeId(target);
    if (!graph.hasOwnProperty(sourceId)) throw "Missing source node with id: ".concat(sourceId);
    if (!graph.hasOwnProperty(targetId)) throw "Missing target node with id: ".concat(targetId);
    var sourceNode = graph[sourceId];
    var targetNode = graph[targetId];
    sourceNode.out.push(targetNode);

    function getNodeId(node) {
      return _typeof(node) === 'object' ? idAccessor(node) : node;
    }
  });
  var foundLoops = [];
  traverse(Object.values(graph));
  var nodeDepths = Object.assign.apply(Object, [{}].concat(_toConsumableArray(Object.entries(graph).filter(function (_ref4) {
    var _ref5 = _slicedToArray(_ref4, 2),
        node = _ref5[1];

    return !node.skip;
  }).map(function (_ref6) {
    var _ref7 = _slicedToArray(_ref6, 2),
        id = _ref7[0],
        node = _ref7[1];

    return _defineProperty({}, id, node.depth);
  }))));
  return nodeDepths;

  function traverse(nodes) {
    var nodeStack = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var currentDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    for (var i = 0, l = nodes.length; i < l; i++) {
      var node = nodes[i];

      if (nodeStack.indexOf(node) !== -1) {
        var _ret = function () {
          var loop = [].concat(_toConsumableArray(nodeStack.slice(nodeStack.indexOf(node))), [node]).map(function (d) {
            return idAccessor(d.data);
          });

          if (!foundLoops.some(function (foundLoop) {
            return foundLoop.length === loop.length && foundLoop.every(function (id, idx) {
              return id === loop[idx];
            });
          })) {
            foundLoops.push(loop);
            onLoopError(loop);
          }

          return "continue";
        }();

        if (_ret === "continue") continue;
      }

      if (currentDepth > node.depth) {
        // Don't unnecessarily revisit chunks of the graph
        node.depth = currentDepth;
        traverse(node.out, [].concat(_toConsumableArray(nodeStack), [node]), currentDepth + (node.skip ? 0 : 1));
      }
    }
  }
}

var DAG_LEVEL_NODE_RATIO = 2;
var CanvasForceGraph = Kapsule({
  props: {
    graphData: {
      "default": {
        nodes: [],
        links: []
      },
      onChange: function onChange(_, state) {
        state.engineRunning = false;
      } // Pause simulation

    },
    dagMode: {
      onChange: function onChange(dagMode, state) {
        // td, bu, lr, rl, radialin, radialout
        !dagMode && (state.graphData.nodes || []).forEach(function (n) {
          return n.fx = n.fy = undefined;
        }); // unfix nodes when disabling dag mode
      }
    },
    dagLevelDistance: {},
    dagNodeFilter: {
      "default": function _default(node) {
        return true;
      }
    },
    onDagError: {
      triggerUpdate: false
    },
    nodeRelSize: {
      "default": 4,
      triggerUpdate: false
    },
    // area per val unit
    nodeId: {
      "default": 'id'
    },
    nodeVal: {
      "default": 'val',
      triggerUpdate: false
    },
    nodeColor: {
      "default": 'color',
      triggerUpdate: false
    },
    nodeAutoColorBy: {},
    nodeCanvasObject: {
      triggerUpdate: false
    },
    nodeCanvasObjectMode: {
      "default": function _default() {
        return 'replace';
      },
      triggerUpdate: false
    },
    nodeVisibility: {
      "default": true,
      triggerUpdate: false
    },
    linkSource: {
      "default": 'source'
    },
    linkTarget: {
      "default": 'target'
    },
    linkVisibility: {
      "default": true,
      triggerUpdate: false
    },
    linkColor: {
      "default": 'color',
      triggerUpdate: false
    },
    linkAutoColorBy: {},
    linkLineDash: {
      triggerUpdate: false
    },
    linkWidth: {
      "default": 1,
      triggerUpdate: false
    },
    linkCurvature: {
      "default": 0,
      triggerUpdate: false
    },
    linkCanvasObject: {
      triggerUpdate: false
    },
    linkCanvasObjectMode: {
      "default": function _default() {
        return 'replace';
      },
      triggerUpdate: false
    },
    linkDirectionalArrowLength: {
      "default": 0,
      triggerUpdate: false
    },
    linkDirectionalArrowColor: {
      triggerUpdate: false
    },
    linkDirectionalArrowRelPos: {
      "default": 0.5,
      triggerUpdate: false
    },
    // value between 0<>1 indicating the relative pos along the (exposed) line
    linkDirectionalParticles: {
      "default": 0
    },
    // animate photons travelling in the link direction
    linkDirectionalParticleSpeed: {
      "default": 0.01,
      triggerUpdate: false
    },
    // in link length ratio per frame
    linkDirectionalParticleWidth: {
      "default": 4,
      triggerUpdate: false
    },
    linkDirectionalParticleColor: {
      triggerUpdate: false
    },
    globalScale: {
      "default": 1,
      triggerUpdate: false
    },
    d3AlphaMin: {
      "default": 0,
      triggerUpdate: false
    },
    d3AlphaDecay: {
      "default": 0.0228,
      triggerUpdate: false,
      onChange: function onChange(alphaDecay, state) {
        state.forceLayout.alphaDecay(alphaDecay);
      }
    },
    d3AlphaTarget: {
      "default": 0,
      triggerUpdate: false,
      onChange: function onChange(alphaTarget, state) {
        state.forceLayout.alphaTarget(alphaTarget);
      }
    },
    d3VelocityDecay: {
      "default": 0.4,
      triggerUpdate: false,
      onChange: function onChange(velocityDecay, state) {
        state.forceLayout.velocityDecay(velocityDecay);
      }
    },
    warmupTicks: {
      "default": 0,
      triggerUpdate: false
    },
    // how many times to tick the force engine at init before starting to render
    cooldownTicks: {
      "default": Infinity,
      triggerUpdate: false
    },
    cooldownTime: {
      "default": 15000,
      triggerUpdate: false
    },
    // ms
    onUpdate: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onFinishUpdate: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onEngineTick: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onEngineStop: {
      "default": function _default() {},
      triggerUpdate: false
    },
    isShadow: {
      "default": false,
      triggerUpdate: false
    }
  },
  methods: {
    // Expose d3 forces for external manipulation
    d3Force: function d3Force(state, forceName, forceFn) {
      if (forceFn === undefined) {
        return state.forceLayout.force(forceName); // Force getter
      }

      state.forceLayout.force(forceName, forceFn); // Force setter

      return this;
    },
    d3ReheatSimulation: function d3ReheatSimulation(state) {
      state.forceLayout.alpha(1);
      this.resetCountdown();
      return this;
    },
    // reset cooldown state
    resetCountdown: function resetCountdown(state) {
      state.cntTicks = 0;
      state.startTickTime = new Date();
      state.engineRunning = true;
      return this;
    },
    tickFrame: function tickFrame(state) {
      !state.isShadow && layoutTick();
      paintLinks();
      !state.isShadow && paintArrows();
      !state.isShadow && paintPhotons();
      paintNodes();
      return this; //

      function layoutTick() {
        if (state.engineRunning) {
          if (++state.cntTicks > state.cooldownTicks || new Date() - state.startTickTime > state.cooldownTime || state.d3AlphaMin > 0 && state.forceLayout.alpha() < state.d3AlphaMin) {
            state.engineRunning = false; // Stop ticking graph

            state.onEngineStop();
          } else {
            state.forceLayout.tick(); // Tick it

            state.onEngineTick();
          }
        }
      }

      function paintNodes() {
        var getVisibility = accessorFn(state.nodeVisibility);
        var getVal = accessorFn(state.nodeVal);
        var getColor = accessorFn(state.nodeColor);
        var getNodeCanvasObjectMode = accessorFn(state.nodeCanvasObjectMode);
        var ctx = state.ctx; // Draw wider nodes by 1px on shadow canvas for more precise hovering (due to boundary anti-aliasing)

        var padAmount = state.isShadow / state.globalScale;
        var visibleNodes = state.graphData.nodes.filter(getVisibility);
        ctx.save();
        visibleNodes.forEach(function (node) {
          var nodeCanvasObjectMode = getNodeCanvasObjectMode(node);

          if (state.nodeCanvasObject && (nodeCanvasObjectMode === 'before' || nodeCanvasObjectMode === 'replace')) {
            // Custom node before/replace paint
            state.nodeCanvasObject(node, ctx, state.globalScale, state.isShadow);

            if (nodeCanvasObjectMode === 'replace') {
              ctx.restore();
              return;
            }
          } // Draw wider nodes by 1px on shadow canvas for more precise hovering (due to boundary anti-aliasing)


          var r = Math.sqrt(Math.max(0, getVal(node) || 1)) * state.nodeRelSize + padAmount;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = getColor(node) || 'rgba(31, 120, 180, 0.92)';
          ctx.fill();

          if (state.nodeCanvasObject && nodeCanvasObjectMode === 'after') {
            // Custom node after paint
            state.nodeCanvasObject(node, state.ctx, state.globalScale);
          }
        });
        ctx.restore();
      }

      function paintLinks() {
        var getVisibility = accessorFn(state.linkVisibility);
        var getColor = accessorFn(state.linkColor);
        var getWidth = accessorFn(state.linkWidth);
        var getLineDash = accessorFn(state.linkLineDash);
        var getCurvature = accessorFn(state.linkCurvature);
        var getLinkCanvasObjectMode = accessorFn(state.linkCanvasObjectMode);
        var ctx = state.ctx; // Draw wider lines by 2px on shadow canvas for more precise hovering (due to boundary anti-aliasing)

        var padAmount = state.isShadow * 2;
        var visibleLinks = state.graphData.links.filter(getVisibility);
        visibleLinks.forEach(calcLinkControlPoints); // calculate curvature control points for all visible links

        var beforeCustomLinks = [],
            afterCustomLinks = [],
            defaultPaintLinks = visibleLinks;

        if (state.linkCanvasObject) {
          var replaceCustomLinks = [],
              otherCustomLinks = [];
          visibleLinks.forEach(function (d) {
            return ({
              before: beforeCustomLinks,
              after: afterCustomLinks,
              replace: replaceCustomLinks
            }[getLinkCanvasObjectMode(d)] || otherCustomLinks).push(d);
          });
          defaultPaintLinks = [].concat(_toConsumableArray(beforeCustomLinks), afterCustomLinks, otherCustomLinks);
          beforeCustomLinks = beforeCustomLinks.concat(replaceCustomLinks);
        } // Custom link before paints


        ctx.save();
        beforeCustomLinks.forEach(function (link) {
          return state.linkCanvasObject(link, ctx, state.globalScale);
        });
        ctx.restore(); // Bundle strokes per unique color/width/dash for performance optimization

        var linksPerColor = indexBy(defaultPaintLinks, [getColor, getWidth, getLineDash]);
        ctx.save();
        Object.entries(linksPerColor).forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              color = _ref2[0],
              linksPerWidth = _ref2[1];

          var lineColor = !color || color === 'undefined' ? 'rgba(0,0,0,0.15)' : color;
          Object.entries(linksPerWidth).forEach(function (_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2),
                width = _ref4[0],
                linesPerLineDash = _ref4[1];

            var lineWidth = (width || 1) / state.globalScale + padAmount;
            Object.entries(linesPerLineDash).forEach(function (_ref5) {
              var _ref6 = _slicedToArray(_ref5, 2),
                  dashSegments = _ref6[0],
                  links = _ref6[1];

              var lineDashSegments = getLineDash(links[0]);
              ctx.beginPath();
              links.forEach(function (link) {
                var start = link.source;
                var end = link.target;
                if (!start || !end || !start.hasOwnProperty('x') || !end.hasOwnProperty('x')) return; // skip invalid link

                ctx.moveTo(start.x, start.y);
                var controlPoints = link.__controlPoints;

                if (!controlPoints) {
                  // Straight line
                  ctx.lineTo(end.x, end.y);
                } else {
                  // Use quadratic curves for regular lines and bezier for loops
                  ctx[controlPoints.length === 2 ? 'quadraticCurveTo' : 'bezierCurveTo'].apply(ctx, _toConsumableArray(controlPoints).concat([end.x, end.y]));
                }
              });
              ctx.strokeStyle = lineColor;
              ctx.lineWidth = lineWidth;
              ctx.setLineDash(lineDashSegments || []);
              ctx.stroke();
            });
          });
        });
        ctx.restore(); // Custom link after paints

        ctx.save();
        afterCustomLinks.forEach(function (link) {
          return state.linkCanvasObject(link, ctx, state.globalScale);
        });
        ctx.restore(); //

        function calcLinkControlPoints(link) {
          var curvature = getCurvature(link);

          if (!curvature) {
            // straight line
            link.__controlPoints = null;
            return;
          }

          var start = link.source;
          var end = link.target;
          if (!start || !end || !start.hasOwnProperty('x') || !end.hasOwnProperty('x')) return; // skip invalid link

          var l = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)); // line length

          if (l > 0) {
            var a = Math.atan2(end.y - start.y, end.x - start.x); // line angle

            var d = l * curvature; // control point distance

            var cp = {
              // control point
              x: (start.x + end.x) / 2 + d * Math.cos(a - Math.PI / 2),
              y: (start.y + end.y) / 2 + d * Math.sin(a - Math.PI / 2)
            };
            link.__controlPoints = [cp.x, cp.y];
          } else {
            // Same point, draw a loop
            var _d = curvature * 70;

            link.__controlPoints = [end.x, end.y - _d, end.x + _d, end.y];
          }
        }
      }

      function paintArrows() {
        var ARROW_WH_RATIO = 1.6;
        var ARROW_VLEN_RATIO = 0.2;
        var getLength = accessorFn(state.linkDirectionalArrowLength);
        var getRelPos = accessorFn(state.linkDirectionalArrowRelPos);
        var getVisibility = accessorFn(state.linkVisibility);
        var getColor = accessorFn(state.linkDirectionalArrowColor || state.linkColor);
        var getNodeVal = accessorFn(state.nodeVal);
        var ctx = state.ctx;
        ctx.save();
        state.graphData.links.filter(getVisibility).forEach(function (link) {
          var arrowLength = getLength(link);
          if (!arrowLength || arrowLength < 0) return;
          var start = link.source;
          var end = link.target;
          if (!start || !end || !start.hasOwnProperty('x') || !end.hasOwnProperty('x')) return; // skip invalid link

          var startR = Math.sqrt(Math.max(0, getNodeVal(start) || 1)) * state.nodeRelSize;
          var endR = Math.sqrt(Math.max(0, getNodeVal(end) || 1)) * state.nodeRelSize;
          var arrowRelPos = Math.min(1, Math.max(0, getRelPos(link)));
          var arrowColor = getColor(link) || 'rgba(0,0,0,0.28)';
          var arrowHalfWidth = arrowLength / ARROW_WH_RATIO / 2; // Construct bezier for curved lines

          var bzLine = link.__controlPoints && _construct(Bezier, [start.x, start.y].concat(_toConsumableArray(link.__controlPoints), [end.x, end.y]));

          var getCoordsAlongLine = bzLine ? function (t) {
            return bzLine.get(t);
          } // get position along bezier line
          : function (t) {
            return {
              // straight line: interpolate linearly
              x: start.x + (end.x - start.x) * t || 0,
              y: start.y + (end.y - start.y) * t || 0
            };
          };
          var lineLen = bzLine ? bzLine.length() : Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          var posAlongLine = startR + arrowLength + (lineLen - startR - endR - arrowLength) * arrowRelPos;
          var arrowHead = getCoordsAlongLine(posAlongLine / lineLen);
          var arrowTail = getCoordsAlongLine((posAlongLine - arrowLength) / lineLen);
          var arrowTailVertex = getCoordsAlongLine((posAlongLine - arrowLength * (1 - ARROW_VLEN_RATIO)) / lineLen);
          var arrowTailAngle = Math.atan2(arrowHead.y - arrowTail.y, arrowHead.x - arrowTail.x) - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(arrowHead.x, arrowHead.y);
          ctx.lineTo(arrowTail.x + arrowHalfWidth * Math.cos(arrowTailAngle), arrowTail.y + arrowHalfWidth * Math.sin(arrowTailAngle));
          ctx.lineTo(arrowTailVertex.x, arrowTailVertex.y);
          ctx.lineTo(arrowTail.x - arrowHalfWidth * Math.cos(arrowTailAngle), arrowTail.y - arrowHalfWidth * Math.sin(arrowTailAngle));
          ctx.fillStyle = arrowColor;
          ctx.fill();
        });
        ctx.restore();
      }

      function paintPhotons() {
        var getNumPhotons = accessorFn(state.linkDirectionalParticles);
        var getSpeed = accessorFn(state.linkDirectionalParticleSpeed);
        var getDiameter = accessorFn(state.linkDirectionalParticleWidth);
        var getVisibility = accessorFn(state.linkVisibility);
        var getColor = accessorFn(state.linkDirectionalParticleColor || state.linkColor);
        var ctx = state.ctx;
        ctx.save();
        state.graphData.links.filter(getVisibility).forEach(function (link) {
          var numCyclePhotons = getNumPhotons(link);
          if (!link.hasOwnProperty('__photons') || !link.__photons.length) return;
          var start = link.source;
          var end = link.target;
          if (!start || !end || !start.hasOwnProperty('x') || !end.hasOwnProperty('x')) return; // skip invalid link

          var particleSpeed = getSpeed(link);
          var photons = link.__photons || [];
          var photonR = Math.max(0, getDiameter(link) / 2) / Math.sqrt(state.globalScale);
          var photonColor = getColor(link) || 'rgba(0,0,0,0.28)';
          ctx.fillStyle = photonColor; // Construct bezier for curved lines

          var bzLine = link.__controlPoints ? _construct(Bezier, [start.x, start.y].concat(_toConsumableArray(link.__controlPoints), [end.x, end.y])) : null;
          var cyclePhotonIdx = 0;
          var needsCleanup = false; // whether some photons need to be removed from list

          photons.forEach(function (photon) {
            var singleHop = !!photon.__singleHop;

            if (!photon.hasOwnProperty('__progressRatio')) {
              photon.__progressRatio = singleHop ? 0 : cyclePhotonIdx / numCyclePhotons;
            }

            !singleHop && cyclePhotonIdx++; // increase regular photon index

            photon.__progressRatio += particleSpeed;

            if (photon.__progressRatio >= 1) {
              if (!singleHop) {
                photon.__progressRatio = photon.__progressRatio % 1;
              } else {
                needsCleanup = true;
                return;
              }
            }

            var photonPosRatio = photon.__progressRatio;
            var coords = bzLine ? bzLine.get(photonPosRatio) // get position along bezier line
            : {
              // straight line: interpolate linearly
              x: start.x + (end.x - start.x) * photonPosRatio || 0,
              y: start.y + (end.y - start.y) * photonPosRatio || 0
            };
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, photonR, 0, 2 * Math.PI, false);
            ctx.fill();
          });

          if (needsCleanup) {
            // remove expired single hop photons
            link.__photons = link.__photons.filter(function (photon) {
              return !photon.__singleHop || photon.__progressRatio <= 1;
            });
          }
        });
        ctx.restore();
      }
    },
    emitParticle: function emitParticle(state, link) {
      if (link) {
        !link.__photons && (link.__photons = []);

        link.__photons.push({
          __singleHop: true
        }); // add a single hop particle

      }

      return this;
    }
  },
  stateInit: function stateInit() {
    return {
      forceLayout: forceSimulation().force('link', forceLink()).force('charge', forceManyBody()).force('center', forceCenter()).force('dagRadial', null).stop(),
      engineRunning: false
    };
  },
  init: function init(canvasCtx, state) {
    // Main canvas object to manipulate
    state.ctx = canvasCtx;
  },
  update: function update(state) {
    state.engineRunning = false; // Pause simulation

    state.onUpdate();

    if (state.nodeAutoColorBy !== null) {
      // Auto add color to uncolored nodes
      autoColorObjects(state.graphData.nodes, accessorFn(state.nodeAutoColorBy), state.nodeColor);
    }

    if (state.linkAutoColorBy !== null) {
      // Auto add color to uncolored links
      autoColorObjects(state.graphData.links, accessorFn(state.linkAutoColorBy), state.linkColor);
    } // parse links


    state.graphData.links.forEach(function (link) {
      link.source = link[state.linkSource];
      link.target = link[state.linkTarget];
    });

    if (!state.isShadow) {
      // Add photon particles
      var linkParticlesAccessor = accessorFn(state.linkDirectionalParticles);
      state.graphData.links.forEach(function (link) {
        var numPhotons = Math.round(Math.abs(linkParticlesAccessor(link)));

        if (numPhotons) {
          link.__photons = _toConsumableArray(Array(numPhotons)).map(function () {
            return {};
          });
        } else {
          delete link.__photons;
        }
      });
    } // Feed data to force-directed layout


    state.forceLayout.stop().alpha(1) // re-heat the simulation
    .nodes(state.graphData.nodes); // add links (if link force is still active)

    var linkForce = state.forceLayout.force('link');

    if (linkForce) {
      linkForce.id(function (d) {
        return d[state.nodeId];
      }).links(state.graphData.links);
    } // setup dag force constraints


    var nodeDepths = state.dagMode && getDagDepths(state.graphData, function (node) {
      return node[state.nodeId];
    }, {
      nodeFilter: state.dagNodeFilter,
      onLoopError: state.onDagError || undefined
    });
    var maxDepth = Math.max.apply(Math, _toConsumableArray(Object.values(nodeDepths || [])));
    var dagLevelDistance = state.dagLevelDistance || state.graphData.nodes.length / (maxDepth || 1) * DAG_LEVEL_NODE_RATIO * (['radialin', 'radialout'].indexOf(state.dagMode) !== -1 ? 0.7 : 1); // Fix nodes to x,y for dag mode

    if (state.dagMode) {
      var getFFn = function getFFn(fix, invert) {
        return function (node) {
          return !fix ? undefined : (nodeDepths[node[state.nodeId]] - maxDepth / 2) * dagLevelDistance * (invert ? -1 : 1);
        };
      };

      var fxFn = getFFn(['lr', 'rl'].indexOf(state.dagMode) !== -1, state.dagMode === 'rl');
      var fyFn = getFFn(['td', 'bu'].indexOf(state.dagMode) !== -1, state.dagMode === 'bu');
      state.graphData.nodes.filter(state.dagNodeFilter).forEach(function (node) {
        node.fx = fxFn(node);
        node.fy = fyFn(node);
      });
    } // Use radial force for radial dags


    state.forceLayout.force('dagRadial', ['radialin', 'radialout'].indexOf(state.dagMode) !== -1 ? forceRadial(function (node) {
      var nodeDepth = nodeDepths[node[state.nodeId]] || -1;
      return (state.dagMode === 'radialin' ? maxDepth - nodeDepth : nodeDepth) * dagLevelDistance;
    }).strength(function (node) {
      return state.dagNodeFilter(node) ? 1 : 0;
    }) : null);

    for (var i = 0; i < state.warmupTicks && !(state.d3AlphaMin > 0 && state.forceLayout.alpha() < state.d3AlphaMin); i++) {
      state.forceLayout.tick();
    } // Initial ticks before starting to render


    this.resetCountdown();
    state.onFinishUpdate();
  }
});

function linkKapsule (kapsulePropNames, kapsuleType) {
  var propNames = kapsulePropNames instanceof Array ? kapsulePropNames : [kapsulePropNames];
  var dummyK = new kapsuleType(); // To extract defaults

  return {
    linkProp: function linkProp(prop) {
      // link property config
      return {
        "default": dummyK[prop](),
        onChange: function onChange(v, state) {
          propNames.forEach(function (propName) {
            return state[propName][prop](v);
          });
        },
        triggerUpdate: false
      };
    },
    linkMethod: function linkMethod(method) {
      // link method pass-through
      return function (state) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        var returnVals = [];
        propNames.forEach(function (propName) {
          var kapsuleInstance = state[propName];
          var returnVal = kapsuleInstance[method].apply(kapsuleInstance, args);

          if (returnVal !== kapsuleInstance) {
            returnVals.push(returnVal);
          }
        });
        return returnVals.length ? returnVals[0] : this; // chain based on the parent object, not the inner kapsule
      };
    }
  };
}

var HOVER_CANVAS_THROTTLE_DELAY = 800; // ms to throttle shadow canvas updates for perf improvement

var ZOOM2NODES_FACTOR = 4; // Expose config from forceGraph

var bindFG = linkKapsule('forceGraph', CanvasForceGraph);
var bindBoth = linkKapsule(['forceGraph', 'shadowGraph'], CanvasForceGraph);
var linkedProps = Object.assign.apply(Object, _toConsumableArray(['nodeColor', 'nodeAutoColorBy', 'nodeCanvasObjectMode', 'linkColor', 'linkAutoColorBy', 'linkLineDash', 'linkWidth', 'linkCanvasObject', 'linkCanvasObjectMode', 'linkDirectionalArrowLength', 'linkDirectionalArrowColor', 'linkDirectionalArrowRelPos', 'linkDirectionalParticles', 'linkDirectionalParticleSpeed', 'linkDirectionalParticleWidth', 'linkDirectionalParticleColor', 'dagMode', 'dagLevelDistance', 'dagNodeFilter', 'onDagError', 'd3AlphaMin', 'd3AlphaDecay', 'd3VelocityDecay', 'warmupTicks', 'cooldownTicks', 'cooldownTime', 'onEngineTick', 'onEngineStop'].map(function (p) {
  return _defineProperty({}, p, bindFG.linkProp(p));
})).concat(_toConsumableArray(['nodeCanvasObject', 'nodeRelSize', 'nodeId', 'nodeVal', 'nodeVisibility', 'linkSource', 'linkTarget', 'linkVisibility', 'linkCurvature'].map(function (p) {
  return _defineProperty({}, p, bindBoth.linkProp(p));
}))));
var linkedMethods = Object.assign.apply(Object, _toConsumableArray(['d3Force', 'd3ReheatSimulation', 'emitParticle'].map(function (p) {
  return _defineProperty({}, p, bindFG.linkMethod(p));
})));

function adjustCanvasSize(state) {
  if (state.canvas) {
    var curWidth = state.canvas.width;
    var curHeight = state.canvas.height;

    if (curWidth === 300 && curHeight === 150) {
      // Default canvas dimensions
      curWidth = curHeight = 0;
    }

    var pxScale = window.devicePixelRatio; // 2 on retina displays

    curWidth /= pxScale;
    curHeight /= pxScale; // Resize canvases

    [state.canvas, state.shadowCanvas].forEach(function (canvas) {
      // Element size
      canvas.style.width = "".concat(state.width, "px");
      canvas.style.height = "".concat(state.height, "px"); // Memory size (scaled to avoid blurriness)

      canvas.width = state.width * pxScale;
      canvas.height = state.height * pxScale; // Normalize coordinate system to use css pixels (on init only)

      if (!curWidth && !curHeight) {
        canvas.getContext('2d').scale(pxScale, pxScale);
      }
    }); // Relative center panning based on 0,0

    var k = zoomTransform(state.canvas).k;
    state.zoom.translateBy(state.zoom.__baseElem, (state.width - curWidth) / 2 / k, (state.height - curHeight) / 2 / k);
  }
}

function resetTransform(ctx) {
  var pxRatio = window.devicePixelRatio;
  ctx.setTransform(pxRatio, 0, 0, pxRatio, 0, 0);
}

function clearCanvas(ctx, width, height) {
  ctx.save();
  resetTransform(ctx); // reset transform

  ctx.clearRect(0, 0, width, height);
  ctx.restore(); //restore transforms
} //


var forceGraph = Kapsule({
  props: _objectSpread2({
    width: {
      "default": window.innerWidth,
      onChange: function onChange(_, state) {
        return adjustCanvasSize(state);
      },
      triggerUpdate: false
    },
    height: {
      "default": window.innerHeight,
      onChange: function onChange(_, state) {
        return adjustCanvasSize(state);
      },
      triggerUpdate: false
    },
    graphData: {
      "default": {
        nodes: [],
        links: []
      },
      onChange: function onChange(d, state) {
        if (d.nodes.length || d.links.length) {
          console.info('force-graph loading', d.nodes.length + ' nodes', d.links.length + ' links');
        }

        [{
          type: 'Node',
          objs: d.nodes
        }, {
          type: 'Link',
          objs: d.links
        }].forEach(hexIndex);
        state.forceGraph.graphData(d);
        state.shadowGraph.graphData(d);

        function hexIndex(_ref4) {
          var type = _ref4.type,
              objs = _ref4.objs;
          objs.filter(function (d) {
            if (!d.hasOwnProperty('__indexColor')) return true;
            var cur = state.colorTracker.lookup(d.__indexColor);
            return !cur || !cur.hasOwnProperty('d') || cur.d !== d;
          }).forEach(function (d) {
            // store object lookup color
            d.__indexColor = state.colorTracker.register({
              type: type,
              d: d
            });
          });
        }
      },
      triggerUpdate: false
    },
    backgroundColor: {
      onChange: function onChange(color, state) {
        state.canvas && color && (state.canvas.style.background = color);
      },
      triggerUpdate: false
    },
    nodeLabel: {
      "default": 'name',
      triggerUpdate: false
    },
    linkLabel: {
      "default": 'name',
      triggerUpdate: false
    },
    linkHoverPrecision: {
      "default": 4,
      triggerUpdate: false
    },
    enableNodeDrag: {
      "default": true,
      triggerUpdate: false
    },
    enableZoomPanInteraction: {
      "default": true,
      triggerUpdate: false
    },
    enablePointerInteraction: {
      "default": true,
      onChange: function onChange(_, state) {
        state.hoverObj = null;
      },
      triggerUpdate: false
    },
    onNodeDrag: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onNodeDragEnd: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onNodeClick: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onNodeRightClick: {
      triggerUpdate: false
    },
    onNodeHover: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onLinkClick: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onLinkRightClick: {
      triggerUpdate: false
    },
    onLinkHover: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onBackgroundClick: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onBackgroundRightClick: {
      triggerUpdate: false
    },
    onZoom: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onZoomEnd: {
      "default": function _default() {},
      triggerUpdate: false
    },
    onRenderFramePre: {
      triggerUpdate: false
    },
    onRenderFramePost: {
      triggerUpdate: false
    }
  }, linkedProps),
  aliases: {
    // Prop names supported for backwards compatibility
    stopAnimation: 'pauseAnimation'
  },
  methods: _objectSpread2({
    graph2ScreenCoords: function graph2ScreenCoords(state, x, y) {
      var t = zoomTransform(state.canvas);
      return {
        x: x * t.k + t.x,
        y: y * t.k + t.y
      };
    },
    screen2GraphCoords: function screen2GraphCoords(state, x, y) {
      var t = zoomTransform(state.canvas);
      return {
        x: (x - t.x) / t.k,
        y: (y - t.y) / t.k
      };
    },
    centerAt: function centerAt(state, x, y, transitionDuration) {
      if (!state.canvas) return null; // no canvas yet
      // setter

      if (x !== undefined || y !== undefined) {
        var finalPos = Object.assign({}, x !== undefined ? {
          x: x
        } : {}, y !== undefined ? {
          y: y
        } : {});

        if (!transitionDuration) {
          // no animation
          setCenter(finalPos);
        } else {
          new TWEEN.Tween(getCenter()).to(finalPos, transitionDuration).easing(TWEEN.Easing.Quadratic.Out).onUpdate(setCenter).start();
        }

        return this;
      } // getter


      return getCenter(); //

      function getCenter() {
        var t = zoomTransform(state.canvas);
        return {
          x: (state.width / 2 - t.x) / t.k,
          y: (state.height / 2 - t.y) / t.k
        };
      }

      function setCenter(_ref5) {
        var x = _ref5.x,
            y = _ref5.y;
        state.zoom.translateTo(state.zoom.__baseElem, x === undefined ? getCenter().x : x, y === undefined ? getCenter().y : y);
      }
    },
    zoom: function zoom(state, k, transitionDuration) {
      if (!state.canvas) return null; // no canvas yet
      // setter

      if (k !== undefined) {
        if (!transitionDuration) {
          // no animation
          setZoom(k);
        } else {
          new TWEEN.Tween({
            k: getZoom()
          }).to({
            k: k
          }, transitionDuration).easing(TWEEN.Easing.Quadratic.Out).onUpdate(function (_ref6) {
            var k = _ref6.k;
            return setZoom(k);
          }).start();
        }

        return this;
      } // getter


      return getZoom(); //

      function getZoom() {
        return zoomTransform(state.canvas).k;
      }

      function setZoom(k) {
        state.zoom.scaleTo(state.zoom.__baseElem, k);
      }
    },
    zoomToFit: function zoomToFit(state) {
      var transitionDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var padding = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10;

      for (var _len = arguments.length, bboxArgs = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        bboxArgs[_key - 3] = arguments[_key];
      }

      var bbox = this.getGraphBbox.apply(this, bboxArgs);

      if (bbox) {
        var center = {
          x: (bbox.x[0] + bbox.x[1]) / 2,
          y: (bbox.y[0] + bbox.y[1]) / 2
        };
        var zoomK = Math.max(1e-12, Math.min(1e12, (state.width - padding * 2) / (bbox.x[1] - bbox.x[0]), (state.height - padding * 2) / (bbox.y[1] - bbox.y[0])));
        this.centerAt(center.x, center.y, transitionDuration);
        this.zoom(zoomK, transitionDuration);
      }

      return this;
    },
    getGraphBbox: function getGraphBbox(state) {
      var nodeFilter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {
        return true;
      };
      var getVal = accessorFn(state.nodeVal);

      var getR = function getR(node) {
        return Math.sqrt(Math.max(0, getVal(node) || 1)) * state.nodeRelSize;
      };

      var nodesPos = state.graphData.nodes.filter(nodeFilter).map(function (node) {
        return {
          x: node.x,
          y: node.y,
          r: getR(node)
        };
      });
      return !nodesPos.length ? null : {
        x: [min(nodesPos, function (node) {
          return node.x - node.r;
        }), max(nodesPos, function (node) {
          return node.x + node.r;
        })],
        y: [min(nodesPos, function (node) {
          return node.y - node.r;
        }), max(nodesPos, function (node) {
          return node.y + node.r;
        })]
      };
    },
    pauseAnimation: function pauseAnimation(state) {
      if (state.animationFrameRequestId) {
        cancelAnimationFrame(state.animationFrameRequestId);
        state.animationFrameRequestId = null;
      }

      return this;
    },
    resumeAnimation: function resumeAnimation(state) {
      if (!state.animationFrameRequestId) {
        this._animationCycle();
      }

      return this;
    },
    _destructor: function _destructor() {
      this.pauseAnimation();
      this.graphData({
        nodes: [],
        links: []
      });
    }
  }, linkedMethods),
  stateInit: function stateInit() {
    return {
      lastSetZoom: 1,
      forceGraph: new CanvasForceGraph(),
      shadowGraph: new CanvasForceGraph().cooldownTicks(0).nodeColor('__indexColor').linkColor('__indexColor').isShadow(true),
      colorTracker: new ColorTracker() // indexed objects for rgb lookup

    };
  },
  init: function init(domNode, state) {
    // Wipe DOM
    domNode.innerHTML = ''; // Container anchor for canvas and tooltip

    var container = document.createElement('div');
    container.classList.add('force-graph-container');
    container.style.position = 'relative';
    domNode.appendChild(container);
    state.canvas = document.createElement('canvas');
    if (state.backgroundColor) state.canvas.style.background = state.backgroundColor;
    container.appendChild(state.canvas);
    state.shadowCanvas = document.createElement('canvas'); // Show shadow canvas
    //state.shadowCanvas.style.position = 'absolute';
    //state.shadowCanvas.style.top = '0';
    //state.shadowCanvas.style.left = '0';
    //container.appendChild(state.shadowCanvas);

    var ctx = state.canvas.getContext('2d');
    var shadowCtx = state.shadowCanvas.getContext('2d'); // Setup node drag interaction

    select(state.canvas).call(drag().subject(function () {
      if (!state.enableNodeDrag) {
        return null;
      }

      var obj = state.hoverObj;
      return obj && obj.type === 'Node' ? obj.d : null; // Only drag nodes
    }).on('start', function (ev) {
      var obj = ev.subject;
      obj.__initialDragPos = {
        x: obj.x,
        y: obj.y,
        fx: obj.fx,
        fy: obj.fy
      }; // keep engine running at low intensity throughout drag

      if (!ev.active) {
        obj.fx = obj.x;
        obj.fy = obj.y; // Fix points
      } // drag cursor


      state.canvas.classList.add('grabbable');
    }).on('drag', function (ev) {
      var obj = ev.subject;
      var initPos = obj.__initialDragPos;
      var dragPos = ev;
      var k = zoomTransform(state.canvas).k;
      var translate = {
        x: initPos.x + (dragPos.x - initPos.x) / k - obj.x,
        y: initPos.y + (dragPos.y - initPos.y) / k - obj.y
      }; // Move fx/fy (and x/y) of nodes based on the scaled drag distance since the drag start

      ['x', 'y'].forEach(function (c) {
        return obj["f".concat(c)] = obj[c] = initPos[c] + (dragPos[c] - initPos[c]) / k;
      }); // prevent freeze while dragging

      state.forceGraph.d3AlphaTarget(0.3) // keep engine running at low intensity throughout drag
      .resetCountdown(); // prevent freeze while dragging

      obj.__dragged = true;
      state.onNodeDrag(obj, translate);
    }).on('end', function (ev) {
      var obj = ev.subject;
      var initPos = obj.__initialDragPos;
      var translate = {
        x: obj.x - initPos.x,
        y: obj.y - initPos.y
      };

      if (initPos.fx === undefined) {
        obj.fx = undefined;
      }

      if (initPos.fy === undefined) {
        obj.fy = undefined;
      }

      delete obj.__initialDragPos;
      state.forceGraph.d3AlphaTarget(0) // release engine low intensity
      .resetCountdown(); // let the engine readjust after releasing fixed nodes
      // drag cursor

      state.canvas.classList.remove('grabbable');

      if (obj.__dragged) {
        delete obj.__dragged;
        state.onNodeDragEnd(obj, translate);
      }
    })); // Setup zoom / pan interaction

    state.zoom = zoom();
    state.zoom(state.zoom.__baseElem = select(state.canvas)); // Attach controlling elem for easy access

    state.zoom.__baseElem.on('dblclick.zoom', null); // Disable double-click to zoom


    state.zoom.filter(function (ev) {
      return state.enableZoomPanInteraction ? !ev.button : false;
    }) // disable zoom interaction
    .scaleExtent([0.01, 1000]).on('zoom', function () {
      var t = zoomTransform(this); // Same as d3.event.transform

      [ctx, shadowCtx].forEach(function (c) {
        resetTransform(c);
        c.translate(t.x, t.y);
        c.scale(t.k, t.k);
      });
      state.onZoom(_objectSpread2({}, t));
    }).on('end', function () {
      var t = zoomTransform(this); // Same as d3.event.transform

      state.onZoomEnd(_objectSpread2({}, t));
    });
    adjustCanvasSize(state);
    state.forceGraph.onFinishUpdate(function () {
      // re-zoom, if still in default position (not user modified)
      if (zoomTransform(state.canvas).k === state.lastSetZoom && state.graphData.nodes.length) {
        state.zoom.scaleTo(state.zoom.__baseElem, state.lastSetZoom = ZOOM2NODES_FACTOR / Math.cbrt(state.graphData.nodes.length));
      }
    }); // Setup tooltip

    var toolTipElem = document.createElement('div');
    toolTipElem.classList.add('graph-tooltip');
    container.appendChild(toolTipElem); // Capture pointer coords on move or touchstart

    var pointerPos = {
      x: -1e12,
      y: -1e12
    };
    ['pointermove', 'pointerdown'].forEach(function (evType) {
      return container.addEventListener(evType, function (ev) {
        // detect point drag
        !state.isPointerDragging && ev.type === 'pointermove' && ev.pressure > 0 && [ev.movementX, ev.movementY].some(function (m) {
          return Math.abs(m) > (ev.pointerType === 'touch' ? 1 : 0);
        }) // relax drag trigger sensitivity on touch events
        && (state.isPointerDragging = true); // update the pointer pos

        var offset = getOffset(container);
        pointerPos.x = ev.pageX - offset.left;
        pointerPos.y = ev.pageY - offset.top; // Move tooltip

        toolTipElem.style.top = "".concat(pointerPos.y, "px");
        toolTipElem.style.left = "".concat(pointerPos.x, "px"); //

        function getOffset(el) {
          var rect = el.getBoundingClientRect(),
              scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
              scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          return {
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft
          };
        }
      }, {
        passive: true
      });
    }); // Handle click/touch events on nodes/links

    container.addEventListener('pointerup', function (ev) {
      if (state.isPointerDragging) {
        state.isPointerDragging = false;
        return; // don't trigger click events after pointer drag (pan / node drag functionality)
      }

      requestAnimationFrame(function () {
        // trigger click events asynchronously, to allow hoverObj to be set (on frame)
        if (ev.button === 0) {
          // mouse left-click or touch
          if (state.hoverObj) {
            state["on".concat(state.hoverObj.type, "Click")](state.hoverObj.d, ev);
          } else {
            state.onBackgroundClick(ev);
          }
        }

        if (ev.button === 2) {
          // mouse right-click
          if (state.hoverObj) {
            var fn = state["on".concat(state.hoverObj.type, "RightClick")];
            fn && fn(state.hoverObj.d, ev);
          } else {
            state.onBackgroundRightClick && state.onBackgroundRightClick(ev);
          }
        }
      });
    }, {
      passive: true
    });
    container.addEventListener('contextmenu', function (ev) {
      if (!state.onBackgroundRightClick && !state.onNodeRightClick && !state.onLinkRightClick) return true; // default contextmenu behavior

      ev.preventDefault();
      return false;
    });
    state.forceGraph(ctx);
    state.shadowGraph(shadowCtx); //

    var refreshShadowCanvas = throttle(function () {
      // wipe canvas
      clearCanvas(shadowCtx, state.width, state.height); // Adjust link hover area

      state.shadowGraph.linkWidth(function (l) {
        return accessorFn(state.linkWidth)(l) + state.linkHoverPrecision;
      }); // redraw

      var t = zoomTransform(state.canvas);
      state.shadowGraph.globalScale(t.k).tickFrame();
    }, HOVER_CANVAS_THROTTLE_DELAY); // Kick-off renderer

    (this._animationCycle = function animate() {
      // IIFE
      if (state.enablePointerInteraction) {
        // Update tooltip and trigger onHover events
        var obj = null;

        if (!state.isPointerDragging) {
          // don't hover during drag
          // Lookup object per pixel color
          var pxScale = window.devicePixelRatio;
          var px = pointerPos.x > 0 && pointerPos.y > 0 ? shadowCtx.getImageData(pointerPos.x * pxScale, pointerPos.y * pxScale, 1, 1) : null;
          px && (obj = state.colorTracker.lookup(px.data));
        }

        if (obj !== state.hoverObj) {
          var prevObj = state.hoverObj;
          var prevObjType = prevObj ? prevObj.type : null;
          var objType = obj ? obj.type : null;

          if (prevObjType && prevObjType !== objType) {
            // Hover out
            state["on".concat(prevObjType, "Hover")](null, prevObj.d);
          }

          if (objType) {
            // Hover in
            state["on".concat(objType, "Hover")](obj.d, prevObjType === objType ? prevObj.d : null);
          }

          var tooltipContent = obj ? accessorFn(state["".concat(obj.type.toLowerCase(), "Label")])(obj.d) || '' : '';
          toolTipElem.style.visibility = tooltipContent ? 'visible' : 'hidden';
          toolTipElem.innerHTML = tooltipContent;
          state.hoverObj = obj;
        }

        refreshShadowCanvas();
      } // Wipe canvas


      clearCanvas(ctx, state.width, state.height); // Frame cycle

      var globalScale = zoomTransform(state.canvas).k;
      state.onRenderFramePre && state.onRenderFramePre(ctx, globalScale);
      state.forceGraph.globalScale(globalScale).tickFrame();
      state.onRenderFramePost && state.onRenderFramePost(ctx, globalScale);
      TWEEN.update(); // update canvas animation tweens

      state.animationFrameRequestId = requestAnimationFrame(animate);
    })();
  },
  update: function updateFn(state) {}
});

export default forceGraph;
