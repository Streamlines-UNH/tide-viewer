import {mat3, vec2, vec3} from 'gl-matrix'


export default function(watchUtils){
	return {
		// Locations of the two vertex attributes that we use. They
		// will be bound to the shader program before linking.
		aPosition: 0,
		aOffset: 1,
		aDistance: 2,
		aSide: 3,
		aColor: 4,

		constructor: function() {
			// Geometrical transformations that must be recomputed
			// from scratch at every frame.
			this.transform = mat3.create();
			this.extrude = mat3.create();
			this.translationToCenter = vec2.create();
			this.screenTranslation = vec2.create();

			// Geometrical transformations whose only a few elements
			// must be updated per frame. Those elements are marked
			// with NaN.
			this.display = mat3.fromValues(NaN, 0, 0, 0, NaN, 0, -1, 1, 1);
			this.screenScaling = vec3.fromValues(NaN, NaN, 1);

			// Whether the vertex and index buffers need to be updated
			// due to a change in the layer data.
			this.needsUpdate = false;

			// We listen for changes to the graphics collection of the layer
			// and trigger the generation of new frames. A frame rendered while
			// `needsUpdate` is true may cause an update of the vertex and
			// index buffers.
			var requestUpdate = function() {
				this.needsUpdate = true;
				this.requestRender();
			}.bind(this);

			this.watcher = watchUtils.on(
				this,
				"layer.graphics",
				"change",
				requestUpdate,
				requestUpdate,
				requestUpdate
			);
		},

		// Called once a custom layer is added to the map.layers collection and this layer view is instantiated.
		attach: function() {
			var gl = this.context;

			var vertexSource =
				"precision highp float;" +
				"uniform mat3 u_transform;" +
				"uniform mat3 u_extrude;" +
				"uniform mat3 u_display;" +
				"attribute vec2 a_position;" +
				"attribute vec2 a_offset;" +
				"attribute float a_distance;" +
				"attribute float a_side;" +
				"attribute vec4 a_color;" +
				"varying float v_distance;" +
				"varying float v_side;" +
				"varying vec4 v_color;" +
				"void main() {" +
				"  gl_Position.xy = (u_display * (u_transform * vec3(a_position, 1.0) + u_extrude * vec3(a_offset, 0.0))).xy;" +
				"  gl_Position.zw = vec2(0.0, 1.0);" +
				"  v_distance = a_distance;" +
				"  v_side = a_side;" +
				"  v_color = a_color;" +
				"}";

			var fragmentSource =
				"precision highp float;" +
				"uniform float u_current_time;" +
				"varying float v_distance;" +
				"varying float v_side;" +
				"varying vec4 v_color;" +
				"const float TRAIL_SPEED = 4000.0;" +
				"const float TRAIL_LENGTH = 1800.0;" +
				"const float TRAIL_CYCLE = 4000.0;" +
				"void main() {" +
				"  float d = mod(v_distance - u_current_time * TRAIL_SPEED, TRAIL_CYCLE);" +
				"  float a1 = d < TRAIL_LENGTH ? mix(0.0, 1.0, d / TRAIL_LENGTH) : 0.0;" +
				"  float a2 = exp(-abs(v_side) * 3.0);" +
				"  float a = a1 * a2;" +
				"  gl_FragColor = v_color * a;" +
				"}";

			var vertexShader = gl.createShader(gl.VERTEX_SHADER);
			gl.shaderSource(vertexShader, vertexSource);
			gl.compileShader(vertexShader);
			var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fragmentShader, fragmentSource);
			gl.compileShader(fragmentShader);

			// Create the shader program.
			this.program = gl.createProgram();
			gl.attachShader(this.program, vertexShader);
			gl.attachShader(this.program, fragmentShader);

			// Bind attributes.
			gl.bindAttribLocation(this.program, this.aPosition, "a_position");
			gl.bindAttribLocation(this.program, this.aOffset, "a_offset");
			gl.bindAttribLocation(this.program, this.aDistance, "a_distance");
			gl.bindAttribLocation(this.program, this.aSide, "a_side");
			gl.bindAttribLocation(this.program, this.aColor, "a_color");

			// Link.
			gl.linkProgram(this.program);

			// Shader objects are not needed anymore.
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);

			// Retrieve uniform locations once and for all.
			this.uTransform = gl.getUniformLocation(
				this.program,
				"u_transform"
			);
			this.uExtrude = gl.getUniformLocation(this.program, "u_extrude");
			this.uDisplay = gl.getUniformLocation(this.program, "u_display");
			this.uCurrentTime = gl.getUniformLocation(
				this.program,
				"u_current_time"
			);

			// Create the vertex and index buffer. They are initially empty. We need to track the
			// size of the index buffer because we use indexed drawing.
			this.vertexBuffer = gl.createBuffer();
			this.indexBuffer = gl.createBuffer();

			// Number of indices in the index buffer.
			this.indexBufferSize = 0;

			// When certain conditions occur, we update the buffers and re-compute and re-encode
			// all the attributes. When buffer update occurs, we also take note of the current center
			// of the view state, and we reset a vector called `translationToCenter` to [0, 0], meaning that the
			// current center is the same as it was when the attributes were recomputed.
			this.centerAtLastUpdate = vec2.fromValues(
				this.view.state.center[0],
				this.view.state.center[1]
			);
		},

		// Called once a custom layer is removed from the map.layers collection and this layer view is destroyed.
		detach: function() {
			// Stop watching the `layer.graphics` collection.
			this.watcher.remove();

			var gl = this.context;

			// Delete buffers and programs.
			gl.deleteBuffer(this.vertexBuffer);
			gl.deleteBuffer(this.indexBuffer);
			gl.deleteProgram(this.program);
		},

		// Called every time a frame is rendered.
		render: function(renderParameters) {
			var gl = renderParameters.context;
			var state = renderParameters.state;

			// Update vertex positions. This may trigger an update of
			// the vertex coordinates contained in the vertex buffer.
			// There are three kinds of updates:
			//  - Modification of the layer.graphics collection ==> Buffer update
			//  - The view state becomes non-stationary ==> Only view update, no buffer update
			//  - The view state becomes stationary ==> Buffer update
			this.updatePositions(renderParameters);

			// If there is nothing to render we return.
			if (this.indexBufferSize === 0) {
				return;
			}

			// Update view `transform` matrix; it converts from map units to pixels.
			mat3.identity(this.transform);
			this.screenTranslation[0] = (state.pixelRatio * state.size[0]) / 2;
			this.screenTranslation[1] = (state.pixelRatio * state.size[1]) / 2;
			mat3.translate(
				this.transform,
				this.transform,
				this.screenTranslation
			);
			mat3.rotate(
				this.transform,
				this.transform,
				(Math.PI * state.rotation) / 180
			);
			this.screenScaling[0] = state.pixelRatio / state.resolution;
			this.screenScaling[1] = -state.pixelRatio / state.resolution;
			mat3.scale(this.transform, this.transform, this.screenScaling);
			mat3.translate(
				this.transform,
				this.transform,
				this.translationToCenter
			);

			// Update view `extrude` matrix; it causes offset vectors to rotate and scale
			// with the view, but caps the maximum width a polyline is allowed to be.
			mat3.identity(this.extrude);
			mat3.rotate(
				this.extrude,
				this.extrude,
				(Math.PI * state.rotation) / 180
			);
			const HALF_WIDTH = 4;
			mat3.scale(this.extrude, this.extrude, [
				HALF_WIDTH,
				-HALF_WIDTH,
				1
			]);

			// Update view `display` matrix; it converts from pixels to normalized device coordinates.
			this.display[0] = 2 / (state.pixelRatio * state.size[0]);
			this.display[4] = -2 / (state.pixelRatio * state.size[1]);

			// Draw.
			gl.useProgram(this.program);
			gl.uniformMatrix3fv(this.uTransform, false, this.transform);
			gl.uniformMatrix3fv(this.uExtrude, false, this.extrude);
			gl.uniformMatrix3fv(this.uDisplay, false, this.display);
			gl.uniform1f(this.uCurrentTime, performance.now() / 1000.0);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			gl.enableVertexAttribArray(this.aPosition);
			gl.enableVertexAttribArray(this.aOffset);
			gl.enableVertexAttribArray(this.aDistance);
			gl.enableVertexAttribArray(this.aSide);
			gl.enableVertexAttribArray(this.aColor);
			gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 28, 0);
			gl.vertexAttribPointer(this.aOffset, 2, gl.FLOAT, false, 28, 8);
			gl.vertexAttribPointer(this.aDistance, 1, gl.FLOAT, false, 28, 16);
			gl.vertexAttribPointer(this.aSide, 1, gl.FLOAT, false, 28, 20);
			gl.vertexAttribPointer(
				this.aColor,
				4,
				gl.UNSIGNED_BYTE,
				true,
				28,
				24
			);
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			gl.drawElements(
				gl.TRIANGLES,
				this.indexBufferSize,
				gl.UNSIGNED_SHORT,
				0
			);

			// Request new render because markers are animated.
			this.requestRender();
		},

		// Called internally from render().
		updatePositions: function(renderParameters) {
			var gl = renderParameters.context;
			var stationary = renderParameters.stationary;
			var state = renderParameters.state;

			// If we are not stationary we simply update the `translationToCenter` vector.
			if (!stationary) {
				vec2.sub(
					this.translationToCenter,
					this.centerAtLastUpdate,
					state.center
				);
				this.requestRender();
				return;
			}

			// If we are stationary, the `layer.graphics` collection has not changed, and
			// we are centered on the `centerAtLastUpdate`, we do nothing.
			if (
				!this.needsUpdate &&
				this.translationToCenter[0] === 0 &&
				this.translationToCenter[1] === 0
			) {
				return;
			}

			// Otherwise, we record the new encoded center, which imply a reset of the `translationToCenter` vector,
			// we record the update time, and we proceed to update the buffers.
			this.centerAtLastUpdate.set(state.center);
			this.translationToCenter[0] = 0;
			this.translationToCenter[1] = 0;
			this.needsUpdate = false;

			var graphics = this.layer.graphics;

			// Allocate memory.
			var vtxCount = 0;
			var idxCount = 0;

			for (var i = 0; i < graphics.items.length; ++i) {
				var graphic = graphics.items[i];
				var path = graphic.geometry.paths[0];

				vtxCount += path.length * 2;
				idxCount += (path.length - 1) * 6;
			}

			var vertexData = new ArrayBuffer(7 * vtxCount * 4);
			var floatData = new Float32Array(vertexData);
			var colorData = new Uint8Array(vertexData);
			var indexData = new Uint16Array(idxCount);

			// Generate attribute and index data. These cursors count the number
			// of GPU vertices and indices emitted by the triangulator; writes to
			// vertex and index memory occur at the positions pointed by the cursors.
			var vtxCursor = 0;
			var idxCursor = 0;

			for (var i1 = 0; i1 < graphics.items.length; ++i1) {
				var graphic1 = graphics.items[i1];
				var path1 = graphic1.geometry.paths[0];
				var color = graphic1.attributes["color"];

				// Initialize new triangulation state.
				var s = {};

				// Process each vertex.
				for (var j = 0; j < path1.length; ++j) {
					// Point p is an original vertex of the polyline; we need to produce two extruded
					// GPU vertices, for each original vertex.
					var p = path1[j];

					if (s.current) {
						// If this is not the first point, we compute the vector between the previous
						// and the next vertex.
						s.delta = [p[0] - s.current[0], p[1] - s.current[1]];

						// And we normalize it. This is the direction of the current line segment
						// that we are processing.
						var deltaLength = Math.sqrt(
							s.delta[0] * s.delta[0] + s.delta[1] * s.delta[1]
						);
						s.direction = [
							s.delta[0] / deltaLength,
							s.delta[1] / deltaLength
						];

						// We want to compute the normal to that segment. The normal of a
						// vector (x, y) can be computed by rotating it by 90 degrees; this yields (-y, x).
						var normal = [-s.direction[1], s.direction[0]];

						if (s.normal) {
							// If there is already a normal vector in the state, then the offset is the
							// average of that normal and the next normal, i.e. the bisector of the turn.
							s.offset = [
								s.normal[0] + normal[0],
								s.normal[1] + normal[1]
							];

							// We first normalize it.
							var offsetLength = Math.sqrt(
								s.offset[0] * s.offset[0] + s.offset[1] * s.offset[1]
							);
							s.offset[0] /= offsetLength;
							s.offset[1] /= offsetLength;

							// Then we scale it like the cosine of the half turn angle. This can
							// be computed as the dot product between the previous normal and the
							// normalized bisector.
							var d =
								s.normal[0] * s.offset[0] + s.normal[1] * s.offset[1];
							s.offset[0] /= d;
							s.offset[1] /= d;
						} else {
							// Otherwise, this is the offset of the first vertex; it is equal to the
							// normal we just computed.
							s.offset = [normal[0], normal[1]];
						}

						// All the values that we computed are written to the first GPU vertex.
						floatData[vtxCursor * 7 + 0] =
							s.current[0] - this.centerAtLastUpdate[0];
						floatData[vtxCursor * 7 + 1] =
							s.current[1] - this.centerAtLastUpdate[1];
						floatData[vtxCursor * 7 + 2] = s.offset[0];
						floatData[vtxCursor * 7 + 3] = s.offset[1];
						floatData[vtxCursor * 7 + 4] = s.distance;
						floatData[vtxCursor * 7 + 5] = +1;
						colorData[4 * (vtxCursor * 7 + 6) + 0] = color[j][0];
						colorData[4 * (vtxCursor * 7 + 6) + 1] = color[j][1];
						colorData[4 * (vtxCursor * 7 + 6) + 2] = color[j][2];
						colorData[4 * (vtxCursor * 7 + 6) + 3] = 255;

						// We also write the same values to the second vertex, but we negate the
						// offset and the side (these are the attributes at positions +9, +10 and +12).
						floatData[vtxCursor * 7 + 7] =
							s.current[0] - this.centerAtLastUpdate[0];
						floatData[vtxCursor * 7 + 8] =
							s.current[1] - this.centerAtLastUpdate[1];
						floatData[vtxCursor * 7 + 9] = -s.offset[0];
						floatData[vtxCursor * 7 + 10] = -s.offset[1];
						floatData[vtxCursor * 7 + 11] = s.distance;
						floatData[vtxCursor * 7 + 12] = -1;
						colorData[4 * (vtxCursor * 7 + 13) + 0] = color[j][0];
						colorData[4 * (vtxCursor * 7 + 13) + 1] = color[j][1];
						colorData[4 * (vtxCursor * 7 + 13) + 2] = color[j][2];
						colorData[4 * (vtxCursor * 7 + 13) + 3] = 255;
						vtxCursor += 2;

						if (j >= 2) {
							// If this is the third iteration then it means that we have emitted
							// four GPU vertices already; we can form a triangle with them.
							indexData[idxCursor + 0] = vtxCursor - 4;
							indexData[idxCursor + 1] = vtxCursor - 3;
							indexData[idxCursor + 2] = vtxCursor - 2;
							indexData[idxCursor + 3] = vtxCursor - 3;
							indexData[idxCursor + 4] = vtxCursor - 1;
							indexData[idxCursor + 5] = vtxCursor - 2;
							idxCursor += 6;
						}

						// The next normal becomes the current normal at the next iteration.
						s.normal = normal;

						// We increment the distance along the line by the length of the segment
						// that we just processed.
						s.distance += deltaLength;
					} else {
						s.distance = 0;
					}

					// We move to the next point.
					s.current = p;
				}

				// Finishing up (last 2 extruded vertices and 6 indices).
				s.offset = [s.normal[0], s.normal[1]];
				floatData[vtxCursor * 7 + 0] =
					s.current[0] - this.centerAtLastUpdate[0];
				floatData[vtxCursor * 7 + 1] =
					s.current[1] - this.centerAtLastUpdate[1];
				floatData[vtxCursor * 7 + 2] = s.offset[0];
				floatData[vtxCursor * 7 + 3] = s.offset[1];
				floatData[vtxCursor * 7 + 4] = s.distance;
				floatData[vtxCursor * 7 + 5] = +1;
				var j1 = path1.length-1
				colorData[4 * (vtxCursor * 7 + 6) + 0] = color[j1][0];
				colorData[4 * (vtxCursor * 7 + 6) + 1] = color[j1][1];
				colorData[4 * (vtxCursor * 7 + 6) + 2] = color[j1][2];
				colorData[4 * (vtxCursor * 7 + 6) + 3] = 255;
				floatData[vtxCursor * 7 + 7] =
					s.current[0] - this.centerAtLastUpdate[0];
				floatData[vtxCursor * 7 + 8] =
					s.current[1] - this.centerAtLastUpdate[1];
				floatData[vtxCursor * 7 + 9] = -s.offset[0];
				floatData[vtxCursor * 7 + 10] = -s.offset[1];
				floatData[vtxCursor * 7 + 11] = s.distance;
				floatData[vtxCursor * 7 + 12] = -1;
				colorData[4 * (vtxCursor * 7 + 13) + 0] = color[j1][0];
				colorData[4 * (vtxCursor * 7 + 13) + 1] = color[j1][1];
				colorData[4 * (vtxCursor * 7 + 13) + 2] = color[j1][2];
				colorData[4 * (vtxCursor * 7 + 13) + 3] = 255;
				vtxCursor += 2;

				indexData[idxCursor + 0] = vtxCursor - 4;
				indexData[idxCursor + 1] = vtxCursor - 3;
				indexData[idxCursor + 2] = vtxCursor - 2;
				indexData[idxCursor + 3] = vtxCursor - 3;
				indexData[idxCursor + 4] = vtxCursor - 1;
				indexData[idxCursor + 5] = vtxCursor - 2;
				idxCursor += 6;

				// There is no next vertex.
				s.current = null;
			}

			// Upload data to the GPU.
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

			// Record number of indices.
			this.indexBufferSize = indexData.length;
		}
	}}
