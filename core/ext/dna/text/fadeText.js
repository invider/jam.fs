let FadeText = function(dat) {
    this.alive = true
    this.time = 0

    this.x = 0
    this.y = 0
    this.dx = 0
    this.dy = 0
    this.ttl = 5
    this.tti = 1
    this.ttf = 1
    this.align ="left"
    this.base = "top"
    this.font = '14px impact'

    sys.augment(this, dat)

    this.tta = this.ttl - this.ttf
    if (this.tta < 0) this.tta = 0
    if (dat.rx) this.x = dat.rx/100 * ctx.width;
    else this.x = dat.x
    if (dat.ry) this.y = dat.ry/100 * ctx.height;
    else this.y = dat.y
}

FadeText.prototype.evo = function(dt) {
    this.time += dt
    this.x += this.dx * dt
    this.y += this.dy * dt

    if (this.time > this.ttl) {
        this.alive = false
        this.__.detach(this)
    }
}

FadeText.prototype.draw = function() {
    if (!this.alive) return 

    if (this.time > this.tta) {
        ctx.globalAlpha = (this.ttl - this.time) / (this.ttl - this.tta)
    } else if (this.time < this.tti) {
        ctx.globalAlpha = this.time / this.tti
    } else {
        ctx.globalAlpha = 1
    }

    ctx.font = this.font
    ctx.fillStyle = this.fillStyle
    ctx.textAlign = this.align
    ctx.textBaseline = this.base

    ctx.fillText(this.text, this.x, this.y)
    ctx.globalAlpha = 1
}

module.exports = function(dat) {
    return new FadeText(dat)
}

