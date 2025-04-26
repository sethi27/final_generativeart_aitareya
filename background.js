let particles = [];
const numParticles = 100;

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('background-canvas');
    
    // Initialize particles
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function draw() {
    background(0, 20);
    
    // Update and display particles
    for (let particle of particles) {
        particle.update();
        particle.display();
    }
}

class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = random(width);
        this.y = random(height);
        this.size = random(2, 5);
        this.speedX = random(-1, 1);
        this.speedY = random(-1, 1);
        this.color = color(random([
            '#00ffff', // cyan
            '#ff00ff', // magenta
            '#ffff00', // yellow
            '#ff7f50'  // coral
        ]));
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Wrap around screen
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
        
        // Connect particles
        for (let other of particles) {
            let d = dist(this.x, this.y, other.x, other.y);
            if (d < 100) {
                stroke(this.color);
                strokeWeight(0.5);
                line(this.x, this.y, other.x, other.y);
            }
        }
    }
    
    display() {
        noStroke();
        fill(this.color);
        circle(this.x, this.y, this.size);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
} 