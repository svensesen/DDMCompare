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



/**
 * A single node of a tree graph.
 */
export class TreeNode {
    /**
     * Creates a single node in a tree graph.
     * @param {String} _name The name and identifier of the node (noNameGivenNode by default).
     * @param {Node} _parent The parent of the node (null by default).
     * @param {Number} _distance The distance to the parent node (0 by default).
     * @param {Tree|Array.<Tree>} _tree The tree(s) to which the node belongs (null by default)
     */
    constructor(_name = "noNameGivenNode", _parent = null, _distance = 0, _tree = null) {
        this.set_name(_name); //The name of the node

        this.parent = null; //The parent of the node (null by default)
        if(_parent != null){_parent.add_child(this);} 

        this.set_distance(_distance); //The distance to the parent node (0 by default)

        this.trees = [];  //The trees to which the node belongs (empty by default)
        if(_tree != null){this.add_tree(_tree);}

        this.children = []; //A list of the children of this node (empty by default)
    }

    toString() {
        return `TreeNode(${this.name})`;
    }

    /**
     * Sets the node's name to the input.
     * @param {String} _name To be set name.
     */
    set_name(_name) {
        check_type(_name, "string")
        this.name = _name;
    }

    /**
     * Sets the node's name to the input (SHOULD NOT BE MANUALLY INVOKED).
     * @param {Node} _parent To be set parent.
     */
    set_parent(_parent) {
        check_type(_parent, TreeNode)
        this.parent = _parent;
    }
 
    /**
     * Sets the node's distance to the input .
     * @param {Number} _distance To be set distance.
     */
    set_distance(_distance) {
        check_type(_distance, "number")
        this.distance = _distance;
    }

    /**
     * Adds a tree to the node.
     * @param {Tree|Array.<Tree>} added To be added tree or trees.
     */
    add_tree(added) {
        if (added instanceof Array) {
            for (tree in added) {
                check_type(tree, Tree)
                this.trees.push(tree);
            }
        }

        else {
            this.trees.push(added);
        }
    }

    /**
     * Adds a child to the node and makes it the child's parent.
     * @param {TreeNode|Array.<TreeNode>} added To be added child or children.
     */
    add_child(added) {
        check_type(added, [TreeNode, Array])
        if (added instanceof TreeNode) {
            this.children.push(added);
            added.set_parent(this);
        }

        else if (added instanceof Array) {
            for (child in added) {
                check_type(child, TreeNode)
                this.children.push(child);
                child.set_parent(this);
            }
        }
    }

    /**
     * The distance from the node to the root.
     */
    get root_distance() {
        if (this.parent == null) {
            return 0;
        }

        else {
            return this.parent.root_distance + this.distance;
        }
    }
    
    /**
     * The tree depth at the node.
     */
    get depth() {
        if (this.parent == null){
            return 0;
        }
        
        else {
            return this.parent.depth + 1;
        }
    }

    /**
     * The tree height at the node.
     */
    get height() {
        if (this.children.length == 0) {
            return 0;
        }

        else {
            return Math.max(...this.children.map(function (child) {return child.height;}))+1;
        }
    }
}

/**
 * A node at the root of a graph tree.
 */
export class TreeRoot extends TreeNode {
     /**
     * Creates a root, a node at the top of a graph tree.
     * @param {String} _name The name and identifier of the root (noNameGivenRoot by default).
     * @param {Tree} _tree The tree(s) to which the node belongs (empty array by default)
     */
    constructor(_name = "noNameGivenTree", _tree = []) {
        super(_name, null, 0, _tree);
    }

    toString() {
        return `TreeRoot(${this.name})`;
    }

    set_parent(_parent) {
        if (_parent != null) {
            throw new Error ("A root can not have a parent");
        }
    }

    set_distance(_distance) {
        if (_distance != 0) {
            throw new Error("A root can not have a non-zero distance");
        }
    }
}

/**
 * A node at a bottom of a graph tree.
 */
export class TreeLeaf extends TreeNode {
    /**
     * Creates a leaf, a node at the bottom of a graph tree.
     * @param {String} _name The name and identifier of the leaf (noNameGivenLeaf by default).
     * @param {Node} _parent The parent of the node (null by default).
     * @param {Number} _distance The distance to the parent node (0 by default).
     * @param {Tree} _tree The tree(s) to which the node belongs (empty array by default)
     */
    constructor(_name = "noNameGivenLeaf", _parent = null, _distance = 0, _tree = []) {
        super(_name, _parent, _distance, _tree);
    }

    toString() {
        return `TreeLeaf(${this.name})`;
    }

    add_child(added) {
        if (!(added instanceof Array && added.length == 0)) {
            throw new Error("A leaf can not be given children");
        }
    }
}



/**
 * A tree graph
 */
export class Tree {
    /**
     * Creates an empty tree graph
     * @param {String} _name The name and identifier of the tree
     * @param {String} root_name The name and identifier of the root of the tree
     */
    constructor(_name = "NoNameGivenTree", root_name = "NoGivenNameRoot", _tree_table = null) {
        Tree.instances.push(this);

        this.set_name(_name); //The name of the tree
        this.root = new TreeRoot(root_name); //The root of the tree
        this.tree_table = null; //The associated treeTable
        if(_tree_table != null){_parent.set_tree_table(this);} 

        this.tree_table = _tree_table; 
        this.nodes = []; //All nodes in the tree
        this.leaves = []; //All leaves in the tree   
        this.leaf_names = [];
    }

    toString() {
        return `Tree(${this.name})`;
    }

    /**
     * Set the tree's name to the input
     * @param {String} _name to be set name
     */
    set_name(_name) {
        check_type(_name, "string");
        this.name = _name;
    }

    /**
     * Sets the tree's associated tree table to the input (SHOULD NOT BE MANUALLY INVOKED).
     * @param {TreeTable} _parent to be set tree table
     */
    set_tree_table(_tree_table) {
        this.tree_table = _tree_table;
    }

    /**
     * Creates a new node and adds it to the tree
     * @param {String} name the name of this new node
     * @param {TreeNode} parent the parent of the new node
     * @param {Number} distance the distance of the node from its parent (0 by default)
     * @returns {TreeNode} the created node
     */
    create_node(name, parent, distance = 0) {
        const node = new TreeNode(name, parent, distance, this); 
        this.nodes.push(node);
        return node;
    }

    /**
     * Creates a new leaf and adds it to the tree
     * @param {String} name the name of this new leaf
     * @param {TreeNode} parent the parent of the new leaf
     * @param {Number} distance the distance of the node from its parent (0 by default)
     * @returns {TreeLeaf} the created leaf
     */
    create_leaf(name, parent, distance = 0) {
        const leaf = new TreeLeaf(name, parent, distance, this); 
        this.nodes.push(leaf);
        this.leaves.push(leaf);
        return leaf;
    }

    /**
     * Determines the type of format for the newick string
     * @param {String} newick_string the string to determine the format for
     * @returns {number} 0:no names or distances, 1:only distances, 2:names for leaves, 3:names for all, 4:names for leaves and distances, 5:names for all and distances
     */
    determine_newick_format(newick_string) {
        let distances = false;
        if (newick_string.includes(":")) {
            distances = true;
        }

        let leaf_names = false;
        for (let i of newick_string) {
            if (!(["(", ",", ")", ";", ":", ".", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(i))) {
                leaf_names = true;
                break;
            }
        }

        let node_names = false;
        let check_next = false;
        for (let i of newick_string) {
            if (i == ")") {
                check_next = true;
            }

            else if (check_next) {
                if (!([",", ")", ";", ":"].includes(i))) {
                    node_names = true;
                    break;
                }
                check_next = false;
            }
        }

        if (equal_array([distances, leaf_names, node_names],[false, false, false])) {return 0;}
        else if (equal_array([distances, leaf_names, node_names], [true, false, false])) {return 1;}
        else if (equal_array([distances, leaf_names, node_names], [false, true, false])) {return 2;}
        else if (equal_array([distances, leaf_names, node_names], [false, true, true])) {return 3;}
        else if (equal_array([distances, leaf_names, node_names], [true, true, false])) {return 4;}
        else if (equal_array([distances, leaf_names, node_names], [true, true, true])) {return 5;}
        else {return 100;}
    }

    /**
     * Fill the tree with nodes based on a newick string
     * @param {string} newick_string the newick string to be used
     */
    fill_tree_newick(newick_string) {
        const format = this.determine_newick_format(newick_string);

        let node_number = 0;
        let leaf_number = 0;
        let current_change = this.root;
        let current_parent = this.root;  
        let current_string = "";
        let closed = false;
        const used_names = [];

        switch(format) {
            case 0:
                for (let i of newick_string){
                    switch(i) {
                        case "(":
                            if (node_number > 0) {
                                let node = this.create_node(`Node ${node_number}`, current_parent);
                                current_parent = node;
                            }
                            closed = false;  
                            node_number += 1;
                            break;
                        
                        case ",":
                        case ")":
                            if (!closed) {
                                this.create_leaf(`Leaf ${leaf_number}`, current_parent);
                                leaf_number += 1;
                            }
                            closed = false;
                            if(i == ")") {current_parent = current_parent.parent;}
                            break;
                    }
                }
                break;
            
            case 1:
                for (let i of newick_string) {
                    switch(i) {
                        case "(":
                            if (node_number > 0) {
                                let node = this.create_node(`Node ${node_number}`, current_parent);
                                current_parent = node;
                            }
                            closed = false;  
                            node_number += 1;
                            break;
                        
                        case ";":
                        case ",":
                        case ")":
                            if (current_string != "") {
                                if (closed) {
                                    current_change.set_distance(parseFloat(current_string));
                                }

                                else {
                                    let name = current_string;
                                    let counter = 0;
                                    while(used_names.includes(name)){
                                        counter += 1;
                                        name = current_string + " (" + counter + ")"
                                    }
                                    used_names.push(name);

                                    this.create_leaf(`Leaf ${leaf_number}`, current_parent, parseFloat(current_string));
                                    leaf_number += 1;
                                }
                                current_string = "";
                            }
                            if (i == ")") { closed = true; current_change = current_parent; current_parent = current_parent.parent; }
                            else { closed = false; }
                            break;
                        
                        case ":":
                            break;

                        default:
                            current_string += i;                  
                    }
                }
                break;
            
            case 2:
                for (let i of newick_string) {
                    switch(i) {
                        case "(":
                            if (node_number > 0) {
                                let node = this.create_node(`Node ${node_number}`, current_parent);
                                current_parent = node;
                            }
                            node_number += 1;
                            break;
                            
                        case ",":
                        case ")":
                            if (current_string != "") {
                                let name = current_string
                                let count = 1;
                                while (used_names.includes(name)) {
                                    name = current_string + " (" + count + ")";
                                    count += 1;
                                }

                                this.create_leaf(name, current_parent);
                                current_string = "";
                            }
                            if (i == ")") { current_parent = current_parent.parent; }
                            break;
    
                        default:
                            current_string += i;                                          
                    }
                }
                break;
                
            case 3:
                for (let i of newick_string) {
                    switch(i) {
                        case "(":
                            if (node_number > 0) {
                                let node = this.create_node(`Node ${node_number}`, current_parent);
                                current_parent = node;
                            }
                            node_number += 1;
                            closed = false;
                            break;
                        
                        case ";":
                        case ",":
                        case ")":
                            if (current_string != "") {
                                let name = current_string;
                                let counter = 0;
                                while(used_names.includes(name)){
                                    counter += 1;
                                    name = current_string + " (" + counter + ")"
                                }
                                used_names.push(name);

                                if (closed) {
                                    current_change.set_name(current_string);
                                }

                                else {
                                    this.create_leaf(current_string, current_parent); 
                                }
                                current_string = "";
                            }
                            if (i == ")") { closed = true; current_change = current_parent; current_parent = current_parent.parent; }
                            else { closed = false; }
                            break;

                        default:
                            current_string += i;                                   
                    }
                }
                break;
            
            case 4:
                for (let i of newick_string) {
                    switch(i) {
                        case "(":
                            if (node_number > 0) {
                                let node = this.create_node(`Node ${node_number}`, current_parent);
                                current_change = node;
                                current_parent = node;
                            }
                            node_number += 1;
                            break;
                        
                        case ";":
                        case ",":
                        case ")":
                            if (current_string != "") {
                                current_change.set_distance(parseFloat(current_string));
                                current_string = "";
                            }
                            if (i == ")") { current_change = current_parent; current_parent = current_parent.parent; }
                            break;
                        
                        case ":":
                            if (current_string != "") {
                                let name = current_string;
                                let counter = 0;
                                while(used_names.includes(name)){
                                    counter += 1;
                                    name = current_string + " (" + counter + ")"
                                }
                                used_names.push(name);

                                let leaf = this.create_leaf(current_string, current_parent);
                                current_change = leaf;
                                current_string = "";
                            }
                            break;

                        default:
                            current_string += i; 
                    }
                }
                break;
            
            case 5:
                for (let i of newick_string) {
                    switch(i) {
                        case "(":
                            if (node_number > 0) {
                                let node = this.create_node(`node ${node_number}`, current_parent);
                                current_change = node;
                                current_parent = node;
                            }
                            node_number += 1;
                            closed = false;
                            break;

                        case ",":
                        case ")":
                            if (current_string != "") {
                                current_change.set_distance(parseFloat(current_string));
                                current_string = "";
                            }
                            if (i == ")") { current_change = current_parent; current_parent = current_parent.parent; closed = true; }
                            else { closed = false;}
                            break;
                        
                        case ";":
                        case ":":
                            if (current_string != "") {
                                let name = current_string;
                                let counter = 0;
                                while(used_names.includes(name)){
                                    counter += 1;
                                    name = current_string + " (" + counter + ")"
                                }
                                used_names.push(name);

                                if (closed) {
                                    current_change.set_name(name);
                                }

                                else {
                                    let leaf = this.create_leaf(current_string, current_parent);
                                    current_change = leaf;                                  
                                }
                                current_string = "";
                            }   
                            break;

                        default:
                            current_string += i; 
                    }
                }
                break;

            default:
                print("different fuck");
        }
        this.determine_tree_leaves();
    }

    /**
     * Fill the tree with nodes based on a newick string inside the file
     * @param {File} file a .txt file containing the newick string
     */
    fill_tree_newick_file(file) {
        let reader = new FileReader;
        reader.tree = this;
        reader.addEventListener("loadend", function(e) {this.tree.fill_tree_newick(e.target.result);})  
        reader.readAsText(file);
               
    }

    /**
     * Sets the leaf_names variable for later use
     */
    determine_tree_leaves() {
        this.leaf_names = [];
        for (let leaf in this.leaves) {
            this.leaf_names.push(leaf.name);
        }
    }
    
    /**
     * Return the children of the root node of the tree
     */
    get children() {
        return this.root.children
    }

    
    /**
     * Return the height of the tree
     */
     get height() {
        return this.root.height;
    }
}

Tree.instances = [];



export class TreeTable {

    constructor(_name = "noNameGivenTreeTable"){
        TreeTable.instances.push(this)
        
        this.set_name(_name);
        this.tree = null;
        this.file_name = null;

        this.true_base_distance_matrix = null; 
        this.true_base_distance_matrix_label = null;

        this.false_base_distance_matrix = null;
        this.false_base_distance_matrix_label = null;
        
        this.min_PGM_tree = null;
        this.min_PGM_distance_matrix = null;
        this.min_PGM_distance_matrix_label = null;

        this.max_PGM_tree = null;
        this.max_PGM_distance_matrix = null;
        this.max_PGM_distance_matrix_label = null;

        this.average_PGM_tree = null;
        this.average_PGM_distance_matrix = null;
        this.average_PGM_distance_matrix_label = null;
    }

    toString() {
        return `TreeTable(${this.name})`;
    }

    /**
     * Sets the tables name to the input.
     * @param {string} _name to be set name.
     */
    set_name(_name) {
        check_type(_name, "string");
        this.name = _name;
    }

    /**
     * Sets the tables tree to the input (SHOULD NOT BE MANUALLY INVOKED).
     * @param {Tree} _tree to be set tree.
     */
    set_tree(_tree) {
        check_type(_tree, Tree);
        this.tree = _tree;
    }

    /**
     * Creates a new tree based on the newick string in the given file
     * @param {File} file a .txt file containing the newick string
     */
    create_tree_newick_file(file) {

        for (let tree_table of TreeTable.instances) {
            if (file.name == tree_table.file_name) {
                TreeTable.instances.splice(TreeTable.instances.indexOf(this), 1);
                console.log(`${file.name} was already loaded`)
                return
            }
        }
  
        this.set_tree(new Tree(this.name));
        this.tree.fill_tree_newick_file(file);
    }

    /**
     * Creates a new tree based on a newick string
     * @param {str} newick the newick string
     */
     create_tree_newick_string(newick) {
        this.set_tree(new Tree(this.name));
        this.tree.fill_tree_newick(newick);
    }

    /**
     * Sets the false_base_distance_matrix or true_base_distance_matrix variable to the distance matrix of the tree
     * @param {Boolean} use_distance whether or not the nodes inbuilt distance parameters should be used
     */
    create_base_distance_matrix_from_tree(use_distance = false) {
        if (use_distance) {
            [this.true_base_distance_matrix, this.true_base_distance_matrix_label] = create_base_distance_matrix(this.tree, use_distance);
        }

        else {
            [this.false_base_distance_matrix, this.false_base_distance_matrix_label] = create_base_distance_matrix(this.tree, use_distance);
        }
        
    }

    /**
     * Sets the PGM_tree, PGM_distance_matrix and PGM_distance_matrix_label variable to those of the tree
     * @param {string} PGM_type which PGM_tree method to use ("min" or "max")
     */
    create_PGM_distance_matrix_from_tree(PGM_type = "min") {
        if(PGM_type == "min") {
            this.min_PGM_tree = create_PGM_tree(this.tree, PGM_type);
            [this.min_PGM_distance_matrix, this.min_PGM_distance_matrix_label] = create_base_distance_matrix(this.min_PGM_tree);
        }

        else if (PGM_type == "max") {
            this.max_PGM_tree = create_PGM_tree(this.tree, PGM_type);
            [this.max_PGM_distance_matrix, this.max_PGM_distance_matrix_label] = create_base_distance_matrix(this.max_PGM_tree);
        }

        else if (PGM_type == "average") {
            this.average_PGM_tree = create_PGM_tree(this.tree, PGM_type);
            [this.average_PGM_distance_matrix, this.average_PGM_distance_matrix_label] = create_base_distance_matrix(this.average_PGM_tree);
        }

        else {
            throw Error ("not a supported PGM type")
        }
    }

    get leaf_names() {
        return this.tree.leaf_names;
    }
}

TreeTable.instances = [];



export class Vis {

    constructor() {
        this.matrixes = [];
        this.trees = [];
    }

    /**
     * marks the asked for values in a tree
     * @param {div} svg the svg containing the tree
     * @param {Array.<String>} values the values which should be marked
     */
    mark_tree(svg, values) {
        svg.selectAll(".node")
            .style("fill", function(d) { return (d.children ? d3.color("grey"): d3.color("black")); })
            .attr("r", 8)
            .filter(function(d) {return values.includes(d.id)})
                .style("fill", d3.color("blue"))
                .attr("r", 16);

        svg.selectAll("text")
            .style("fill", "black")
            .filter(function(d) { return values.includes(d.id); })
                .style("fill", "red")

        svg.marked = values;
    }

    /**
     * marks the asked for values in a matrix
     * @param {div} svg the svg containing the matrix
     * @param {Array.<String>} values the values which should be marked
     */
    mark_matrix(svg, values) {
        svg.selectAll(".cell")
            .style("stroke-width", 0)
            .attr("marked", false)
            .filter(function(d) { return values.includes(d.x) || values.includes(d.y); })
                .style("stroke-width", svg.x.bandwidth()/5)
                .style("stroke", "black")
                .attr("marked", true);
            //.style("fill", svg.colorer)
            //.filter(function(d) { return values.includes(d.x) || values.includes(d.y); })
                //.style("fill", svg.colorerMarked );
        
        svg.selectAll("text")
            .style("fill", "black")
            .filter(function(d) { return values.includes(d); })
                .style("fill", "red")

    }

    /**
     * Creates a tree visualization
     * @param {Tree} input_tree the tree to be visualized
     * @param {String} div the name of the div on which the tree should be added
     * @param {Int} width the width of the tree in pixels
     * @param {Int} height the height of the tree in pixels
     * @param {Object} margin the top, right, bottom and left margins
     */
    create_tree(input_tree, div = "body", width = 800, height = 800, margin = {top: 100, right: 100, bottom: 100, left: 100}, node_names = false) {
        const data = [];
        
        //function which will be used for changing the tree into a usable format
        function add_layer(node) {
            data.push({"id": node.name, "parentId": node.parent.name});
            for (let child of node.children) {
                add_layer(child)
            }
        }
        
        //fills up data with an usable format
        data.push({"id": input_tree.root.name, "parentId": null});
        for (let child of input_tree.root.children) {
            add_layer(child)
        }

        //creates a zoom class
        const zoom = d3.zoom().on("zoom", zoomed)
            
        //creating the canvas
        const svg = d3.select(div)
            .append("svg")
                .attr("width", width + margin.left + margin.right) //width of the canvas
                .attr("height", height + margin.top + margin.bottom) //height of the canvas
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(zoom)
                
        
        const g = svg.append("g");

        //what happens when there is a zoom
        function zoomed() {
            svg.zoom_k = d3.event.transform.k
            svg.zoom_x = d3.event.transform.x
            svg.zoom_y = d3.event.transform.y
            g.attr("transform", d3.event.transform)
        }
        
        
        const tree = d3.tree().size([150*input_tree.height, 150*input_tree.height]);
            
        const stratify = d3.stratify() //does calculations of reformating the data

        const root = stratify(data) //determines the root of the tree
            .sort(function(a,b) { return (a.height - b.height) || a.id.localeCompare(b.id); });
        
        tree(root); //determines the coordinates of everything

        function diagonal(d) { //determines the shape of the link
            let result = "M" + d.y + "," + d.x
            + "C" + (Math.min(d.parent.y, d.y) + Math.abs(d.parent.y - d.y)*0.5) + "," + d.x
            + " " + (Math.min(d.parent.y, d.y) + Math.abs(d.parent.y - d.y)*0.5) + "," + d.parent.x
            + " " + d.parent.y + "," + d.parent.x;
 
            return result;
        }

        const link = g.selectAll(".link") //draws the lines between the node and its parent for all non-roots
            .data(root.descendants().slice(1))
        .enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal)
            .attr("fill", "none")
            .attr("stroke", "blue");
        
        const nodes = g.selectAll(".nodes") //sets the locations of all the nodes
            .data(root.descendants())
        .enter().append("g")
            .attr("class", "nodes")
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        const node = nodes.append("circle") //puts circles at the node location
            .attr("class", "node")
            .attr("r", 8)
            .style("fill", function(d) { return (d.children ? d3.color("grey"): d3.color("black")); })
            .style("stroke-width", 0) //Prevents the rectangle outlines
            .style("stroke", "red")
             
        const node_mouseover = function(d) { //handles mousing over a node
            d3.select(this).style("stroke-width", 2)
        }

        const node_mouseout = function(d) { //handles mousing out of the tree node
            d3.select(this).style("stroke-width", 0)
        } 

        const _trees = this.trees;
        const _mark_tree = this.mark_tree;
        const _matrixes = this.matrixes;
        const _mark_matrix = this.mark_matrix;

        const node_right_click = function(d) { //handles right clicking a tree node
            for (let svg of _trees) {
                _mark_tree(svg, [d.id])
            }

            for (let svg of _matrixes) {
                _mark_matrix(svg, [d.id])
            }
                
            d3.event.preventDefault()
        }

        
        node.on("contextmenu", node_right_click) //implements mouse interaction
            .on("mouseover", node_mouseover)
            .on("mouseout", node_mouseout);
        
        if(node_names) {
            nodes.append("text") //puts text at the node locations
            .attr("dy", function(d) { return d.children ? 20 : 5; })
            .attr("x", function(d) { return d.children ? 0 : 15; })
            .style("text-anchor", function(d) { return d.children ? "middle" : "start"; })
            .style("fill", "black")
            .text(function(d) { return d.id});
        }

        else {
            nodes.append("text") //puts text at the node locations
            .attr("dy", 5)
            .attr("x", 15)
            .style("text-anchor", "start")
            .style("fill", "black")
            .text(function(d) { return (d.children ? "": d.id); });
        }
        
        
        svg.call(zoom.scaleTo, height/(175*input_tree.height));
        svg.call(zoom.translateTo, 80*input_tree.height, 80*input_tree.height)

        //The button for zooming towards the selected space
        let zoom_button = document.getElementById(div.slice(1)+"zoomB")
        zoom_button.innerHTML = "To marked"; 
        zoom_button.addEventListener("click", function(e) {
            for (let i of root.descendants().slice(1)) {
                if (i.id == svg.marked[0]) {
                    console.log(svg.zoom_k)
                    if (svg.zoom_k <= 1 & svg.zoom_k >= 0.333) { //zoom out - move - zoom in
                        zoom.scaleTo(svg.transition().duration(250), 0.333);
                        setTimeout(() => {zoom.translateTo(svg.transition().duration(500), i.y, i.x);}, 275);
                        setTimeout(() => {zoom.scaleTo(svg.transition().duration(250), 1);}, 800);
                    }

                    else { //move - zoom in
                        zoom.translateTo(svg.transition().duration(500), i.y, i.x);
                        setTimeout(() => {zoom.scaleTo(svg.transition().duration(500), 1);}, 550);
                    }
                    
                    break;
                }
            }
            svg.marked.push(svg.marked.shift())
        })
        
        this.trees.push(svg);
    }

    /**
     * creates a matrix visualization
     * @param {Array.<Array.<Int>>} array_matrix the matrix numbers to be visualized
     * @param {Array.<String>} labels the labels of the matrix
     * @param {String} div the name of the div on which the matrix should be added
     * @param {Int} width the width of the matrix in pixels
     * @param {Int} height the height of the matrix in pixels
     * @param {Object} margin the top, right, bottom and left margins
     * @param {Array.<String>} base_color_range the base colors used
     * @param {Array.<String>} selected_color_range the colors used when marked
     * @param {Boolean} fancy if the matrix labels should be fancy
     */
    create_matrix(array_matrix, labels, div = "body", width = 800, height = 800, margin = {top: 100, right: 100, bottom: 100, left: 100}, 
    base_color_range = ["#FFFFFF", "#000000"], selected_color_range = ["#000064", "#00ffff"], fancy = false) {  
        const matrix = [];
        for (let i =0 ; i<array_matrix.length; i++) {
            for(let j = 0; j<array_matrix[i].length; j++) {
                matrix.push({"x": labels[i], "y": labels[j], "value": array_matrix[i][j]})
            }
        }

        let top = null;
        let svg = null;
        let zoom = d3.zoom().on("zoom", function() { return null; });
        if (fancy) {
            svg = d3.select(div)
                .append("svg") //creates 'canvas'
                    .attr("width", width + margin.left + margin.right) //width of the canvas
                    .attr("height", height + margin.top + margin.bottom) //height of the canvas
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")  
                    .call(zoom)  
                    .append("g"); 
            
            top = svg;
        }
        
        else {
            svg = d3.select(div)
                .append("svg") //creates 'canvas'
                    .attr("width", width + margin.left + margin.right) //width of the canvas
                    .attr("height", height + margin.top + margin.bottom) //height of the canvas
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")  
                    .call(zoom)

            top = svg.append("g");
        }
            
        
        //runs whenever the user tries to zoom
        

        if (fancy) {
            zoom = d3.zoom().on("zoom", function() {
                cell.attr("transform", d3.event.transform)
                background.attr("transform", d3.event.transform)

                columnLabels.attr("transform", "translate("  + d3.event.transform["x"] + ",0)")
                columnLabelsText.attr("y", function(d) { return (y.bandwidth()*0.8 + x(d.name))*d3.event.transform["k"]; })
                columnLabelsText.style("font-size", function(d) {
                    const max_font_size = x.bandwidth()*d3.event.transform["k"];
                    const current_length = d.length*d3.event.transform["k"];
                    const max_length = height*0.2;
                    return (current_length <= max_length ? max_font_size: (max_length*max_font_size)/current_length);
                })

                rowLabels.attr("transform", "translate(0,"  + d3.event.transform["y"] + ")")
                rowLabelsText.attr("y", function(d) { return (y.bandwidth()*0.8 + x(d.name))*d3.event.transform["k"]; })
                rowLabelsText.style("font-size", function(d) {
                    const max_font_size = y.bandwidth()*d3.event.transform["k"];
                    const current_length = d.length*d3.event.transform["k"];
                    const max_length = height*0.2;
                    return (current_length <= max_length ? max_font_size: (max_length*max_font_size)/current_length);
                })
            })
        }

        else {
            zoom = d3.zoom().on("zoom", function() {
                top.attr("transform", d3.event.transform);
            })
        }

        svg.call(zoom);

        const background = top.append("rect") //creates base
            .attr("class", "background") 
            .attr("width", width)
            .attr("height", height)
            .style("fill", d3.color("black"));


        //for auto scaling of the inserts along the x axis
        const x = d3.scaleBand() 
            .domain(labels) 
            .range([0, width])
            .padding(0.05);
        
        svg.x = x;

        //for auto scaling of the inserts along the y axis
        const y = d3.scaleBand() 
            .domain(labels)
            .range([0, height])
            .padding(0.05);

        svg.y = y;

        //for auto coloring of the squares
        var colorMap = d3.scaleLinear()
            .domain(base_color_range.length == 2 ? this.get_min_max(matrix): this.get_min_mean_max(matrix))
            .range(base_color_range); 

        //final coloring function, includes color for null values
        function colorer(d) { 
            if (d.value == null) {return d3.color("purple");}
            else {return colorMap(d.value);}
        }
            
        //auto coloring of the marked squares
        var colorMapMarked = d3.scaleLinear()
            .domain(selected_color_range.length == 2 ? this.get_min_max(matrix): this.get_min_mean_max(matrix))
            .range(selected_color_range);
        
        //final coloring function for the marked squares, includes color for null values
        function colorerMarked(d) {
            if (d.value == null) {return d3.color("purple");}
            else {return colorMapMarked(d.value);}
        }
        
        svg.colorer = colorer;
        svg.colorerMarked = colorerMarked;

        const cell = top.selectAll(".cell") //This will create the squares
            .data(matrix) //puts in the data
        .join("rect") //creates the rectangles of the squares
            .attr("class", "cell")
            .attr("x", function(d) { return x(d.x); })
            .attr("y", function(d) { return y(d.y); })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth()) 
            .attr("marked", false) //will keep track if this square is marked
            .style("stroke-width", 0) //Prevents the rectangle outlines
            .style("stroke", "red")
            .style("fill", colorer); //colors the rectangles in
        
        //the tooltip that will show up upon hovering over a cell
        const tooltip = d3.select(div)
            .append("div")
                .attr("class", " tooltip")
                .style("opacity", 0)
                .style("background-color", "white")
                .style("border", "solid")
                .style("position", "absolute")
                .text("tooltip")
        
            
        const cell_mouseover = function(d) { //handles mousing over a matrix cell
            if (this.getAttribute("marked") == "false") {
                d3.select(this)
                    .style("stroke-width", x.bandwidth()/5)
                    .style("stroke", "red")
            }

            else { d3.select(this).style("stroke", "blue"); }

            tooltip.style("opacity", .9)
                .html(`node 1: ${d.x} <br> node 2: ${d.y} <br> value: ${d.value}`)
                .style("left", (d3.event.pageX+70) + "px")
				.style("top", (d3.event.pageY-70) + "px");
        }

        const cell_mouseout = function(d) { //handles mousing out of a matrix cell
            if (this.getAttribute("marked") == "false") {
                d3.select(this).style("stroke-width", 0)    
            }

            else { d3.select(this).style("stroke", "black"); }

            tooltip.style("opacity", 0);
        } 
            
        const cell_mousemove = function(d) { //handles mousing moving over a matrix cell
			tooltip
				.style("left", (d3.event.pageX+70) + "px")
				.style("top", (d3.event.pageY-70) + "px");
		}

        const _trees = this.trees;
        const _mark_tree = this.mark_tree;
        const _matrixes = this.matrixes;
        const _mark_matrix = this.mark_matrix;
        
        const cell_right_click = function(d) { //handles right clicking a matrix cell
            for (let svg of _trees) {
                _mark_tree(svg, [d.x, d.y])
            }

            for (let svg of _matrixes) {
                _mark_matrix(svg, [d.x, d.y])
            }
            
            d3.event.preventDefault()
        }
        
        cell.on("mouseover", cell_mouseover) //implements all of the above
            .on("mouseout", cell_mouseout)
            .on("mousemove", cell_mousemove)
            .on("contextmenu", cell_right_click);;

        let columnLabels = null;
        let rowLabels = null;
        let columnLabelsText = null;
        let rowLabelsText = null;

        if (fancy) {
            top.append("rect") //row labels background
                .attr("class", "background") 
                .attr("width", width)
                .attr("height", height*3)
                .attr("x", -width)
                .attr("y", -height)
                .style("fill", "#D3D3D3");
        
            top.append("rect") //column labels background
                .attr("class", "background") 
                .attr("width", width*3)
                .attr("height", height)
                .attr("x", -width)
                .attr("y", -height)
                .style("fill", "#D3D3D3");

            //adds the visual length to the x_axis labels
            let labels_plus_x = [];
            for (let label of labels) {
                labels_plus_x.push({"name":label, "length":Vis.measureText(label, x.bandwidth())})
            }

            //adds the visual length to the y_axis labels
            let labels_plus_y = [];
            for (let label of labels) {
                labels_plus_y.push({"name":label, "length":Vis.measureText(label, y.bandwidth())})
            }

            columnLabels = top.selectAll(".column_labels") //stores the labels of the columns
                .data(labels_plus_x)
            .enter().append("g")
                .attr("class", "column_labels")

            columnLabelsText = columnLabels.append("text") //labels at the top
                .attr("x", x.bandwidth()/4) //distance from matrix
                .attr("y", function(d) { return y.bandwidth()*0.8 + x(d.name); })
                .attr("text-anchor", "start")
                .attr("transform", function(d,i) { return "rotate(-90)"; }) //rotates the text
                .style("font-size", function(d) {
                    const max_font_size = x.bandwidth();
                    const max_length = height*0.2;
                    return (d.length <= max_length ? max_font_size: (max_length*max_font_size)/d.length);
                })
                .style("fill", "black")
                .text(function(d) { return d.name; }); //sets the values of the text
        
        
            rowLabels = top.selectAll(".row_labels") //stores the labels of the rows
                .data(labels_plus_y)
            .enter().append("g")
                .attr("class", "row_labels")
        
            rowLabelsText = rowLabels.append("text") //labels at the left
                .attr("x", -x.bandwidth()/4) //distance from matrix
                .attr("y", function(d) { return y.bandwidth()*0.8 + x(d.name); })
                .attr("text-anchor", "end")
                .style("font-size", function(d) {
                    const max_font_size = y.bandwidth();
                    const max_length = height*0.2;
                    return (d.length <= max_length ? max_font_size: (max_length*max_font_size)/d.length);
                })
                .style("fill", "black")
                .text(function(d) { return d.name; }); //sets the values of the text     
        
            top.append("rect") //corner block of the labels background
                .attr("class", "background") 
                .attr("width", width)
                .attr("height", height)
                .attr("x", -width)
                .attr("y", -height)
                .style("fill", "#D3D3D3");
            
            top.attr("transform", "translate(" + width*0.2 + "," + height*0.2 + ") scale(" + 1/1.2 + ")")
        }

        else {
            columnLabels = top.selectAll(".column_labels") //stores the labels of the columns
                .data(labels)
            .enter().append("g")
                .attr("class", "column_labels")

            columnLabelsText = columnLabels.append("text") //labels at the top
                .attr("x", x.bandwidth()/4) //distance from matrix
                .attr("y", function(d) { return y.bandwidth()*0.8 + x(d); })
                .attr("text-anchor", "start")
                .attr("transform", function(d,i) { return "rotate(-90)"; }) //rotates the text
                .style("font-size",  x.bandwidth()*0.8)
                .style("fill", "black")
                .text(function(d) { return d; }); //sets the values of the text
        
        
            rowLabels = top.selectAll(".row_labels") //stores the labels of the rows
                .data(labels)
            .enter().append("g")
                .attr("class", "row_labels")
        
            rowLabelsText = rowLabels.append("text") //labels at the left
                .attr("x", -x.bandwidth()/4) //distance from matrix
                .attr("y", function(d) { return y.bandwidth()*0.8 + x(d); })
                .attr("text-anchor", "end")
                .style("font-size", y.bandwidth()*0.8)
                .style("fill", "black")
                .text(function(d) { return d; }); //sets the values of the text
            
            background.attr("transform", "translate(" + width*0.15 + "," + height*0.15 + ") scale(" + 1/1.2 + ")");
            cell.attr("transform", "translate(" + width*0.15 + "," + height*0.15 + ") scale(" + 1/1.2 + ")");
            columnLabels.attr("transform", "translate(" + width*0.15 + "," + height*0.15 + ") scale(" + 1/1.2 + ")");
            rowLabels.attr("transform", "translate(" + width*0.15 + "," + height*0.15 + ") scale(" + 1/1.2 + ")");        
        }
  
        this.matrixes.push(svg);
    }

    get_min_max(matrix) {
        let min = Number.MAX_VALUE;
        let max = -Number.MAX_VALUE;
        matrix.forEach(function(o) {
            if (o["value"] != null) {
                min = Math.min(min, o["value"])
                max = Math.max(max, o["value"])
            }
        })
        return [min, max]
    }

    get_min_mean_max(matrix) {
        let min = Number.MAX_VALUE;
        let max = -Number.MAX_VALUE;
        let total = 0;
        matrix.forEach(function(o) {
            if (o["value"] != null) {
                min = Math.min(min, o["value"])
                max = Math.max(max, o["value"])
                total += o["value"]
            }
        })
        let mean = total/matrix.length
        return [min, 0, max]
    }

    static visual_length(str) {
        const ruler = document.getElementById("ruler");
        ruler.innerHTML = str;
        return ruler.offsetWidth;
    }

    static measureText(str, fontSize = 10) {
        const widths = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.2796875,0.2765625,0.3546875,0.5546875,0.5546875,0.8890625,0.665625,0.190625,
            0.3328125,0.3328125,0.3890625,0.5828125,0.2765625,0.3328125,0.2765625,0.3015625,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,0.5546875,
            0.5546875,0.5546875,0.5546875,0.2765625,0.2765625,0.584375,0.5828125,0.584375,0.5546875,1.0140625,0.665625,0.665625,0.721875,0.721875,0.665625,0.609375,
            0.7765625,0.721875,0.2765625,0.5,0.665625,0.5546875,0.8328125,0.721875,0.7765625,0.665625,0.7765625,0.721875,0.665625,0.609375,0.721875,0.665625,0.94375,
            0.665625,0.665625,0.609375,0.2765625,0.3546875,0.2765625,0.4765625,0.5546875,0.3328125,0.5546875,0.5546875,0.5,0.5546875,0.5546875,0.2765625,0.5546875,
            0.5546875,0.221875,0.240625,0.5,0.221875,0.8328125,0.5546875,0.5546875,0.5546875,0.5546875,0.3328125,0.5,0.2765625,0.5546875,0.5,0.721875,0.5,0.5,0.5,
            0.3546875,0.259375,0.353125,0.5890625]
        const avg = 0.5279276315789471
        return str.split('').map(c => c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] : avg).reduce((cur, acc) => acc + cur) * fontSize
      }
}