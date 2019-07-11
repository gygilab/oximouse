//Oximouse js fnxns
/// @author Devin K Schweppe
/// All rights reserved, 2019
/// Authors, Gygi Lab, President and Fellows of Harvard University
///

function AddExternalLinkListeners(uniprot,geneSymbol){
	$("#pubmedLink").attr({href: "https://www.ncbi.nlm.nih.gov/pubmed/?term=" + geneSymbol});
	$("#uniprotLink").attr({href: "https://www.uniprot.org/uniprot/" + uniprot});
	$("#pdbLink").attr({href: "https://www.rcsb.org/pdb/protein/" + uniprot});
	$("#phosphomouseLink").attr({href: "https://phosphomouse.hms.harvard.edu/search_results.php?search_phrase=" + geneSymbol});
	$("#phophositeplusLink").attr({href: "https://www.phosphosite.org/simpleSearchSubmitAction.action?searchStr=" + geneSymbol});
}

function DisplayModalDiv(queryString,targetDiv = "#noProteinModal",textUpdateDiv = "#noProteinQuery"){
	$(textUpdateDiv).html(boldText(queryString));
	$(targetDiv).modal('show');
}

function HideModalDiv(targetDiv = "#noProteinModal"){
	setTimeout(function(){},5); //timing issue (modal doesn't close) without this.
	$(targetDiv).modal('hide');
}


function boldText(text){
	return "<b>" + text + "</b>";
}

/**
 * Adapted from: https://stackoverflow.com/a/34890276/3965651
 * groupped = groupBy(communityAnnotation,"Cluster Number",true,"GeneID",",")
 * @param xs array values to iterate over and group
 * @param key groupBy this key
 * @returns
 */
function groupBy (xs, key, concat, concatKey) {
	return xs.reduce(function(accumulator, currentVal) {
		if(concat){
			(accumulator[currentVal[key]] = accumulator[currentVal[key]] || []).push(currentVal[concatKey]);
			return accumulator;
		} else {
			(accumulator[currentVal[key]] = accumulator[currentVal[key]] || []).push(currentVal);
			return accumulator;
		}
	}, {});
};

/**
 * Join MD array using a delim, works on the back end of GroupBy
 * @param newArray
 * @param filterIndex
 * @param delim
 * @returns
 */
function joinMultiDimArray(newArray, filterIndex, delim = ','){
	var toJoin = Object.values(newArray);
	return toJoin.map(b=>b.join(delim));
}

/**
 * 
 * @param n
 * @param multiplier
 * @returns
 */
function RandomArray(n,multiplier = 40){
	return Array.from({length: n}, () => Math.floor(Math.random() * multiplier));
}

/**
 * 
 * @param d1
 * @param d2
 * @param multiplier
 * @returns
 */
function RandomMultiDimArray(d1,d2,multiplier = 40){
	return Array.from({length: d1}, () => RandomArray(d2,multiplier));
}

/**
 * 
 * @param jsonArray
 * @param include
 * @returns
 */
function jsonToTable(jsonArray,include){
	var newTable = document.createElement('table');
	
	for(var element in jsonArray){
		if(typeof include !== "undefined" && !include.includes(element)){
			continue;
		}
		var tempRow = document.createElement('tr');
		var tempHtml = element + ": " + boldText(jsonArray[element]);
		tempRow.innerHTML = tempHtml.toUpperCase();
		newTable.append(tempRow);
	}
	return newTable;
}

/**
 * 
 * @param TableId
 * @param whereDiv
 * @param addSpace
 * @param captionText
 * @param tableClass
 * @returns
 */
function BuildTable(TableId,whereDiv,addSpace = "<br /><br /><hr>", captionText = "Caption", tableClass = "table display table-hover"){
	document.getElementById(whereDiv).innerHTML += addSpace;
	var table = document.createElement("table");
	table.className = tableClass ;
	table.id = TableId;
	document.getElementById(whereDiv).appendChild(table);
	if(captionText !== "Caption"){
			var caption = document.createElement("caption");
		caption.innerHTML = captionText;
		caption.className = "font-weight-bold";
		caption.id = "table-caption";
		document.getElementById(TableId).appendChild(caption);
	}
}

/**
 * 
 * @param tableElementId
 * @param colspans
 * @param mainNames
 * @param subNames
 * @returns
 */
function FormatTableHeaders(tableElementId, colspans, mainNames,subNames){
	var table = document.getElementById(table);
	var thead = document.createElement("thead");
	thead.id = "thead-" + tableElementId;
	document.getElementById(tableElementId).appendChild(thead);
	// generate main headers
	if(typeof mainNames !== "undefined"){
		GenerateHeaders(mainNames,thead.id,colspans);
	}
	// generate sub headers
	if(typeof subNames !== "undefined"){
		GenerateHeaders(subNames,thead.id);
	}
}

/**
 * 
 * @param names
 * @param theadId
 * @param colspans
 * @returns
 */
function GenerateHeaders(names,theadId,colspans){
	var numColumns = names.length;
	if(typeof colspans == 'undefined'){
		//generate row
		var rowId = "tr-" + theadId + "-" + document.getElementById(theadId).childNodes.length;
		GenerateTableRow(rowId,theadId,false);
		for(var i = 0; i < numColumns; i++){
			var tempTh = document.createElement("th");
			tempTh.innerHTML = names[i];
			document.getElementById(rowId).appendChild(tempTh);
		}
	} else{
		//generate row
		var rowId = "tr-" + theadId + "-" + document.getElementById(theadId).childNodes.length;
		GenerateTableRow(rowId,theadId,false);
		for(var i = 0; i < numColumns; i++){
			var tempTh = document.createElement("th");
			tempTh.colSpan = colspans[i];
			tempTh.innerHTML = names[i];
			document.getElementById(rowId).appendChild(tempTh);
		}
	}
}

///Generate tbody
function GenerateTableBody(tbodyId,parentId){
	var tbody = document.createElement("tbody");
	tbody.id = tbodyId;
	document.getElementById(parentId).appendChild(tbody);
}

///Generate table row
function GenerateTableRow(trId,parentId,prepend,trHeight){
	var tr = document.createElement("tr");
	if(trHeight !== "undefined"){
		tr.style.height = trHeight;
	}
	tr.id = trId;
	if(prepend){
		document.getElementById(parentId).prepend(tr);
	} else {
		document.getElementById(parentId).appendChild(tr);
	}
}

/**
 * Populate table cell with content
 * @param tdId
 * @param trId
 * @param content added to innerHTML
 * @returns
 */
function PopulateTableCell(tdId,trId,content){
	var td = document.createElement("td");
	td.id = tdId;
	td.innerHTML = content
	document.getElementById(trId).appendChild(td);
}

/**
 * Update cell style
 * @param tdId
 * @param trId
 * @param cssElement
 * @param newStyle
 * @returns
 */
function StyleTableCell(tdId,trId,cssElement,newStyle){
	document.getElementById(tdId).style[cssElement] = newStyle;
}

/**
 * Update innerhtml for a table cell
 * @param tdId
 * @param trId
 * @param newContent
 * @returns
 */
function UpdateInnerHtmlForTableCell(tdId,trId,newContent){
	document.getElementById(tdId).innerHTML = newContent;
}

/**
 * 
 * @param mainHeaderNames
 * @param colspans
 * @param subHeaderNames
 * @returns
 */
function NewTable(tableId,whereId,headerArray,cellArray,subHeaderNames,colspans){
	$("#" + whereId).empty();
	var cellString;
	BuildTable(tableId,whereId,"");
	FormatTableHeaders(tableId,colspans, headerArray, subHeaderNames);
	GenerateTableBody("table-body-" + tableId,tableId);
	for(var i = 0; i < cellArray.length; i++){
		GenerateTableRow("trx-" + tableId + i,"table-body-" + tableId)
		for(var property in cellArray[i]){
			PopulateTableCell("tdd-" + tableId + property,"trx-" + tableId + i,cellArray[i][property]);
		}
	}
}


