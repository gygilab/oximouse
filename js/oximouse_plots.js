//Oximouse js fnxns
/// @author Devin K Schweppe
/// All rights reserved, 2019
/// Authors, Gygi Lab, President and Fellows of Harvard University
///

/**
 * Plot new heatmap
 * @param plotId
 * @param x
 * @param y
 * @param z
 * @param color
 * @returns
 */
function NewHeatmap(plotId,x,y,z,color = 'Hot',margins = [55,50,55,30],minMax = [0,100], ylab = "Protein Sequence Position", xlab = "Tissue", colorTitle = "% Occupancy"){
	var heatmapData = [{
		x: x,
		y: y,
		z: z,
	  	type: 'heatmap',
	  	colorscale: color,
	  	colorbar: {
	  		title: colorTitle,
	  		len: 0.5,
	  	},
	  	zmin: minMax[0],
	  	zmax: minMax[1]
	}];
	var config = { displayModeBar: true, displaylogo: false, showTips: false, responsive: true};
	var heatmapLayout = {
		height: 800,
		margin: {
			l: margins[0],
			r: margins[1],
			b: margins[2],
			t: margins[3]
		},
		xaxis: {
			title: {
				text: xlab,
			}
		},
		yaxis: {
			title: {
				text: ylab,
			}
		}
	};

	Plotly.newPlot(plotId, heatmapData,heatmapLayout,config);
}
/**
 * Add listener to update text from plotly plot
 * @param plotId
 * @param updateId
 * @returns
 */
function PlotListener(plotId,updateId, headerArray, dataArray, errorArray, siteArray, subset = false, reOrder= false){
	var heatmapPlot = document.getElementById(plotId),
		d3 = Plotly.d3,
		N = 100,
		x = d3.range(N),
		y = d3.range(N).map( d3.random.normal() ),
		data = [ { x:x, y:y, type:'heatmap', name:'Hovers',
			mode:'markers', marker:{size:10} }];
		layout = {
			hovermode:'closest',
			yaxis: {range:[0.15, 1],},
			title:'Hover on Points'
	};
	
	heatmapPlot.on('plotly_click', function(data){
		let infotext = data.points.map(function(d){
			let sitePosition = d.pointNumber[0] + 1;
		    if(typeof errorArray !== "undefined" && (siteArray.includes(sitePosition) || subset)){
			    var el = $('#' + updateId);
			    el.empty();
			    el.append(jsonToTable({"Mod": "Cys-Oxidation","Site": d.y}));
		    	var error;
		    	if(reOrder){
		    		let orderedValues = headerArray.map((b,i)=> [ b, dataArray[i]]).sort(function(a,b) { return a[0] > b[0] ? 1 : -1 }).map(b=>b[1]);
		    	}
		    	if(subset){
			    	error = errorArray[d.pointNumber[0]];
			    	if(typeof currentSite !== "undefined"){
				    	currentSite = sitePositions[d.pointNumber[0]];
			    	}
		    	} else {
		    		error = errorArray[siteArray.indexOf(sitePosition)];
			    	if(typeof currentSite !== "undefined"){
				    	currentSite = d.pointNumber[0] + 1;
			    	}
		    	}
		    	PlotlyBar('siteQuantPlot', headerArray, dataArray[d.pointNumber[0]], d.pointNumber[1],error);
		    }
		});
	});
}

/**
 * Plot a barplot with plotly
 * @param targetDiv
 * @param xvals
 * @param yvals
 * @param targetX
 * @param yerror
 * @returns
 */
function PlotlyBar(targetDiv,xvals,yvals,targetX = 0,yerror, yaxTitle = "% Occupancy"){
	var trace = [{
		name: 'Quant',
		x: xvals,
		y: yvals,
		error_y: {
			type: 'data',
		      array: yerror,
		      visible: true
		},
		type: 'bar',
		hoverinfo: 'x+y',
		marker: {
			showscale: false,
			color: xvals.map(b=> (b == xvals[targetX]) * 1),
			colorscale: [[0,"Gainsboro"],[0.5,"Gainsboro"],[0.5,"rgb(101,115,126)"],[1,"rgb(101,115,126)"]],
			colorbar: {
				title: xvals[targetX],
				tickvals: [0.25,0.75],
			},
			line: {
				color: "black",
				width: 1,
			}
		},
	}];
	var layout = {
		paper_bgcolor: 'white',
		plot_bgcolor: 'white' ,
		xaxis:{
			fixedrange: false,
			showticklabels: true,
			showgrid: false,
			zeroline: true,
			showline: false,
		},
		yaxis:{
			title: yaxTitle,
			hoverformat: '.2r',
			fixedrange: true,
			showticklabels: true,
			showgrid: false,
			zeroline: true,
			showline: true,
		},
		margin: {
			l: 50,
			r: 5,
			b: 120,
			t: 5,
			pad: 5
		},
	};
	var config = { displayModeBar: true, displaylogo: false, showTips: false, responsive: true};
	Plotly.newPlot(targetDiv, trace, layout, config);
}