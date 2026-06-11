

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


function Vertex(p)
{
    this.p = p;
    this.normal = [];
    this.triangles = [];
}

function Triangle(v0, v1, v2)
{
    this.v0 = v0;
    this.v1 = v1;
    this.v2 = v2;
    this.normal = [];
    this.tangent = [];
}

// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices, indices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);

        this.count = indices.length;
    }

    this.Draw = function() {

        //gl.drawArrays(gl.LINE_STRIP, 0, this.count);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    this.DrawWireframe = function() {

        for (let p=0; p<this.count; p+=3)
            gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, p);
    }
}


function CreateSurfaceData(data)
{
    let vertices = [];

    const A = 0.5;
    const B = 2.0;
    const C = 0.0;
    const D = 2.0;

    const xMin = -Math.PI;
    const xMax = Math.PI;
    const N = 50; 
    const M = 36; 

    const scale = 0.5; 

    for (let i = 0; i < N; i++) {
        let t = i / (N - 1);
        let x = xMin + t * (xMax - xMin);
        let r = A * Math.sin(B * x + C) + D;

        for (let j = 0; j <= M; j++) {
            let phi = (j / M) * 2 * Math.PI;
            let y = r * Math.cos(phi);
            let z = r * Math.sin(phi);

            vertices.push(x * scale, y * scale, z * scale);
        }
    }

    data.verticesF32 = new Float32Array(vertices);

    let indices = [];
    
    const verticesPerRing = M + 1; 

    for (let i = 0; i < N - 1; i++) {
        for (let j = 0; j < M; j++) {

            let v0 = i * verticesPerRing + j;
            let v1 = v0 + 1;
            let v2 = (i + 1) * verticesPerRing + j;
            let v3 = v2 + 1;

            indices.push(v0, v1, v2);
            indices.push(v1, v3, v2);
        }
    }

    data.indicesU16 = new Uint16Array(indices);
}