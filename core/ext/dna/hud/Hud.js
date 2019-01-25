let Hud = function() {
    this.name = 'hud'
    dna.hud.Container.call(this)
    
    // fix preset if not present
    env.attach(sys.clone(dna.hud.preset), 'hud')

    // append another trap on click event
    let hud = this
    sys.after(trap, 'click', function(e) {
        let x = e.x - hud.x
        let y = e.y - hud.y
        hud.onClick(x, y)
    })
}

Hud.prototype = Object.create(dna.hud.Container.prototype)

Hud.prototype.init = function() {
    // calculate operating area
    this.x = 0
    this.y = 0
    this.w = ctx.width
    this.h = ctx.height
}

module.exports = Hud
