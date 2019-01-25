
let instances = 0

let Button = function(st) {
    instances ++

    this.x = 0
    this.y = 0
    this.color = dna.hud.preset.font
    this.bcolor = '#404040'
    this.pcolor = '#202020'
    this.hspace = 5
    this.vspace = 5
    this.font = dna.hud.preset.font
    this.font = '24px Impact'
    this.fontHeight = dna.hud.preset.baseHeight

    sys.augment(this, st)

    if (!this.name) this.name = 'Button ' + instances
    if (!this.text) this.text = this.name
}

Button.prototype.evo = function() {}

Button.prototype.size = function() {
    ctx.font = this.font
    let m = ctx.measureText(this.text)
    return {
        w: m.width + this.hspace*2,
        h: this.fontHeight + this.vspace*2,
    };
}

Button.prototype.draw = function() {
    let s = this.size()
    ctx.fillStyle = this.bcolor
    ctx.fillRect(this.x, this.y, s.w, s.h)

    ctx.fillStyle = this.color
    ctx.font = this.font
    ctx.textBaseline = 'top'
    ctx.textAlign = "left"
    ctx.fillText(this.text, this.x + this.hspace, this.y + this.vspace);
}

return Button
