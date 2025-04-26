/*
 * Flowing Patterns Generator
 * 
 * Based on p5.js particle system concepts with significant enhancements:
 * 
 * Original concepts from:
 * - p5.js particle system examples
 * - Perlin noise flow field concepts
 * 
 * Major modifications and additions:
 * 1. Custom pattern generation system
 * 2. Interactive color schemes with three distinct palettes
 * 3. Click-based pattern creation
 * 4. Video recording functionality
 * 5. Enhanced UI with sliding controls
 * 6. Canvas saving capabilities
 */

let time = 0;
let colorScheme = 'neon';
let clickPatterns = []; // Array to store patterns created by clicks
let isMenuOpen = false;
let isRecording = false;
let mediaRecorder;
let recordedChunks = [];
let recordingStartTime;
let recordingDuration = 5000; // Default 5 seconds
let isSaving = false;

// Color palettes - Custom implementation with three distinct schemes
const colorPalettes = {
    neon: [
        '#00ffff', // neon aqua
        '#ff00ff', // neon magenta
        '#ffff00', // neon yellow
        '#ff7f50'  // neon coral
    ],
    pastel: [
        '#ffb3ba', // pastel pink
        '#baffc9', // pastel green
        '#bae1ff', // pastel blue
        '#ffffba'  // pastel yellow
    ],
    monochrome: [
        '#ffffff', // white
        '#cccccc', // light gray
        '#999999', // medium gray
        '#666666'  // dark gray
    ]
};

function setup() {
    // Enhanced setup with custom UI implementation
    // Added features:
    // - Sliding menu panel
    // - Color scheme selector
    // - Recording controls
    // - Save functionality
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('flowing-canvas');
    
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

    // Color scheme selector
    const schemeGroup = createDiv('');
    schemeGroup.class('control-group');
    const schemeLabel = createDiv('Color Scheme: ');
    schemeLabel.class('control-label');
    const schemeSelect = createSelect();
    schemeSelect.option('Neon', 'neon');
    schemeSelect.option('Pastel', 'pastel');
    schemeSelect.option('Monochrome', 'monochrome');
    schemeSelect.changed(() => {
        colorScheme = schemeSelect.value();
    });
    schemeGroup.child(schemeLabel);
    schemeGroup.child(schemeSelect);
    controlsDiv.child(schemeGroup);

    // Clear button
    const clearButton = createButton('New Pattern');
    clearButton.class('control-button');
    clearButton.mousePressed(() => {
        clearCanvas();
        clickPatterns = [];
    });
    controlsDiv.child(clearButton);

    // Save Image button
    const saveButton = createButton('💾 Save Image');
    saveButton.class('control-button');
    saveButton.mousePressed(() => {
        if (!isSaving) {
            saveImage();
        }
    });
    controlsDiv.child(saveButton);

    // Record Video section
    const recordGroup = createDiv('');
    recordGroup.class('control-group');
    
    // Duration control
    const durationLabel = createDiv('Recording Duration: ');
    durationLabel.class('control-label');
    const durationSlider = createSlider(1, 10, 5, 1);
    const durationValue = createDiv('5s');
    durationValue.class('control-label');
    durationSlider.input(() => {
        recordingDuration = durationSlider.value() * 1000;
        durationValue.html(durationSlider.value() + 's');
    });
    
    // Record button
    const recordButton = createButton('🎥 Record Video');
    recordButton.class('control-button');
    recordButton.id('record-button');
    recordButton.mousePressed(() => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    });
    
    recordGroup.child(durationLabel);
    recordGroup.child(durationSlider);
    recordGroup.child(durationValue);
    recordGroup.child(recordButton);
    controlsDiv.child(recordGroup);

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
        select {
            background: #333;
            color: #fff;
            border: none;
            padding: 8px;
            border-radius: 5px;
            cursor: pointer;
        }
        select:hover {
            background: #444;
        }
        .notification {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1001;
            display: none;
        }
    `;
    document.head.appendChild(style);
}

function showNotification(message, duration = 2000) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, duration);
}

function saveImage() {
    isSaving = true;
    saveCanvas('flowing-patterns', 'png');
    showNotification('Image saved!');
    setTimeout(() => {
        isSaving = false;
    }, 2000);
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
    const canvas = document.getElementById('flowing-canvas').querySelector('canvas');
    
    // Create MediaStream from the canvas
    const stream = canvas.captureStream(30); // 30 FPS
    
    // Create MediaRecorder
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
        recordButton.innerHTML = '🎥 Record Video';
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
    
    // Create a Blob from the recorded chunks
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowing-patterns-animation.webm';
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

function mousePressed() {
    // Custom click pattern generation
    // Enhanced with:
    // - Pattern storage
    // - Interactive placement
    // - Color scheme integration
    // Create a new pattern at click position
    clickPatterns.push({
        x: mouseX,
        y: mouseY,
        size: random(30, 100), // Fixed size range
        rotation: random(TWO_PI),
        rotationSpeed: random(-0.02, 0.02),
        vertices: floor(random(3, 8)), // Random number of vertices
        color: random(colorPalettes[colorScheme]),
        pulsePhase: random(TWO_PI),
        pulseSpeed: random(0.02, 0.05),
        scale: 1,
        scaleSpeed: random(-0.01, 0.01)
    });
}

function draw() {
    // Enhanced drawing function
    // Modifications include:
    // - Pattern animation
    // - Color scheme application
    // - Recording integration
    // - Performance optimizations
    background(0, 20);
    
    // Update time
    time += 0.01;
    
    // Draw and update click-generated patterns
    for (let i = clickPatterns.length - 1; i >= 0; i--) {
        let pattern = clickPatterns[i];
    
        // Update pattern properties
        pattern.rotation += pattern.rotationSpeed;
        pattern.pulsePhase += pattern.pulseSpeed;
        pattern.scale += pattern.scaleSpeed;
        
        // Remove pattern if it gets too small or too large
        if (pattern.scale < 0.1 || pattern.scale > 2) {
            pattern.scaleSpeed *= -1;
        }
        
        push();
        translate(pattern.x, pattern.y);
        rotate(pattern.rotation);
        scale(pattern.scale);
        
        // Draw the pattern
        noFill();
        stroke(pattern.color);
        strokeWeight(2);
        
        beginShape();
        for (let j = 0; j < pattern.vertices; j++) {
            let angle = (TWO_PI / pattern.vertices) * j;
            let radius = pattern.size * (1 + sin(pattern.pulsePhase + j) * 0.2);
            let x = cos(angle) * radius;
            let y = sin(angle) * radius;
            vertex(x, y);
        }
        endShape(CLOSE);
        
        // Draw inner details
        for (let j = 0; j < pattern.vertices; j++) {
            let angle1 = (TWO_PI / pattern.vertices) * j;
            let angle2 = (TWO_PI / pattern.vertices) * ((j + 2) % pattern.vertices);
            let radius = pattern.size * 0.5;
            let x1 = cos(angle1) * radius;
            let y1 = sin(angle1) * radius;
            let x2 = cos(angle2) * radius;
            let y2 = sin(angle2) * radius;
            line(x1, y1, x2, y2);
        }
        
        pop();
    }

    // Update recording progress if recording
    if (isRecording) {
        const elapsedTime = millis() - recordingStartTime;
        const progress = Math.min(100, Math.floor((elapsedTime / recordingDuration) * 100));
        
        const recordButton = document.getElementById('record-button');
        if (recordButton) {
            recordButton.textContent = `🎥 Recording: ${progress}%`;
        }
        
        if (elapsedTime >= recordingDuration) {
            stopRecording();
        }
    }
}

function clearCanvas() {
    background(0);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
} 