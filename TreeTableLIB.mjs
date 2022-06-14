import {Tree} from "./TreeLIB.mjs"
import {check_type} from "./ErrorLIB.mjs"
import {create_base_distance_matrix, create_PGM_tree} from "./ComparingLIB.mjs";

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