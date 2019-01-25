let FADEOUT = 0.3 // default particle fadeout value

let Particle = function(dat) {
    this.alive = true
    sys.augment(this, dat)

    if (!this.img && !this.color) this.color = '#ffffff'
    this.gr = -this.r
    this.dx = Math.cos(this.angle) * this.speed
    this.dy = Math.sin(this.angle) * this.speed

    this.evo = function(dt) {
        this.move(dt)
        this.lifespan -= dt 
        if (this.lifespan < 0) this.alive = false
    }
}

var Emitter = function(init) {
    // tuning
    this.dead = false
    this.blend = 'source-over'

    this.lifespan = 1
    this.force = 200
    this.radius = 0
    this.size = 1
    this.vsize = 0
    this.speed = 100
    this.vspeed = 0
    this.angle = 0
    this.spread = Math.PI * 2
    this.minLifespan = 1
    this.vLifespan = 0

    // augmenting
    augment(this, init)

    if (this.force) this.frequency = 1/this.force

    this.potential = 0
    this.particles = []
}

Emitter.prototype.init = function(parent, scene) {
}

Emitter.prototype.onExhausted = function() {
}

Emitter.prototype.moveParticle = function(dt) {
    this.x += this.dx * dt
    this.y += this.dy * dt
}
    
Emitter.prototype.drawParticle = function() {
    if (this.img) {
        ctx.globalAlpha = 0.5
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(this.img, this.x-this.r, this.y-this.r, this.r*2, this.r*2);
    } else {
        ctx.beginPath();
        if (this.lifespan < FADEOUT) {
            ctx.globalAlpha = this.lifespan/FADEOUT
        } else {
            ctx.globalAlpha = 1
        }
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = this.color
        ctx.fill();
    }
}

Emitter.prototype.createParticle = function() {
    let x = 0
    let y = 0
    if (this.radius) {
        let r = lib.math.rnd(this.radius)
        let fi = lib.math.rndfi()
        x = Math.cos(fi) * r
        y = Math.sin(fi) * r
    }

    return new Particle({
        img: this.img,
        color: this.color,
        x: x,
        y: y, 
        r: this.size + lib.math.rnd(this.vsize),
        speed: this.speed + lib.math.rnd(this.vspeed),
        angle: this.angle + lib.math.rnd(this.spread),
        lifespan: this.minLifespan + lib.math.rnd(this.vLifespan)
    })
}

Emitter.prototype.spawn = function() {
    var p = this.createParticle()
    if (!p.draw) p.draw = this.drawParticle
    if (!p.move) p.move = this.moveParticle

    // find a slot
    var placed = false
    for (var i = 0; i < this.particles.length; i++) {
       if (!this.particles[i].alive) {
           this.particles[i] = p
           placed = true
           break;
       }
    }
    if (!placed) this.particles.push(p)
}

Emitter.prototype.emit = function(dt) {
    // emitting
    this.potential += dt
    while (this.lifespan !== 0 && this.potential >= this.frequency) {
        this.potential -= this.frequency
        this.spawn()
    }
}

Emitter.prototype.evo = function(dt) {
    if (this.dead) this.__.detach(this)

    if (this.dx) this.x += this.dx * dt
    if (this.dy) this.y += this.dy * dt

    if (this.lifespan > 0) {
        this.lifespan -= dt
        if (this.lifespan < 0) {
            this.lifespan = 0
            this.onExhausted()
        }
    }

    this.emit(dt)

    // mutating particles
    var pn = 0
    this.particles.forEach( p => {
        if (p.alive) {
            pn++
            p.evo(dt)
        }
    })

    if (pn === 0 && this.lifespan === 0) {
        this.dead = true
    }
}

Emitter.prototype.draw = function() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.globalCompositeOperation = this.blend

    var i = 0
    this.particles.forEach( p => {
        i++
        if (p.alive) p.draw()
    })
    ctx.restore()
}

module.exports = Emitter
