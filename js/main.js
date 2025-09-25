window.onload = () => {
    const canvas = document.getElementById("particle-canvas");
    const lgcanvas = document.getElementById("lgcanvas");
    let textDiv = document.getElementById("textContent");
    
    let centerX = textDiv.offsetLeft + textDiv.offsetWidth / 2;
    let centerY = textDiv.offsetTop + textDiv.offsetHeight / 2;
    let center = [centerX, centerY];

    let sizeX = textDiv.offsetWidth;
    let sizeY = textDiv.offsetHeight;
    let size = [sizeX, sizeY];

    resizeCanvases = () => {
        const ratio = Math.ceil(window.devicePixelRatio);
        canvas.width = window.innerWidth * ratio;
        canvas.height = window.innerHeight * ratio;
        lgcanvas.width = window.innerWidth * ratio;
        lgcanvas.height = window.innerHeight * ratio;
        centerX = (textDiv.offsetLeft + textDiv.offsetWidth / 2) * ratio;
        centerY = (textDiv.offsetTop + textDiv.offsetHeight / 2) * ratio;
        center = [centerX, centerY];

        sizeX = textDiv.offsetWidth * ratio;
        sizeY = textDiv.offsetHeight * ratio;
        size = [sizeX, sizeY];
    }
    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);



    window.addEventListener("resize", () => {

    });

    new Particles({
        walled: false,
        gravity: true,
        falling: false, 
        telportWalls: true,
        interactive: false,
        repel: false,
        particleColor: "rgb(255,255,255)",
        backgroundColor: "rgba(0,0,0,100)",
        connected: false,
        random: {
            number: 200,
            minMass: 0.2,
            maxMass: 0.4,
            minDx: -0.6,
            maxDx: 0.6,
            minDy: -0.6,
            maxDy: 0.6,
        },
    }, canvas).start();


    
    const gl = lgcanvas.getContext("webgl");
    const src_canvas = canvas;

    const vsSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;
    
    const fsSource = `
        precision mediump float;

        uniform vec3 iResolution;
        uniform vec4 iCenter;
        uniform vec2 iSize;
        uniform sampler2D iChannel0;

        void mainImage(out vec4 fragColor, in vec2 fragCoord)
        {
            const float NUM_ZERO = 0.0;
            const float NUM_ONE = 1.0;
            const float NUM_HALF = 0.5;
            const float NUM_TWO = 2.0;
            const float MASK_MULTIPLIER_1 = 10000.0;
            const float MASK_MULTIPLIER_2 = 9500.0;
            const float MASK_MULTIPLIER_3 = 11000.0;
            const float LENS_MULTIPLIER = 0.65;
            const float MASK_STRENGTH_1 = 8.0;
            const float MASK_STRENGTH_2 = 16.0;
            const float MASK_STRENGTH_3 = 2.0;
            const float MASK_THRESHOLD_1 = 0.95;
            const float MASK_THRESHOLD_2 = 0.9;
            const float MASK_THRESHOLD_3 = 1.5;
            const float SAMPLE_OFFSET = 1.8;
            const float ABBERATION_OFFSET = 0.05;
            const float GRADIENT_RANGE = 0.3;
            const float GRADIENT_OFFSET = 0.1;
            const float GRADIENT_EXTREME = -1000.0;
            const float LIGHTING_INTENSITY = 0.1;

            vec2 invRes = NUM_ONE / iResolution.xy;
            vec2 uv = fragCoord * invRes; // scales pixel coord to 0-1
            vec2 center = iCenter.xy * invRes;
            vec2 boxSize = iSize.xy / NUM_TWO;
            vec2 boxSizeNorm = (iSize.xy * invRes) / NUM_TWO;
            vec2 m2 = (uv - center); // offsets uv by the center, value in [-1,1], 0 indicates center

            // Compute s^8 via multiplications instead of pow(s, 8.0)
            float sx = abs(m2.x) / boxSizeNorm.x;
            float sy = abs(m2.y) / boxSizeNorm.y;
            float sx2 = sx * sx;
            float sy2 = sy * sy;
            float sx4 = sx2 * sx2;
            float sy4 = sy2 * sy2;
            float roundedBox = sx4 * sx4 + sy4 * sy4;

            float rb1 = clamp((NUM_ONE - roundedBox) * MASK_STRENGTH_1, NUM_ZERO, NUM_ONE);
            float rb2 = clamp((MASK_THRESHOLD_1 - roundedBox) * MASK_STRENGTH_2, NUM_ZERO, NUM_ONE) -
                        clamp((MASK_THRESHOLD_2 - roundedBox) * MASK_STRENGTH_2, NUM_ZERO, NUM_ONE);
            float rb3 = clamp((MASK_THRESHOLD_3 - roundedBox) * MASK_STRENGTH_3, NUM_ZERO, NUM_ONE) -
                        clamp((NUM_ONE - roundedBox) * MASK_STRENGTH_3, NUM_ZERO, NUM_ONE);

            fragColor = vec4(NUM_ZERO);
            float transition = smoothstep(NUM_ZERO, NUM_ONE, rb1 + rb2);

            if (transition > NUM_ZERO) {
                // Chromatic lensing coordinates (one per channel)
                vec2 lens_r = (uv - NUM_HALF) * (NUM_ONE - roundedBox * (LENS_MULTIPLIER + ABBERATION_OFFSET)) + NUM_HALF;
                vec2 lens_g = (uv - NUM_HALF) * (NUM_ONE - roundedBox * (LENS_MULTIPLIER)) + NUM_HALF;
                vec2 lens_b = (uv - NUM_HALF) * (NUM_ONE - roundedBox * (LENS_MULTIPLIER - ABBERATION_OFFSET)) + NUM_HALF;

                // 5-tap cross blur per channel (center + 4 cardinal). 15 total texture reads.
                vec2 dx = vec2(SAMPLE_OFFSET * invRes.x, 0.0);
                vec2 dy = vec2(0.0, SAMPLE_OFFSET * invRes.y);

                vec3 accum = vec3(0.0);
                accum.r += texture2D(iChannel0, lens_r).r;
                accum.g += texture2D(iChannel0, lens_g).g;
                accum.b += texture2D(iChannel0, lens_b).b;

                accum.r += texture2D(iChannel0, lens_r + dx).r;
                accum.g += texture2D(iChannel0, lens_g + dx).g;
                accum.b += texture2D(iChannel0, lens_b + dx).b;

                accum.r += texture2D(iChannel0, lens_r - dx).r;
                accum.g += texture2D(iChannel0, lens_g - dx).g;
                accum.b += texture2D(iChannel0, lens_b - dx).b;

                accum.r += texture2D(iChannel0, lens_r + dy).r;
                accum.g += texture2D(iChannel0, lens_g + dy).g;
                accum.b += texture2D(iChannel0, lens_b + dy).b;

                accum.r += texture2D(iChannel0, lens_r - dy).r;
                accum.g += texture2D(iChannel0, lens_g - dy).g;
                accum.b += texture2D(iChannel0, lens_b - dy).b;

                vec4 blurred = vec4(accum / 5.0, 1.0);

                float gradient = clamp((clamp(m2.y, NUM_ZERO, GRADIENT_RANGE) + GRADIENT_OFFSET) / NUM_TWO, NUM_ZERO, NUM_ONE) +
                                 clamp((clamp(-m2.y, GRADIENT_EXTREME, GRADIENT_RANGE) * rb3 + GRADIENT_OFFSET) / NUM_TWO, NUM_ZERO, NUM_ONE);
                vec4 lighting = clamp(blurred + vec4(rb1) * gradient + vec4(rb2) * LIGHTING_INTENSITY, NUM_ZERO, NUM_ONE);

                fragColor = mix(texture2D(iChannel0, uv), lighting, transition);
            } else {
                fragColor = texture2D(iChannel0, uv);
            }
        }

        void main() {
            mainImage(gl_FragColor, gl_FragCoord.xy);
        }
    `;
    
    const createShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
    
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
    
        return shader;
    }
    
    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("An error occurred linking the program: " + gl.getProgramInfoLog(program));
        return null;
    }
    
    gl.useProgram(program);
    
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
    )
    
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    
    const uniforms = {
        resoulution: gl.getUniformLocation(program, "iResolution"),
        center: gl.getUniformLocation(program, "iCenter"),
        texture: gl.getUniformLocation(program, "iChannel0"),
        size: gl.getUniformLocation(program, "iSize"),
    }

 

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const allocateTexture = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            lgcanvas.width,
            lgcanvas.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
    };

    // Initial allocation and reallocate on resize
    allocateTexture();
    window.addEventListener("resize", allocateTexture);

    const render = () => {
        gl.viewport(0, 0, lgcanvas.width, lgcanvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.uniform3f(uniforms.resoulution, lgcanvas.width, lgcanvas.height, 1.0);
        gl.uniform4f(uniforms.center, center[0], center[1], 0, 0);
        gl.uniform2f(uniforms.size, size[0], size[1]);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, src_canvas);
        gl.uniform1i(uniforms.texture, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }

    render();
};
