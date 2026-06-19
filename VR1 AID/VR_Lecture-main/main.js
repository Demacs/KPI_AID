'use strict';

let gl;
let surface;
let shProgram;
let spaceball;
let stereoCam;

let videoElement; 
let videoTexture;

function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;
    this.iAttribVertex = -1;
    this.iColor = -1;
    this.iModelViewMatrix = -1;
    this.iProjectionMatrix = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

function initWebcam() {
    videoElement = document.getElementById('webcam-view');
    
    if (!videoElement) {
        console.error("Елемент #webcam-view не знайдено на сторінці!");
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(function(stream) {
            videoElement.srcObject = stream;
            videoElement.play().catch(e => console.log("Автозапуск відео призупинено браузером:", e));
        })
        .catch(function(err) {
            console.error("Помилка доступу до веб-камери: ", err);
        });

    videoTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function updateCameraParameters() {
    if (!stereoCam) return;
    stereoCam.mEyeSeparation = parseFloat(document.getElementById("eyeSep").value);
    stereoCam.mConvergence = parseFloat(document.getElementById("conv").value);
    stereoCam.mFOV = parseFloat(document.getElementById("fov").value) * Math.PI / 180.0;
    stereoCam.mNearClippingDistance = parseFloat(document.getElementById("near").value);
    
    draw();
}

function draw() { 
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    let modelView = spaceball.getViewMatrix();
    
    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, -0.5, -stereoCam.mConvergence + 5.0); 

    let matrLeftFrustum = stereoCam.calcLeftFrustum();
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, matrLeftFrustum);

    let translateLeftEye = m4.translation(stereoCam.mEyeSeparation / 2, 0, 0);
    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateLeftEye, matAccum0);
    let matAccum2 = m4.multiply(translateToPointZero, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2);
    
    gl.colorMask(true, false, false, true); 
    
    gl.uniform4fv(shProgram.iColor, [0.2, 0.0, 0.0, 1.0]);
    surface.Draw();
    
    gl.uniform4fv(shProgram.iColor, [1.0, 0.0, 0.0, 1.0]);
    surface.DrawWireframe();


    gl.clear(gl.DEPTH_BUFFER_BIT);

    let matrRightFrustum = stereoCam.calcRightFrustum();
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, matrRightFrustum);

    let translateRightEye = m4.translation(-stereoCam.mEyeSeparation / 2, 0, 0);
    matAccum0 = m4.multiply(rotateToPointZero, modelView);
    matAccum1 = m4.multiply(translateRightEye, matAccum0);
    matAccum2 = m4.multiply(translateToPointZero, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccum2);

    gl.colorMask(false, true, true, true); 
    
    gl.uniform4fv(shProgram.iColor, [0.0, 0.2, 0.2, 1.0]);
    surface.Draw();
    
    gl.uniform4fv(shProgram.iColor, [0.0, 1.0, 1.0, 1.0]);
    surface.DrawWireframe();

    gl.colorMask(true, true, true, true);
}

function tick() {
    if (videoElement && videoElement.readyState === videoElement.HAVE_CURRENT_DATA) {
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElement);
    }
    
    if (spaceball) {
        draw();
    }
    
    requestAnimationFrame(tick);
}

function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "ProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");

    let data = {};
    CreateSurfaceData(data);

    surface = new Model('Surface');
    surface.BufferData(data.verticesF32, data.indicesU16);

    stereoCam = new StereoCamera(
        14.0,   
        0.7,    
        1.0,    
        45.0 * Math.PI / 180.0,
        2.0,    
        200.0   
    );

    gl.enable(gl.DEPTH_TEST);
    
    initWebcam(); 
    tick();
}

function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    try {
        initGL(); 
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }
}