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

