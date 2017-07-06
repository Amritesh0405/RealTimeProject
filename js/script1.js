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
    var scale = d3.scaleLinear().domain(amt_range).range([1, 10]);
    finalData.links = [];
    finalData.nodes =[];
    var verticeslinks=[];
    $.each(data.edges, function (i, d) {
        verticeslinks[d.from] = d;
        verticeslinks[d.to] = d;
        finalData.links.push({
            source: d.from,
            target: d.to,
            transaction_count: d.transaction_count,
            risk: parseInt(scale(d.amount)),
            riskActual: d.amount,
              label:d.labelE,
            suspicious:d.suspicious
        });
    });
    $.each(data.vertices, function (i, d) {       
        finalData.nodes.push({
            id: d.id,
            name: d.name,
            lableV:d.labelV,
            transaction_count: verticeslinks[d.id].transaction_count,
            risk: parseInt(scale(verticeslinks[d.id].amount)),
            riskActual: verticeslinks[d.id].amount
        });
    });
//    finalData.nodes = data.vertices;

    forceCollapseCurved(finalData, options);

}
function forceCollapseCurved(data, options) {
    var links = data.links;
    
    var colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    $(".force_tooltip_curved").remove();
    var tool_tip = $('body').append('<div class="force_tooltip_curved" style="z-index:2000;position: absolute; opacity: 1; pointer-events: none; visibility: hidden;background-color:#0cae96; padding: 10px;border-radius: 5px;border: 1px solid gray;font-size: 10px;color:#000;"><span style=" font-size: 12px; position: absolute; white-space: nowrap;  margin-left: 0px; margin-top: 0px; left: 8px; top: 8px;"><span style="font-size:10px" class="tool_tip_x_val"></span><table><tbody><tr><td style="padding:0"> </td><td style="padding:0"><b>216.4 mm</b></td></tr><tr><td style="color:#434348;padding:0">New York: </td><td style="padding:0"><b>91.2 mm</b></td></tr><tr><td style="color:#90ed7d;padding:0">London: </td><td style="padding:0"><b>52.4 mm</b></td></tr><tr><td style="color:#f7a35c;padding:0">Berlin: </td><td style="padding:0"><b>47.6 mm</b></td></tr></tbody></table></span></div>');

    var markerArr = [];
    $.each(links, function (i, d) {
       
             markerArr.push({risk: d.risk,
                            suspicious:d.suspicious,
                            label:d.label,
                            id:i
                            
            });
    });
console.log("sss",links)

    var nodes = data.nodes;


    data.nodes = nodes;
    data.links = links;
   
    var width = $(options.container).width() ? $(options.container).width() : 960,
            height = options.height ? options.height : 500;

    /*** Configure zoom behaviour ***/
    var zoomer = d3.zoom()
            .scaleExtent([1, 10])
            //allow 10 times zoom in or out
            .on("zoom", zoomFn);
    //define the event handler function
    function zoomFn() {
       
        svg.attr("transform", d3.event.transform);
    }

    /*** Configure drag behaviour ***/
    var drag = d3.drag()
            .subject(function (d) {
                return d;
            }) //center of circle
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
//        d3.event.sourceEvent.stopPropagation();
//        d3.select(this).classed("active", true);
//        force.stop(); //stop ticks while dragging
//        simulation.stop();
    }
    function dragged(d) {
        if (d.fixed)
            return; //root is fixed

        //get mouse coordinates relative to the visualization
        //coordinate system:
 d.fx = d3.event.x;
            d.fy = d3.event.y;
        var mouse = d3.mouse(svg.node());
        d.x = mouse[0];
        d.y = mouse[1];
        tick();//re-position this node and any links
    }
    function dragended(d) {
          if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
//        d3.select(this).classed("active", false);
////        force.resume();
//        simulation.restart();

//            if (!d3.event.active) simulation.alphaTarget(0);
//            d.fx = null;
//            d.fy = null;
    }
    var mainsvg = d3.select(options.container).append("svg")
            .attr("width", width)
            .attr("height", height).append("g")
            .attr("class", "graph")
            .call(zoomer); //Attach zoom behaviour.
    var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function (d) {
                return d.id;
            }))
            
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 3, height / 3));

//    var rect = mainsvg.append("rect")
//            .attr("width", width)
//            .attr("height", height).style("fill", "transparent");
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
                return "marker" + (d.risk)+"marker_"+d.id;
            })
                    .attr("class",function(d){
                        return "markerCls_"+d.label;
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
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .style("fill", function (d) {
                if (d.suspicious == "true") {
                    return "red" ;
                } else if(d.label =="tx") {
                    return "green";
                } else {
                    return "black" ; 
                }
            });

    var path = svg.append("g").selectAll(".link")
            .data(data.links)
            .enter().append("path")
            .attr("class", function (d) {
                return "link " + d.risk+" linkCls_"+d.label;
            })
            .style("fill", "none")
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
            .attr("marker-end", function (d,i) {
                return "url(#" + "marker" + d.risk + "marker_"+i+")";
            });

    var circle = svg.append("g").selectAll("circle")
            .data(data.nodes)
            .enter().append("circle")
            .attr("r", 6)
            .on("mouseover", function (d) {
                $(".force_tooltip_curved").html('<span>Transaaction Count:  ' + d.transaction_count + '</span><br><span>Amount: ' + d.riskActual + '</span>');
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
                 console.log("sss",d)
                if (d.lableV == "external") {
                    return "red" ;
                } else if(d.lableV == "organization") {
                    return "purple";
                } else if(d.lableV == "person") {
                    return "orange" ; 
                }else{
                    return "black";
                }
            })
            .style("stroke", "none")
            .call(drag);

    var text = svg.append("g").selectAll("text")
            .data(data.nodes)
            .enter().append("text")
            .attr("x", 8)
            .attr("y", ".31em")
            .text(function (d) {
                return d.name;
            })
            .style("font", "10px sans-serif")
            .style("pointer-events", "none")
            .style(" text-shadow", " 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff");
    simulation
            .nodes(nodes)
            .on("tick", tick);

    simulation.force("link")
            .links(links);

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        text.attr("transform", transform);
    }

    function linkArc(d) {
        var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }
}