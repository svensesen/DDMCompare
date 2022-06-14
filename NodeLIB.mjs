import {check_type} from "./ErrorLIB.mjs"
import {Tree} from "./TreeLIB.mjs"


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
const new_root = new TreeRoot();
const node_1 = new TreeNode("node_1", new_root, 1);
const node_2 = new TreeNode("node_2", node_1, 2);

print(node_2.depth)
print(new_root.height)   
print(node_2.root_distance)
*/