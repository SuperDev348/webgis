var offices = [];
var init_departments = [];
var departments = [];
var municipalities = [];
var parcels = [];
var regionData = {};
$(document).ready(function(){
  // init
  searchRegion(300012, 1666);
  initOffices()
  initDepartments()
  $("#office").change(function(){
    var officeIndex = $( "#office" ).val();
    changeDepartments(officeIndex)
  });
  // $("#department").change(function(){
  //   var officeIndex = $( "#office" ).val();
  //   var departmentIndex = $( "#department" ).val();
  //   if (officeIndex == -1 && departments.length > departmentIndex) {
  //     var officeId = departments[departmentIndex].officeId
  //     var officeIndex = offices.findIndex((item) => item.id == officeId)
  //     $( "#office" ).val(officeIndex);
  //     changeDepartments(officeIndex)
  //     $( "#department" ).val(departmentIndex);
  //   }
  // });
  $("#department").change(function(){
    var officeIndex = $( "#office" ).val();
    var departmentIndex = $( "#department" ).val();
    if (officeIndex != -1 && departmentIndex != -1) {
      initMunicipalities(officeIndex, departmentIndex);
    }
  });
  $("#parcel-search").change(function(){
    var municipaltyIndex = $( "#municipality" ).val();
    var parcelSearch = $( "#parcel-search" ).val();
    if (municipaltyIndex != -1 && municipalities.length > municipaltyIndex && parcelSearch != '') {
      var regNum = municipalities[municipaltyIndex].key2
      initParcels(parcelSearch, regNum);
    }
  });
  $("#parcel").change(function(){
    var municipaltyIndex = $( "#municipality" ).val();
    var parcelIndex = $( "#parcel" ).val();
    if (municipaltyIndex != -1 && municipalities.length > municipaltyIndex && parcelIndex != -1 && parcels.length > parcelIndex) {
      var regNum = municipalities[municipaltyIndex].key2
      var parcel = parcels[parcelIndex].value1
      searchRegion(regNum, parcel);
      
    }
  });
});

function initOffices() {
  $.get("https://oss.uredjenazemlja.hr/oss/public/search-cad-parcels/offices", function(data, status){
    console.log('offices', data)
    offices = data
    var initOption = $('<option></option>').attr("value", "-1").text("--select--");
    $("#office").empty().append(initOption);
    data.forEach((item, index) => {
      var option = $('<option></option>').attr("value", index).text(item.name);
      $("#office").append(option);
    })
  });
}
function initDepartments() {
  $.get("https://oss.uredjenazemlja.hr/oss/public/search-cad-parcels/departments?doFilter=false", function(data, status){
    console.log('departments', data)
    init_departments = data
    departments = data
    changeDepartments(-1)
  });
}
function initMunicipalities(officeIndex, departmentIndex) {
  var officeId = -1;
  var departmentId = -1;
  if (offices.length > officeIndex && departments.length > departmentIndex) {
    officeId = offices[officeIndex].id
    departmentId = departments[departmentIndex].id
  }
  if (officeId != -1 && departmentId != -1) {
    $.get(`https://oss.uredjenazemlja.hr/oss/public/search-cad-parcels/municipalities?search=&officeId=${officeId}&departmentId=${departmentId}`, function(data, status){
      console.log('municipalities', data)
      municipalities = data
      var initOption = $('<option></option>').attr("value", "-1").text("--select--");
      $("#municipality").empty().append(initOption);
      data.forEach((item, index) => {
        var option = $('<option></option>').attr("value", index).text(item.displayValue1);
        $("#municipality").append(option);
      })
    });
  }
}
function initParcels(search, regNum) {
  $.get(`https://oss.uredjenazemlja.hr/oss/public/search-cad-parcels/parcel-numbers?search=${search}&municipalityRegNum=${regNum}`, function(data, status){
    console.log('parcels', data)
    parcels = data
    var initOption = $('<option></option>').attr("value", "-1").text("--select--");
    $("#parcel").empty().append(initOption);
    data.forEach((item, index) => {
      var option = $('<option></option>').attr("value", index).text(item.value1);
      $("#parcel").append(option);
    })
  });
}
function changeDepartments(officeIndex) {
  if (officeIndex != -1 && offices.length > officeIndex) {
    var officeId = offices[officeIndex].id
    var newDepartments = init_departments.filter((item) => item.officeId == officeId)
    departments = newDepartments
  }
  var initOption = $('<option></option>').attr("value", "-1").text("--select--");
  $("#department").empty().append(initOption);
  departments.forEach((item, index) => {
    var option = $('<option></option>').attr("value", index).text(item.name);
    $("#department").append(option);
  })
}
function searchRegion(regNum, parcel) {
  $.get(`https://oss.uredjenazemlja.hr/OssWebServices/wfs?token=7effb6395af73ee111123d3d1317471357a1f012d4df977d3ab05ebdc184a46e&service=WFS&version=1.0.0&request=GetFeature&maxFeatures=50&outputFormat=application/json&typeName=oss:DKP_CESTICE&CQL_FILTER=MATICNI_BROJ_KO=${regNum} AND BROJ_CESTICE='${parcel}'`, function(data, status){
    console.log('region search result', data)
    regionData = data;
    if (regionData.bbox && regionData.features && regionData.features.length > 0) {
      var x1 = regionData.bbox[0];
      var y1 = regionData.bbox[1];
      var x2 = regionData.bbox[2];
      var y2 = regionData.bbox[3];
      var xmin = x1 - Math.abs(x2 - x1) * 3.5;
      var xmax = x1 + Math.abs(x2 - x1) * 3.5;
      var ymin = y1 - Math.abs(y2 - y1) * 3.5;
      var ymax = y1 + Math.abs(y2 - y1) * 3.5;
      changeRange(xmin, ymin, xmax, ymax)
      setParcel(regionData.features[0].geometry.coordinates[0])
    }
  });
}