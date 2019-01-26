let BlinkingText = function(dat) {
    this.align ="center";
    this.font = '72px zekton'
    this.fillStyle = '#FFA000'
    
    sys.augment(this, dat)

    if (dat.rx) this.x = dat.rx/100 * ctx.width
    else this.x = dat.x
    if (dat.ry) this.y = dat.ry/100 * ctx.height
    else this.y = dat.y
}

BlinkingText.prototype.evo = function(dt) {
}

BlinkingText.prototype.draw = function() {
    ctx.font = this.font
    ctx.textAlign = this.align
    ctx.fillStyle = this.fillStyle

    ctx.fillText(this.txt, this.x, this.y) 
}

module.exports = function(dat) {
    return new BlinkingText(dat)
}

