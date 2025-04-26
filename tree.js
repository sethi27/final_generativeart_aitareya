/*
 * Recursive Tree Generator
 * 
 * Based on recursive tree algorithms with p5.js implementation
 * 
 * Original concepts from:
 * - Recursive tree algorithms
 * - p5.js transform functions
 * https://p5js.org/examples/repetition-recursive-tree/
 * 
 * Major modifications and additions:
 * 1. Interactive growth controls
 * 2. Dynamic color transitions
 * 3. Video recording functionality
 * 4. Enhanced UI with sliding controls
 * 5. Pattern saving capabilities
 * 6. Smooth angle interpolation
 */

let angle = 0;
let colorPalette = [];
let currentColor;
let isAutoColor = true;
let colorIndex = 0;
let lerpAmount = 0;
let isMenuOpen = false;
let treeHeight = 0.7; // Controls how far down the trees are from the top (0.7 = 70% down)
let isSaving = false; // Flag to prevent multiple saves
let isRecording = false; // Flag to track recording state
let mediaRecorder; // MediaRecorder object for video recording
let recordedChunks = []; // Array to store video chunks
let recordingStartTime; // Time when recording started
let recordingDuration = 5000; // Recording duration in milliseconds (5 seconds)
let durationSlider; // Slider for recording duration
let targetAngle = 0; // Target angle for smooth animation
let currentAngle = 0; // Current angle that will be interpolated
let hasInteracted = false; // Flag to track if user has moved mouse

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('tree-canvas');
    colorMode(HSB);

    // Initialize color palette with neon colors
    colorPalette = [
        color('#00ffff'), // cyan
        color('#ff00ff'), // magenta
        color('#ffff00'), // yellow
        color('#ff7f50'), // coral
        color('#00ff00'), // green
        color('#ff0000'), // red
        color('#0000ff')  // blue
    ];
    currentColor = colorPalette[0];

    //  menu toggle button
    const menuToggle = createDiv('⋮');
    menuToggle.class('menu-toggle');
    menuToggle.mousePressed(() => {
        isMenuOpen = !isMenuOpen;
        controlsDiv.style('transform', isMenuOpen ? 'translateX(0)' : 'translateX(-100%)');
        menuToggle.style('transform', isMenuOpen ? 'translateX(280px)' : 'translateX(0)');
    });

    //  controls
    const controlsDiv = createDiv('');
    controlsDiv.class('controls');
    controlsDiv.position(0, 0);

    // Back to Gallery button at the top
    const backButton = createButton('← Back to Gallery');
    backButton.class('back-button');
    backButton.mousePressed(() => {
        window.location.href = 'gallery.html';
    });
    controlsDiv.child(backButton);

    // Save button
    const saveButton = createButton('💾 Save Tree');
    saveButton.class('control-button');
    saveButton.mousePressed(() => {
        if (!isSaving) {
            saveTree();
        }
    });
    controlsDiv.child(saveButton);

    // Record Animation button
    const recordButton = createButton('🎥 Record Animation');
    recordButton.class('control-button');
    recordButton.id('record-button');
    recordButton.mousePressed(() => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    });
    controlsDiv.child(recordButton);

    // Recording duration control
    const durationGroup = createDiv('');
    durationGroup.class('control-group');
    const durationLabel = createDiv('Recording Duration (seconds): ');
    durationLabel.class('control-label');
    durationSlider = createSlider(1, 10, 5, 1);
    durationSlider.input(() => {
        recordingDuration = durationSlider.value() * 1000; // Convert seconds to milliseconds
    });
    durationGroup.child(durationLabel);
    durationGroup.child(durationSlider);
    controlsDiv.child(durationGroup);

    // Tree height control
    const heightGroup = createDiv('');
    heightGroup.class('control-group');
    const heightLabel = createDiv('Tree Position: ');
    heightLabel.class('control-label');
    const heightSlider = createSlider(0.3, 0.9, 0.7, 0.1);
    heightSlider.input(() => {
        treeHeight = heightSlider.value();
    });
    heightGroup.child(heightLabel);
    heightGroup.child(heightSlider);
    controlsDiv.child(heightGroup);

    // Auto color toggle
    const autoColorToggle = createButton('Auto Color: ON');
    autoColorToggle.class('control-button');
    autoColorToggle.mousePressed(() => {
        isAutoColor = !isAutoColor;
        autoColorToggle.html(`Auto Color: ${isAutoColor ? 'ON' : 'OFF'}`);
    });
    controlsDiv.child(autoColorToggle);

    // Color selector
    const colorGroup = createDiv('');
    colorGroup.class('control-group');
    colorPalette.forEach((col, i) => {
        const colorBtn = createButton('');
        colorBtn.class('color-button');
        colorBtn.style('background-color', color(col).toString());
        colorBtn.mousePressed(() => {
            currentColor = col;
            isAutoColor = false;
            autoColorToggle.html('Auto Color: OFF');
        });
        colorGroup.child(colorBtn);
    });
    controlsDiv.child(colorGroup);

    //  styles
    const style = document.createElement('style');
    style.textContent = `
        .menu-toggle {
            position: fixed;
            top: 20px;
            left: 20px;
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 24px;
            z-index: 1000;
            transition: transform 0.3s ease;
            user-select: none;
        }
        .menu-toggle:hover {
            background: rgba(0, 0, 0, 0.9);
        }
        .controls {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 280px;
            background: rgba(0, 0, 0, 0.9);
            padding: 80px 20px 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            overflow-y: auto;
            z-index: 999;
        }
        .back-button {
            background: transparent;
            color: #fff;
            border: none;
            padding: 10px 0;
            font-size: 16px;
            cursor: pointer;
            text-align: left;
            transition: color 0.3s;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .back-button:hover {
            color: #0fa;
        }
        .control-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .control-label {
            color: #fff;
            font-family: Arial;
        }
        .control-button {
            background: #333;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .control-button:hover {
            background: #444;
        }
        .color-button {
            width: 30px;
            height: 30px;
            border: 2px solid white;
            border-radius: 50%;
            cursor: pointer;
            margin: 0 5px;
        }
        .color-button:hover {
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);
}

function draw() {
    background(0);
    
    //  angle based on mouse position only after first mouse movement
    if (hasInteracted) {
        targetAngle = map(mouseX, 0, width, -PI/4, PI/4);
    } else {
        targetAngle = 0; // Keep branches vertical until mouse moves
    }
    
    // Smoothly interpolate the current angle towards the target
    currentAngle = lerp(currentAngle, targetAngle, 0.1);
    angle = currentAngle;

    //  auto color if enabled
    if (isAutoColor) {
        lerpAmount += 0.02;
        if (lerpAmount >= 1) {
            lerpAmount = 0;
            colorIndex = (colorIndex + 1) % colorPalette.length;
        }
        let nextIndex = (colorIndex + 1) % colorPalette.length;
        currentColor = lerpColor(colorPalette[colorIndex], colorPalette[nextIndex], lerpAmount);
    }

    // Draw trees
    push();
    translate(width * 0.167, height * treeHeight);
    branch(200, 0);
    pop();

    push();
    translate(width * 0.333, height * treeHeight);
    branch(150, 0);
    pop();

    push();
    translate(width * 0.5, height * treeHeight);
    branch(180, 0);
    pop();

    push();
    translate(width * 0.667, height * treeHeight);
    branch(150, 0);
    pop();

    push();
    translate(width * 0.833, height * treeHeight);
    branch(200, 0);
    pop();

    //  recording progress if recording
    if (isRecording) {
        const elapsedTime = millis() - recordingStartTime;
        const progress = Math.min(100, Math.floor((elapsedTime / recordingDuration) * 100));
        
        const recordButton = document.getElementById('record-button');
        if (recordButton) {
            recordButton.innerHTML = `🎥 Recording: ${progress}%`;
        }
        
        if (elapsedTime >= recordingDuration) {
            stopRecording();
        }
    }
}

function branch(len, depth) {
    // Enhanced recursive branch function
    // Modifications include:
    // - Dynamic angle control
    // - Color integration
    // - Performance optimizations
    // Use the current color (either auto or manually selected)
    stroke(currentColor);
    strokeWeight(map(len, 4, 200, 1, 5));

    line(0, 0, 0, -len);
    translate(0, -len);
    
    if (len > 4) {
        push();
        rotate(angle);
        branch(len * 0.67, depth + 1);
        pop();
        
        push();
        rotate(-angle);
        branch(len * 0.67, depth + 1);
        pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function saveTree() {
    isSaving = true;
    
    //  a temporary canvas to draw the tree
    const tempCanvas = createGraphics(width, height);
    tempCanvas.background(0);
    tempCanvas.colorMode(HSB);
    
    // the tree on the temporary canvas
    tempCanvas.push();
    tempCanvas.translate(width * 0.167, height * treeHeight);
    branchOnCanvas(tempCanvas, 200, 0);
    tempCanvas.pop();
    
    tempCanvas.push();
    tempCanvas.translate(width * 0.333, height * treeHeight);
    branchOnCanvas(tempCanvas, 150, 0);
    tempCanvas.pop();
    
    tempCanvas.push();
    tempCanvas.translate(width * 0.5, height * treeHeight);
    branchOnCanvas(tempCanvas, 180, 0);
    tempCanvas.pop();
    
    tempCanvas.push();
    tempCanvas.translate(width * 0.667, height * treeHeight);
    branchOnCanvas(tempCanvas, 150, 0);
    tempCanvas.pop();
    
    tempCanvas.push();
    tempCanvas.translate(width * 0.833, height * treeHeight);
    branchOnCanvas(tempCanvas, 200, 0);
    tempCanvas.pop();
    
    // Save the canvas as an image
    saveCanvas(tempCanvas, 'recursive-tree', 'png');
    
    // Reset saving flag after a delay
    setTimeout(() => {
        isSaving = false;
    }, 2000);
}

// Helper function to draw branches on a specific canvas
function branchOnCanvas(canvas, len, depth) {
    canvas.stroke(currentColor);
    canvas.strokeWeight(map(len, 4, 200, 1, 5));
    
    canvas.line(0, 0, 0, -len);
    canvas.translate(0, -len);
    
    if (len > 4) {
        canvas.push();
        canvas.rotate(angle);
        branchOnCanvas(canvas, len * 0.67, depth + 1);
        canvas.pop();
        
        canvas.push();
        canvas.rotate(-angle);
        branchOnCanvas(canvas, len * 0.67, depth + 1);
        canvas.pop();
    }
}

function startRecording() {
    // Added video recording functionality
    // Features:
    // - Duration control
    // - State management
    // - User feedback
    isRecording = true;
    recordedChunks = [];
    recordingStartTime = millis();
    
    // Update the record button text
    const recordButton = document.getElementById('record-button');
    if (recordButton) {
        recordButton.innerHTML = '🎥 Recording: 0%';
    }
    
    // Show a notification with duration
    const durationInSeconds = recordingDuration / 1000;
    const notification = createDiv(`Recording started (${durationInSeconds}s)...`);
    notification.class('notification');
    notification.position(width/2 - 100, height - 100);
    setTimeout(() => {
        notification.remove();
    }, 2000);
    
    console.log('Recording started for', durationInSeconds, 'seconds');
    
    // Get the canvas element
    const canvas = document.getElementById('tree-canvas').querySelector('canvas');
    
    //  MediaStream from the canvas
    const stream = canvas.captureStream(30); // 30 FPS
    
    //  MediaRecorder
    mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000 // 5 Mbps
    });
    
    // Set up event handlers
    mediaRecorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = function() {
        saveVideo();
    };
    
    // Start recording
    mediaRecorder.start(100); // Collect data every 100ms
}

function stopRecording() {
    if (!isRecording) return;
    
    isRecording = false;
    
    // Update the record button text
    const recordButton = document.getElementById('record-button');
    if (recordButton) {
        recordButton.innerHTML = '🎥 Record Animation';
    }
    
    // Show a notification
    const notification = createDiv('Processing video...');
    notification.class('notification');
    notification.position(width/2 - 100, height - 100);
    
    console.log('Recording stopped. Processing video...');
    
    // Stop the MediaRecorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

function saveVideo() {
    console.log('Saving video with', recordedChunks.length, 'chunks');
    
    if (recordedChunks.length === 0) {
        console.log('No video data to save!');
        const notification = createDiv('Error: No video recorded');
        notification.class('notification');
        notification.position(width/2 - 100, height - 100);
        setTimeout(() => {
            notification.remove();
        }, 2000);
        return;
    }
    
    //  a Blob from the recorded chunks
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    
    //  a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recursive-tree-animation.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show a notification
    const notification = createDiv('Video saved!');
    notification.class('notification');
    notification.position(width/2 - 100, height - 100);
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

function mouseMoved() {
    hasInteracted = true;
} 