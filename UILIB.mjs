import {subtract_matrixes, sortLowHigh, removeNull} from "./ComparingLIB.mjs"
import {TreeTable} from "./TreeTableLIB.mjs"
import {Vis} from "./VisLIB.mjs"
   
const fileInput = document.querySelector("input[type='file']"); //the button that will be used to confirm the file selection
fileInput.addEventListener("change", fileInputChange);

const fileLoaderButton = document.getElementById("fileLoaderButton"); //the button that loads the file selection
fileLoaderButton.addEventListener("click", fileInputAccept);
fileLoaderButton.disabled = true;

const stringInput = document.getElementById("stringInput"); //the field where you can put in the newick string of a tree
stringInput.addEventListener("change", stringInputChange);

const stringLoaderButton = document.getElementById("stringLoaderButton"); //the button that loads the input string
stringLoaderButton.addEventListener("click", stringInputAccept);
stringLoaderButton.disabled = true;

const sortingDropDown = document.getElementById("sortingDropDown"); //the drop down menu to determine the sorting

const absoluteCheckbox = document.getElementById("absoluteCheckbox"); //the checkbox of wether or not the difference should be absolute
absoluteCheckbox.addEventListener("change", absoluteCheckboxChange);

const typeDropDown = document.getElementById("typeDropDown"); //the type of distance difference matrix which will be created

const nullCheckbox = document.getElementById("nullCheckbox"); //the checkbox for determining if null values should be kept

const threeColorDropDown = document.getElementById("threeColorDropDown"); //the drop down menu for the three color schemes (no absolutes)

const twoColorDropDown = document.getElementById("twoColorDropDown"); //the drop down menu for the two color schemes (absolute distances)

const fancyCheckBox = document.getElementById("fancyCheckbox"); //the checkbox for determining if the 'fancy' matrix should be used

const nodeLabelsCheckbox = document.getElementById("nodeLabelsCheckbox"); //the checkbox for determining if the nodes should have their names displayed

const explanation = document.getElementById("explanation");
explanation.style.display = "none";

const disclaimer = document.getElementById("disclaimer");
disclaimer.style.display = "none";

let testButton = document.getElementById("testButton");
testButton.addEventListener("click", generate);



/**
 * What happens when the file loader button is pressed
 * @param {Node} e the pressed button
 */
function fileInputAccept(e) {
    const selected_files = fileInput.files;
    if (selected_files) { //If any files are selected
        for (var i = 0; i<selected_files.length; i++) { //Load each file and create a new tree table
            let tree_table_name = selected_files[i].name;
            tree_table_name = tree_table_name.slice(0, tree_table_name.length - 4);

            let tree_table = new TreeTable(tree_table_name);
            tree_table.create_tree_newick_file(selected_files[i]);
        }
    } 
    update_LoadedTrees()  //Updates the section showing the loaded trees
}

/**
 * What happens when the string loader button is pressed
 * @param {Node} e the pressed button
 */
function stringInputAccept(e) {
    const newick_string = stringInput.value;
    if (newick_string) { //If the is input filed
        //creates a non-duplicate custom name
        let tree_table_name = "custom tree";
        let tree_table_names = [];
        for (let i = 0; i < TreeTable.instances.length; i++) {
            tree_table_names.push(TreeTable.instances[i].name);
        }
        let counter = 1;
        while (tree_table_names.includes(tree_table_name)) {
            tree_table_name = `custom tree (${counter})`;
            counter += 1;
        }

        let tree_table = new TreeTable(tree_table_name);
        tree_table.create_tree_newick_string(newick_string);
    }
    update_LoadedTrees()  //Updates the section showing the loaded trees
}

function update_LoadedTrees() {
    const loadedTrees = document.getElementById("loadedTrees");
    while(loadedTrees.firstChild) {loadedTrees.removeChild(loadedTrees.firstChild)} //empty the loaded trees section

    for (let tree_table of TreeTable.instances) { //for each loaded tree table
        const subLoadedTrees = document.createElement("div"); //a subgroup containing one loaded tree table information
        subLoadedTrees.treeTable = tree_table;
        loadedTrees.appendChild(subLoadedTrees);

        const nameDisplay = document.createElement("p"); //displays the name of the tree table
        nameDisplay.setAttribute("style", "display:inline")
        nameDisplay.innerHTML = tree_table.name
        subLoadedTrees.appendChild(nameDisplay);
        subLoadedTrees.nameDisplay = nameDisplay;

        const checkBox = document.createElement("INPUT"); //determines if this tree will be used for the visualization
        checkBox.setAttribute("type", "checkbox");
        subLoadedTrees.appendChild(checkBox);
        subLoadedTrees.checkBox = checkBox;

        const nameChanger = document.createElement("button"); //the name change button
        nameChanger.setAttribute("style", "display:inline")
        nameChanger.innerHTML = "Change name";
       
        nameChanger.addEventListener("click", function(e) { //when the name change button is pressed
            if (this.parentNode.inputChanger.style.display == "none") { //if not currently changing the name
                this.parentNode.nameDisplay.innerHTML = this.parentNode.nameDisplay.innerHTML.replace(
                    this.parentNode.nameDisplay.innerHTML.substring(0, this.parentNode.treeTable.name.length), "");
                this.innerHTML = "Confirm";
                
                this.parentNode.inputChanger.value = this.parentNode.treeTable.name;
                this.parentNode.inputChanger.style.display = "inline";

                this.parentNode.cancelChanger.style.display = "inline";
                this.parentNode.checkBox.style.display = "none"
            }

            else { // if currently changing the name
                this.parentNode.treeTable.set_name(this.parentNode.inputChanger.value)

                this.innerHTML = "Change name"
                this.parentNode.inputChanger.style.display = "none"
                this.parentNode.nameDisplay.innerHTML = this.parentNode.treeTable.name + "  ";
                this.parentNode.cancelChanger.style.display = "none";
                this.parentNode.checkBox.style.display = "inline"
            }
        });
        subLoadedTrees.appendChild(nameChanger);
        subLoadedTrees.nameChanger = nameChanger;

        const inputChanger = document.createElement("INPUT"); //field to input the new name
        inputChanger.style.display = "none";
        subLoadedTrees.insertBefore(inputChanger, nameChanger);
        subLoadedTrees.inputChanger = inputChanger;

        const cancelChanger = document.createElement("button"); //cancel button
        cancelChanger.innerHTML = "Cancel"
        cancelChanger.style.display = "none";
        cancelChanger.addEventListener("click", function(e) {
            this.parentNode.nameChanger.innerHTML = "Change name"
            this.parentNode.inputChanger.style.display = "none"
            this.parentNode.nameDisplay.innerHTML = this.parentNode.treeTable.name + "  ";
            this.style.display = "none";
        })
        subLoadedTrees.insertAfter(cancelChanger, nameChanger);
        subLoadedTrees.cancelChanger = cancelChanger;
    }
}

/**
 * Handles what happens when a change in the fileInput occurs
 * @param {Node} e the fileInput
 */
function fileInputChange(e) {
    const selectedFile = this.files[0];
    if (selectedFile){fileLoaderButton.disabled = false;}
    else {fileLoaderButton.disabled = true;}
}

/**
 * Handles what happens when a change in the stringInput occurs
 * @param {Node} e the stringInput
 */
function stringInputChange(e) {
    const input = this.value;
    if (input){stringLoaderButton.disabled = false;}
    else {stringLoaderButton.disabled = true;}
}

/**
 * Handles what happens when a change in the absoluteCheckbox occurs
 * @param {Node} e the absoluteCheckbox
 */
function absoluteCheckboxChange(e) {
    if (this.checked) {
        threeColorDropDown.style.display = "none";
        twoColorDropDown.style.display = "inline";
    }

    else {
        threeColorDropDown.style.display = "inline";
        twoColorDropDown.style.display = "none";
    }
}


/**
 * Generates a visualization set
 * @param {*} e 
 */
export function generate(e) {
    console.time
    emptyVisualization();

    const loadedTrees = document.getElementById("loadedTrees");
    const used_tree_tables = [] //will contain all marked trees
    for (let subLoadedTrees of loadedTrees.childNodes) { 
        if (subLoadedTrees.checkBox.checked == true) {
            used_tree_tables.push(subLoadedTrees.treeTable)
        }
    }

    if (used_tree_tables.length < 2) { //if no two are selected, take upper two (mostly for testing convenience)
        used_tree_tables[0] = TreeTable.instances[0];
        used_tree_tables[1] = TreeTable.instances[1];
    }

    //the first displayed tree and its distance matrix
    console.time("process tree 1")
    const tree_table1 = used_tree_tables[0];
    const [distance_matrix1, distance_matrix_label1] = createDistanceMatrix(tree_table1);
    console.timeEnd("process tree 1")

    //the second displayed tree and its distance matrix
    console.time("process tree 2")
    const tree_table2 = used_tree_tables[1];
    const [distance_matrix2, distance_matrix_label2] = createDistanceMatrix(tree_table2);
    console.timeEnd("process tree 2")

    //creates the difference difference matrix (DDM)
    console.time("subtract DM")
    let [result_matrix, result_matrix_label] = subtract_matrixes(distance_matrix1, distance_matrix_label1, distance_matrix2, distance_matrix_label2, absoluteCheckbox.checked);
    console.timeEnd("subtract DM")
    
    if(!nullCheckbox.checked) {
        [result_matrix, result_matrix_label] = removeNull(result_matrix, result_matrix_label);
    }

    if (["quadratic", "quadratic_distance"].includes(typeDropDown.value)) {
        result_matrix = result_matrix.map(row => row.map(element => (element < 0 ? -Math.pow(element,2) : Math.pow(element,2))))
    }

    //changes the ordering of the DDM if asked for
    console.time("sorting DM")
    let [final_matrix, final_matrix_label] = sortMatrix(result_matrix, result_matrix_label);
    console.timeEnd("sorting DM")
    
    const [base_color, mark_color] = getMatrixColors(); //the base color of the matrix and the color used when a cell is marked

    const size = Math.min(screen.height*0.8, screen.width*0.32) //size of one field
    let vision = new Vis(); //the overarching visualization class
    
    console.time("visualize tree 1")
    vision.create_tree(tree_table1.tree, "#matrix00", size, size, {top: size*0, right: size*0, bottom: size*0, left: size*0}, nodeLabelsCheckbox.checked);
    console.timeEnd("visualize tree 1")

    console.time("visualize matrix")
    vision.create_matrix(final_matrix, final_matrix_label, "#matrix01", size, size, 
    {top: size*0, right: size*0, bottom: size*0, left: size*0}, base_color, mark_color, fancyCheckBox.checked);
    console.timeEnd("visualize matrix")

    console.time("visualize tree 2")
    vision.create_tree(tree_table2.tree, "#matrix02", size, size, {top: size*0, right: size*0, bottom: size*0, left: size*0}, nodeLabelsCheckbox.checked);
    console.timeEnd("visualize tree 2")

    //below implements the search function
    vision.labels = final_matrix_label;
    addSearcher(vision);
}

Element.prototype.insertAfter = function(A, B)  { //ease of use addition
    this.insertBefore(A, B.nextSibling);
}

/**
 * Empties the elements used for displaying the visualizations
 */
function emptyVisualization() {
    document.getElementById("matrix00").innerHTML = "";
    document.getElementById("matrix01").innerHTML = "";
    document.getElementById("matrix02").innerHTML = "";
    document.getElementById("matrix10").innerHTML = "";
    document.getElementById("matrix11").innerHTML = "";
    document.getElementById("matrix12").innerHTML = "";
    document.getElementById("searcher").innerHTML = "";
}

/**
 * creates (if required) and returns the distance matrix for the current setting
 * @param {TreeTable} tree_table the TreeTable for which the distance matrixes are created
 * @param {String} type the type of matrix to create (by default take from the type drop down)
 * @returns the created distance matrix and distance matrix label
 */
function createDistanceMatrix(tree_table, type = typeDropDown.value) {
    switch(type) {
        case "basic":
            if (!tree_table.false_base_distance_matrix) { tree_table.create_base_distance_matrix_from_tree(false); }
            return [tree_table.false_base_distance_matrix, tree_table.false_base_distance_matrix_label];
        
        case "basic_distance":
            if (!tree_table.true_base_distance_matrix) { tree_table.create_base_distance_matrix_from_tree(true); }
            return [tree_table.true_base_distance_matrix, tree_table.true_base_distance_matrix_label];

        case "quadratic":
            if (!tree_table.false_base_distance_matrix) { tree_table.create_base_distance_matrix_from_tree(false); }
            return [tree_table.false_base_distance_matrix, tree_table.false_base_distance_matrix_label];

        case "quadratic_distance":
            if (!tree_table.true_base_distance_matrix) { tree_table.create_base_distance_matrix_from_tree(true); }
            return [tree_table.true_base_distance_matrix, tree_table.true_base_distance_matrix_label];
        
        case "min_PGM":
            if (!tree_table.min_PGM_distance_matrix) { tree_table.create_PGM_distance_matrix_from_tree("min"); }
            return [tree_table.min_PGM_distance_matrix, tree_table.min_PGM_distance_matrix_label];

        case "max_PGM":
            if (!tree_table.max_PGM_distance_matrix) { tree_table.create_PGM_distance_matrix_from_tree("max"); }
            return [tree_table.max_PGM_distance_matrix, tree_table.max_PGM_distance_matrix_label];

        case "average_PGM":
            if (!tree_table.average_PGM_distance_matrix) { tree_table.create_PGM_distance_matrix_from_tree("average"); }
            return [tree_table.average_PGM_distance_matrix, tree_table.average_PGM_distance_matrix_label];
        
        default:
            throw Error("incorrect distance matrix type")
    }
}

/**
 * Sorts and returns the given matrix in one of various ways
 * @param {Array.<Object>} matrix the matrix to be sorted
 * @param {Array.<String>} matrix_label the matrix label belonging to the matrix
 * @param {*} type the type of sorting (by default the value of the sorting drop down)
 * @returns 
 */
function sortMatrix (matrix, matrix_label, type = sortingDropDown.value) {
    disclaimer.style.display = "none";
    switch (type) {
        case "default":
            return [matrix, matrix_label];
        
        case "seriation":
            disclaimer.style.display = "inline";
            return [matrix, matrix_label];

        case "low-high":
            return sortLowHigh(matrix, matrix_label);

        case "high-low":
            return sortLowHigh(matrix, matrix_label, true);
        
        default:
            throw Error("incorrect matrix sort type")
    }
}

/**
 * Looks at the absolute differences checkbox and the color selection check box to get tha matrix colors
 * @returns a array containing the base_color array and the mark_color array
 */
function getMatrixColors() {
    if(!absoluteCheckbox.checked) {
        explanation.style.display = "inline";
        switch (threeColorDropDown.value) {
            case "temperature": 
                return [['#2b83ba','#ffffbf','#d7191c'], ['#d47c45','#000040','#28e6e3']];
            
            case "aqua-brown": 
                return [['#018571','#f5f5f5','#a6611a'],["#fe7a8e",'#0a0a0a','#599ee5']];

            case "pink-green":
                return [['#4dac26','#f7f7f7','#d01c8b'],['#b253d9','#080808','	#2fe374']];

            case "purple-orange": 
                return [['#5e3c99','#f7f7f7','#e66101'],['#a1c366','#080808','	#199efe']];
            
            default:
                throw Error("Incorrect color value")         
        }
    }

    else {
        explanation.style.display = "none";
        switch (twoColorDropDown.value) {        
            case "white-black":
                return [["#f7f7f7", "#252525"],["#000064", "#00ffff"]];
            
            case "orange":
                return [["#feedde", "#a63603"],["#000064", "#00ffff"]];

            case "blue":
                return [["#00ffff", "#000064"],["#a63603", "#feedde"]];
            
            case "green":
                return[["#edf8e9", "#006d2c"],["#000064", "#ff92d3"]];
            
            default:
                throw Error("Incorrect color value")  
        }
    }
}

/**
 * Adds the searcher function to the bottom of the page
 * @param {Vis} visualization the Vis which the searcher links to
 */
function addSearcher(visualization) {
    const searcher = document.getElementById("searcher");

    const nameSearchInput = document.createElement("INPUT"); //the field in which you can fill in the searched for node
    nameSearchInput.addEventListener("input", function(e) {this.style.color = d3.color("black");})
    searcher.appendChild(nameSearchInput);
    
    const nameSearchButton = document.createElement("button"); //the button that activates the search
    nameSearchButton.innerHTML = "Search for Node";
    nameSearchButton.addEventListener("click", function(e) {
        const objective = nameSearchInput.value;
        if (visualization.labels.includes(objective)) {
            nameSearchInput.value = "";
            for (let svg of visualization.trees) {
                visualization.mark_tree(svg, [objective])
            }

            for (let svg of visualization.matrixes) {
                visualization.mark_matrix(svg, [objective])
            }
        }

        else {
            nameSearchInput.style.color = d3.color("red");
        }
    }) 
    searcher.appendChild(nameSearchButton);
}