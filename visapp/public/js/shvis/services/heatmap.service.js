'use strict';
(function() {
	var cluster = angular.module('shvis.heatmap.service', []);
	cluster.factory('Heatmap', ['LoadService', 'PipService', function(loadServ, pipServ) {
		var init = function(gl, params) {
			var g_ShaderProgram = createShader(gl);
			var g_CoordAttribute = gl.getAttribLocation(g_ShaderProgram, "aCoord");
			gl.enableVertexAttribArray(g_CoordAttribute); // create scene data 
			var g_CoordBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, g_CoordBuffer);
			var coords = [0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0];
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);

			params.g_ShaderProgram = g_ShaderProgram;
			params.g_CoordBuffer = g_CoordBuffer;
			params.g_CoordAttribute = g_CoordAttribute;
		}

		var render = function(data, gl, params) {
			var g_ShaderProgram = params.g_ShaderProgram,
			g_CoordBuffer = params.g_CoordBuffer,
			g_CoordAttribute = params.g_CoordAttribute;


			var g_VertexPositionAttribute = gl.getAttribLocation(g_ShaderProgram, "aVertexPosition");
			gl.enableVertexAttribArray(g_VertexPositionAttribute); // create scene data 
			var g_VertexPositionBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, g_VertexPositionBuffer);
			var vertices = [-1.0, params.ryb, -1.0, params.ryt, params.rx, params.ryb, params.rx, params.ryt];
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);


			initTexture(gl, g_ShaderProgram, data);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.bindBuffer(gl.ARRAY_BUFFER, g_VertexPositionBuffer);
			gl.vertexAttribPointer(g_VertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, g_CoordBuffer);
			gl.vertexAttribPointer(g_CoordAttribute, 2, gl.FLOAT, false, 0, 0);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);


		}

		var initTexture = function(gl, g_ShaderProgram, data) {
			var ext = gl.getExtension("OES_texture_float");
			var tex = gl.createTexture();
			var image = [];
			var time = Object.keys(data);
			var maxLineNumber = d3.max(time, function(d) {
				return data[d].length;
			})
			var u_UnitWidth = gl.getUniformLocation(g_ShaderProgram, 'u_UnitWidth');
			var u_LineNumber = gl.getUniformLocation(g_ShaderProgram, 'u_LineNumber');
			gl.uniform1f(u_UnitWidth, 1 / time.length);
			gl.uniform1f(u_LineNumber, maxLineNumber);
			var timeLength = nearestPowerOfTwo(time.length);
			var u_TexWidth = gl.getUniformLocation(g_ShaderProgram, 'u_TexWidth');
			gl.uniform1f(u_TexWidth, timeLength);
			var lineLength = nearestPowerOfTwo(maxLineNumber);
			var u_TexHeight = gl.getUniformLocation(g_ShaderProgram, 'u_TexHeight');
			gl.uniform1f(u_TexHeight, lineLength);
			var preTimeYs = [];
			for (var i = 0; i < timeLength; i++) {
				var curTimeYs = [];
				if (i < time.length) {
					var t = time[i];
					var lines = data[t];
					for (var j = 0; j < lineLength; j++) {
						if (j < lines.length) {
							var li = lines[j];
							//check if this line exists at previous time step
							if(preTimeYs.indexOf(li.y0) >= 0) {
								image.push(li.y0, li.y1, 0.0);
							} else {
								image.push(li.y0, li.y1, 1.0);
							}
							curTimeYs.push(li.y1);
						} else {
							image.push(-2.0, -2.0, -2.0);
						}
					}
				} else {
					for (var j = 0; j < lineLength; j++) {
						image.push(-2.0, -2.0, -2.0);
					}
				}
				preTimeYs = curTimeYs;
			}
			var u_Sampler = gl.getUniformLocation(g_ShaderProgram, 'u_Sampler');
			loadTexture2D(gl, tex, u_Sampler, image, lineLength, timeLength, gl.TEXTURE0, gl.NEAREST);
			gl.uniform1i(u_Sampler, 0);
			var colormap = [];
			// var colors = [
			// 	[255,255,255],
			// 	[255,245,240],
			// 	[254,224,210],
			// 	[252,187,161],
			// 	[252,146,114],
			// 	[251,106,74],
			// 	[239,59,44],
			// 	[203,24,29]
			// ];
			var colors = [
				[255,255,255],
				[26,152,80],
				[145,207,96],
				[217,239,139],
				[255,255,191],
				[254,224,139],
				[252,141,89],
				[215,48,39]
			];
			var texColorMap = gl.createTexture();
			for(var i = 0; i < 8; i++) {
				for(var j = 0; j < 8; j++) {
					colormap.push(colors[i][0], colors[i][1], colors[i][2])
				}
			}
			var u_Colormap = gl.getUniformLocation(g_ShaderProgram, 'u_Colormap');
			loadTexture2D(gl, texColorMap, u_Colormap, colormap, 8, 8, gl.TEXTURE1, gl.LINEAR);
			gl.uniform1i(u_Colormap, 1);
		}

		var nearestPowerOfTwo = function(value) {
			return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
		}

		var loadTexture2D = function(gl, tex, u_Sampler, image, width, height, texNumber, mode) {
			gl.activeTexture(texNumber);
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mode);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mode);
			if(texNumber == gl.TEXTURE0) {
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB,
				gl.FLOAT, new Float32Array(image));
			} else {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB,
				gl.UNSIGNED_BYTE, new Uint8Array(image));
			}
			
		}

		var shader = function(name) {
			var data = {
				FSHADER_SRC: 'precision highp float;\
		varying vec2 vCoord;\
		uniform sampler2D u_Sampler;\
		uniform sampler2D u_Colormap;\
		uniform float u_UnitWidth;\
		uniform float u_LineNumber;\
		uniform float u_TexWidth;\
		uniform float u_TexHeight;\
		void main() {\
			float index = floor(vCoord.x / u_UnitWidth);\
			float x0 = index * u_UnitWidth;\
			float x1 = x0 + u_UnitWidth;\
			float x = (vCoord.x - x0) / u_UnitWidth;\
			float y = 3.0 * x * x - 2.0 * x * x * x;\
			const float maxNumber = 100000.0;\
			float value = 0.0;\
			float count = 0.0;\
			float curSecIndex = (index + 0.5)/ u_TexWidth;\
			float preSecIndex = (index - 1.0 + 0.5)/ u_TexWidth;\
			float nextSecIndex = (index + 1.0 + 0.5)/ u_TexWidth;\
			float sigma=0.02;\
			float lineFlag = 0.0;\
			float lineDist = 1.0;\
			for(float i = 0.0; i < maxNumber; i++) {\
				vec2 coord = vec2((i + 0.5)/ u_TexHeight, curSecIndex);\
				vec4 parameter= texture2D(u_Sampler, coord);\
				float tmp = 1.0;\
				float flag1 = 1.0, flag2 = 1.0, flag3 = 1.0;\
				if(parameter.x >= 0.0 && coord.x <= 1.0) {\
					float y0 = parameter.x;\
					float y1 = parameter.y;\
					float yy = y0 + y * (y1 - y0);\
					float dist = (vCoord.y - yy) * 2.5;\
					if(abs(dist) < 0.002 && abs(dist) < lineDist) {\
						lineFlag = 1.0;\
						lineDist = abs(dist);\
					}\
					float t0=2.0*sigma*sigma;\
					float t2=exp(-1.0*(dist*dist)/t0);\
					float t3=1.0/sqrt(3.14159*t0)*t2;\
					tmp*=t3/4.0;\
					value += tmp;\
				} else {\
					flag1 = -1.0;\
				}\
				if(nextSecIndex <= 1.0) {\
					vec2 coord = vec2((i + 0.5)/ u_TexHeight, nextSecIndex);\
					vec4 parameter= texture2D(u_Sampler, coord);\
					float tmp = 1.0;\
					if(parameter.x >= 0.0 && coord.x <= 1.0) {\
						float y0 = parameter.x;\
						float dist = distance(vec2(x1, y0), vCoord);\
						float t0=2.0*sigma*sigma;\
						float t2=exp(-1.0*(dist*dist)/t0);\
						float t3=1.0/sqrt(3.14159*t0)*t2;\
						tmp*=t3/20.0;\
						if(parameter.z >= 0.1)\
							value += tmp;\
					} else {\
						flag2 = -1.0;\
					}\
				} else {\
					flag2 = -1.0;\
				}\
				if(flag1 < 0.0 && flag2 < 0.0) {\
					break;\
				}\
			}\
			vec4 color;\
			float finalValue = 1.0 / (u_LineNumber) * value;\
			if(finalValue < 0.0) {\
				color = vec4(1.0, 1.0, 1.0, 1.0);\
			} else if (finalValue > 1.0) {\
				color = texture2D(u_Colormap, vec2(0.0, 1.0));\
			} else {\
				color = texture2D(u_Colormap, vec2(0.0, finalValue));\
			}\
			if(lineFlag > 0.0) {\
				gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\
				color = mix(color, vec4(1.0, 1.0, 1.0, 1.0), 1.0 - lineDist / 0.002);\
			}\
			gl_FragColor = color;\
		}',
				VSHADER_SRC: 'attribute vec2 aVertexPosition;\
		attribute vec2 aCoord;\
		varying vec2 vCoord;\
		void main() {\
			gl_Position = vec4( aVertexPosition, 0, 1);\
			vCoord = aCoord;\
		}'
			}
			return data[name];
		}

		var createShader = function(gl) {
			//create vertex shader
			var vsSource = shader('VSHADER_SRC');
			var vertexShader = gl.createShader(gl.VERTEX_SHADER);
			gl.shaderSource(vertexShader, vsSource);
			//compile vertex shader
			gl.compileShader(vertexShader);
			if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
				alert(gl.getShaderInfoLog(vertexShader));
			}

			//create fragment shader
			var fsSource = shader('FSHADER_SRC');
			var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
			// compile fragment shader
			gl.shaderSource(fragmentShader, fsSource);
			gl.compileShader(fragmentShader);
			if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
				alert(gl.getShaderInfoLog(fragmentShader));
			}

			//create shader program
			var g_ShaderProgram = gl.createProgram();
			gl.attachShader(g_ShaderProgram, vertexShader);
			gl.attachShader(g_ShaderProgram, fragmentShader);
			gl.linkProgram(g_ShaderProgram);

			if (!gl.getProgramParameter(g_ShaderProgram, gl.LINK_STATUS)) {
				alert("Shader initialize failed");
				return;
			}

			gl.useProgram(g_ShaderProgram);

			return g_ShaderProgram;
		};

		return {
			render: render,
			init: init
		}
	}]);
})();