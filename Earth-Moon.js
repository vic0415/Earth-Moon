// HelloTriangle_FragCoord.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
'attribute vec4 a_Position;\n' +
'attribute vec4 a_Color;\n' +
'varying vec4 v_Color;\n' +
'attribute vec2 a_TexCoord;\n' +
'varying vec2 v_TexCoord;\n' +
'uniform mat4 u_ModelMatrix;\n' +
'uniform mat4 u_ProjMatrix;\n' +
'uniform mat4 u_ViewMatrix;\n' +

'void main() {\n' +
'  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
'  v_TexCoord = a_TexCoord;\n' +

'}\n';

// Fragment shader program
var FSHADER_SOURCE =
'precision mediump float;\n' + // Precision qualifier (See Chapter 6)
'uniform sampler2D u_Sampler;\n' +
'varying vec2 v_TexCoord;\n' +
'void main() {\n' +
'  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
'}\n';

var ANGLE_STEP = 45.0/1000;
var angleToDegree = 2*Math.PI/360;
var revolution = 0.4;

var VIEW_ANGLE_STEP = 10;
var VIEW_REDUIS = 2;

var currentViewAngle = 270;


//
var earth;
var moon;
function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');
  
    document.onkeydown = function(ev){keydown(ev);};

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
  
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }

//init sphere vertex
    earth = new Sphere(0.2, 36, 36);
    earth.buildVertex();
    var earthNum = earth.vertexPosArray.length;

    moon = new Sphere(0.1, 36, 36);
    moon.buildVertex();
    var moonNum = moon.vertexPosArray.length;
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
      console.log('Failed to get the storage location of u_ModelMatrix');
      return;
    }

    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    if (!u_ProjMatrix) {
      console.log('Failed to get the storage location of u_ProjMatrix');
      return;
    }

    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
      console.log('Failed to get the storage location of u_ViewMatrix');
      return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    // Set texture
    if (!initTextures(gl, earthNum)) {
      console.log('Failed to intialize the texture.');
      return;
    }

////
    // Current rotation angle
    var currentAngle = 0.0;
    
    // Model matrix
    var modelMatrix = new Matrix4();
    var projMatrix = new Matrix4();
    var viewMatrix = new Matrix4();
    
    var tick = function()
    {
      currentAngle = getAngle(currentAngle);
      var viewX = Math.cos(currentViewAngle*angleToDegree);
      var viewZ = Math.sin(currentViewAngle*angleToDegree);
      viewMatrix.setLookAt(viewX * VIEW_REDUIS, 0.0, viewZ * VIEW_REDUIS, 0.0, 0.0, 0.0, 0, 1, 0)
      projMatrix.setPerspective(60, canvas.width/canvas.height, 1, 10);
      
      // Set clear color and enable hidden surface removal
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);

      // Clear <canvas>
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      drawEarth(gl, earthNum, currentAngle, modelMatrix, projMatrix, viewMatrix, u_ModelMatrix, u_ProjMatrix, u_ViewMatrix);
      drawMoon(gl, moonNum, currentAngle, modelMatrix, projMatrix, viewMatrix,  u_ModelMatrix, u_ProjMatrix, u_ViewMatrix);
      
      requestAnimationFrame(tick, canvas);
    };

    tick();
    
  }

  function drawEarth(gl, n, currentAngle, modelMatrix, projMatrix, viewMatrix, u_ModelMatrix, u_ProjMatrix, u_ViewMatrix)
  {
    pushModelMatrix(modelMatrix);
    
    modelMatrix.translate(0, 0, 0);
    
    modelMatrix.rotate(currentAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    
    //draw sphere
    initSphereBuffer(gl, earth.vertexPosArray, earth.vertexIndicesArray);
    gl.uniform1i(u_Sampler, 0);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);;

    modelMatrix.set(popModelMatrix());  
  }

  function drawMoon(gl, n, currentAngle, modelMatrix, projMatrix, viewMatrix, u_ModelMatrix, u_ProjMatrix, u_ViewMatrix)
  {
    pushModelMatrix(modelMatrix);
    
    var x = Math.cos(currentAngle*angleToDegree);
    var y = Math.sin(currentAngle*angleToDegree);
    
    modelMatrix.translate(x*revolution, y*revolution, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    initSphereBuffer(gl, moon.vertexPosArray, moon.vertexIndicesArray);
    // Draw the rectangle
    gl.uniform1i(u_Sampler, 1);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
    modelMatrix.set(popModelMatrix());
  }

  var g_last = Date.now();
  var now;
  var elapsed;
  function getAngle(currentAngle)
  {
    now = Date.now();
    elapsed = now - g_last;
    g_last = now;
    currentAngle += elapsed*ANGLE_STEP;
    return currentAngle % 360;
  }

//mvMatrixStack
  var mvMatrixStack = [];

  function pushModelMatrix(mvMatrix) {
      var copy = new Matrix4()
      copy.set(mvMatrix);
      mvMatrixStack.push(copy);
  }

  function popModelMatrix() {
      if (mvMatrixStack.length == 0) {
          throw "Invalid popMatrix!";
      }
      return mvMatrixStack.pop();
  }
  ///sphere

function Sphere(radius,latitudinalNum,longitudinalNum)
{
	"use strict";
	this.radius = radius;
	this.latitudinalNum = latitudinalNum;
	this.longitudinalNum = longitudinalNum;
  this.vertexPosArray = [];
	this.vertexNormalArray = [];
  this.vertexIndicesArray = [];
}

Sphere.prototype.buildVertex = function(){
	

   var latPace = 1.0 / (this.latitudinalNum-1);
   var longPace =  1.0 / (this.longitudinalNum-1);

   // pos & normal
   for(var i=0;i<this.latitudinalNum;i++){
	   for(var j=0;j<this.longitudinalNum;j++){
		   
		   var x =  Math.cos(2*Math.PI*j*longPace) * Math.sin(Math.PI*i*latPace);
		   var y =  Math.sin(-Math.PI/2 + Math.PI*i*latPace); 
       var z =  Math.sin(2*Math.PI*j*longPace) * Math.sin(Math.PI*i*latPace);
       
		   this.vertexPosArray.push(x*this.radius);
		   this.vertexPosArray.push(y*this.radius);
       this.vertexPosArray.push(z*this.radius);
       //color
       this.vertexPosArray.push(j*longPace);       
       this.vertexPosArray.push(i*latPace);
       
		   this.vertexNormalArray.push(x);
		   this.vertexNormalArray.push(y);
       this.vertexNormalArray.push(z);

	   }
   }
   
   // indices
   for(var i=0;i<this.latitudinalNum-1;i++){
	   for(var j=0;j<this.longitudinalNum-1;j++){
		   this.vertexIndicesArray.push(i*this.longitudinalNum+j);
		   this.vertexIndicesArray.push(i*this.longitudinalNum+ (j+1) );
		   this.vertexIndicesArray.push( (i+1) *this.longitudinalNum+j);
		   
		   this.vertexIndicesArray.push(i*this.longitudinalNum+ (j+1) );
		   this.vertexIndicesArray.push( (i+1) *this.longitudinalNum+ (j+1) );
		   this.vertexIndicesArray.push( (i+1) *this.longitudinalNum+j);
	   }
   }
  }

   function initSphereBuffer(gl, vertexPosArray, indicesArray)
   {
    vertexColorBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();

    var vertexPosTypedArray = new Float32Array(vertexPosArray);
    var indicesTypedArray = new Uint16Array(indicesArray);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexPosTypedArray, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return -1;
    }

    var spherePosFSIZE = vertexPosTypedArray.BYTES_PER_ELEMENT;    
    
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, spherePosFSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);
  
    // Get the storage location of a_TexCoord
    var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if (a_TexCoord < 0) {
      console.log('Failed to get the storage location of a_TexCoord');
      return -1;
    }
    // Assign the buffer object to a_TexCoord variable
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, spherePosFSIZE * 5, spherePosFSIZE * 3);
    gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object
  
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesTypedArray, gl.STATIC_DRAW);
   }

   var u_Sampler;
   function initTextures(gl, n) {
    var texture = gl.createTexture();   // Create a texture object
    if (!texture) {
      console.log('Failed to create the texture object');
      return false;
    }

    var texture2 = gl.createTexture();   // Create a texture object
    if (!texture2) {
      console.log('Failed to create the texture object');
      return false;
    }
  
    // Get the storage location of u_Sampler
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
      console.log('Failed to get the storage location of u_Sampler');
      return false;
    }
    var earthImage = new Image();  // Create the image object
    if (!earthImage) {
      console.log('Failed to create the image object');
      return false;
    }

    var moonImage = new Image();  // Create the image object
    if (!moonImage) {
      console.log('Failed to create the image object');
      return false;
    }

    var isEarthLoaded = false;
    var isMoonLoaded = false;

    earthImage.onload = function(){ 
      isEarthLoaded = true;
      if(isEarthLoaded == true)
      {
        loadTexture(gl, n, texture, u_Sampler, earthImage, 0);
      }
    };

    moonImage.onload = function(){ 
      isMoonLoaded = true;
      if(isMoonLoaded == true)
      {
        loadTexture(gl, n, texture2, u_Sampler, moonImage, 1);
      }
    };
    // Tell the browser to load an image
    earthImage.src = 'PathfinderMap.jpg';
    moonImage.src = 'moon.jpg';
    
    return true;
  }

  function loadTexture(gl, n, texture, u_Sampler, image, texUnit) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    // Enable texture unit0
    if(texUnit == 0)
    {
      gl.activeTexture(gl.TEXTURE0);
    }else if(texUnit == 1)
    {
      gl.activeTexture(gl.TEXTURE1);
    }else
    {
      console.log('Failed to activeTexture');
      return false;
    }
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    
    // Set the texture unit 0 to the sampler
    //gl.uniform1i(u_Sampler, 1);
  }

  function keydown(ev) {
    switch (ev.keyCode) {
      case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
        currentViewAngle = (currentViewAngle - VIEW_ANGLE_STEP) % 360;
        break;
      case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
        currentViewAngle = (currentViewAngle + VIEW_ANGLE_STEP) % 360;
        break;
      default: return; // Skip drawing at no effective action
    }
  }