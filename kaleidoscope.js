/*
 * Kaleidoscope Pattern Generator
 * 
 * Based on traditional kaleidoscope mechanics with p5.js implementation
 * 
 * Original concepts from:
 * - Traditional kaleidoscope mechanics
 * - p5.js transform functions
 * https://p5js.org/examples/repetition-kaleidoscope/
 * 
 * Major modifications and additions:
 * 1. Dynamic symmetry controls
 * 2. Interactive color palette system
 * 3. Auto-color transition effects
 * 4. Enhanced UI with sliding controls
 * 5. Pattern saving functionality
 * 6. Asymmetric drawing mode
 */

let symmetry = 8;
let angle;
let isSymmetric = true;
let colorPalette = [];
let currentColor;
let clearButton;
let isAutoColor = true;
let colorIndex = 0;
let lerpAmount = 0;
let saveButton;
let isMenuOpen = false;

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('kaleidoscope-canvas');
    angleMode(DEGREES);
    background(0);

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

    // controls
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

    // Symmetry control
    const symmetryGroup = createDiv('');
    symmetryGroup.class('control-group');
    const symmetryLabel = createDiv('Symmetry: ');
    symmetryLabel.class('control-label');
    const symmetrySlider = createSlider(2, 16, 8, 1);
    symmetrySlider.input(() => {
        symmetry = symmetrySlider.value();
    });
    symmetryGroup.child(symmetryLabel);
    symmetryGroup.child(symmetrySlider);
    controlsDiv.child(symmetryGroup);

    // Symmetry toggle
    const symmetryToggle = createButton('Toggle Symmetry');
    symmetryToggle.class('control-button');
    symmetryToggle.mousePressed(() => {
        isSymmetric = !isSymmetric;
        symmetryToggle.html(isSymmetric ? 'Symmetric' : 'Asymmetric');
    });
    controlsDiv.child(symmetryToggle);

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

    // Clear button
    clearButton = createButton('New Pattern');
    clearButton.class('control-button');
    clearButton.mousePressed(() => {
        background(0);
    });
    controlsDiv.child(clearButton);

    // Save button
    saveButton = createButton('Save Image');
    saveButton.class('control-button');
    saveButton.mousePressed(() => {
        saveCanvas('kaleidoscope', 'png');
    });
    controlsDiv.child(saveButton);

    // styles
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
    if (mouseIsPressed) {
        translate(width / 2, height / 2);
        
        let mx = mouseX - width / 2;
        let my = mouseY - height / 2;
        let pmx = pmouseX - width / 2;
        let pmy = pmouseY - height / 2;

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
        
        if (isSymmetric) {
            for (let i = 0; i < symmetry; i++) {
                rotate(360 / symmetry);
                
                stroke(currentColor);
                strokeWeight(2);
                line(mx, my, pmx, pmy);
                
                push();
                scale(1, -1);
                line(mx, my, pmx, pmy);
                pop();
            }
        } else {
            rotate(360 / symmetry);
            stroke(currentColor);
            strokeWeight(2);
            line(mx, my, pmx, pmy);
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
} 