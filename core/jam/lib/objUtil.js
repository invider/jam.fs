var objUtil = {
    _info: 'library of object math functions',
    assertIsPositionalObj: function(obj){
        lib.asserts.assertTrue(sys.isObj(obj), "Object must be provided");
        lib.asserts.assertTrue(obj.x !== undefined, "Object must have x");
        lib.asserts.assertTrue(obj.y !== undefined, "Object must have x");
    },
    /**angle
     * Calculates distance between objects
     * @param source
     * @param target
     */
    distance: function(source, target){
        this.assertIsPositionalObj(source);
        this.assertIsPositionalObj(target);
        return lib.math.distance(source.x, source.y, target.x, target.y);
    },

    /**
     * returns vector obj1 -> obj2
     * @param source
     * @param target
     */
    vector: function(source, target){
        this.assertIsPositionalObj(source);
        this.assertIsPositionalObj(target);
        return {
            x: target.x - source.x,
            y: target.y - source.y
        }
    },

    /**
     * returns normalized vector obj1 -> obj2
     * @param source
     * @param target
     */
    nVector: function(source, target){
        this.assertIsPositionalObj(source);
        this.assertIsPositionalObj(target);
        let vect = this.vector(source, target);
        let divider = Math.max(vect.x, vect.y);
        vect.x /= divider;
        vect.y /= divider;
        return vect;
    },

    findObj: function(container, predicate){
        this.assertIsPositionalObj(container);
        if (typeof predicate !== "function"){
            return container._ls.indexOf(predicate) !== -1 ? predicat: false;
        }

        for (let k in container._ls){
            if (predicate(container._ls)){
                return predicate;
            }
        }
        return false;
    },

    /**
     * returns list of object in given radius
     * @param obj
     * @param radius
     * @returns {*[]}
     */
    findObjInRadius: function(obj, radius){
        return obj.__._ls.filter(o => this.distance(obj, o) <= radius);
    },

    /**
     *
     * @param obj1
     * @param obj2
     * @param predicate function to check
     * @param stopOnFirst
     */
    rayTrace: function(obj1, obj2, predicate, stopOnFirst){
        let source = obj.__
        let result = [];
        for (let k in source._ls){
            let o = source._ls[k];
            if (o === obj1 || o === obj2){
                continue;
            }
            if (predicate(obj1, obj2, o)){
                result.push(o);
                if (stopOnFirst){
                    break;
                }
            }
        }
        return result;
    },

    rayTraceRadial: function(obj1, obj2, radius, stopOnFirst){
        radius = radius === undefined ? 1 : radius;
        let predicate = function(o1, o2, o){
            let len = lib.math.distanceToSegment(o.x, o.y, o1.x, o1.y, o2.x, o2.y);
            return len <= radius;
        };
        let result = this.rayTrace(obj1, obj2, predicate, stopOnFirst);
        return result
    }
};

module.exports = objUtil;
