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

let uniprotQuery; let uniprotFeatures;
let tissues; let sortedTissues; let Tissues;
let sequence; let sequenceArray;
let proteinSites; let sitePositions; let siteFeatures;
let proteinQuant; let proteinError;
let allSiteData; let proteinList;

function DisplayModalDiv(queryString,targetDiv = "#noProteinModal"){
	$("#noProteinQuery").html(boldText(queryString));
	$(targetDiv).modal('show');
}

/**
 * 
 * @param accession
 * @param sequenceOnly
 * @returns
 */
function Query(accession,targetDiv = '#sequenceMap',sequenceOnly = true, additionalSiteMap = "Phospho"){
	let requestUrl = "https://www.ebi.ac.uk/proteins/api/proteins?offset=0&size=1&accession=";
	requestUrl += accession;
	DisplayModalDiv("","#loadingModal");
	return $.getJSON(requestUrl).done(function(result){
		let geneName = result[0].gene[0].name.value;
		let accessionNumber = uniprotQuery = result[0].accession;
		let proteinName = result[0].protein.recommendedName.fullName.value;
		let commentFunction = result[0].comments.filter(b=>b.type == "FUNCTION")[0].text[0].value;
		$("#proteinInformation").html(jsonToTable({"Protein Info": "","Accession": accessionNumber,"Gene": geneName,"Protein": proteinName,"Fnxn": commentFunction,}));
		AddExternalLinkListeners(accessionNumber,geneName);
		if(sequenceOnly){
			sequence = result[0].sequence.sequence;
			sequenceArray = sequence.split('').map((x,index)=>x + (index + 1));
			uniprotFeatures = [...new Set(result[0].features.filter(b=>b.type == "MOD_RES" && b.description.includes(additionalSiteMap)).map(b=>+b["begin"]))];
			$(targetDiv).empty();
			NewSequenceMap(targetDiv,sequence,GenerateFeature(SitesToPositions(uniprotFeatures),additionalSiteMap));
			ConsumeSiteData("data/site_all_1.csv",accession);			
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

let orderByTissue = false;
function ReorderTissuePlots(targetDiv = 'siteHeatmap'){
	let tempTissues = tissues.map(b=>b);
	let tissueValues = tempTissues.map((b,i)=> [ b, proteinSites[502][i]]).sort(function(a,b) { return a[0] > b[0] ? 1 : -1 }).map(b=>b[1]);
	tempTissues.sort();
	let modifiedProteinSites = proteinSites.filter((b,i)=> b.some(c=>c !== 0));
	let modifiedError = sitePositions.map((b,i)=> [b,i]).sort((a,b)=> a[0] - b[0]).map(b=> proteinError[b[1]]);
	PlotListener(targetDiv,"siteDescriptionText", tempTissues, tissueValues, modifiedError,sitePositions,true);
	onlyModInHeatmap = true;
}

function ToggleTissueOrder(){
	if(!orderByTissue){
		ReorderTissuePlots();
		$("#tissueOrderToggle").html("Order By Age");
	} else{
		BuildMaps();
		$("#tissueOrderToggle").html("Order By Tissue");
	}
}


$("#tissueOrderToggle").click(function() {
	ToggleTissueOrder();
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
    	allSiteData = value;
		$( "#sitesSearchInput" ).autocomplete({
			source: [...new Set(allSiteData.map(b=>b.Gene))],
			minLength: 2
		});
    	//prep data
    	proteinQuant = value.filter(b=>b.Uniprot == uniprotAccessionQuery);
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
function NewSequenceMap(sequenceMapTarget, sequence, newFeature){
	let options = {showAxis: true, showSequence: true,brushActive: true, toolbar:true,bubbleHelp: false, zoomMax:3 };
	featureViewer = new FeatureViewer(sequence, sequenceMapTarget,options);
	if(typeof newFeature !== "undefined"){
		featureViewer.addFeature(newFeature);
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
	    }
	});
}



