module.exports = function(src, vol, pan) {
    if (!pan) pan = 0
    if (!vol) vol = 1
    if (sys.isNumber(env.sfxVolume)) {
        vol *= env.sfxVolume
    }

    if (!(src instanceof Audio)) {
        // find by path in resources
        src = res.selectOne(src)
    }

    if (src && src instanceof Audio && src.readyState === 4) {
        src.volume = vol
        src.play()
    }
}

