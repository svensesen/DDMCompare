import {Tree} from "./TreeLIB.mjs"

/**
 * Creates and returns a matrix containing the distances between all leaves of a tree graph
 * @param {Tree} tree the tree graph to use
 * @param {Boolean} use_distance whether or not the nodes inbuilt distance parameters should be used (false by default)
 * @param {Boolean} inf_diagonal whether the diagonal should be 0 (false) or infinite (true) (false by default)
 * @returns a matrix with the distance between all leaves
 */
export function create_base_distance_matrix(tree, use_distance = false, inf_diagonal = false) {
    const distance_matrix = []; //this wil store the final result
    for (let i = 0; i < tree.leaves.length; i++) {
        distance_matrix[i] = [];
    }

    const leaf_names = [];
    const leaf_distances = {} //this will store the distance of the each leaf to each of the nodes above it
    for (let leaf of tree.leaves) { //runs through all the leaves
        leaf_names.push(leaf.name);
        let current_leaf = leaf;
        let current_distance = 0;
        let current_leaf_distances = new Map();

        while(current_leaf.parent != null) { //runs through all nodes directly above the leaf
            current_distance += (use_distance ? current_leaf.distance : 1);
            current_leaf = current_leaf.parent;
            current_leaf_distances.set(current_leaf.name, current_distance);
        }

        leaf_distances[leaf.name] = current_leaf_distances
    }

    for (let i = 0; i < tree.leaves.length; i++) {
        distance_matrix[i][i] = (inf_diagonal ? Infinity : 0); //distance from a leaf to itself is always 0

        for (let j = i+1; j < tree.leaves.length; j++) {
            let outcome = null;
            let j_key_list = Array.from(leaf_distances[tree.leaves[j].name].keys());
            
            for (let entry of leaf_distances[tree.leaves[i].name]) { //finds the first time two of the passed nodes overlap and returns the total distance
                if(j_key_list.includes(entry[0])) {
                    outcome = entry[1] + leaf_distances[tree.leaves[j].name].get(entry[0])
                    break;
                }
            }
            
            distance_matrix[i][j] = outcome; 
            distance_matrix[j][i] = outcome; 
        }
    }

    return [distance_matrix, leaf_names]
}

/**
 * Creates a PGM (Pair Group Method) tree from a normal tree
 * @param {Tree} tree the normal tree which will be converted
 * @param {string} type the type of the PGM tree (min or max)
 * @returns the PGM tree
 */
export function create_PGM_tree(tree, PGM_type = "min") {
    let [distance_matrix, matrix_label] = create_base_distance_matrix(tree, true, true);

    const PGM_tree = new Tree("PGM", "Root");
    
    let counter = 1;
    let amount_combined = Array(distance_matrix.length).fill(1);

    for (let leaf_name of matrix_label) {
        PGM_tree.create_leaf(leaf_name, PGM_tree.root);
    }

    while (matrix_label.length > 2) {
        let min_value = Infinity
        let min_i = null;
        let min_j = null;

        //finds the next values to be combined
        for (let i = 0; i < distance_matrix.length; i++) {
            for (let j = 0; j < distance_matrix[i].length; j++) {
                if (distance_matrix[i][j] <= min_value) {
                    min_value = distance_matrix[i][j];
                    min_i = i;
                    min_j = j;
                }
            }
        }
        
        //sets the parents of the newly combined values
        let current_node = PGM_tree.create_node(`node ${counter}`, PGM_tree.root);

        for(let node of PGM_tree.nodes) {
            if ([matrix_label[min_i], matrix_label[min_j]].includes(node.name)) {
                node.set_parent(current_node);
            }
        }

        //updates the distance_matrix with the new node
        let new_row = combine_array(distance_matrix[min_i], distance_matrix[min_j], PGM_type, amount_combined[min_i], amount_combined[min_j])
        
        let first = Math.min(min_i,min_j);
        let second = Math.max(min_i,min_j);

        amount_combined.push(amount_combined[min_i] + amount_combined[min_j])
        amount_combined.splice(first, 1);
        amount_combined.splice(second-1, 1);

        new_row.splice(first, 1);
        new_row.splice(second-1, 1);
        new_row.push((PGM_type == "min" ? Infinity: -Infinity));
       
        for(let k = 0; k < distance_matrix.length; k++){
            distance_matrix[k].splice(first, 1);
            distance_matrix[k].splice(second-1, 1);
            distance_matrix[k].push(new_row[k])
        }
        
        distance_matrix.splice(first, 1);
        distance_matrix.splice(second-1, 1);
        distance_matrix.push(new_row)

        //updates the matrix_label with the new node
        matrix_label.splice(first, 1);
        matrix_label.splice(second-1, 1);
        matrix_label.push(`node ${counter}`);

        counter += 1;
    }

    for(let node of PGM_tree.nodes) {
        if ([matrix_label[0], matrix_label[1]].includes(node.name)) {
            node.set_parent(PGM_tree.root);
        }
    }

    return PGM_tree
}

/**
 * creates a PGM_tree and turns it into a distance matrix
 * @param {Tree} tree the normal tree which will be used
 * @returns the PGM distance matrix
 */
export function create_PGM_distance_matrix(tree) {
    const PGM_tree = create_PGM_tree(tree);

    return create_base_distance_matrix(PGM_tree);
}

/**
 * subtracts the second matrix from the first, if entry is only in either matrix, it becomes null
 * @param {Array.<Object>} base_matrix the matrix from which is subtracted
 * @param {Array.<String>} base_matrix_label the row/column label of the base matrix
 * @param {Array.<Object>} subtracted_matrix the matrix which is subtracted
 * @param {Array.<String>} subtracted_matrix_label the row/column label of the subtracted matrix
 * @param {boolean} absolute wether the absolute value should be used (true by default)
 * @returns the newly created matrix (0 if values do not overlap) and matrix label
 */
export function subtract_matrixes(base_matrix, base_matrix_label, subtracted_matrix, subtracted_matrix_label, absolute = true) {
    const new_matrix = []; //this wil store the final result
    const new_matrix_label = []; //this wil store the labels of the final result
    
    for (let i = 0; i < base_matrix.length; i++) { //for each row
        new_matrix_label.push(base_matrix_label[i])

        if (!subtracted_matrix_label.includes(base_matrix_label[i])) {  //accounts for entries in base_matrix but not in subtracted_matrix
            for(let i = 0; i < new_matrix.length; i++) {
                new_matrix[i][new_matrix.length] = null;
            }

            new_matrix[new_matrix.length] = new Array(new_matrix.length+1).fill(null);
        }

        else {
            new_matrix[i] = [];

            for (let j = 0; j < base_matrix.length; j++) { //for each column in the row
                if(!subtracted_matrix_label.includes(base_matrix_label[j])) { //for entries where j is only in base_matrix
                    new_matrix[i][j] = null;
                }
                else {
                    let subtracted_i = subtracted_matrix_label.indexOf(base_matrix_label[i]);
                    let subtracted_j = subtracted_matrix_label.indexOf(base_matrix_label[j]);
                    let result = base_matrix[i][j] - subtracted_matrix[subtracted_i][subtracted_j];
                    new_matrix[i][j] =  (absolute ? Math.abs(result): result);
                }
            }
        }
    }

    for(const [index, element] of subtracted_matrix_label.entries()) { //accounts for entries in subtracted matrix but not in base_matrix
        if (!base_matrix_label.includes(element)) {
            new_matrix_label.push(element);

            for(let i = 0; i < new_matrix.length; i++) {
                new_matrix[i][new_matrix.length] = null;
            }

            new_matrix[new_matrix.length] = new Array(new_matrix.length+1).fill(null);
        }
    }

    return [new_matrix, new_matrix_label];
}

/**
 * Sorts the matrix from rows/columns with lowest sum value to highest sum value
 * @param {Array.<Object>} matrix the matrix containing the original matrix
 * @param {Array.<String>} matrix_label the row/column labels of the original matrix
 * @param {float} reverse if true reverses the order
 * @returns the sorted matrix and matrix label
 */
export function sortLowHigh(matrix, matrix_label, reverse = false) {
    
    const total_values = {};
    for (let i = 0; i < matrix.length; i++) { //this stores the different labels by their total_values
        let new_key = matrix[i].reduce((a, b) => a + b, 0)
        if (!(new_key in total_values)) {total_values[new_key] = []}
        total_values[new_key].push(matrix_label[i]);
    }
    
    let order = Object.keys(total_values);
    for (let i = 0; i < order.length; i++) { //orders all the different total_values of the labels
        order[i] = parseInt(order[i]);
    }
    order = order.sort(function(a, b) { return a - b; });
    if(reverse) {order = order.reverse()} //reverses the order if needed

    const new_matrix = [];
    const result_matrix = []
    const result_matrix_label = [];

    let row = 0;
    for (let i = 0; i < order.length; i++) { //creates new_matrix, where all the values are in the correct rows
        for (let new_label of total_values[order[i]]) {
            result_matrix_label.push(new_label);
            result_matrix.push([])

            let index = matrix_label.indexOf(new_label);
            new_matrix[row] = matrix[index];
            row += 1;
        }
    }

    for (let i = 0; i < order.length; i++) { //creates result_matrix, where the rows of the new_matrix are put in the correct columns
        for (let new_label of total_values[order[i]]) {
            let index = matrix_label.indexOf(new_label);
            for (let j = 0; j < row; j++) {
                result_matrix[j].push(new_matrix[j][index])
            }
        }
    }

    return [result_matrix, result_matrix_label]
}

export function removeNull(matrix, matrix_label) {
    let to_remove = [];
    for (let i = 0; i < matrix.length; i++) {
        if (matrix[i].every(element => element === null)) {
            to_remove.push(i);
        }
    }

    for (let i = 0; i < to_remove.length; i++) {
        matrix.splice(to_remove[i], 1);
        matrix_label.splice(to_remove[i], 1);
       
        for(let j = 0; j < matrix.length; j++){
            matrix[j].splice(to_remove[i], 1);
        }
        
        to_remove = to_remove.map(function(element) {
            return element - 1
        })
    }

    return [matrix, matrix_label]
}

/**
 * Combines the values of two arrays
 * @param {Array} array1 the first array
 * @param {Array} array2  the second array
 * @param {string} type how the array should be combined ("min", "max" or average)
 * @param {Int} amount1 the amount of arrays combined in the first array (only used for average type)
 * @param {Int} amount2 the amount of arrays combined in the second array (only used for average type)
 * @returns the combined array
 */
function combine_array(array1, array2, type = "min", amount1 = null, amount2 = null) {
    const new_array = [];
    if(array1.length != array2.length) {
        throw Error("Arrays must be same size")
    }

    switch (type) {
        case "min":
            for(let i=0; i < array1.length; i++) {
                new_array.push(Math.min(array1[i], array2[i]))
            }
            break;
        
        case "max":
            for(let i=0; i < array1.length; i++) {
                new_array.push(Math.max(array1[i], array2[i]))
            }
            break;
        
        case "average":
            for(let i=0; i < array1.length; i++) {
                new_array.push((array1[i]*amount1 + array2[i]*amount2)/(amount1 + amount2))
            }
            break;
        
        default:
            throw Error("How did you fuck this up?")
    }

    return new_array
}