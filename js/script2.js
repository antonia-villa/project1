
function causeVisual(){

// Append Sub-Heading
	document.getElementById('subHeading').innerHTML = "From 1999 through 2015";

  //Reformat Data
	var children = [];
	for( keys in causeData){
  	var child = {
  		'cause': keys,
  		'total': (causeData[keys]/1000)
  		}
	  	if(child.cause != 'All Causes'){
			children.push(child);
		}
	}

	// Create Tree Structure
	var tree = {
	    cause: "tree",
	    children: children
	};

	var width = 900,
	    height = 600,
	    color = d3.scale.category20c(),
	    div = d3.select("body")
	    		.append("div")
	    		.attr("id", "causeVisual")
	       		.style("position", "relative");

	var treemap = d3.layout.treemap()
	    .size([width, height])
	    .sticky(true)
	    .value(function(d) { return d.total; });
	 
	var node = div.datum(tree)
			.selectAll(".node")
	      	.data(treemap.nodes)
	    	.enter()
	    	.append("div")
	      	.attr("class", "node")
	      	.attr("id", function(d) { return d.cause; })
	      	.call(position)
	      	.style("background-color", function(d) {
	          return d.cause == 'tree' ? '#fff' : color(d.cause); })
	      	.append('div')
	      	.style("font-size", function(d) {
	          // compute font size based on sqrt(area)
	          return Math.max(8, 0.18*Math.sqrt(d.area))+'px'; })
	      	.text(function(d) { return d.children ? null : d.cause; })
	      	.style("text-align", "center");;

}

// To set positions for main style 
function position() {
  this.style("left", function(d) { return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
}

// 

function nodeClicked() {
	console.log('click');


	// Retrieve Data set based on cause clicked
	var cause = this.id
	var data = stateCauseData(cause);
	console.log(data);

	// Hide Previous Data Visual
	document.getElementById('causeVisual').style.display = 'none';
	document.getElementById('visualHeading').innerHTML = "Cause of Death " + cause;
	document.getElementById('subHeading').innerHTML = "By State and Year";

	// var margin = {top: 20, right: 20, bottom: 70, left: 40};

	// var width = 1000 - margin.left - margin.right,
 //    	height = 500 - margin.top - margin.bottom;


	var margin = {top: 20, right: 160, bottom: 60, left: 40};

	var width = 1000 - margin.left - margin.right,
    	height = 600 - margin.top - margin.bottom;

	var svg = d3
	  .select("body")
	  .append("svg")
	  .attr("id", "stateCauseVisual")
	  .attr("width", width + margin.left + margin.right)
	  .attr("height", height + margin.top + margin.bottom+100)
	  .append("g")
	  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	// Sort years

	// var sortedYears = years.sort(function(a, b) {
 //  		return a - b;
	// });
	// console.log(sortedYears);

	years.sort(function(a, b) {
  		return a - b;
	});
	console.log(years);

// [1, 2, 3, 4, 5]


	  // Transpose the data into layers
	var dataset = d3.layout.stack()(years.map(function(year) {
  		return data.map(function(d) {
    		return {x: d.state, y: +d[year]/d.total, z: year};
 		});
	}));

	console.log(dataset);

	// Set x, y and colors
	var x = d3.scale.ordinal()
	  .domain(dataset[0].map(function(d) { return d.x; }))
	  .rangeRoundBands([0, width], .05)

	var y = d3.scale.linear()
	  .domain([0, d3.max(dataset, function(d) {  return d3.max(d, function(d) { return d.y0 + d.y; });  })])
	  .range([height, 0]);

	var colors  = randomColor({
   		count: years.length,
   		hue: 'blue'
	});

	var formatPercent = d3.format(".00%");

	// Define and draw axes
	var yAxis = d3.svg.axis()
	  .scale(y)
	  .orient("left")
	  .ticks(5)
	  .tickSize(-width, 0, 0)
	  .tickFormat(formatPercent);

	var xAxis = d3.svg.axis()
	  .scale(x)
	  .orient("bottom")
	  .tickSize(4, 2, 0)

	svg.append("g")
	  .attr("class", "y axis")
	  .call(yAxis);

	svg.append("g")
	  .attr("class", "x axis")
	  .attr("transform", "translate(18," + height + ")")
	  .call(xAxis)      
	  .selectAll("text")
	  .style("text-anchor", "end")
	  .attr("dx", "-.8em")
	  .attr("dy", "-1.55em")
	  .attr("transform", "rotate(-90)" );

	// Create groups for each series, rects for each segment 
	var groups = svg.selectAll("g.total")
	  .data(dataset)
	  .enter().append("g")
	  .attr("class", "total")
	  .style("fill", function(d, i) { return colors[i]; });

	var rect = groups.selectAll("rect")
	  .data(function(d) { return d; })
	  .enter()
	  .append("rect")
	  .attr("x", function(d) { return x(d.x); })
	  .attr("y", function(d) { return y(d.y0 + d.y); })
	  .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
	  .attr("width", x.rangeBand())
	  .on("mouseover", function() { tooltip.style("display", null); })
	  .on("mouseout", function() { tooltip.style("display", "none"); })
	  .on("mousemove", function(d) {
	    var xPosition = d3.mouse(this)[0] - 15;
	    var yPosition = d3.mouse(this)[1] - 25;
	    tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
	    tooltip.select("text").html("Year: " + d.z + "  " + (d.y*100).toFixed(2)+ " %");
	  	tooltip.select("text").attr("data-html", "true")
	  });

	  // Draw legend
	var legend = svg.selectAll(".legend")
	  .data(colors)
	  .enter()
	  .append("g")
	  .attr("class", "legend")
	  .attr("transform", function(d, i) { return "translate(30," + i * 19 + ")"; });
	 
	legend.append("rect")
	  .attr("x", width - 18)
	  .attr("width", 18)
	  .attr("height", 18)
	  .style("fill", function(d, i) {return colors.slice().reverse()[i];});
	 
	legend.append("text")
	  .attr("x", width + 5)
	  .attr("y", 9)
	  .attr("dy", ".35em")
	  .style("text-anchor", "start")
	  .text(function(d, i) { 
	  		return years[i];
	  	});

	    // Prep the tooltip bits, initial display is hidden
		var tooltip = svg.append("g")
		  .attr("class", "tooltip")
		  .style("display", "none");
		    
		tooltip.append("rect")
		  .attr("width", 30)
		  .attr("height", 20)
		  .attr("fill", "white")
		  .style("opacity", 0.5);

		tooltip.append("text")
		  .attr("x",15)
		  .attr("dy", "1.2em")
		  .style("text-anchor", "middle")
		  .attr("font-size", "12px")
		  .attr("font-weight", "bold");

}


function addCauseEventListeners() {
	var causes = document.querySelectorAll('.node');

	for(var i =0; i < causes.length; i++){
		causes[i].addEventListener('click', nodeClicked);
	}
}






