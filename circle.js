/*
 * Circle Packing Algorithm
 * 
 * Original inspiration from Generative Artistry:
 * https://generativeartistry.com/tutorials/circle-packing/
 * 
 * Modifications and enhancements:
 * 1. Added dynamic color schemes with auto-coloring option
 * 2. Implemented filled and outlined circle variations
 * 3. Added inner glow effects for both circle types
 * 4. Enhanced performance with optimized collision detection
 * 5. Added interactive controls and UI elements
 * 6. Implemented canvas saving functionality
 */

let circles = [];
let maxCircles = 50;
let maxSize = 80;
let colorMode = 'auto';
let autoColorHue = 0;
let isSaving = false;

// Color presets - Custom neon color palette added
const colors = {
    neonPink: { r: 255, g: 20, b: 147 },
    neonBlue: { r: 0, g: 255, b: 255 },
    neonGreen: { r: 57, g: 255, b: 20 }
};

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode = 'auto';
    setupControls();
    resetSketch();
}

function draw() {
    background(0, 20);
    
    //  add new circles
    if (circles.length < maxCircles) {
        for (let i = 0; i < 10; i++) {
            addCircle();
        }
    }

    // Update and display circles
    for (let circle of circles) {
        if (circle.growing) {
            circle.grow();
            if (checkCollision(circle)) {
                circle.growing = false;
            }
        }
        circle.display();
    }

    // Update auto color
    if (colorMode === 'auto') {
        autoColorHue = (autoColorHue + 0.5) % 360;
    }
}

function addCircle() {
    // Enhanced circle object with additional properties and methods
    // Original structure from Coding Train, modified with:
    // - Added isFilled property for circle style variation
    // - Enhanced display method with glow effects
    // - Modified growth behavior
    let newCircle = {
        x: random(width),
        y: random(height),
        r: 1,
        growing: true,
        color: getColor(),
        isFilled: random() < 0.3, // 30% chance of being a filled circle
        
        grow() {
            if (this.growing && this.r < maxSize) {
                this.r += 0.5;
            }
        },
        
        display() {
            if (this.isFilled) {
                // For filled circles
                noStroke();
                fill(this.color.r, this.color.g, this.color.b, 100);
                circle(this.x, this.y, this.r * 2);
                
                // inner glow for filled circles
                for (let i = 3; i > 0; i--) {
                    fill(this.color.r, this.color.g, this.color.b, 50/i);
                    circle(this.x, this.y, (this.r * 2) - (i * 4));
                }
            } else {
                // For outlined circles (original style)
                noFill();
                stroke(this.color.r, this.color.g, this.color.b);
                strokeWeight(2);
                circle(this.x, this.y, this.r * 2);
                
                // inner glow effect
                for (let i = 3; i > 0; i--) {
                    stroke(this.color.r, this.color.g, this.color.b, 50/i);
                    circle(this.x, this.y, (this.r * 2) - (i * 2));
                }
            }
        }
    };
    
    if (!checkCollision(newCircle)) {
        circles.push(newCircle);
    }
}

function checkCollision(circle) {
    //  canvas bounds
    if (circle.x - circle.r < 0 || circle.x + circle.r > width ||
        circle.y - circle.r < 0 || circle.y + circle.r > height) {
        return true;
    }
    
    //  other circles
    for (let other of circles) {
        if (circle !== other) {
            let d = dist(circle.x, circle.y, other.x, other.y);
            if (d < circle.r + other.r + 2) {
                return true;
            }
        }
    }
    return false;
}

function getColor() {
    if (colorMode === 'auto') {
        let c = color(autoColorHue, 100, 100);
        return {
            r: red(c),
            g: green(c),
            b: blue(c)
        };
    }
    return colors[colorMode];
}

function setupControls() {
    // Custom UI implementation
    // Added features:
    // - Sliding menu panel
    // - Interactive sliders for circle count and size
    // - Color scheme selection
    // - Reset and save functionality
    // Setup menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const controls = document.querySelector('.controls');
    menuToggle.addEventListener('click', () => {
        controls.classList.toggle('visible');
        menuToggle.style.transform = controls.classList.contains('visible') ? 'translateX(280px)' : 'translateX(0)';
    });

    // Back button
    const backButton = document.querySelector('.back-button');
    backButton.addEventListener('click', () => {
        window.location.href = 'gallery.html';
    });

    // Circle count slider
    const circleCountSlider = document.getElementById('circleCount');
    const circleCountValue = document.getElementById('circleCountValue');
    circleCountSlider.addEventListener('input', () => {
        maxCircles = parseInt(circleCountSlider.value);
        circleCountValue.textContent = maxCircles;
    });

    // Max size slider
    const maxSizeSlider = document.getElementById('maxSize');
    const maxSizeValue = document.getElementById('maxSizeValue');
    maxSizeSlider.addEventListener('input', () => {
        maxSize = parseInt(maxSizeSlider.value);
        maxSizeValue.textContent = maxSize;
    });

    // Color buttons
    document.getElementById('autoColor').addEventListener('click', () => colorMode = 'auto');
    document.getElementById('neonPink').addEventListener('click', () => colorMode = 'neonPink');
    document.getElementById('neonBlue').addEventListener('click', () => colorMode = 'neonBlue');
    document.getElementById('neonGreen').addEventListener('click', () => colorMode = 'neonGreen');

    // Reset button
    document.getElementById('resetButton').addEventListener('click', resetSketch);

    // Save button
    document.getElementById('saveButton').addEventListener('click', saveCircleArt);
}

function resetSketch() {
    circles = [];
    background(0);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    resetSketch();
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
        document.body.removeChild(notification);
    }, 2000);
}

function saveCircleArt() {
    if (isSaving) return;
    isSaving = true;
    
    saveCanvas('circle-packing', 'png');
    
    setTimeout(() => {
        isSaving = false;
    }, 2000);
} 