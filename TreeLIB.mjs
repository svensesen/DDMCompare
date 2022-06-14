import {TreeNode, TreeRoot, TreeLeaf} from "./NodeLIB.mjs";
import {print, check_type, equal_array} from "./ErrorLIB.mjs"


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



//let reader = new FileReader();
//reader.readAsText("data/pecto-newick-trees/ani.newick.txt")

/** 
 * let tree = new Tree("Root");
tree.fill_tree_newick("(:0.1,:0.2,(:0.3,:0.4):0.5);");
tree.fill_tree_newick("(,,(,),(),,);")
print("")
print(tree.root)
print(tree.root.children)
print(tree.root.children[2].children)
print(tree.root.children[3].children)
print(tree.root.children[0])
//print(tree.root.children[2].distance)
//print(tree.root.children[2].children[1].root_distance)
*/