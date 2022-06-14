export const print = (...any) => console.log(...any.map(String));

/**
 * Checks if the input is of the correct type, throws error if not
 * @param {Any} input The input who's variable should be checked
 * @param {String|Function|Array.<String|Function>} expected_type The correct input types
 */
export function check_type(input, expected_type) {
    if (typeof expected_type == "string") {
        if(typeof input != expected_type) {
            throw TypeError(`Expected type ${expected_type}. Given type: ${input.constructor.name}`)
        }
    }

    else if (typeof expected_type == "function") {
        if(!(input instanceof expected_type)) {
            throw TypeError(`Expected type ${expected_type.name}. Given type: ${input.constructor.name}`)
        }
    }

    else if (expected_type instanceof Array) {
        for (let i = 0; i < expected_type.length; i++) {
            if (typeof expected_type[i] == "string") {
                if(typeof input == expected_type[i]) {
                    return null;
                }
            }
            
            else if (typeof expected_type[i] == "function") {
                if(input instanceof expected_type[i]) {
                    return null;
                }
            }

            else {
                throw TypeError("Ya messed up the error checker");
            }
        }
        throw TypeError(`Expected types ${expected_type.map(function (single_type) {
            if (typeof single_type == "string") {return single_type;}
            else {return single_type.name;}}
            )}. Given type: ${input.constructor.name}`);
    }

    else {
        throw TypeError("Ya messed up the error checker");
    }

}

/**
 * checks if two arrays are equal
 * @param {Array} a the first array
 * @param {Array} b the second array
 * @returns {boolean} whether the arrays are equal
 */
export function equal_array(a, b) {
    if (a === b) return true;
    else if (a == null || b == null) return false;
    else if (a.length !== b.length) return false;
      
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function not_smaller_zero(a) {
    if (a <0) {
        return 0
    }

    else {
        return a
    }
}

