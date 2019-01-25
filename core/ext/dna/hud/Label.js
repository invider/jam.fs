
let labelCounter = 0

let Label = function Label(dat) {
    labelCounter ++

    if (!dat) dat = {}
    else if (sys.isString(dat)) dat = { text: dat }

    if (dat.name) this.name = dat.name
    else this.name = 'Label ' + labelCounter
    if (dat.x) this.x = dat.x
    else this.x = 0
    if (dat.y) this.y = dat.y
    else this.y = 0

    // preconfigure
    this.color = env.hud.color
    this.font = env.hud.font

    // must follow preconfigure
    if (dat.text) this.setText(dat.text)
    else this.setText('Label')
}

Label.prototype.setText = function(text) {
    this.text = text
    this.th = parseInt(this.font)
    ctx.font = this.font
    this.tw = ctx.measureText(text).width
    this.w = this.tw
    this.h = this.th
}

Label.prototype.evo = function() {}

Label.prototype.draw = function() {
    ctx.fillStyle = this.color
    ctx.font = this.font
    ctx.textAlign = "left"
    ctx.textBaseline = 'top'
    ctx.fillText(this.text, this.x, this.y);
}

return Label
