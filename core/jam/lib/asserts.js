var asserts = {
    assertTrue: function(value, exception) {
        if (!value){
            exception = (exception instanceof Error) ? exception: new Error(exception);
            throw exception
        }
    },
    assertNumber: function(value, exception) {
        if (isNaN(value)){
            exception = (exception instanceof Error) ? exception: new Error(exception);
            throw exception
        }
    },
    notEmpty: function(value, exception){
        if (!value){
            exception = (exception instanceof Error) ? exception: new Error(exception);
            throw exception
        }
    }
};
module.exports = asserts;