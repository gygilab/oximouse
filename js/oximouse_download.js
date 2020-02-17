//Oximouse js fnxns
/**
 * The Oximouse website is licensed under the CC BY 4.0 license: https://creativecommons.org/licenses/by/4.0/
 * @author Devin Schweppe <devin_schweppe@hms.harvard.edu>
 */

var downloaderFormaterVariable;
/**
 * Sites downloads
 */
$('#downloadSites').attr({action: 'data/site_all.csv'});
// Communities downloads:
$('#downloadCommunities').attr({action: 'data/communities/huttlin2017_communities_bioplex_overlay_percent.tsv'});
$('#downloadCommunityOverlay').attr({action: 'data/communities/huttlin2017_communities_oxi_overlay.tsv'});


//Supp data:
$('#downloadOldSites').attr({action: 'data/download/All_old_sites.xlsx'});
$('#downloadYoungSites').attr({action: 'data/download/All_young_sites.xlsx'});
$('#downloadDiseaseYoung').attr({action: 'data/download/Disease_network_young.xlsx'});
$('#downloadDiseaseOld').attr({action: 'data/download/Disease_network_old.xlsx'});