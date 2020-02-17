//Oximouse js fnxns
/**
 * The Oximouse website is licensed under the CC BY 4.0 license: https://creativecommons.org/licenses/by/4.0/
 * @author Devin Schweppe <devin_schweppe@hms.harvard.edu>
 */

/**
 * Consume new graph data, generate heatmap and listener
 * @param newDataSource
 * @returns
 */
function ConsumeGraphData(newDataSource){
    var communities; var communityNumbers;
    d3.tsv(newDataSource).then(function(value) {
    	//prep data
    	var tempCommunities = Array.from(value);
    	communities = Array.from({length: tempCommunities.length}, () => Array());
	    var communityNumbers = Array();//this is (cluster.num - 1)
	    communityKeys = Object.keys(tempCommunities[0]); 
	    delete communityKeys[0]; //remove cluster_no
	    for(community in tempCommunities){
	    	communityNumbers.push(tempCommunities[community].cluster_no);
	    	for(comm in communityKeys){
	    		if(communityKeys[comm] !== "cluster_no"){
	    			//convert to numeric
	    			communities[community][comm] = +tempCommunities[community][communityKeys[comm]];
	    		} 
	    	}
	    }
	    //plot
	    NewHeatmap("communityHeatmap",communityKeys,communityNumbers,communities,communitiesColors,[55,50,150,30],[0,100],"BioPlex 2.0 Community", "Tissue_AgeGroup", "% of community");
	    GraphListener('communityHeatmap','graphDescription','graphPlot');
	    updateTissueGraphDropdown(communityKeys);
	    cytoscape.warnings(false);
    });
}

$("#communitySearchInput").keypress(function(e) {
	if(e.keyCode==13){
		SearchCommunities(document.getElementById('communitySearchInput').value);
	}
});

/**
 * 
 * @param stringArray
 * @param targetDiv
 * @returns
 */
function updateTissueGraphDropdown(stringArray,targetDiv = "graphTissueDropdown"){
	for(var item in stringArray){
		var newA = document.createElement("a");
		newA.className = "dropdown-item";
		newA.href = "#";
		newA.setAttribute("onClick","GenerateNewGraph('graphPlot','graphDescription', currentCommunity ,'" + stringArray[item] + "');");
		newA.innerHTML = stringArray[item];
		document.getElementById(targetDiv).appendChild(newA);
	}
}

/**
 * Search for a symbol or geneID
 * @param query
 * @param focus
 * @returns
 */
function SearchCommunities(query, focus = true){
	if(typeof communityAnnotation == "undefined"){
		DisplayModalDiv("","#dataLoadingModal");
	}
	var community;
	if(isNaN(parseInt(query))){
		community = communityAnnotation.filter(b=>b.Symbol.toUpperCase() == query.toUpperCase());
	} else {
		community = communityAnnotation.filter(b=>b.GeneID == parseInt(query));
	}
	
	if(community.length < 1){
		DisplayModalDiv(query);
		return false;
	}
	
	GenerateNewGraph('graphPlot', 'graphDescription', community[0]["Cluster.Number"], 'subQ_young');
}

var interactionData;
/**
 * Import interaction nodes/edge data from file
 * ImportInteractionData("data/combinedInteractionList_032019.tsv")
 * @param newDataSource
 * @returns
 */
function ImportInteractionData(newDataSource){
    if(typeof interactionData !== "undefined"){
    	return false;
    }
    d3.tsv(newDataSource).then(function(value) {
    	interactionData = value;
    });
    return true;
}

var communityAnnotation; var groupedClusterAnnotation;
/**
 * Import community annotations
 * ImportCommunityAnnotations("data/huttlin2017_communities.tsv")
 * @param newDataSource
 * @returns
 */
function ImportCommunityAnnotations(newDataSource){
    if(typeof communityAnnotation !== "undefined"){
    	return false;
    }
    d3.tsv(newDataSource).then(function(value) {
    	communityAnnotation = value;
    	groupedClusterAnnotation = groupBy(communityAnnotation,"Cluster.Number",true,"GeneID",",");
    });
    return true;
}

/**
 * Use like:
 * edges = SelectNetworksInteractions(joinMultiDimArray(groupped)[0],interactionData)
 * @param interactors
 * @returns
 */
function SelectNetworksInteractions(interactors, interactions){
	interactors = "," + interactors + ",";
	return interactions.filter(i=>interactors.includes("," + i.GeneID1 + ",") && interactors.includes("," + i.GeneID2 + ","));
}

/**
 * Build nodes from edge table
 * @param edgeTable
 * @param columnName
 * @param matchArray
 * @param weightArray
 * @returns
 */
function EdgeTableToNodes(edgeTable,columnName, matchArray, weightArray, nameArray){
	var uniqueNodes;
	if(Array.isArray(columnName)){
		uniqueNodes = [...new Set(edgeTable.map(b=>b[columnName[0]]).concat(edgeTable.map(b=>b[columnName[1]])))];
	} else {
		uniqueNodes = [...new Set(edgeTable.map(b=>b[columnName]))];
	}
	
	var nodeIds;
	if(typeof matchArray !== "undefined" && typeof nameArray !== "undefined"){
		nodeIds = uniqueNodes.map(function(b) { 
			var bIndex = matchArray.indexOf(b);
			return { data: { id: b, weight: parseFloat(weightArray[bIndex]), color: MapColor(parseFloat(weightArray[bIndex])), label: nameArray[bIndex] } };
		} );
	} else {
		nodeIds = uniqueNodes.map(function(b) { return { data: { id: b, weight: 50 } } } );
	}
	return nodeIds;
}

function MapColor(input, breaks = [0,10,20], colors = ["rgb(160,160,160)", "rgb(86,203,189)", "rgb(224, 168, 0)", "rgb(143,26,29)"]){
	if(input <= breaks[0]){
		return colors[0];
	} else if(input > breaks[0] && input <= breaks[1]){
		return colors[1];
	} else if(input > breaks[1] && input <= breaks[2]) {
		return colors[2];
	} else if(input > breaks[2]) {
		return colors[3];
	}
}
var edgeColors = ["rgb(160,160,160)", "rgb(86,203,189)", "rgb(143,26,29)"];

/**
 * Build edges from edge table
 * @param edgeTable
 * @param columnName
 * @returns
 */
function EdgeTableToEdges(edgeTable,columnName,matchArray, weightArray){
	var edgeData;
	if(typeof matchArray !== "undefined"){
		edgeData = edgeTable.map(function(b) {
			var sourceIndex = matchArray.indexOf(b[columnName[0]]);
			var targetIndex = matchArray.indexOf(b[columnName[1]]);
			var colorIndex = NoneEitherBoth(!isNaN(weightArray[sourceIndex]),!isNaN(weightArray[targetIndex]),edgeColors);
			return { data: { source: b[columnName[0]], target: b[columnName[1]], connection: colorIndex } };
		} );
	} else {
		edgeData = edgeTable.map(function(b) { return { data: { source: b[columnName[0]], target: b[columnName[1]] } } } );
	}
	return edgeData;
}

function NoneEitherBoth(first, second, response = [0,1,2]){
	if(first && second){
		return response[2];
	} else if(first || second){
		return response[1];
	} else {
		return response[0];
	}
}

/**
 * Generate the new graph
 * @param graphId
 * @param elements
 * @param style
 * @param layout
 * @returns
 */
function NewGraph(graphId,elements,style, layout = "concentric"){
	cy = cytoscape({
			container: document.getElementById( graphId ),
			zoom: 1,
			minZoom: 0.5,
			maxZoom: 10,
			style: style,
			elements: elements,
			layout: { name: layout },
	});
}

var cystyle = [
    {
        selector: 'node',
        style: {
          'content': 'data(label)',
          'font-family': 'helvetica',
          'font-size': 14,
          'text-valign': 'top',
          'background-color': 'data(color)',
          //'background-color': 'mapData(weight, 1, 20, rgb(86,203,189), rgb(143,26,29))', //for weight
          'color': 'black',
          'border-color': 'rgb(0,91,150)',
          'border-width': 2,
        }
      },

      {
        selector: ':selected',
        style: {
          'background-color': '#000',
          'line-color': '#000',
          'target-arrow-color': '#000',
          'text-outline-color': '#000'
        }
      },

      {
        selector: 'edge',
        style: {
          'width': 2,
          'curve-style': 'haystack',
          'line-color': 'data(connection)',
        }
      },
    ];

/**
 * Update heatmap slick listener to generate graphs
 * @param plotId
 * @param updateId
 * @param graphId
 * @returns
 */
function GraphListener(plotId, updateId, graphId){
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
		var infotext = data.points.map(function(d){
			var clusterNumber = d.pointNumber[0] + 1;
		    GenerateNewGraph(graphId, updateId, clusterNumber, d.x);
		});
	});
}



/**
 * Generate the cystoscape.js plot by search or heatmap click
 * @param graphId
 * @param textId
 * @param clusterNo
 * @param dataColumn
 * @param columnNames
 * @returns
 */
function GenerateNewGraph(graphId, textId, clusterNo, dataColumn, columnNames = ["GeneID1","GeneID2"]){
	SendGaEvent(clusterNo, 'Cluster Query');
	currentCommunity = clusterNo;
    var el = $('#' + textId);
    el.empty();
    el.html("Community: " + clusterNo + "<br /> Sample: " + dataColumn);
	
	var edges = SelectNetworksInteractions(joinMultiDimArray(groupedClusterAnnotation)[clusterNo - 1],interactionData);
	//communityAnnotation index is already +1, catch up with cluster#
	var matchingArray = groupBy(communityAnnotation,"Cluster.Number",true,"GeneID")[clusterNo];
	var weightingArray = groupBy(communityAnnotation,"Cluster.Number",true,dataColumn)[clusterNo];
	var namingArray = groupBy(communityAnnotation,"Cluster.Number",true,"Symbol")[clusterNo];
	var newNetworkElements = [ EdgeTableToNodes(edges,columnNames,matchingArray,weightingArray,namingArray)
		.concat( EdgeTableToEdges(edges,columnNames,matchingArray,weightingArray) ) ];
    NewGraph(graphId, newNetworkElements[0], cystyle);
    AddNetworkToolTips();
}


var temporaryToolTip;
var temporaryToolTipNode;
var temporaryToolTipEdge;

function AddNetworkToolTips(){
	cy.on('tap', 'node', function (evt) {
		//console.log(evt.target.id())
		if(temporaryToolTipNode === cy.getElementById(evt.target.id()) && temporaryToolTip !== undefined){
			temporaryToolTip.hide()
			temporaryToolTip = undefined;
			return;
		} else{
			temporaryToolTipNode = cy.getElementById(evt.target.id());
			if(temporaryToolTip !== undefined){
				temporaryToolTip.hide()
			}
			temporaryToolTip = makeNodeToolTip(temporaryToolTipNode, evt.target.id());
			temporaryToolTip.show();
		}
	});
	
	cy.on('tapstart', function (evt) {
		if(temporaryToolTip !== undefined && evt.target === cy){
			temporaryToolTip.hide()
			temporaryToolTip = undefined;
		}
	});
};

/**
 * Generate network tooltip for node
 * @param netElem
 * @param text
 * @returns
 */
function makeNodeToolTip(netElem){
	var geneID = netElem.data().id.split("-")[0];
	var geneName = (netElem.data().label !== null) ? netElem.data().label.split("-")[0] : geneID;
	var weight = netElem.data().weight;
	return tippy( netElem.popperRef(), {
		content: function(){
			var div = document.createElement('div');
			div.id = "NodeToolTip";
			div.innerHTML = "<h4 align='left'>Maximal site oxidation for " + geneName + " (GeneID: " + geneID + ")" + " was " + Math.round(weight,2) + "% oxidized.</h4>";
			return div;
		},
		delay: 100,
		theme: 'light-border',
		trigger: 'manual',
		arrow: true,
		placement: 'right',
		hideOnClick: false,
		multiple: false,
		sticky: true,
		interactive: true,
	});
};