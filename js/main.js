const fadeMs = 200;
let pageStart = Date.now();
let fadePercent = Math.min(1, (Date.now() - pageStart) / fadeMs);
let copyVideo = false;

function setupVideo(url) {
    const vid = document.createElement("video");
    let playing = false;
    
    vid.playsInline = true;
    vid.muted = true;
    vid.loop = true;

    vid.addEventListener("playing", () => {
        playing = true;
        checkReady();
    }, true);

    vid.onpause = () => video.play();

    function checkReady() {
        if (playing) {
            // console.log('ready!');
            copyVideo = true;
        }
    }

    vid.src = url;
    vid.play();

    return vid;
};


window.onload = () => {
    const img = document.getElementById("backdrop");
    img.height = window.outerHeight;
    const lgcanvas = document.getElementById("lgcanvas");
    let textDiv = document.getElementById("textContent");

    let ratio = Math.ceil(window.devicePixelRatio);

    let resolutionX = lgcanvas.width;
    let resolutionY = lgcanvas.height;
    let resolution = [resolutionX, resolutionY];
    
    let centerX = (textDiv.offsetLeft + textDiv.offsetWidth / 2) * ratio;
    let centerY = (textDiv.offsetTop + textDiv.offsetHeight / 2) * ratio;
    let center = [centerX, centerY];

    let sizeX = textDiv.offsetWidth * ratio;
    let sizeY = textDiv.offsetHeight * ratio;
    let size = [sizeX, sizeY];

    let mouseX = centerX;
    let mouseY = centerY;
    let mouse = [mouseX, mouseY];

    resizeCanvases = () => {
        ratio = Math.ceil(window.devicePixelRatio);

        centerX = (textDiv.offsetLeft + textDiv.offsetWidth / 2) * ratio;
        centerY = (textDiv.offsetTop + textDiv.offsetHeight / 2) * ratio;
        center = [centerX, centerY];

        resolutionX = window.innerWidth * ratio;
        resolutionY = lgcanvas.clientHeight * ratio;
        resolution = [resolutionX, resolutionY];

        lgcanvas.width = resolutionX;
        lgcanvas.height = resolutionY;

        sizeX = textDiv.offsetWidth * ratio;
        sizeY = textDiv.offsetHeight * ratio;
        size = [sizeX, sizeY];

        // console.log([centerX, centerY]);
        // console.log([lgcanvas.width, lgcanvas.height]);
        // console.log([sizeX, sizeY]);
    }
    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);

    const mouseMove = (e) => {
        const ratio = Math.ceil(window.devicePixelRatio);

        mouseX = e.x * ratio;
        mouseY = window.innerHeight * ratio - e.y * ratio;
        mouse = [mouseX, mouseY];
        // console.log(mouse);
    };
    window.addEventListener("mousemove", mouseMove);

    const gl = lgcanvas.getContext("webgl");

    const vsSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;
    
    const fsSource = `
        precision highp float;

        uniform vec3 iResolution;
        uniform vec4 iCenter;
        uniform vec2 iSize;
        uniform sampler2D iChannel0;
        uniform vec2 iMouse;
        uniform float iPlaying;
        uniform float iFadePercent;

        void main() {

            const float NUM_ZERO = 0.0;
            const float NUM_ONE = 1.0;
            const float NUM_HALF = 0.5;
            const float NUM_TWO = 2.0;

            const float LENS_MULTIPLIER = 0.7;
            const float MASK_STRENGTH_1 = 0.5;
            const float MASK_STRENGTH_2 = 3.0;
            const float MASK_THRESHOLD_1 = 0.9;
            const float MASK_THRESHOLD_2 = 0.2;
            const float SAMPLE_OFFSET = 2.0;
            const float ABBERATION_OFFSET = 0.175;
            const float EDGE_GLOW_RANGE = 1.0;
            const float EDGE_GLOW_ROTATION = 0.3;
            const float LIGHTING_INTENSITY = 0.4;
            
            vec2 invRes = NUM_ONE / iResolution.xy;
            vec2 uv = gl_FragCoord.xy * invRes; // scales pixel coord to 0-1
            vec2 center = iCenter.xy * invRes;
            vec2 boxSize = iSize.xy;
            vec2 boxSizeNorm = boxSize * invRes;
            float borderRadius = 0.2;
            vec2 boxScreenRatio = iResolution.xy / boxSize;
            vec2 posOffset = (iCenter.xy - (boxSize * NUM_HALF)) * invRes; 

            float videoAspect = 1920.0 / 1080.0;
            float canvasAspect = iResolution.x / iResolution.y;
            vec2 adjusted_uv = uv;
            if (canvasAspect > videoAspect) {
                float sc = videoAspect / canvasAspect;
                adjusted_uv.y = (adjusted_uv.y - 0.5) * sc + 0.5;
            } else {
                float sc = canvasAspect / videoAspect;
                adjusted_uv.x = (adjusted_uv.x - 0.5) * sc + 0.5;
            }
            gl_FragColor = texture2D(iChannel0, uv);

            // Only supports rectangles that are wider than they are tall
            vec2 m2 = uv - posOffset;
            m2 = m2 * boxScreenRatio;
            
            float width = NUM_ONE;
            float height = NUM_ONE;
            float halfHeight = height * NUM_HALF - borderRadius;
            float halfWidth = width * NUM_HALF - borderRadius;

            vec2 rectCenter = vec2(NUM_HALF, NUM_ONE);
            float yCoord = NUM_HALF;
            

            vec2 lineSegmentX = vec2(center.x - halfWidth, center.x + halfWidth);
            vec2 lineSegmentY = vec2(yCoord - halfHeight, yCoord + halfHeight);
            float nearest_x = clamp(m2.x, lineSegmentX.x, lineSegmentX.y);
            float nearest_y = clamp(m2.y, lineSegmentY.x, lineSegmentY.y);
            vec2 pointOnLineSegment = vec2(nearest_x, nearest_y);
            float br_scale = NUM_ONE / (borderRadius);
            float roundedBoxSdf = NUM_ONE - distance(m2, pointOnLineSegment) * br_scale;

            roundedBoxSdf = smoothstep(NUM_ZERO, NUM_ONE, roundedBoxSdf);
            


            float rb1 = clamp((NUM_ONE - roundedBoxSdf) * MASK_STRENGTH_1, NUM_ZERO, NUM_ONE);
            float rb2 = clamp((MASK_THRESHOLD_1 - roundedBoxSdf) * MASK_STRENGTH_2, NUM_ZERO, NUM_ONE) -
                        clamp((MASK_THRESHOLD_2 - roundedBoxSdf) * MASK_STRENGTH_2, NUM_ZERO, NUM_ONE);


            if (roundedBoxSdf > NUM_ZERO) {
                float scale = 45.0;
                float transition = NUM_ONE/(scale*roundedBoxSdf);

                // Chromatic lensing coordinates (one per channel)
                vec2 lens_r = (adjusted_uv - NUM_HALF) * (NUM_ONE + transition * (LENS_MULTIPLIER + ABBERATION_OFFSET)) + NUM_HALF;
                vec2 lens_g = (adjusted_uv - NUM_HALF) * (NUM_ONE + transition * (LENS_MULTIPLIER)) + NUM_HALF;
                vec2 lens_b = (adjusted_uv - NUM_HALF) * (NUM_ONE + transition * (LENS_MULTIPLIER - ABBERATION_OFFSET)) + NUM_HALF;

                // 5-tap cross blur per channel (center + 4 cardinal). 15 total texture reads.
                vec2 dx = vec2(SAMPLE_OFFSET * invRes.x, NUM_ZERO);
                vec2 dy = vec2(NUM_ZERO, SAMPLE_OFFSET * invRes.y);

                vec3 accum = vec3(NUM_ZERO);
                // Unrolled 5-tap sampling
                
                // accum.r += texture2D(iChannel0, lens_r + dx + dy).r;
                // accum.g += texture2D(iChannel0, lens_g + dx + dy).g;
                // accum.b += texture2D(iChannel0, lens_b + dx + dy).b;

                accum.r += texture2D(iChannel0, lens_r + dy).r;
                accum.g += texture2D(iChannel0, lens_g + dy).g;
                accum.b += texture2D(iChannel0, lens_b + dy).b;

                // accum.r += texture2D(iChannel0, lens_r - dx + dy).r;
                // accum.g += texture2D(iChannel0, lens_g - dx + dy).g;
                // accum.b += texture2D(iChannel0, lens_b - dx + dy).b;

                accum.r += texture2D(iChannel0, lens_r + dx).r;
                accum.g += texture2D(iChannel0, lens_g + dx).g;
                accum.b += texture2D(iChannel0, lens_b + dx).b;

                // Center sample
                accum.r += texture2D(iChannel0, lens_r).r;
                accum.g += texture2D(iChannel0, lens_g).g;
                accum.b += texture2D(iChannel0, lens_b).b;

                accum.r += texture2D(iChannel0, lens_r - dx).r;
                accum.g += texture2D(iChannel0, lens_g - dx).g;
                accum.b += texture2D(iChannel0, lens_b - dx).b;

                // accum.r += texture2D(iChannel0, lens_r + dx - dy).r;
                // accum.g += texture2D(iChannel0, lens_g + dx - dy).g;
                // accum.b += texture2D(iChannel0, lens_b + dx - dy).b;

                accum.r += texture2D(iChannel0, lens_r - dy).r;
                accum.g += texture2D(iChannel0, lens_g - dy).g;
                accum.b += texture2D(iChannel0, lens_b - dy).b;

                // accum.r += texture2D(iChannel0, lens_r - dx - dy).r;
                // accum.g += texture2D(iChannel0, lens_g - dx - dy).g;
                // accum.b += texture2D(iChannel0, lens_b - dx - dy).b;

                vec4 blurred = vec4(accum / 5.0, NUM_ONE);

                float grad_cos = cos(EDGE_GLOW_ROTATION);
                float grad_sin = sin(EDGE_GLOW_ROTATION);
                float grad_y = (m2.x-NUM_HALF) * grad_sin + (m2.y-NUM_HALF) * grad_cos;
                float edge_glow = smoothstep(NUM_ZERO, EDGE_GLOW_RANGE, abs(grad_y));

                // vec4 lighting = clamp(blurred + vec4(rb1) * edge_glow + vec4(LIGHTING_INTENSITY), NUM_ZERO, NUM_ONE);
                vec4 lighting = mix(clamp(blurred + vec4(rb1) * edge_glow, NUM_ZERO, NUM_ONE), vec4(1.0, 1.0, 1.0, 1.0), vec4(LIGHTING_INTENSITY));
                gl_FragColor = mix(texture2D(iChannel0, adjusted_uv), lighting, clamp(NUM_ZERO, NUM_ONE, scale*roundedBoxSdf));
            } else {
                gl_FragColor = texture2D(iChannel0, adjusted_uv);
            }
            gl_FragColor = mix(vec4(0.0,0.0,0.0,0.0), gl_FragColor, iFadePercent);
            
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
        mouse: gl.getUniformLocation(program, "iMouse"),
        playing: gl.getUniformLocation(program, "iPlaying"),
        fadePercent: gl.getUniformLocation(program, "iFadePercent"),
    };

    // function isPowerOf2(value) {
    //     return (value & (value - 1)) === 0;
    // }

    const texture = gl.createTexture();
    const video = setupVideo("img/output2.mp4");
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            setTimeout(() => video.play(), 50); // afterwards, video.paused is false but the video still freezes
        }
    });

    const allocateTexture = () => {
        const slot = 0
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
        //     gl.generateMipmap(gl.TEXTURE_2D);
        // } else {
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // }
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // console.log('initialized texture...');
    };

    // Initial allocation and reallocate on resize
    allocateTexture();
    window.addEventListener("resize", allocateTexture);

    const render = () => {
        gl.viewport(0, 0, resolution[0], resolution[1]);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (copyVideo) {
            // gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
            // console.log('allocated new texture...');
        }
        gl.uniform3f(uniforms.resoulution, resolution[0], resolution[1], 1.0);
        gl.uniform4f(uniforms.center, center[0], center[1], 0, 0);
        gl.uniform2f(uniforms.size, size[0], size[1]);
        gl.uniform2f(uniforms.mouse, mouse[0], mouse[1]);
        gl.uniform1f(uniforms.playing, copyVideo === true ? 1 : 0);

        gl.activeTexture(gl.TEXTURE0+0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniforms.texture, 0);
        fadePercent = Math.min(1, (Date.now() - pageStart) / fadeMs);
        gl.uniform1f(uniforms.fadePercent, fadePercent);

        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, texture);
        // gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, lgcanvas.width, lgcanvas.height, gl.RGBA, gl.UNSIGNED_BYTE, src_canvas);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src_canvas);
        // gl.uniform1i(uniforms.texture, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }

    render();
};
