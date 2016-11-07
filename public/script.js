var config = {
	host: "localhost",
	prefix: "/",	//this should be the name of the virtual proxy. For example "/nodeexample/"
	port: "4848",	//as of Sense version 2.0 this should be a string not an integer
	isSecure: window.location.protocol === "https:"
};
var app;
var appId="Pokemon new.qvf";
var typeArray;
var matrixArray=[
  {id:"Attack",value:"Attack"},
  {id:"Defense",value:"Defense"},
  {id:"Special attack",value:"Sp. Atk"},
  {id:"Special defense",value:"Sp. Def"},
  {id:"Speed",value:"Speed"},
  {id:"HP",value:"HP"},
]

//connecting to sense surver
require.config( {
	baseUrl: ( config.isSecure ? "https://" : "http://" ) + config.host + (config.port ? ":" + config.port: "") + config.prefix + "resources"
} );

//main logic here
require( ["js/qlik","./public/d3.v3.min.js","./public/senseUtils.js"], function ( qlik ) {
	qlik.setOnError( function ( error ) {
		alert( error.message );
	} );
	app = qlik.openApp(appId, config);
	createDropdownMenu();
	drawGraph();
} );



function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.getElementsByTagName("head")[0].appendChild(link);
}

function createDropdownMenu()
{
	//create x-axis menu
	var xAxisDiv = document.getElementById("x-axis-matrix-div");
	var xAxisList = document.createElement("select");
	xAxisList.id = "x-axis-menu";
	xAxisDiv.appendChild(xAxisList);
	for (var i = 0; i < matrixArray.length; i++) {
	    var option = document.createElement("option");
	    option.value = matrixArray[i].value;
	    option.text = matrixArray[i].id;
	    xAxisList.appendChild(option);
	}
  //create y-axis menu
  var yAxisDiv = document.getElementById("y-axis-matrix-div");
  var yAxisList = document.createElement("select");
  yAxisList.id = "y-axis-menu";
  yAxisDiv.appendChild(yAxisList);
  for (var i = 0; i < matrixArray.length; i++) {
      var option = document.createElement("option");
      option.value = matrixArray[i].value;
      option.text = matrixArray[i].id;
      yAxisList.appendChild(option);
  }
  
	//set default value and redraw function on select event
	$("#x-axis-menu").val('Attack');
  $("#y-axis-menu").val('Defense');
	$("#x-axis-menu,#y-axis-menu").change(function(){
	  drawGraph();
	});

  //create type menu
  var typeDiv = document.getElementById("type-div");
  var typeList = document.createElement("select");
  typeList.id = "type-menu";
  typeDiv.appendChild(typeList);

  var option = document.createElement("option");
  option.value = "All";
  option.text = "All";
  typeList.appendChild(option);

  app.createList({
    "qDef": {
      "qFieldDefs": [
        "Type"
      ]
    },
    "qInitialDataFetch": [{
        qTop : 0,
        qLeft : 0,
        qHeight : 30,
        qWidth : 1
      }]
    }, function(reply) {
      var typeVal;
      if ($('#type-menu').length){
        typeVal=$("#type-menu").val();
        $("#type-menu").remove();
      }
      else{
        typeVal='All';
      }

      var typeDiv = document.getElementById("type-div");
      var typeList = document.createElement("select");
      typeList.id = "type-menu";
      typeDiv.appendChild(typeList);

      var option = document.createElement("option");
      option.value = "All";
      option.text = "All";
      typeList.appendChild(option);

      $.each(reply.qListObject.qDataPages[0].qMatrix, function(key, value) {
        var option = document.createElement("option");
        option.value = value[0].qElemNumber;
        option.text = value[0].qText;
        typeList.appendChild(option);
      });

      $("#type-menu").val(typeVal);
      $("#type-menu").change(function(){
        app.field("Type").clear();
        if($("#type-menu").val()!="All")
        {
          app.field("Type").select([parseInt($("#type-menu").val())], true, true);
        }
      });
    });

}


//redraw function
function drawGraph(){
	var xVal=$("#x-axis-menu").val()
  var yVal=$("#y-axis-menu").val()

	//Create a new hypercube base on xVal and yVal
	var qHyperCubeDef={                
	    qDimensions : [
		    {
		    	qDef : {qFieldDefs : ["logoRef"]}
		    }
	    ],
	    qMeasures : [
		    {
				qDef : {qDef : "Avg(["+xVal+"])"}
			},
			{
				qDef : {qDef : "Avg(["+yVal+"])"}
			},
		    {
				qDef : {qDef : "Name"}
			},
		    {
				qDef : {qDef : "Index"}
			}
		],
    qSuppressZero : true,
    qSuppressMissing : true,
    qInitialDataFetch : [{
        qWidth :5,
        qHeight : 1500
    }]
	}
	app.createCube(qHyperCubeDef, function(reply) {
    //draw graph
		viz($("#pokemonScatter"),reply,90);
    //Append visualization
    console.log(reply);
	});
}



//Graph rendering
var viz = function($element, layout,logoSize) {
	$element.empty();
	var id = senseUtils.setupContainer($element,layout,"scatter"),
	ext_width = $element.width(),
	ext_height = $element.height(),
	classDim = layout.qHyperCube.qDimensionInfo[0].qFallbackTitle.replace(/\s+/g, '-');    

	var data = layout.qHyperCube.qDataPages[0].qMatrix;

	var margin = {top: 50, right: 50, bottom: 50, left: 50 },
	  width = ext_width - margin.left - margin.right,
	  height = ext_height - margin.top - margin.bottom;

	var x = d3.scale.linear()
	  .range([0, width]);
	var y = d3.scale.linear()
	  .range([height, 0]);

	var xMax = d3.max(data, function(d) { return d[1].qNum; })*1.02,
		xMin = d3.min(data, function(d) { return d[1].qNum; })*0.98,
		yMax = d3.max(data, function(d) { return d[2].qNum; })*1.02,
		yMin = d3.min(data, function(d) { return d[2].qNum; })*0.98;
    
    var xMin2 = xMin == xMax ? xMin*0.5 : xMin;
    var xMax2 = xMin == xMax ? xMax*1.5 : xMax;
    var yMin2 = yMin == yMax ? yMin*0.5 : yMin;
    var yMax2 = yMin == yMax ? yMax*1.5 : yMax;
   
     x.domain([xMin2, xMax2]).nice();
     y.domain([yMin2, yMax2]).nice();    
   
  var color = d3.scale.category20();

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickSize(-height)
      .tickFormat(d3.format(".2s")); 

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")  
      .tickSize(-width)       
      .tickFormat(d3.format(".2s"));

  var zoomBeh = d3.behavior.zoom()
      .x(x)
      .y(y)
      .scaleExtent([0, 500])
      .on("zoom", zoom);

  var svg = d3.select("#" + id)    
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")") 
     .call(zoomBeh);

  svg.append("rect")
    .attr("width", width)
    .attr("height", height);

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", margin.bottom - 10)
    .style("text-anchor", "end")
    .text(senseUtils.getMeasureLabel(1,layout));

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text(senseUtils.getMeasureLabel(2,layout));  

  var plot = svg.append("svg")
    .classed("objects", true)
      .attr("width", width)
      .attr("height", height);  


    plot.selectAll(".dot")
        .data(data)
        .enter().append("svg:image")
        .attr("width", logoSize)
        .attr("height", logoSize)
        .attr("xlink:href", function(d) {return d[0].qText;})
        .attr("class", "dot "+classDim)
        .attr("transform", transform)
        .attr("id", function(d) { return d[0].qText.replace(/[^A-Z0-9]+/ig, "-"); })
        //.attr("cx", function(d) { return x(d.measure(1).qNum); })
        //.attr("cy", function(d) { return y(d.measure(2).qNum); })
        .style("fill", function(d) { return color(d[0].qText); })
        .on("mouseover", function(d){
          d3.selectAll($("."+classDim+"#"+d[0].qText.replace(/[^A-Z0-9]+/ig, "-"))).classed("highlight",true);
              d3.selectAll($("."+classDim+"[id!="+d[0].qText.replace(/[^A-Z0-9]+/ig, "-")+"]")).classed("dim",true);
          })
          .on("mouseout", function(d){
              d3.selectAll($("."+classDim+"#"+d[0].qText.replace(/[^A-Z0-9]+/ig, "-"))).classed("highlight",false);
              d3.selectAll($("."+classDim+"[id!="+d[0].qText.replace(/[^A-Z0-9]+/ig, "-")+"]")).classed("dim",false);
          })
            .append("title")
            .html(function(d) {
              var tempHtml=senseUtils.getDimLabel(1,layout) + ": " + d[0].qText;
              for(i=1;i<=layout.qHyperCube.qMeasureInfo.length;i++) {
                tempHtml += "<br/>" + senseUtils.getMeasureLabel(i,layout) + ": " + d[i].qText;
              }
              return tempHtml;
            });
    
    d3.select("input").on("click", change);

    function change() {
      var xMax3 = d3.max(data, function(d) { return d[1].qNum; })*1.02;
      var xMin3 = d3.min(data, function(d) { return d[1].qNum; })*0.98;
      var yMax3 = d3.max(data, function(d) { return d[2].qNum; })*1.02;
      var yMin3 = d3.min(data, function(d) { return d[2].qNum; })*0.98;

      
      zoomBeh
        .x(x.domain([xMin3, xMax3]).nice())
        .y(y.domain([yMin3, yMax3]).nice());

      var svg = d3.select("#" + id).transition();

      svg.select(".x.axis").duration(750).call(xAxis).select(".label").text(senseUtils.getMeasureLabel(1,layout));
      svg.select(".y.axis").duration(750).call(yAxis).select(".label").text(senseUtils.getMeasureLabel(2,layout));

      plot.selectAll(".dot").transition().duration(1000).attr("transform", transform);
    }

    function zoom() {
      svg.select(".x.axis").call(xAxis);
      svg.select(".y.axis").call(yAxis);

      svg.selectAll(".dot")
          .attr("transform", transform);
    }

    function transform(d) {    
      
      return "translate(" + x(d[1].qNum) + "," + y(d[2].qNum) + ")";

    }
}