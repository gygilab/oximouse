//Oximouse js fnxns
/// @author Devin K Schweppe
/// All rights reserved, 2019
/// Authors, Gygi Lab, President and Fellows of Harletd University
///

/**
 * 1- query uniprot, need uniprot to start this, use autocorrect array to key to specific index
 * 2- pull sequence
 * 3- plot heatmap using tsv
 * 4- plot sequence map
 * 5- add listener for both maps
 * 
 */

let uniprotQuery; let uniprotFeatures; let disulfideFeatures;
let tissues; let sortedTissues; let Tissues;
let sequence; let sequenceArray;
let currentSite = 1;
let proteinSites; let sitePositions; let siteFeatures;
let proteinQuant; let proteinError;
let allSiteData; let proteinList;

function DisplayModalDiv(queryString,targetDiv = "#noProteinModal", queryDisplayDiv = "#noProteinQuery"){
	$(queryDisplayDiv).html(boldText(queryString));
	$(targetDiv).modal('show');
}

/**
 * 
 * @param accession
 * @param sequenceOnly
 * @returns
 */
function Query(accession,targetDiv = '#sequenceMap',sequenceOnly = true, additionalSiteMapName = "Phospho"){
	SendGaEvent(accession, 'Site Query Initiated');
	let requestUrl = "https://www.ebi.ac.uk/proteins/api/proteins?offset=0&size=1&accession=";
	requestUrl += accession;
	DisplayModalDiv("","#loadingModal");
	return $.getJSON(requestUrl).done(function(result){
		let geneName = result[0].gene[0].name.value;
		let accessionNumber = uniprotQuery = result[0].accession;
		let proteinName = result[0].protein.recommendedName.fullName.value;
		let commentFunction;
		if(result[0].comments.filter(b=>b.type == "FUNCTION").length == 0){
			commentFunction = "No known function found in Uniprot";
		} else {
			commentFunction = result[0].comments.filter(b=>b.type == "FUNCTION")[0].text[0].value;
		}
		$("#proteinInformation").html(jsonToTable({"Protein Info": "","Accession": accessionNumber,"Gene": geneName,"Protein": proteinName,"Fnxn": commentFunction,}));
		AddExternalLinkListeners(accessionNumber,geneName);
		if(sequenceOnly){
			sequence = result[0].sequence.sequence;
			sequenceArray = sequence.split('').map((x,index)=>x + (index + 1));
			if(typeof(result[0].features) !== "undefined"){
				uniprotFeatures = [...new Set(result[0].features.filter(b=>b.type == "MOD_RES" && b.description.includes(additionalSiteMapName)).map(b=>+b["begin"]))];
				disulfideFeatures = [...new Set(result[0].features.filter(b=>b.type == "DISULFID").map(b=>+b["begin"]))];
			}
			$(targetDiv).empty();
			let newFeaturesArray = [ GenerateFeature(SitesToPositions(uniprotFeatures),additionalSiteMapName) , GenerateFeature(SitesToPositions(disulfideFeatures),"Disulfide")]
			NewSequenceMap(targetDiv,sequence,newFeaturesArray);
			ConsumeSiteData("data/site_all.csv",accession);			
		}
		return result;
	}).fail(function() { DisplayModalDiv(accession); });
}

function BuildMaps(){
	HideModalDiv("#loadingModal");
	NewHeatmap("siteHeatmap",tissues,sequenceArray,proteinSites,siteHeatmapColors,[60,50,150,30]);
	PlotListener("siteHeatmap","siteDescriptionText", tissues, proteinSites, proteinError,sitePositions);
	PlotlyBar('siteQuantPlot', tissues, proteinSites[0], -1,proteinError);
	NewTable("siteTable","siteTableWrapper",Object.keys(proteinQuant[0]), proteinQuant);
	$(document).ready( function () {
	    $('#siteTable').DataTable({
	    	dom: 'Bfrtip',
	        buttons: [
	            'copy', 'csv', 'excel', 'pdf',
	        ]
	    });
	} );	
	onlyModInHeatmap = false;
}

let onlyModInHeatmap = false;
function OnlyModResHeatmap(targetDiv = 'siteHeatmap'){
	let modifiedProteinSites = proteinSites.filter((b,i)=> b.some(c=>c !== 0));
	let modifiedError = sitePositions.map((b,i)=> [b,i]).sort((a,b)=> a[0] - b[0]).map(b=> proteinError[b[1]]);
	NewHeatmap(targetDiv,tissues,sequenceArray.filter((b,i)=> sitePositions.includes(i+1)),modifiedProteinSites,siteHeatmapColors,[60,50,150,30]);
	PlotListener(targetDiv,"siteDescriptionText", tissues, modifiedProteinSites, modifiedError,sitePositions,true);
	onlyModInHeatmap = true;
}

function ToggleHeatmap(){
	if(!onlyModInHeatmap){
		OnlyModResHeatmap();
		$("#fullOrModOnlyToggleHeatmap").html("All Positions");
	} else{
		BuildMaps();
		$("#fullOrModOnlyToggleHeatmap").html("Modified Positions");
	}
}


$("#fullOrModOnlyToggleHeatmap").click(function() {
	ToggleHeatmap();
});

let orderedByTissue = false;
function ReorderBarPlotByTissue(targetDiv = 'siteQuantPlot'){
	let tempTissues; let tissueValues;
	let tempError = proteinError[sitePositions.indexOf(currentSite)];
	if(!orderedByTissue){
		tempTissues = tissues.map(b=>b);
		tissueValues = tempTissues.map((b,i)=> [ b, proteinSites[currentSite - 1][i]]).sort(function(a,b) { return a[0] > b[0] ? 1 : -1 }).map(b=>b[1]);
		tempError = tempTissues.map((b,i)=> [ b, tempError[i]]).sort(function(a,b) { return a[0] > b[0] ? 1 : -1 }).map(b=>b[1]);
		tempTissues.sort();
		orderedByTissue = true;
		$("#tissueOrderToggle").html("Order By Age");
		
	} else {
		tempTissues = tissues.map(b=>b);
		tissueValues = proteinSites[currentSite - 1];
		orderedByTissue = false;
		$("#tissueOrderToggle").html("Order By Tissue");
	}
	PlotlyBar('siteQuantPlot', tempTissues, tissueValues, 0,tempError);
	//PlotlyBar(targetDiv,xvals,yvals,targetX = 0,yerror, yaxTitle = "% Occupancy")
}


$("#tissueOrderToggle").click(function() {
	ReorderBarPlotByTissue();
});


/**
 * Consume flat file data, featureViewer relies on d3 v3.5, use that for tsv reading
 * @param newDataSource
 * @returns
 */
function ConsumeSiteData(newDataSource, uniprotAccessionQuery, tissueString = "oxi_percent_"){
	if(typeof allSiteData !== "undefined"){
    	//prep data
		proteinQuant = allSiteData.filter(b=>b.Uniprot == uniprotAccessionQuery);
		if(allSiteData.filter(b=>b.Uniprot.includes(uniprotAccessionQuery + "-")).length > 0) {
			DisplayModalDiv(uniprotAccessionQuery, "#isoformModal","#isoformProteinQuery");
		}
    	sitePositions = proteinQuant.map(b=> PullSitesFromArray(b));
    	tissues = Object.keys(proteinQuant[0]).filter(b=>b.includes(tissueString)).map(b=>b.replace(tissueString,"").toUpperCase());
    	proteinSites = RandomMultiDimArray(sequence.length,tissues.length,0);
    	//build UI
    	UpdateProteinSitesFromArray(sitePositions,proteinQuant);
    	proteinError = UpdateProteinSitesFromArray(sitePositions,proteinQuant,false,"se_");
    	AddFeatureViewListener(proteinSites, tissues, proteinError, sitePositions);
    	BuildMaps();
		return;
	}
    return d3.csv(newDataSource, function(value) {
    	//generate protein list for searching
    	// sort input data by Uniprot
    	allSiteData = value.sort((a,b) => (a.Uniprot > b.Uniprot) ? 1 : ((b.Uniprot > a.Uniprot) ? -1 : 0));;
		$( "#sitesSearchInput" ).autocomplete({
			source: [...new Set(allSiteData.map(b=>b.Gene))],
			minLength: 2
		});
    	//prep data
		proteinQuant = allSiteData.filter(b=>b.Uniprot == uniprotAccessionQuery);
		if(allSiteData.filter(b=>b.Uniprot.includes(uniprotAccessionQuery + "-")).length > 0) {
			DisplayModalDiv(uniprotAccessionQuery, "#isoformModal","#isoformProteinQuery");
		}
		sitePositions = proteinQuant.map(b=> PullSitesFromArray(b));
    	tissues = Object.keys(proteinQuant[0]).filter(b=>b.includes(tissueString)).map(b=>b.replace(tissueString,"").toUpperCase());
    	proteinSites = RandomMultiDimArray(sequence.length,tissues.length,0);
    	//build UI
    	UpdateProteinSitesFromArray(sitePositions,proteinQuant);
    	proteinError = UpdateProteinSitesFromArray(sitePositions,proteinQuant,false,"se_");
    	AddFeatureViewListener(proteinSites, tissues, proteinError, sitePositions);
    	BuildMaps();
    	return;
    });
}

$("#sitesSearchInput").keypress(function(e) {
	if(e.keyCode==13){
		SearchSites(document.getElementById('sitesSearchInput').value);
	}
});


$("#mainNavSearchButton").click(function() {
	SearchSites(document.getElementById('sitesSearchInput').value);
});

/**
 * Search for a symbol or geneID
 * @param query
 * @param focus
 * @returns
 */
function SearchSites(query, focus = true){
	if(typeof allSiteData == "undefined"){
		DisplayModalDiv("","#dataLoadingModal");
	}
	let protein;
	protein = allSiteData.filter(b=>b.Gene.toUpperCase() == query.toUpperCase() || b.Uniprot.toUpperCase() == query.toUpperCase());
	if(protein.length < 1){
		DisplayModalDiv(query);
		return false;
	}
	siteFeatures = undefined;
	SendGaEvent(query + "_" + protein[0].Uniprot, 'Site Query');
	Query(protein[0].Uniprot);
}

/**
 * Pull quantitation from the protein quant array based on specific columns
 * @param keyFinder
 * @param quantArray
 * @param delim
 * @returns
 */
function UpdateProteinSitesFromArray(sitesArray, quantArray, update = true, keyFinder = "oxi_percent_", addNewFeatures = true){
	let quantKeys = Object.keys(quantArray[0]).filter((b)=>b.includes(keyFinder));
	//brutal...
	let quantOutput = quantArray.map(b=> Object.keys(b).filter((c,i) => c.includes(keyFinder)).map(function(d) {
			if(isNaN(+b[d])) { return 0; } else { return +b[d]; }
		}));
	if(update){
		proteinSites = proteinSites.map(function(b,i) {
			if(sitePositions.includes(i + 1)) {
				return quantOutput[sitePositions.indexOf(i+1)];
			} else { return b; } } );
	} else {
		return quantOutput;
	}

	if(update && addNewFeatures && typeof featureViewer !== "undefined" && typeof siteFeatures == "undefined"){
		siteFeatures = GenerateFeature(SitesToPositions(sitePositions));
		featureViewer.addFeature(siteFeatures);
	}
}

/**
 * Pull site positions from site strings: "sp|A0JNU3|LPP60_MOUSE_503"
 * @param quantArray
 * @param delim
 * @returns
 */
function PullSitesFromArray(quantArray = proteinQuant, delim = "_"){
	let siteArray = quantArray.site.split(delim);
	return +siteArray[siteArray.length - 1];
}

let featureViewer;
/**
 * Using nextProt's sequence feature mapper
 * @param sequenceMapTarget
 * @param sequence
 * @param newFeature will add one feature by default
 * @returns
 */
function NewSequenceMap(sequenceMapTarget, sequence, newFeaturesArray){
	let options = {showAxis: true, showSequence: true,brushActive: true, toolbar:true,bubbleHelp: false, zoomMax:3 };
	featureViewer = new FeatureViewer(sequence, sequenceMapTarget,options);
	if(typeof newFeaturesArray !== "undefined"){
		for(i = 0; i < newFeaturesArray.length; i++){
			featureViewer.addFeature(newFeaturesArray[i]);
		}
	}
}

/**
 * Generate features for featureViewer
 * @param positions
 * @param name
 * @param className
 * @param filter
 * @param color
 * @param type
 * @returns
 */
function GenerateFeature(positions = [{x:1,y:1},{x:10,y:10},{x:20,y:20}], name = "Oxidation", color = "#a40b0b",type = "rect"){
	let tempFeature = {
	    data: positions,
	    name: name,
	    className: name,
	    color: color,
	    type: type,
	    filter: name,
	    description: name,
	};
	return tempFeature;
}

/**
 * 
 * @param siteArray
 * @returns
 */
function SitesToPositions(siteArray){
	return siteArray.map(function(b) { return {x: b, y: b}; })
}

/**
 * 
 * @param dataArray
 * @param headerArray
 * @param errorArray
 * @param siteArray
 * @param targetDiv
 * @param descriptionDiv
 * @returns
 */
function AddFeatureViewListener(dataArray, headerArray, errorArray, siteArray, targetDiv = 'siteQuantPlot', descriptionDiv = "siteDescriptionText"){
	featureViewer.onFeatureSelected(function (d) {
		let siteIndex = d.detail.start - 1;
	    if(typeof errorArray !== "undefined" && siteArray.includes(d.detail.start)){
	    	let error = errorArray[siteArray.indexOf(d.detail.start)];
	    	PlotlyBar(targetDiv, headerArray, dataArray[siteIndex], -1, error);
	    	let el = $('#' + descriptionDiv);
		    el.empty();
		    el.append(jsonToTable({"Mod": "Cys-Oxidation","Site": d.detail.start}));
		    currentSite = d.detail.start;
	    }
	});
}



