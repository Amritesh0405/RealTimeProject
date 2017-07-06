$(document).ready(function () {
    var options = {
        container: "#example",
        height: 500,
        uri: "data/data1.json"
    };
    loadforcecollapseCurvedData(options);
});
function loadforcecollapseCurvedData(options) {
    var current_options = options;
    d3.json(options.uri, function (error, data) {
        current_options.data = formatData(data, options);
    });
}
function formatData(data, options) {
    var verticesObj = {}, finalData = [];
    $.each(data.edges, function (i, d) {
        if(!d.amount){
         d.amount = 0;
        }
     });
    $.each(data.vertices, function (i, d) {
        verticesObj[d.id] = d;
    });
    var amt_range = d3.extent(data.edges, function (d) {
        return d.amount;
    });
    var scale = d3.scale.linear().domain(amt_range).range([1, 10]);
    $.each(data.edges, function (i, d) {
        finalData.push({
            source: verticesObj[d.from],
            target: verticesObj[d.to],
            transaction_count: d.transaction_count,
            risk: parseInt(scale(d.amount)),
            riskActual:d.amount,
            label:d.labelE,
            suspicious:d.suspicious
        });
    });
  for(i=0; i<data.vertices.length; i++){
      if(!data.vertices[i].labelV){
      }
      if(data.vertices[i].labelV){
           console.log('d',data.vertices[i].labelV)
          finalData[i]["labelV"] = data.vertices[i].labelV;
      }
}
   
    forceCollapseCurved(finalData, options);
     
}
function forceCollapseCurved(links, options) {
    var colorScale = d3.scale.category10();
    $(".force_tooltip_curved").remove();
    var tool_tip = $('body').append('<div class="force_tooltip_curved" style="z-index:2000;position: absolute; opacity: 1; pointer-events: none; visibility: hidden;background-color:#0cae96; padding: 10px;border-radius: 5px;border: 1px solid gray;font-size: 10px;color:#000;"><span style=" font-size: 12px; position: absolute; white-space: nowrap;  margin-left: 0px; margin-top: 0px; left: 8px; top: 8px;"><span style="font-size:10px" class="tool_tip_x_val"></span><table><tbody><tr><td style="padding:0"> </td><td style="padding:0"><b>216.4 mm</b></td></tr><tr><td style="color:#434348;padding:0">New York: </td><td style="padding:0"><b>91.2 mm</b></td></tr><tr><td style="color:#90ed7d;padding:0">London: </td><td style="padding:0"><b>52.4 mm</b></td></tr><tr><td style="color:#f7a35c;padding:0">Berlin: </td><td style="padding:0"><b>47.6 mm</b></td></tr></tbody></table></span></div>');

    var markerArr = [];
    $.each(links, function (i, d) {
       
            markerArr.push({risk: d.risk,
                            suspicious:d.suspicious,
                            label:d.label
                            
            });
    });
    var nodes = {};
    // Compute the distinct nodes from the links.
//     $.each(links, function (i, link) {
    links.forEach(function (link) {
        link.source = nodes[link.source.id] || (nodes[link.source.id] = {name: link.source.name, risk: link.risk,riskActual:link.riskActual,transaction_count:link.transaction_count,labelV:link.labelV});
        link.target = nodes[link.target.id] || (nodes[link.target.id] = {name: link.target.name, risk: link.risk,riskActual:link.riskActual,transaction_count:link.transaction_count,labelV:link.labelV});
    });
    var width = $(options.container).width() ? $(options.container).width() : 960,
            height = options.height ? options.height : 500;

    var force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(links)
            .size([width, height])
            .linkDistance(70)
            .charge(-300)
            .on("tick", tick)
            .start();
    /*** Configure zoom behaviour ***/
    var zoomer = d3.behavior.zoom()
            .scaleExtent([0.1, 10])
            //allow 10 times zoom in or out
            .on("zoom", zoom);
    //define the event handler function
    function zoom() {

        svg.attr("transform",
                "translate(" + d3.event.translate + ")"
                + " scale(" + d3.event.scale + ")");
    }

    /*** Configure drag behaviour ***/
    var drag = d3.behavior.drag()
            .origin(function (d) {
                return d;
            }) //center of circle
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended);

    function dragstarted(d) {

        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed("dragging", true);
        force.stop(); //stop ticks while dragging
    }
    function dragged(d) {
        if (d.fixed)
            return; //root is fixed

        //get mouse coordinates relative to the visualization
        //coordinate system:

        var mouse = d3.mouse(svg.node());
        d.x = mouse[0];
        d.y = mouse[1];
        tick();//re-position this node and any links
    }
    function dragended(d) {
        d3.select(this).classed("dragging", false);
        force.resume();
    }
    var mainsvg = d3.select(options.container).append("svg")
            .attr("width", width)
            .attr("height", height).append("g")
            .attr("class", "graph")
            .call(zoomer); //Attach zoom behaviour.
    var rect = mainsvg.append("rect")
            .attr("width", width)
            .attr("height", height).style("fill", "transparent");
    var svg = mainsvg.append("svg:g")
            .attr("class", "plotting-area")

            //.style("fill", "none") 
            //make transparent (vs black if commented-out)
            .style("pointer-events", "all");
    // Per-risk markers, as they don't inherit styles.
    svg.append("defs").selectAll("marker")
            .data(markerArr)
            .enter().append("marker")
//            .attr("markerUnits","userSpaceOnUse")
            .attr("id", function (d) {
                return "marker" + (d.risk);
            })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", function (d) {
                return 15;
            })
            .attr("refY", function (d) {
                return -1 - ((d.risk) / 10);

            })
            .attr("markerWidth", function (d) {
                if ((d.risk) < 5) {
                    return 10 - (2 * (d.risk));
                } else {
                    return 2;
                }
            })
            .attr("markerHeight", function (d) {
                if ((d.risk) < 5) {
                    return 10 - (2 * (d.risk));
                } else {
                    return 2;
                }
            })
            .style("fill", function (d) {
                if (d.suspicious == "true") {
                    return "red" ;
                } else if(d.label =="tx") {
                    return "green";
                } else {
                    return "black" ; 
                }
            })
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
//            .style("fill", function (d) {
//                return colorScale((d.risk));
//            });

    var path = svg.append("g").selectAll("path")
            .data(force.links())
            .enter().append("path")
            .attr("class", function (d) {
                return "link " + d.risk;
            })
            .style("fill", "none")
            .style("stroke", function (d) {
                return colorScale(d.risk);
            })
            .style("stroke", function (d) {
                if (d.suspicious == "true") {
                    return "red" ;
                } else if(d.label =="tx") {
                    return "yellow";
                } else {
                    return "black" ; 
                }
            })
            .style("stroke-width", function (d) {
                return d.risk + 'px';
            })
            .attr("marker-end", function (d) {
                return "url(#" + "marker" + d.risk + ")";
            });
            console.log(force.nodes().length)
    var circle = svg.append("g").selectAll("circle")
            .data(force.nodes())
            .enter().append("circle")
            .attr("r", 6)
            .on("mouseover", function (d) {
                $(".force_tooltip_curved").html('<span>Transaaction Count:  ' + d.transaction_count + '</span><br><span>Amount: '+d.riskActual+'</span>');
                return $(".force_tooltip_curved").css("visibility", "visible");
            })
            .on("mousemove", function () {
                $(".force_tooltip_curved").css("top", (d3.event.pageY - 10) + "px")
                return  $(".force_tooltip_curved").css("left", (d3.event.pageX + 10) + "px");

            })
            .on("mouseout", function () {
                return $(".force_tooltip_curved").css("visibility", "hidden");
            })
            .style("fill", function (d) {
                return colorScale(d.risk);
            })
             .style("fill", function (d) {  
                 console.log("sss",d)
                if (d.labelV == "external") {
                    return "red" ;
                } else if(d.labelV == "organization") {
                    return "purple";
                } else if(d.labelV == "person") {
                    return "orange" ; 
                }
            })
            .style("stroke", "none")
            .call(drag);

    var text = svg.append("g").selectAll("text")
            .data(force.nodes())
            .enter().append("text")
            .attr("x", 8)
            .attr("y", ".31em")
            .text(function (d) {
                return d.name;
            })
            .style("font", "10px sans-serif")
            .style("pointer-events", "none")
            .style(" text-shadow", " 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff");


    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        text.attr("transform", transform);
    }

    function linkArc(d) {
//        console.log("gggg",d)
        var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }
}